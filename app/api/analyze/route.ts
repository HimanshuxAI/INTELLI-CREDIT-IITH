import { NextRequest } from 'next/server';
import { extractStructuredData, parseOfficerNotes } from '@/lib/engines/extractor';
import { validateAndFillDefaults } from '@/lib/engines/validator';
import { runGSTREngine } from '@/lib/engines/gstr-engine';
import { runContradictionEngine } from '@/lib/engines/contradiction-engine';
import { runScoringEngine } from '@/lib/engines/scoring-engine';
import { runLimitEngine } from '@/lib/engines/limit-engine';
import { runWarningEngine } from '@/lib/engines/warning-engine';
import { computeConfidence } from '@/lib/engines/confidence-engine';

const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';

// ── File Extractors ──

async function extractTextFromPDF(buffer: ArrayBuffer): Promise<{ text: string; pages: number }> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pdfParse = require('pdf-parse');
  const data = await pdfParse(Buffer.from(buffer));
  return { text: data.text, pages: data.numpages || Math.max(1, Math.ceil(data.text.length / 3000)) };
}

async function extractTextFromXLSX(buffer: ArrayBuffer): Promise<string> {
  const XLSX = await import('xlsx');
  const workbook = XLSX.read(Buffer.from(buffer), { type: 'buffer' });
  const sheets: string[] = [];
  for (const name of workbook.SheetNames) {
    const sheet = workbook.Sheets[name];
    const csv = XLSX.utils.sheet_to_csv(sheet);
    sheets.push(`--- Sheet: ${name} ---\n${csv}`);
  }
  return sheets.join('\n\n');
}

// ── Score colors ──

const SCORE_COLORS = [
  { color: '#157A45', tagClass: 'tag-green' },
  { color: '#96500A', tagClass: 'tag-amber' },
  { color: '#0066CC', tagClass: 'tag-blue' },
  { color: '#6428C8', tagClass: 'tag-purple' },
  { color: '#B01225', tagClass: 'tag-red' },
];

const SIGNAL_COLORS: Record<string, string> = { critical: '#B01225', high: '#96500A', medium: '#0066CC', low: '#157A45' };

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let GEMINI_API_KEY = (request.headers.get('X-API-Key') || process.env.GEMINI_API_KEY || '').trim();
  if (GEMINI_API_KEY && !GEMINI_API_KEY.startsWith('AIzaSy')) {
    GEMINI_API_KEY = (process.env.GEMINI_API_KEY || '').trim();
  }

  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
      return new Response(JSON.stringify({ error: 'No files uploaded' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // ────────────────────────────────────────────
    // STEP 1: Extract raw text from uploaded files
    // ────────────────────────────────────────────
    let allText = '';
    let totalPages = 0;
    const fileResults: { name: string; type: string; extracted: boolean }[] = [];

    for (const file of files) {
      const buffer = await file.arrayBuffer();
      const lower = file.name.toLowerCase();

      if (lower.endsWith('.pdf') || file.type === 'application/pdf') {
        try {
          const result = await extractTextFromPDF(buffer);
          allText += `\n\n=== FILE: ${file.name} ===\n${result.text}`;
          totalPages += result.pages;
          fileResults.push({ name: file.name, type: 'PDF', extracted: true });
        } catch (err) {
          console.error(`Error parsing PDF ${file.name}:`, err);
          allText += `\n\n=== FILE: ${file.name} ===\n[Could not extract text]`;
          totalPages += 1;
          fileResults.push({ name: file.name, type: 'PDF', extracted: false });
        }
      } else if (lower.endsWith('.xlsx') || lower.endsWith('.xls') || file.type.includes('sheet') || file.type.includes('excel')) {
        try {
          const text = await extractTextFromXLSX(buffer);
          allText += `\n\n=== FILE: ${file.name} (XLSX) ===\n${text}`;
          totalPages += Math.max(1, Math.ceil(text.length / 3000));
          fileResults.push({ name: file.name, type: 'XLSX', extracted: true });
        } catch (err) {
          console.error(`Error parsing XLSX ${file.name}:`, err);
          fileResults.push({ name: file.name, type: 'XLSX', extracted: false });
        }
      } else if (lower.endsWith('.csv')) {
        try {
          const text = new TextDecoder().decode(buffer);
          allText += `\n\n=== FILE: ${file.name} (CSV) ===\n${text}`;
          totalPages += Math.max(1, Math.ceil(text.length / 3000));
          fileResults.push({ name: file.name, type: 'CSV', extracted: true });
        } catch {
          fileResults.push({ name: file.name, type: 'CSV', extracted: false });
        }
      } else {
        try {
          const text = new TextDecoder().decode(buffer);
          allText += `\n\n=== FILE: ${file.name} ===\n${text}`;
          totalPages += Math.max(1, Math.ceil(text.length / 3000));
          fileResults.push({ name: file.name, type: 'OTHER', extracted: true });
        } catch {
          fileResults.push({ name: file.name, type: 'OTHER', extracted: false });
        }
      }
    }

    // Truncate
    if (allText.length > 100000) {
      allText = allText.substring(0, 100000) + '\n\n[... truncated ...]';
    }

    // ────────────────────────────────────────────
    // STEPS 2-12: RULE ENGINE PIPELINE (deterministic)
    // ────────────────────────────────────────────

    // Step 2: Structured extraction (4-layer)
    const extracted = extractStructuredData(allText, files.map(f => f.name), totalPages);

    // Step 3: Validate + fill defaults
    const validated = validateAndFillDefaults(extracted);

    // Step 4: Officer notes (if provided via form)
    const officerNotesRaw = (formData.get('officerNotes') as string) || '';
    const officerInsights = officerNotesRaw ? parseOfficerNotes(officerNotesRaw) : null;

    // Apply officer insights to validated data
    if (officerInsights) {
      if (officerInsights.capacityUtilisation !== null) {
        validated._capacityUtilisation = officerInsights.capacityUtilisation;
        validated.capacityUtilisation = officerInsights.capacityUtilisation;
      }
      if (officerInsights.collateralValue !== null) {
        validated._collateralValue = officerInsights.collateralValue;
        validated.collateralValue = officerInsights.collateralValue;
      }
    }

    // Step 5: GSTR Engine
    const gstrResult = runGSTREngine(validated);

    // Step 6: Contradiction Engine
    const contradictionResult = runContradictionEngine(validated);

    // Step 7: Scoring Engine (deterministic 5 C's)
    const scoringResult = runScoringEngine(validated, gstrResult, contradictionResult);

    // Step 8: Limit Engine
    const limitResult = runLimitEngine(validated, gstrResult, scoringResult);

    // Step 9: Warning Engine
    const warningResult = runWarningEngine(validated, gstrResult);

    // Step 10: Confidence Engine
    const confidenceReport = computeConfidence(validated);

    // Step 11: Compute verdict (pure logic)
    let decision: 'APPROVE' | 'REJECT' | 'REFER';
    if (scoringResult.autoReject) {
      decision = 'REJECT';
    } else if (gstrResult.criticalMismatchFlag) {
      decision = 'REJECT';
    } else if (scoringResult.compositeScore >= 75) {
      decision = 'APPROVE';
    } else if (scoringResult.compositeScore >= 60) {
      decision = 'REFER';
    } else {
      decision = 'REJECT';
    }

    // Step 12: Assemble AnalysisResult
    const cScores = [
      scoringResult.character,
      scoringResult.capacity,
      scoringResult.capital,
      scoringResult.collateral,
      scoringResult.conditions,
    ].map((c, i) => ({
      label: c.label,
      score: c.score,
      weight: c.weight,
      color: SCORE_COLORS[i].color,
      tagClass: SCORE_COLORS[i].tagClass,
      note: c.deductions.length > 0 ? c.deductions[0].value : 'Clean',
      detail: c.deductions.map(d => `${d.rule}: ${d.value} (${d.threshold})`).join('. ') || 'No deductions applied.',
      interval: Math.round(confidenceReport[c.label as keyof typeof confidenceReport] === 'high' ? 1 : confidenceReport[c.label as keyof typeof confidenceReport] === 'medium' ? 3 : 6) as number,
      confidenceNote: `${(confidenceReport[c.label as keyof typeof confidenceReport] || 'medium')} confidence — ${c.deductions.length > 0 ? `${c.deductions.length} rule(s) applied` : 'no deductions'}`,
    }));

    // Risk signals from all engines
    const riskSignals = [
      ...gstrResult.flags.map(f => ({
        severity: f.severity === 'critical' ? 'high' as const : f.severity,
        color: SIGNAL_COLORS[f.severity] || '#0066CC',
        title: f.title,
        body: f.detail,
        meta: `SOURCE: GSTR Engine · Rule: ${f.rule}`,
        impact: f.impact,
      })),
      ...contradictionResult.flags.map(f => ({
        severity: f.severity === 'critical' ? 'high' as const : f.severity,
        color: SIGNAL_COLORS[f.severity] || '#0066CC',
        title: f.title,
        body: f.detail,
        meta: `SOURCE: Contradiction Engine · ${f.sourceA} vs ${f.sourceB}`,
        impact: `${f.gapPct}% gap`,
      })),
      ...warningResult.triggers.filter(t => t.severity === 'critical' || t.severity === 'high').map(t => ({
        severity: t.severity === 'critical' ? 'high' as const : t.severity as 'high' | 'medium' | 'low',
        color: SIGNAL_COLORS[t.severity] || '#0066CC',
        title: t.title,
        body: t.description,
        meta: `SOURCE: Warning Engine · ${t.type}`,
        impact: `Score impact: ${t.scoreImpact > 0 ? '+' : ''}${t.scoreImpact} pts`,
      })),
    ];

    // Explain chain (deterministic)
    const explainChain = [
      { text: `<strong>${validated.companyName || 'Unknown Company'}</strong> — ${files.length} documents (${totalPages} pages) processed. ${fileResults.filter(f => f.extracted).length} files extracted successfully.` },
      { text: `<strong>${validated.industry || 'General'}</strong> sector identified. Revenue: ₹${validated._revenue} Cr, Net Worth: ₹${validated._netWorth} Cr, D/E: ${validated._deRatio}×.` },
      ...scoringResult.allAuditEntries.slice(0, 4).map(a => ({
        text: `<strong>${a.rule}</strong>: ${a.value} → <span class="text-brand-amber font-semibold">${a.category} ${a.deduction > 0 ? '+' : ''}${a.deduction} pts</span> (${a.threshold})`,
      })),
      { text: `<strong>Composite Score: ${scoringResult.compositeScore}</strong> → Verdict: <span class="text-brand-${decision === 'APPROVE' ? 'green' : decision === 'REFER' ? 'amber' : 'red'} font-semibold">${decision} — ${limitResult.limitFormatted} at ${limitResult.interestRate}</span>` },
    ];

    // Research items
    const researchItems = [
      { tag: 'Rule Engine', tagClass: 'tag-blue', sentiment: 'neutral' as const, body: `5 C's scored deterministically. ${scoringResult.allAuditEntries.length} rules evaluated. Composite: ${scoringResult.compositeScore}/100.`, meta: `IntelliCredit Rule Engine · ${new Date().toLocaleDateString('en-IN')}` },
      { tag: validated.industry?.split(' ')[0] || 'Sector', tagClass: 'tag-green', sentiment: 'neutral' as const, body: `${validated.industry} sector. D/E ${validated._deRatio}× is ${validated._deRatio <= 2.0 ? 'within' : 'above'} sector norms. DSCR: ${validated._dscr}×.`, meta: `Sector Analysis · ${validated.industry}` },
      ...(gstrResult.flags.length > 0 ? [{ tag: 'GST', tagClass: 'tag-amber', sentiment: 'negative' as const, body: gstrResult.flags[0].detail, meta: `GSTR Engine · ${gstrResult.flags[0].rule}` }] : []),
      ...(contradictionResult.flags.length > 0 ? [{ tag: 'Contradiction', tagClass: 'tag-red', sentiment: 'negative' as const, body: contradictionResult.flags[0].detail, meta: `Contradiction Engine · ${contradictionResult.flags[0].rule}` }] : []),
      { tag: 'Confidence', tagClass: confidenceReport.overallConfidence === 'high' ? 'tag-green' : confidenceReport.overallConfidence === 'medium' ? 'tag-amber' : 'tag-red', sentiment: (confidenceReport.overallConfidence === 'high' ? 'positive' : 'neutral') as 'positive' | 'neutral', body: `Overall confidence: ${confidenceReport.overallConfidence}. ${confidenceReport.notes.slice(0, 2).join('. ')}`, meta: 'Confidence Engine' },
    ];

    const elapsedMs = Date.now() - startTime;
    const minutes = Math.floor(elapsedMs / 60000);
    const seconds = Math.floor((elapsedMs % 60000) / 1000);
    const processingTime = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;

    // The complete rule-engine result (NO AI dependency)
    const ruleResult = {
      companyProfile: {
        companyName: validated.companyName || 'Unknown Company',
        cin: validated.cin || 'Not Available',
        promoter: validated.promoterName ? `${validated.promoterName}${validated.promoterStake ? ` (${validated.promoterStake}%)` : ''}` : 'See documents',
        turnover: `₹${validated._revenue} Cr`,
        industry: validated.industry || 'Manufacturing / General',
        incorporation: validated.incorporationYear ? `${validated.incorporationYear} · ${2026 - validated.incorporationYear} years standing` : 'See filings',
      },
      financials: {
        netWorth: `₹${validated._netWorth} Cr`,
        debtEquity: `${validated._deRatio}×`,
        dscr: `${validated._dscr}×`,
        currentRatio: `${validated._currentRatio}×`,
        gstrGap: gstrResult.itcMismatchPct !== null ? `${gstrResult.itcMismatchPct.toFixed(1)}%` : 'No data',
        patMargin: `${validated._patMargin}%`,
      },
      cScores,
      riskSignals,
      verdict: {
        decision,
        limit: limitResult.limitFormatted,
        rate: limitResult.interestRate,
        tenure: limitResult.tenure,
        rationale: '', // Will be filled by Gemini narrative, or fallback text
      },
      explainChain,
      researchItems,
      compositeScore: scoringResult.compositeScore,
      processingTime,
      pagesProcessed: totalPages,
      extractedText: allText,
      ruleAuditTrail: scoringResult.allAuditEntries,
      confidenceReport,
      limitBreakdown: limitResult.breakdown,
      warningTriggers: warningResult.triggers,
    };

    // ────────────────────────────────────────────
    // STEP 13-15: STREAM RESULT + ASYNC GEMINI NARRATIVE
    // ────────────────────────────────────────────

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        // Send extraction info
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'extraction', files: fileResults, totalPages })}\n\n`));

        // Send status
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'status', step: 'rule_engine', message: 'Running deterministic rule engines...' })}\n\n`));

        // Step 13: Stream the deterministic result immediately
        const resultJSON = JSON.stringify(ruleResult);
        for (let i = 0; i < resultJSON.length; i += 50) {
          const chunk = resultJSON.substring(i, i + 50);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'token', token: chunk })}\n\n`));
        }

        // Step 14-15: ASYNC Gemini narrative (non-blocking)
        try {
          if (GEMINI_API_KEY) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'status', step: 'narrative', message: 'Generating AI narrative...' })}\n\n`));

            const narrativePrompt = `You are writing a Credit Appraisal Memorandum (CAM) rationale for a bank. Based on the following deterministic analysis results, write a 3-5 sentence professional rationale explaining the credit decision.

Company: ${ruleResult.companyProfile.companyName}
Sector: ${ruleResult.companyProfile.industry}
Composite Score: ${scoringResult.compositeScore}/100
Decision: ${decision}
Limit: ${limitResult.limitFormatted} at ${limitResult.interestRate}
DSCR: ${validated._dscr}×
D/E: ${validated._deRatio}×
Revenue: ₹${validated._revenue} Cr
Net Worth: ₹${validated._netWorth} Cr
${gstrResult.flags.length > 0 ? `GST Flags: ${gstrResult.flags.map(f => f.title).join('; ')}` : ''}
${contradictionResult.flags.length > 0 ? `Contradictions: ${contradictionResult.flags.map(f => f.title).join('; ')}` : ''}
Key deductions: ${scoringResult.allAuditEntries.slice(0, 5).map(a => `${a.rule}: ${a.value}`).join(', ')}

Write ONLY the rationale text. No headers, no JSON, no markdown.`;

            const res = await fetch(GEMINI_URL, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${GEMINI_API_KEY}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                model: 'gemini-2.5-flash',
                messages: [{ role: 'user', content: narrativePrompt }],
                max_tokens: 500,
                temperature: 0.4,
              }),
            });

            if (res.ok) {
              const data = await res.json();
              const narrative = data.choices?.[0]?.message?.content?.trim() || '';
              if (narrative) {
                ruleResult.verdict.rationale = narrative;
              }
            }
          }
        } catch (err) {
          console.warn('[analyze] Gemini narrative failed (non-blocking):', err);
        }

        // Fallback rationale if Gemini didn't produce one
        if (!ruleResult.verdict.rationale) {
          ruleResult.verdict.rationale = `${decision === 'APPROVE' ? 'Approved' : decision === 'REFER' ? 'Referred to committee' : 'Rejected'} — ${ruleResult.companyProfile.companyName}. Composite score: ${scoringResult.compositeScore}/100. DSCR: ${validated._dscr}×, D/E: ${validated._deRatio}×. ${scoringResult.allAuditEntries.length} rules evaluated. ${ruleResult.riskSignals.length} risk signals detected. Rule engine analysis complete — AI narrative unavailable.`;
        }

        // Send final complete result
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'complete', result: ruleResult })}\n\n`));
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error: any) {
    console.error('Analysis error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Analysis failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
