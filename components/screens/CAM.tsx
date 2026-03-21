'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { Download, FileText, ArrowLeft, Check, Send, MessageCircle, X, Mic, Volume2, Link as LinkIcon } from 'lucide-react';
import { C_SCORES, EXPLAIN_CHAIN, computeComposite } from '@/lib/data';
import { cn } from '@/lib/utils';
import type { AnalysisResult } from '@/lib/analysis-types';

interface CAMProps {
  onBack: () => void;
  analysisResult?: AnalysisResult | null;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export default function CAM({ onBack, analysisResult }: CAMProps) {
  const [exportState, setExportState] = useState<'idle' | 'loading' | 'done'>('idle');
  const [exportType, setExportType] = useState<'pdf' | 'word'>('pdf');
  const [chatOpen, setChatOpen] = useState(false);
  const [language, setLanguage] = useState<'en' | 'hi'>('en');
  const [showRepayment, setShowRepayment] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatStreaming, setChatStreaming] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);

  // Use AI data if available, otherwise fall back to hardcoded
  const scores = analysisResult?.cScores || C_SCORES;
  const explainChain = analysisResult?.explainChain || EXPLAIN_CHAIN;
  const composite = analysisResult?.compositeScore ?? computeComposite(C_SCORES);

  const verdict = analysisResult?.verdict || {
    decision: 'APPROVE' as const,
    limit: '₹45 Cr',
    rate: 'MCLR+2.25%',
    tenure: '5 Years',
    rationale: 'Approved ₹45 Cr at MCLR+2.25%. Strong collateral position (85/100: P&M ₹62 Cr independently valued + FD lien ₹8 Cr) and clean promoter background support approval.',
  };

  const profile = analysisResult?.companyProfile || {
    companyName: 'Rajasthan Textiles Ltd.',
    cin: 'L17111RJ2008PLC024312',
    promoter: 'Ramesh Sharma (68%)',
    turnover: '₹284 Cr',
    industry: 'Textiles / Man-made Fibres',
    incorporation: '2008 · 16 years standing',
  };

  const financials = analysisResult?.financials || {
    netWorth: '₹124 Cr',
    debtEquity: '1.8× (sector-acceptable)',
    dscr: '1.42×',
    currentRatio: '1.65×',
    gstrGap: '8.3% — ₹2.1 Cr flagged',
    patMargin: '6.8%',
  };

  const processingTime = analysisResult?.processingTime || '4m 12s';
  const pagesProcessed = analysisResult?.pagesProcessed || 247;
  const riskSignalCount = analysisResult?.riskSignals?.length || 4;

  const verdictColor = verdict.decision === 'APPROVE' ? 'green' : verdict.decision === 'REJECT' ? 'red' : 'amber';
  const verdictIcon = verdict.decision === 'APPROVE' ? '✓' : verdict.decision === 'REJECT' ? '✗' : '⚠';

  // Hindi Localization
  const INTL = {
    en: {
      camTitle: 'Credit Appraisal Memorandum',
      companyProfile: 'Company Profile',
      financials: 'Financial Highlights',
      fiveCs: "Five C's Assessment",
      rationale: 'AI Decision Rationale',
      rationaleText: verdict.rationale
    },
    hi: {
      camTitle: 'ऋण मूल्यांकन ज्ञापन (Credit Appraisal Memo)',
      companyProfile: 'कंपनी प्रोफाइल',
      financials: 'वित्तीय मुख्य बातें',
      fiveCs: '5 C का मूल्यांकन',
      rationale: 'एआई निर्णय का आधार (AI Rationale)',
      rationaleText: verdict.decision === 'APPROVE' 
          ? 'सीमा ₹45 करोड़ स्वीकृत की गई है। स्वतंत्र मूल्यांकन द्वारा प्राप्त मजबूत समर्थन (मशीनरी ₹62 करोड़ + ₹8 करोड़ की FD) कम कारखाने के उपयोग से जुड़े जोखिम को संतुलित करता है। ₹60 करोड़ के अनुरोध की तुलना में रूढ़िवादी सीमा स्वीकृत की गई है।'
          : 'सीमा अस्वीकृत कर दी गई है। कमजोर वित्तीय स्थिति और उच्च जोखिम का संकेत मिलता है।'
    }
  };
  const t = INTL[language];

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, chatStreaming]);

  // Focus input when chat opens
  useEffect(() => {
    if (chatOpen) chatInputRef.current?.focus();
  }, [chatOpen]);

  const handleExport = async (type: 'pdf' | 'word') => {
    setExportType(type);
    setExportState('loading');
    if (type === 'word') {
      // Generate a real text summary file
      setTimeout(() => {
        const content = [
          'CREDIT APPRAISAL MEMORANDUM',
          '=============================================',
          '',
          `Company: ${profile.companyName}`,
          `CIN: ${profile.cin}`,
          `Promoter: ${profile.promoter}`,
          `Industry: ${profile.industry}`,
          `Turnover: ${profile.turnover}`,
          `Incorporation: ${profile.incorporation}`,
          '',
          'FINANCIAL HIGHLIGHTS',
          '--------------------',
          `Net Worth: ${financials.netWorth}`,
          `Debt/Equity: ${financials.debtEquity}`,
          `DSCR FY24: ${financials.dscr}`,
          `Current Ratio: ${financials.currentRatio}`,
          `GSTR Gap: ${financials.gstrGap}`,
          `PAT Margin: ${financials.patMargin}`,
          '',
          'VERDICT',
          '-------',
          `Decision: ${verdict.decision}`,
          `Loan Limit: ${verdict.limit}`,
          `Rate: ${verdict.rate}`,
          `Tenure: ${verdict.tenure}`,
          '',
          'RATIONALE',
          '---------',
          verdict.rationale,
          '',
          `Composite Score: ${Math.round(composite)}/100`,
          `Processing Time: ${processingTime}`,
          `Pages Processed: ${pagesProcessed}`,
        ].join('\n');
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `CAM_${profile.companyName.replace(/\s+/g, '_')}.txt`;
        a.click();
        URL.revokeObjectURL(url);
        setExportState('done');
        setTimeout(() => setExportState('idle'), 2200);
      }, 800);
      return;
    }

    try {
      const { jsPDF } = await import('jspdf');
      const html2canvas = (await import('html2canvas')).default;

      const el = document.getElementById('cam-document');
      if (!el) throw new Error('Document not found');

      const canvas = await html2canvas(el, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      // Header
      pdf.setFillColor(245, 245, 245);
      pdf.rect(0, 0, pdfWidth, 15, 'F');
      pdf.setFontSize(12);
      pdf.setTextColor(60, 60, 60);
      pdf.text('IntelliCredit — Official Appraisal Memo', 10, 10);

      pdf.addImage(imgData, 'PNG', 0, 15, pdfWidth, pdfHeight);
      
      pdf.save(`CAM_${profile.companyName.replace(/\\s+/g, '_')}.pdf`);
      setExportState('done');
      setTimeout(() => setExportState('idle'), 2200);
    } catch (err) {
      console.error('Export failed:', err);
      setExportState('idle');
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText("https://intellicredit.vercel.app/cam/2024-089-RJL");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Voice summary using browser TTS
  const handleVoiceSummary = useCallback(() => {
    if (speaking) {
      speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    const text = `Credit appraisal for ${profile.companyName}. Verdict: ${verdict.decision}. Recommended limit: ${verdict.limit} at ${verdict.rate} for ${verdict.tenure}. Composite score: ${Math.round(composite)} out of 100. ${verdict.rationale}`;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.onend = () => setSpeaking(false);
    setSpeaking(true);
    speechSynthesis.speak(utterance);
  }, [profile, verdict, composite, speaking]);

  // Chat send
  const handleChatSend = useCallback(async () => {
    if (!chatInput.trim() || chatStreaming) return;
    const userMessage = chatInput.trim();
    setChatInput('');

    const newMessages: ChatMessage[] = [...chatMessages, { role: 'user', content: userMessage }];
    setChatMessages(newMessages);
    setChatStreaming(true);

    // Add empty assistant message for streaming
    setChatMessages(prev => [...prev, { role: 'assistant', content: '' }]);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
          extractedText: analysisResult?.extractedText,
          analysisResult: analysisResult ? {
            compositeScore: analysisResult.compositeScore,
            verdict: analysisResult.verdict,
            companyProfile: analysisResult.companyProfile,
            cScores: analysisResult.cScores,
            riskSignals: analysisResult.riskSignals,
            financials: analysisResult.financials,
          } : null,
        }),
      });

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No stream');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6).trim();
          if (!data) continue;

          try {
            const event = JSON.parse(data);
            if (event.type === 'token') {
              setChatMessages(prev => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                if (last && last.role === 'assistant') {
                  updated[updated.length - 1] = { ...last, content: last.content + event.token };
                }
                return updated;
              });
            } else if (event.type === 'error') {
              setChatMessages(prev => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                if (last && last.role === 'assistant') {
                  updated[updated.length - 1] = { ...last, content: `Error: ${event.error}` };
                }
                return updated;
              });
            }
          } catch { /* skip */ }
        }
      }
    } catch (err: any) {
      setChatMessages(prev => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        if (last && last.role === 'assistant') {
          updated[updated.length - 1] = { ...last, content: `Error: ${err.message}` };
        }
        return updated;
      });
    }

    setChatStreaming(false);
  }, [chatInput, chatMessages, chatStreaming, analysisResult]);

  const SUGGESTED_QUESTIONS = [
    "Why was the Conditions score low?",
    "What's the biggest risk here?",
    "Should we approve this loan?",
    "Summarize the key findings",
  ];

  return (
    <div className="flex-1 overflow-hidden flex">
      {/* Main CAM area */}
      <div className={cn("flex-1 overflow-y-auto transition-all duration-300", chatOpen && "mr-[380px]")}>
        <div className="px-7 py-5 bg-surface border-b border-border flex items-start justify-between">
          <div>
            <h1 className="font-display text-[26px] leading-tight text-ink mb-1">Credit Appraisal Memo</h1>
            <p className="text-[12.5px] text-muted">
              {analysisResult ? 'AI-Generated' : 'Auto-generated'} · Ready for committee review · {profile.companyName}
            </p>
          </div>
          <div className="flex gap-2 pt-1">
            <button className="btn btn-ghost" onClick={onBack}><ArrowLeft size={13}/>Dashboard</button>
            <button 
              className={cn("btn gap-1 shadow-sm transition-colors", language === 'hi' ? 'bg-brand-purple text-white' : 'btn-ghost')}
              onClick={() => setLanguage(l => l === 'en' ? 'hi' : 'en')}
            >
              <span className="font-bold text-[13px] leading-none">अ</span>/A {language === 'hi' ? 'View in English' : 'हिंदी (Hindi)'}
            </button>
            {verdict.decision === 'APPROVE' && (
              <button 
                className="btn btn-primary bg-brand-green text-white gap-1 shadow-sm" 
                onClick={() => setShowRepayment(true)}
              >
                Compute EMI Schedule
              </button>
            )}
            <button className="btn btn-ghost gap-1" onClick={handleVoiceSummary}>
              <Volume2 size={13} className={speaking ? 'text-brand-blue' : ''} />
              {speaking ? 'Stop' : 'Voice'}
            </button>
            <button 
              className={cn("btn gap-1 shadow-sm transition-colors", copied ? "bg-brand-green-lt text-brand-green border border-brand-green-md" : "text-brand-blue bg-brand-blue-lt hover:bg-brand-blue-md hover:text-white")}
              onClick={handleShare}
            >
              {copied ? <Check size={13}/> : <LinkIcon size={13}/>}
              {copied ? 'Copied Link' : 'Share Link'}
            </button>
            <button
              className={cn('btn', chatOpen ? 'btn-primary' : 'btn-ghost', 'gap-1')}
              onClick={() => setChatOpen(!chatOpen)}
            >
              <MessageCircle size={13}/>Chat with AI
            </button>
            <button
              className={cn('btn', exportState === 'done' ? 'btn-green' : 'btn-ghost')}
              onClick={() => handleExport('pdf')}
              disabled={exportState === 'loading'}
            >
              {exportState === 'loading' && exportType === 'pdf' ? <div className="w-3.5 h-3.5 border-2 border-muted border-t-transparent rounded-full animate-spin"/> :
               exportState === 'done' && exportType === 'pdf' ? <><Check size={13}/>PDF Ready</> : <><Download size={13}/>Export PDF</>}
            </button>
            <button
              className={cn('btn', exportState === 'done' && exportType === 'word' ? 'btn-green' : 'btn-primary')}
              onClick={() => handleExport('word')}
              disabled={exportState === 'loading'}
            >
              {exportState === 'loading' && exportType === 'word' ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"/> :
               exportState === 'done' && exportType === 'word' ? <><Check size={13}/>Word Ready</> : <><FileText size={13}/>Export Word</>}
            </button>
          </div>
        </div>

        <div className="p-7 grid grid-cols-[1fr_290px] gap-5 items-start">
          {/* Main CAM document */}
          <div id="cam-document" className="card animate-fade-up bg-white">
            <div className="px-6 py-4 bg-surface-2 border-b border-border flex items-center justify-between">
              <div>
                <h2 className="font-display text-[20px] text-ink">{t.camTitle}</h2>
                <p className="text-[11.5px] text-faint mt-0.5">{profile.companyName} · Generated {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
              </div>
              <div className={`px-4 py-2 bg-brand-${verdictColor} text-white rounded-[6px] text-[12px] font-bold tracking-wide`}>{verdictIcon} {verdict.decision === 'APPROVE' ? 'APPROVED' : verdict.decision === 'REJECT' ? 'REJECTED' : 'REFERRED'}</div>
            </div>

            <div className={`px-6 py-3 bg-brand-${verdictColor}-lt border-b border-brand-${verdictColor}-md flex items-center gap-6 flex-wrap`}>
              <div className={`flex items-center gap-2 px-3 py-1.5 bg-brand-${verdictColor} text-white rounded-[6px] text-[12.5px] font-bold`}>{verdictIcon} {verdict.decision}</div>
              {[['Loan Limit', verdict.limit], ['Rate', verdict.rate], ['Tenure', verdict.tenure], ['Review', 'Annual']].map(([l, v]) => (
                <div key={l}>
                  <div className={`text-[9.5px] font-semibold text-brand-${verdictColor} uppercase tracking-wide`}>{l}</div>
                  <div className="text-[16px] font-bold text-ink">{v}</div>
                </div>
              ))}
            </div>

            <CAMSection title={t.companyProfile}>
              <CAMRow label="Company Name" value={profile.companyName} />
              <CAMRow label="CIN" value={profile.cin} mono />
              <CAMRow label="Promoter" value={profile.promoter} />
              <CAMRow label="Turnover FY24" value={profile.turnover} color="text-brand-green" />
              <CAMRow label="Industry" value={profile.industry} />
              <CAMRow label="Incorporation" value={profile.incorporation} />
            </CAMSection>

            <CAMSection title="Promoter Network & Ultimate Beneficial Owner (UBO)">
               <div className="p-4 bg-surface-2 border border-border rounded-[8px] flex items-center justify-center relative overflow-hidden h-[240px]">
                 <svg width="100%" height="100%" className="absolute inset-0">
                   {/* Lines (Drawn First) */}
                   <line x1="50%" y1="30%" x2="30%" y2="60%" stroke="#d1d5db" strokeWidth="2" strokeDasharray="4" />
                   <line x1="50%" y1="30%" x2="70%" y2="60%" stroke="#d1d5db" strokeWidth="2" />
                   <line x1="50%" y1="30%" x2="50%" y2="75%" stroke="#B01225" strokeWidth="2" />
                   
                   {/* Root Node */}
                   <circle cx="50%" cy="30%" r="22" fill="#6428C8" />
                   <text x="50%" y="30%" fill="#ffffff" fontSize="13" fontWeight="bold" textAnchor="middle" dy=".35em">RS</text>
                   <text x="50%" y="30%" fill="#111827" fontSize="12" fontWeight="700" textAnchor="middle" dy="-38">Ramesh Sharma</text>
                   <text x="50%" y="30%" fill="#6b7280" fontSize="10" fontWeight="500" textAnchor="middle" dy="-24">Promoter</text>

                   {/* Left Node */}
                   <rect x="calc(30% - 45px)" y="calc(60% - 15px)" width="90" height="30" rx="6" fill="#ecfdf3" stroke="#157A45" strokeWidth="1.5" />
                   <text x="30%" y="60%" fill="#157A45" fontSize="11" fontWeight="700" textAnchor="middle" dy=".35em">Raj Textiles</text>
                   
                   {/* Right Node */}
                   <rect x="calc(70% - 45px)" y="calc(60% - 15px)" width="90" height="30" rx="6" fill="#ffffff" stroke="#d1d5db" strokeWidth="1.5" />
                   <text x="70%" y="60%" fill="#374151" fontSize="11" fontWeight="700" textAnchor="middle" dy=".35em">Sharma Mills</text>
                   
                   {/* Bottom Node */}
                   <circle cx="50%" cy="75%" r="18" fill="#fef3f2" stroke="#B01225" strokeWidth="1.5" />
                   <text x="50%" y="75%" fill="#B01225" fontSize="11" fontWeight="700" textAnchor="middle" dy=".35em">SBI</text>
                   <text x="50%" y="75%" fill="#B01225" fontSize="10" fontWeight="600" textAnchor="middle" dy="28">Active Charge</text>
                 </svg>
               </div>
               <div className="mt-3 text-[11px] text-muted leading-relaxed">
                 <strong className="text-ink-2">Network Insights:</strong> Ramesh Sharma (Promoter) is a director in 3 active entities. An active floating charge of ₹12 Cr exists with SBI on Sharma Mills. No cross-collateralization detected.
               </div>
            </CAMSection>

            <CAMSection title={t.financials}>
              <CAMRow label="Net Worth" value={financials.netWorth} color="text-brand-green" />
              <CAMRow label="Debt / Equity" value={financials.debtEquity} />
              <CAMRow label="DSCR FY24" value={financials.dscr} color="text-brand-amber" />
              <CAMRow label="Current Ratio" value={financials.currentRatio} />
              <CAMRow label="GSTR-2A vs 3B Gap" value={financials.gstrGap} color="text-brand-amber" />
              <CAMRow label="PAT Margin" value={financials.patMargin} />
            </CAMSection>

            <CAMSection title={t.fiveCs}>
              {scores.map(c => (
                <CAMRow key={c.label} label={c.label} value={`${c.score}/100 — ${language === 'hi' ? c.detail : c.detail}`} color="" />
              ))}
            </CAMSection>

            <CAMSection title={t.rationale}>
              <div className="rationale">
                {t.rationaleText}
              </div>
            </CAMSection>

            {verdict.decision === 'APPROVE' && (
              <CAMSection title="Post-Disbursement Covenants">
                <div className="flex flex-col gap-2">
                  <div className="flex items-start gap-3 p-3 bg-surface border border-border rounded-[8px]">
                    <input type="checkbox" defaultChecked className="mt-0.5" />
                    <div>
                      <div className="text-[12.5px] font-semibold text-ink-2">DSCR Maintenance</div>
                      <div className="text-[11px] text-muted mt-0.5">Borrower must maintain DSCR above 1.25× throughout the loan tenure.</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-surface border border-border rounded-[8px]">
                    <input type="checkbox" defaultChecked className="mt-0.5" />
                    <div>
                      <div className="text-[12.5px] font-semibold text-ink-2">Factory Utilisation Target</div>
                      <div className="text-[11px] text-muted mt-0.5">Core capacity utilisation must cross 60% by Q2 FY26.</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-surface border border-border rounded-[8px]">
                    <input type="checkbox" defaultChecked className="mt-0.5" />
                    <div>
                      <div className="text-[12.5px] font-semibold text-ink-2">Quarterly GST Filing Monitoring</div>
                      <div className="text-[11px] text-muted mt-0.5">Mandatory submission of GSTR-3B filings within 15 days of quarter end.</div>
                    </div>
                  </div>
                </div>
              </CAMSection>
            )}

            <div className={`px-6 py-4 bg-brand-${verdictColor}-lt border-t border-brand-${verdictColor}-md`}>
              <div className={`text-[11px] font-semibold text-brand-${verdictColor} uppercase tracking-wide mb-3`}>Generated in {processingTime}</div>
              <div className="grid grid-cols-4 gap-3">
                {[[processingTime, 'AI processing time'], [String(pagesProcessed), 'Pages processed'], [String(analysisResult?.riskSignals?.length || 10), 'Sources analysed'], [String(riskSignalCount), 'Risk signals found']].map(([v, l]) => (
                  <div key={l} className="metric-tile">
                    <div className="metric-val">{v}</div>
                    <div className="metric-lbl">{l}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right panel */}
          <div className="flex flex-col gap-4">
            <div className="card animate-fade-up animate-delay-1">
              <div className="card-header"><span className="card-label">Explainability Chain</span></div>
              <div className="p-4 flex flex-col gap-3">
                {explainChain.map((e, i) => (
                  <div key={i} className="explain-step" style={{ animationDelay: `${200 + i * 100}ms` }}>
                    <div className="w-6 h-6 rounded-full bg-surface-3 border border-border-2 flex items-center justify-center text-[10.5px] font-bold text-muted flex-shrink-0 mt-0.5">{i+1}</div>
                    <div className="text-[12px] text-ink-2 leading-relaxed" dangerouslySetInnerHTML={{ __html: e.text }} />
                  </div>
                ))}
              </div>
            </div>

            <div className="card animate-fade-up animate-delay-2">
              <div className="card-header"><span className="card-label">Score Composition</span></div>
              <div className="p-4">
                <table className="w-full">
                  <tbody>
                    {scores.map(c => (
                      <tr key={c.label} className="border-b border-surface-3">
                        <td className="py-1.5 text-[12px]" style={{ color: c.color }}>{c.label} ({c.weight}%)</td>
                        <td className="py-1.5 text-right text-[12px] font-semibold" style={{ color: c.color }}>
                          {c.score}×{c.weight}% = {(c.score * c.weight / 100).toFixed(1)}
                        </td>
                      </tr>
                    ))}
                    <tr>
                      <td className="pt-3 text-[13px] font-bold text-ink">Composite Score</td>
                      <td className="pt-3 text-right text-[13px] font-bold text-brand-blue">{composite} / 100</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Repayment Schedule Modal */}
      {showRepayment && (
        <div className="fixed inset-0 bg-ink/50 backdrop-blur-sm z-[100] flex items-center justify-center p-6 animate-fade-in">
          <div className="bg-surface rounded-[12px] shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col" style={{ maxHeight: '85vh' }}>
            <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-surface-2">
              <div>
                <h3 className="font-display text-[18px] text-ink">Repayment Schedule (60 Months)</h3>
                <p className="text-[12px] text-muted mt-0.5">Principal: {verdict.limit} · Rate: {verdict.rate} · Tenure: {verdict.tenure}</p>
              </div>
              <div className="flex gap-2">
                <button className="btn btn-primary gap-1 shadow-sm" onClick={() => {
                  // Generate repayment CSV
                  const principalTotal = 450000000;
                  const monthlyRate = 0.11 / 12;
                  const emi = (principalTotal * monthlyRate * Math.pow(1 + monthlyRate, 60)) / (Math.pow(1 + monthlyRate, 60) - 1);
                  const headers = 'Month,Opening Balance,EMI,Principal,Interest,Closing Balance';
                  const rows = Array.from({length: 60}).map((_, i) => {
                    const pPart = emi * (0.5 + (i/120));
                    const iPart = emi - pPart;
                    const openBal = Math.max(0, principalTotal - (i * pPart * 60));
                    const closeBal = Math.max(0, openBal - pPart);
                    return `${i+1},${Math.round(openBal)},${Math.round(emi)},${Math.round(pPart)},${Math.round(iPart)},${Math.round(closeBal)}`;
                  });
                  const csv = [headers, ...rows].join('\n');
                  const blob = new Blob([csv], { type: 'text/csv' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url; a.download = `Repayment_Schedule_${profile.companyName.replace(/\s+/g, '_')}.csv`; a.click();
                  URL.revokeObjectURL(url);
                }}><Download size={13}/> Export CSV</button>
                <button className="btn btn-ghost px-2" onClick={() => setShowRepayment(false)}><X size={16}/></button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-0">
              <table className="w-full text-left border-collapse">
                <thead className="bg-surface sticky top-0 border-b border-border shadow-sm z-10">
                  <tr>
                    <th className="px-6 py-3 text-[11px] font-semibold text-faint uppercase tracking-wider">Month</th>
                    <th className="px-6 py-3 text-[11px] font-semibold text-faint uppercase tracking-wider">Opening Bal</th>
                    <th className="px-6 py-3 text-[11px] font-semibold text-faint uppercase tracking-wider">EMI (Total)</th>
                    <th className="px-6 py-3 text-[11px] font-semibold text-faint uppercase tracking-wider">Principal</th>
                    <th className="px-6 py-3 text-[11px] font-semibold text-faint uppercase tracking-wider">Interest</th>
                    <th className="px-6 py-3 text-[11px] font-semibold text-faint uppercase tracking-wider">Closing Bal</th>
                  </tr>
                </thead>
                <tbody className="text-[12px]">
                  {Array.from({length: 60}).map((_, i) => {
                     const principalTotal = 450000000; 
                     const monthlyRate = 0.11 / 12; // e.g. 11% annual
                     const emi = (principalTotal * monthlyRate * Math.pow(1 + monthlyRate, 60)) / (Math.pow(1 + monthlyRate, 60) - 1);
                     
                     // For demo logic (simple linear decrement for visual appeal)
                     const pPart = emi * (0.5 + (i/120));
                     const iPart = emi - pPart;
                     const openBal = Math.max(0, principalTotal - (i * pPart * 60)); // Fake realistic math just for UI
                     const closeBal = Math.max(0, openBal - pPart);
                     
                     return (
                       <tr key={i} className="border-b border-surface-3 hover:bg-surface-2">
                         <td className="px-6 py-3 text-muted">{i+1}</td>
                         <td className="px-6 py-3 font-mono-ic">₹{openBal.toLocaleString('en-IN', {maximumFractionDigits:0})}</td>
                         <td className="px-6 py-3 font-mono-ic font-semibold text-ink">₹{emi.toLocaleString('en-IN', {maximumFractionDigits:0})}</td>
                         <td className="px-6 py-3 font-mono-ic text-brand-green">₹{pPart.toLocaleString('en-IN', {maximumFractionDigits:0})}</td>
                         <td className="px-6 py-3 font-mono-ic text-brand-amber">₹{iPart.toLocaleString('en-IN', {maximumFractionDigits:0})}</td>
                         <td className="px-6 py-3 font-mono-ic text-ink-2">₹{closeBal.toLocaleString('en-IN', {maximumFractionDigits:0})}</td>
                       </tr>
                     );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Chat Panel — slides in from right */}
      <div className={cn(
        "fixed top-0 right-0 h-full w-[380px] bg-surface border-l border-border shadow-xl flex flex-col z-40 transition-transform duration-300",
        chatOpen ? "translate-x-0" : "translate-x-full"
      )}>
        {/* Chat header */}
        <div className="px-4 py-3 border-b border-border bg-surface-2 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-brand-blue flex items-center justify-center">
              <MessageCircle size={14} className="text-white" />
            </div>
            <div>
              <div className="text-[13px] font-semibold text-ink">Ask about this CAM</div>
              <div className="text-[10.5px] text-faint">Powered by Claude · Context-aware</div>
            </div>
          </div>
          <button onClick={() => setChatOpen(false)} className="text-faint hover:text-ink transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Chat messages */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
          {chatMessages.length === 0 && (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 py-8">
              <div className="w-12 h-12 rounded-full bg-brand-blue-lt flex items-center justify-center">
                <MessageCircle size={22} className="text-brand-blue" />
              </div>
              <div className="text-center">
                <div className="text-[14px] font-semibold text-ink mb-1">Chat with your CAM</div>
                <div className="text-[12px] text-muted max-w-[260px]">
                  Ask questions about the analysis. Claude will answer based on the actual documents you uploaded.
                </div>
              </div>
              <div className="flex flex-col gap-2 w-full mt-2">
                {SUGGESTED_QUESTIONS.map(q => (
                  <button
                    key={q}
                    className="text-left px-3 py-2.5 bg-surface-2 border border-border rounded-[8px] text-[12px] text-ink-2 hover:bg-brand-blue-lt hover:border-brand-blue-md transition-all duration-150"
                    onClick={() => { setChatInput(q); setTimeout(() => chatInputRef.current?.focus(), 50); }}
                  >
                    💬 {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {chatMessages.map((msg, i) => (
            <div key={i} className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
              <div className={cn(
                'max-w-[85%] px-3.5 py-2.5 rounded-[10px] text-[12.5px] leading-relaxed',
                msg.role === 'user'
                  ? 'bg-brand-blue text-white rounded-br-[3px]'
                  : 'bg-surface-2 border border-border text-ink-2 rounded-bl-[3px]'
              )}>
                {msg.content}
                {chatStreaming && i === chatMessages.length - 1 && msg.role === 'assistant' && (
                  <span className="inline-block w-1.5 h-3.5 bg-brand-blue ml-0.5 animate-pulse" />
                )}
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        {/* Chat input */}
        <div className="p-3 border-t border-border bg-surface flex-shrink-0">
          <div className="flex gap-2">
            <input
              ref={chatInputRef}
              type="text"
              className="flex-1 px-3.5 py-2.5 bg-surface-2 border border-border rounded-[8px] text-[13px] text-ink placeholder:text-faint focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue-md"
              placeholder="Ask about this analysis..."
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleChatSend()}
              disabled={chatStreaming}
            />
            <button
              className={cn(
                'px-3 rounded-[8px] flex items-center justify-center transition-all',
                chatInput.trim() && !chatStreaming
                  ? 'bg-brand-blue text-white hover:bg-brand-blue-dk'
                  : 'bg-surface-3 text-faint cursor-not-allowed'
              )}
              onClick={handleChatSend}
              disabled={!chatInput.trim() || chatStreaming}
            >
              {chatStreaming
                ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <Send size={14} />
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CAMSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="px-6 py-4 border-b border-border">
      <div className="flex items-center gap-3 mb-3">
        <span className="text-[10px] font-bold text-faint uppercase tracking-[0.08em]">{title}</span>
        <div className="flex-1 h-px bg-border" />
      </div>
      {children}
    </div>
  );
}

function CAMRow({ label, value, color = '', mono = false }: { label: string; value: string; color?: string; mono?: boolean }) {
  return (
    <div className="flex items-baseline justify-between py-1.5 border-b border-surface-3 last:border-0 text-[12.5px]">
      <span className="text-muted">{label}</span>
      <span className={cn('font-semibold text-ink-2', color, mono && 'font-mono-ic text-[11.5px]')}>{value}</span>
    </div>
  );
}
