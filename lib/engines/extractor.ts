// ─────────────────────────────────────────────────
// extractor.ts — 4-Layer Structured Data Extraction
// ─────────────────────────────────────────────────
// Layer 1: Regex (CIN, GSTIN, structured numbers)
// Layer 2: Keyword proximity (find label → grab next number)
// Layer 3: Table parsing (P&L / Balance Sheet rows)
// Layer 4: Fallback estimation (derive from GSTR totals, etc.)

export interface ExtractedData {
  // Company profile
  companyName: string | null;
  cin: string | null;
  cinFound: boolean;
  gstin: string | null;
  pan: string | null;
  incorporationYear: number | null;
  industry: string | null;

  // Promoter
  promoterName: string | null;
  promoterStake: number | null;
  dinNumbers: string[];

  // P&L / Revenue
  revenue: number | null;          // in Cr
  revenueSource: string;
  previousYearRevenue: number | null;
  ebitda: number | null;
  ebitdaMargin: number | null;
  pat: number | null;
  patMargin: number | null;
  depreciation: number | null;
  interestExpense: number | null;

  // Balance Sheet
  netWorth: number | null;
  totalDebt: number | null;
  deRatio: number | null;
  currentAssets: number | null;
  currentLiabilities: number | null;
  currentRatio: number | null;
  accumulatedLosses: boolean;

  // Cash Flow / DSCR
  dscr: number | null;
  dscrSource: string;

  // GST
  gstr3bRevenue: number | null;
  gstr1Revenue: number | null;
  gstr2aITC: number | null;
  gstr3bITCClaimed: number | null;
  lateFilings: number;
  nilReturns: number;
  consecutiveNilReturns: number;

  // ITR
  itrDeclaredIncome: number | null;

  // Bank Statement
  avgMonthlyCredit: number | null;
  avgMonthlyDebit: number | null;
  chequeDishonoursCount: number;
  ccUtilisationPct: number | null;
  emiOverdueDays: number;

  // Collateral
  collateralValue: number | null;
  collateralType: string | null;
  valuationIndependent: boolean;
  sarfaesiProceeding: boolean;
  distressDiscount: number | null;

  // Litigation / MCA
  wilfulDefaulter: boolean;
  ncltAdmitted: boolean;
  dinDisqualified: boolean;
  litigationCount: number;
  litigationMaterialValue: number | null;
  directorChangesInFY: number;
  independentDirResigned: boolean;
  lateROCFiling: boolean;
  goingConcernNote: boolean;

  // Sector
  capacityUtilisation: number | null;
  sectorRBIWatchlist: boolean;
  restructuringInProgress: boolean;

  // Credit Rating
  creditRating: string | null;
  ratingDowngrade: boolean;
  ratingDowngradeNotches: number;

  // Requested
  requestedAmount: number | null;

  // Meta
  sourceFiles: string[];
  totalPages: number;
  extractionTimestamp: string;
}

export interface OfficerInsights {
  capacityUtilisation: number | null;
  collateralValue: number | null;
  managementSentiment: string | null;
  visitDate: string | null;
  flags: string[];
}

// ─────────────────────────────────
//  LAYER 1: Regex patterns
// ─────────────────────────────────

function extractCIN(text: string): string | null {
  const m = text.match(/([UL]\d{5}[A-Z]{2}\d{4}[A-Z]{3}\d{6})/);
  return m ? m[1] : null;
}

function extractGSTIN(text: string): string | null {
  const m = text.match(/(\d{2}[A-Z]{5}\d{4}[A-Z]\d[A-Z\d][A-Z])/);
  return m ? m[1] : null;
}

function extractPAN(text: string): string | null {
  const m = text.match(/([A-Z]{5}\d{4}[A-Z])/);
  return m ? m[1] : null;
}

function extractDINNumbers(text: string): string[] {
  const matches = text.match(/\b\d{8}\b/g) || [];
  // DINs are 8-digit numbers near "DIN" or "Director"
  const dins: string[] = [];
  for (const m of matches) {
    const idx = text.indexOf(m);
    const context = text.substring(Math.max(0, idx - 80), idx).toLowerCase();
    if (context.includes('din') || context.includes('director')) {
      dins.push(m);
    }
  }
  return [...new Set(dins)];
}

function extractIncorporationYear(text: string): number | null {
  const m = text.match(/(?:incorporat|establish|found)[^.]{0,40}?(\d{4})/i);
  if (m) {
    const y = parseInt(m[1]);
    if (y >= 1900 && y <= 2026) return y;
  }
  return null;
}

// ─────────────────────────────────
//  LAYER 2: Keyword proximity
// ─────────────────────────────────

function findNumberNear(text: string, patterns: RegExp[], maxChars = 120): number | null {
  for (const p of patterns) {
    const m = text.match(p);
    if (m) {
      // Try to find a number after the keyword match
      const afterIdx = (m.index || 0) + m[0].length;
      const window = text.substring(afterIdx, afterIdx + maxChars);
      const numMatch = window.match(/[₹Rs.INR\s]*?([\d,]+(?:\.\d+)?)\s*(?:cr|crore|lakh|lakhs?|mn|million|billion)?/i);
      if (numMatch) {
        let val = parseFloat(numMatch[1].replace(/,/g, ''));
        // Convert lakhs to crore
        const unit = (numMatch[0] || '').toLowerCase();
        if (unit.includes('lakh')) val = val / 100;
        if (unit.includes('million') || unit.includes('mn')) val = val / 10;
        if (unit.includes('billion')) val = val * 100;
        if (val > 0 && val < 1000000) return parseFloat(val.toFixed(2));
      }
    }
  }
  return null;
}

function findPercentageNear(text: string, patterns: RegExp[]): number | null {
  for (const p of patterns) {
    const m = text.match(p);
    if (m) {
      const afterIdx = (m.index || 0) + m[0].length;
      const window = text.substring(afterIdx, afterIdx + 80);
      const numMatch = window.match(/([\d.]+)\s*%/);
      if (numMatch) return parseFloat(numMatch[1]);
      // Also try inline
      if (m[1]) return parseFloat(m[1]);
    }
  }
  return null;
}

function findRatioNear(text: string, patterns: RegExp[]): number | null {
  for (const p of patterns) {
    const m = text.match(p);
    if (m) {
      const afterIdx = (m.index || 0) + m[0].length;
      const window = text.substring(afterIdx, afterIdx + 50);
      const numMatch = window.match(/([\d.]+)\s*[×xX:]/);
      if (numMatch) return parseFloat(numMatch[1]);
      // Try bare number
      const bare = window.match(/([\d.]+)/);
      if (bare) {
        const v = parseFloat(bare[1]);
        if (v > 0 && v < 20) return v;
      }
      if (m[1]) return parseFloat(m[1]);
    }
  }
  return null;
}

function extractPromoter(text: string): { name: string | null; stake: number | null } {
  // Try to find promoter + name
  const nameMatch = text.match(
    /(?:promoter|director|managing\s*director|chairman|md)[:\s]*(?:mr\.?|mrs\.?|ms\.?|shri\.?|smt\.?)?\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})/
  );
  // Try promoter stake
  const stakeMatch = text.match(
    /(?:promoter|promoters?)\s*(?:holding|shareholding|stake)[:\s]*([\d.]+)\s*%/i
  );
  return {
    name: nameMatch ? nameMatch[1] : null,
    stake: stakeMatch ? parseFloat(stakeMatch[1]) : null,
  };
}

function inferSector(fileNames: string[], text: string): string {
  const lower = (fileNames.join(' ') + ' ' + text.substring(0, 8000)).toLowerCase();
  if (lower.match(/pharma|drug|medicine|api\s|formulation|clinical/)) return 'Pharmaceuticals';
  if (lower.match(/textile|fabric|garment|weaving|fibre/)) return 'Textiles / Man-made Fibres';
  if (lower.match(/auto|vehicle|component|ancillary|motor/)) return 'Auto Ancillary';
  if (lower.match(/steel|metal|iron|alloy/)) return 'Steel / Metals';
  if (lower.match(/agro|agri|food|farm|crop/)) return 'Agriculture / Agro';
  if (lower.match(/it\s|software|tech|digital|saas/)) return 'IT Services';
  if (lower.match(/ship|logistics|transport|freight/)) return 'Logistics / Shipping';
  if (lower.match(/real\s*estate|construction|property|housing/)) return 'Real Estate';
  if (lower.match(/chemical|petro|polymer/)) return 'Chemicals';
  if (lower.match(/fmcg|consumer|retail/)) return 'FMCG / Retail';
  if (lower.match(/renewable|solar|wind|energy/)) return 'Renewables / Energy';
  if (lower.match(/bank|nbfc|finance|lending/)) return 'Banking / NBFC';
  return 'Manufacturing / General';
}

function inferCompanyName(fileNames: string[]): string {
  for (const f of fileNames) {
    const base = f.replace(/\.[^.]+$/, '')
      .replace(/[_-]/g, ' ')
      .replace(/\b(fy\d{2,4}|q[1-4]|annual|report|financials?|gstr?|returns?|bank|statement|itr|balance|sheet|audit|board|minutes|credit|rating)\b/gi, '')
      .replace(/\s+/g, ' ')
      .trim();
    if (base.length > 2) {
      return base.replace(/\b\w/g, c => c.toUpperCase());
    }
  }
  return 'Unknown Company';
}

// ─────────────────────────────────
//  LAYER 3: Table row parsing
// ─────────────────────────────────

function extractFromTableRows(text: string) {
  const results: Record<string, number | null> = {};

  // Revenue from P&L table patterns
  const revenuePatterns = [
    /(?:revenue\s*from\s*operations|total\s*(?:revenue|income|sales|turnover))[^\d]*?([\d,]+(?:\.\d+)?)/gi,
    /(?:net\s*sales|gross\s*sales)[^\d]*?([\d,]+(?:\.\d+)?)/gi,
  ];
  for (const p of revenuePatterns) {
    const m = p.exec(text);
    if (m && !results.revenue) {
      results.revenue = parseFloat(m[1].replace(/,/g, ''));
    }
  }

  // Net Worth
  const nwPatterns = [
    /(?:net\s*worth|shareholders?\s*(?:funds?|equity)|total\s*equity)[^\d]*?([\d,]+(?:\.\d+)?)/gi,
  ];
  for (const p of nwPatterns) {
    const m = p.exec(text);
    if (m && !results.netWorth) {
      results.netWorth = parseFloat(m[1].replace(/,/g, ''));
    }
  }

  // Total debt
  const debtPatterns = [
    /(?:total\s*(?:borrowings?|debt|liabilities))[^\d]*?([\d,]+(?:\.\d+)?)/gi,
  ];
  for (const p of debtPatterns) {
    const m = p.exec(text);
    if (m && !results.totalDebt) {
      results.totalDebt = parseFloat(m[1].replace(/,/g, ''));
    }
  }

  // PAT
  const patPatterns = [
    /(?:profit\s*after\s*tax|pat|net\s*profit)[^\d]*?([\d,]+(?:\.\d+)?)/gi,
  ];
  for (const p of patPatterns) {
    const m = p.exec(text);
    if (m && !results.pat) {
      results.pat = parseFloat(m[1].replace(/,/g, ''));
    }
  }

  // Depreciation
  const depPatterns = [
    /(?:depreciation(?:\s*(?:and|&)\s*amortisation)?)[^\d]*?([\d,]+(?:\.\d+)?)/gi,
  ];
  for (const p of depPatterns) {
    const m = p.exec(text);
    if (m && !results.depreciation) {
      results.depreciation = parseFloat(m[1].replace(/,/g, ''));
    }
  }

  // Interest
  const intPatterns = [
    /(?:interest\s*(?:expense|cost|paid))[^\d]*?([\d,]+(?:\.\d+)?)/gi,
    /(?:finance\s*costs?)[^\d]*?([\d,]+(?:\.\d+)?)/gi,
  ];
  for (const p of intPatterns) {
    const m = p.exec(text);
    if (m && !results.interest) {
      results.interest = parseFloat(m[1].replace(/,/g, ''));
    }
  }

  return results;
}

// ─────────────────────────────────
//  LAYER 4: Fallback estimation
// ─────────────────────────────────

function estimateFromGSTR(data: Partial<ExtractedData>): void {
  // If revenue not found but GSTR-3B total exists, estimate
  if (!data.revenue && data.gstr3bRevenue) {
    data.revenue = data.gstr3bRevenue;
    data.revenueSource = 'Estimated from GSTR-3B totals';
  }

  // If D/E not found but net worth and debt exist
  if (!data.deRatio && data.netWorth && data.totalDebt && data.netWorth > 0) {
    data.deRatio = parseFloat((data.totalDebt / data.netWorth).toFixed(2));
  }

  // If current ratio missing
  if (!data.currentRatio && data.currentAssets && data.currentLiabilities && data.currentLiabilities > 0) {
    data.currentRatio = parseFloat((data.currentAssets / data.currentLiabilities).toFixed(2));
  }

  // DSCR from P&L components
  if (!data.dscr && data.pat != null && data.depreciation != null && data.interestExpense != null) {
    const patVal = data.pat as number;
    const depVal = data.depreciation as number;
    const intVal = data.interestExpense as number;
    const numerator = patVal + depVal + intVal;
    const denominator = intVal + (data.totalDebt ? data.totalDebt * 0.1 : 0); // rough principal
    if (denominator > 0) {
      data.dscr = parseFloat((numerator / denominator).toFixed(2));
      data.dscrSource = 'Calculated from P&L (PAT+Dep+Int)/(Int+Est.Principal)';
    }
  }

  // EBITDA margin
  if (!data.ebitdaMargin && data.ebitda && data.revenue && data.revenue > 0) {
    data.ebitdaMargin = parseFloat(((data.ebitda / data.revenue) * 100).toFixed(1));
  }

  // PAT margin
  if (!data.patMargin && data.pat != null && data.revenue && data.revenue > 0) {
    const patVal = data.pat as number;
    data.patMargin = parseFloat(((patVal / data.revenue) * 100).toFixed(1));
  }
}

// ─────────────────────────────────
//  OFFICER NOTES PARSER
// ─────────────────────────────────

export function parseOfficerNotes(notes: string): OfficerInsights {
  const flags: string[] = [];

  // Capacity utilisation
  const capMatch = notes.match(/(\d+)\s*%\s*(?:capacity|utilisation|utilization)/i)
    || notes.match(/(?:capacity|utilisation|utilization)[^.]*?(\d+)\s*%/i);
  const capUtil = capMatch ? parseInt(capMatch[1]) : null;

  // Collateral value
  const collMatch = notes.match(/(?:valued?\s*(?:at\s*)?|valuation[:\s]*)₹?\s*([\d.]+)\s*(?:cr|crore)/i);
  const collVal = collMatch ? parseFloat(collMatch[1]) : null;

  // Management sentiment
  const sentimentMatch = notes.match(/\b(cooperative|hostile|evasive|transparent|reluctant|supportive|unresponsive)\b/i);
  const sentiment = sentimentMatch ? sentimentMatch[1].toLowerCase() : null;

  // Visit date
  const dateMatch = notes.match(/(\d{1,2}\s*(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s*\d{4})/i);
  const visitDate = dateMatch ? dateMatch[1] : null;

  // Flag extraction
  const flagKeywords = ['concern', 'risk', 'dispute', 'fraud', 'default', 'overdue', 'irregularity',
    'distress', 'diversion', 'round-tripping', 'shell', 'fictitious'];
  const lowerNotes = notes.toLowerCase();
  for (const kw of flagKeywords) {
    if (lowerNotes.includes(kw)) flags.push(kw);
  }

  return { capacityUtilisation: capUtil, collateralValue: collVal, managementSentiment: sentiment, visitDate, flags };
}

// ─────────────────────────────────
//  MAIN EXTRACTION FUNCTION
// ─────────────────────────────────

export function extractStructuredData(
  allText: string,
  fileNames: string[],
  totalPages: number,
  officerNotes?: string
): ExtractedData {
  const t = allText.substring(0, 100000); // limit scan range

  // Layer 1: Regex
  const cin = extractCIN(t);
  const gstin = extractGSTIN(t);
  const pan = extractPAN(t);
  const dins = extractDINNumbers(t);
  const incYear = extractIncorporationYear(t);
  const promoter = extractPromoter(t);
  const companyName = inferCompanyName(fileNames);
  const industry = inferSector(fileNames, t);

  // Layer 2: Keyword proximity
  const revenue = findNumberNear(t, [
    /(?:total\s*)?(?:revenue|turnover|sales|income\s*from\s*operations)/i,
  ]);
  const prevRevenue = findNumberNear(t, [
    /(?:previous\s*year|last\s*year|fy\s*\d{2})[^.]*?(?:revenue|turnover|sales)/i,
  ]);
  const netWorth = findNumberNear(t, [
    /(?:net\s*worth|shareholders?\s*(?:funds?|equity)|total\s*equity)/i,
  ]);
  const totalDebt = findNumberNear(t, [
    /(?:total\s*(?:borrowings?|debt|term\s*loan))/i,
  ]);
  const pat = findNumberNear(t, [
    /(?:profit\s*after\s*tax|pat|net\s*profit)/i,
  ]);
  const ebitda = findNumberNear(t, [
    /(?:ebitda|operating\s*profit)/i,
  ]);
  const depreciation = findNumberNear(t, [
    /(?:depreciation(?:\s*(?:and|&)\s*amortisation)?)/i,
  ]);
  const interest = findNumberNear(t, [
    /(?:interest\s*(?:expense|cost)|finance\s*cost)/i,
  ]);

  const dscr = findRatioNear(t, [
    /(?:dscr|debt\s*service\s*coverage)/i,
  ]);
  const deRatio = findRatioNear(t, [
    /(?:d\/e|debt[- ]?(?:to[- ])?equity)\s*(?:ratio)?/i,
  ]);
  const currentRatio = findRatioNear(t, [
    /(?:current\s*ratio)/i,
  ]);
  const patMargin = findPercentageNear(t, [
    /(?:pat|net\s*profit)\s*margin/i,
  ]);
  const ebitdaMargin = findPercentageNear(t, [
    /(?:ebitda|operating)\s*margin/i,
  ]);

  // GST data
  const gstr3bRev = findNumberNear(t, [/gstr[\s-]*3b[^.]*?(?:turnover|revenue|total)/i]);
  const gstr1Rev = findNumberNear(t, [/gstr[\s-]*1[^.]*?(?:turnover|revenue|total)/i]);
  const gstr2aITC = findNumberNear(t, [/gstr[\s-]*2a[^.]*?(?:itc|input\s*tax)/i]);
  const gstr3bITC = findNumberNear(t, [/gstr[\s-]*3b[^.]*?(?:itc|input\s*tax\s*credit\s*claimed)/i]);
  const itrIncome = findNumberNear(t, [/(?:itr|income\s*tax\s*return)[^.]*?(?:declared|total\s*income)/i]);

  // Late filings & NIL returns
  const lateFilingMatch = t.match(/(?:late|delayed)\s*(?:filing|return)/gi);
  const nilReturnMatch = t.match(/nil\s*(?:return|filing)/gi);

  // Bank statement markers
  const chqDishMatch = t.match(/(?:cheque|check)\s*(?:dishonour|bounce|return)/gi);
  const ccUtil = findPercentageNear(t, [/(?:cc|cash\s*credit)\s*(?:utilisation|utilization|usage)/i]);
  const emiOverdue = findNumberNear(t, [/(?:emi|instalment)\s*(?:overdue|default)[^.]*?(\d+)\s*days/i]);
  const avgCredit = findNumberNear(t, [/(?:average|avg)\s*(?:monthly\s*)?credit/i]);

  // Collateral
  const collValue = findNumberNear(t, [/(?:collateral|security|plant\s*(?:and|&)\s*machinery|p&m)[^.]*?(?:value|valued|valuation)/i]);
  const independentVal = /(?:independent|third\s*party|external)\s*(?:valuation|valued|appraiser)/i.test(t);
  const sarfaesi = /sarfaesi/i.test(t);
  const distressDisc = findPercentageNear(t, [/(?:distress|forced\s*sale)\s*(?:discount|value)/i]);

  // Litigation & MCA
  const wilful = /wilful\s*default/i.test(t);
  const nclt = /nclt\s*(?:admitted|petition)/i.test(t);
  const dinDisq = /din\s*(?:disqualif|deactivat)/i.test(t);
  const litMatches = t.match(/(?:litigation|case|suit|dispute|fir)/gi) || [];
  const litValue = findNumberNear(t, [/(?:litigation|dispute|claim)[^.]*?(?:₹|Rs)/i]);
  const dirChanges = (t.match(/(?:director|din)\s*(?:change|appoint|resign|cess)/gi) || []).length;
  const indepDirResigned = /independent\s*director[^.]*?resign/i.test(t);
  const lateROC = /late\s*(?:roc|annual)\s*filing/i.test(t);
  const goingConcern = /going\s*concern/i.test(t);

  // Sector
  const capUtil = findPercentageNear(t, [/(?:capacity|plant)\s*(?:utilisation|utilization)/i]);
  const rbiWatchlist = /rbi[^.]*?(?:watchlist|caution|alert|circular)/i.test(t);
  const restructuring = /(?:restructur|cdr|s4a|resolution\s*plan)/i.test(t);

  // Credit rating
  const ratingMatch = t.match(/(?:rating|rated)\s*[:\s]*([A-Z]{1,4}[\+\-]?(?:\s*\([^)]+\))?)/i);
  const ratingDowngrade = /(?:downgrad|negative\s*outlook|rating\s*watch)/i.test(t);

  // Requested amount
  const requestedAmt = findNumberNear(t, [/(?:requested|proposed|applied)\s*(?:amount|limit|loan|facility)/i]);

  // Layer 3: Table parsing (supplement missing)
  const tableData = extractFromTableRows(t);

  // Officer notes
  const officerInsights = officerNotes ? parseOfficerNotes(officerNotes) : null;

  // Build the data object
  const data: ExtractedData = {
    companyName,
    cin,
    cinFound: !!cin,
    gstin,
    pan,
    incorporationYear: incYear,
    industry,

    promoterName: promoter.name,
    promoterStake: promoter.stake,
    dinNumbers: dins,

    revenue: revenue || (tableData.revenue ? tableData.revenue : null),
    revenueSource: revenue ? 'Extracted from documents' : (tableData.revenue ? 'Parsed from table' : 'Not found'),
    previousYearRevenue: prevRevenue,
    ebitda,
    ebitdaMargin,
    pat: pat || (tableData.pat ? tableData.pat : null),
    patMargin,
    depreciation: depreciation || (tableData.depreciation ? tableData.depreciation : null),
    interestExpense: interest || (tableData.interest ? tableData.interest : null),

    netWorth: netWorth || (tableData.netWorth ? tableData.netWorth : null),
    totalDebt: totalDebt || (tableData.totalDebt ? tableData.totalDebt : null),
    deRatio,
    currentAssets: null, // needs more parsing
    currentLiabilities: null,
    currentRatio,
    accumulatedLosses: /accumulated\s*loss/i.test(t),

    dscr,
    dscrSource: dscr ? 'Extracted from documents' : 'Not found',

    gstr3bRevenue: gstr3bRev,
    gstr1Revenue: gstr1Rev,
    gstr2aITC: gstr2aITC,
    gstr3bITCClaimed: gstr3bITC,
    lateFilings: lateFilingMatch ? lateFilingMatch.length : 0,
    nilReturns: nilReturnMatch ? nilReturnMatch.length : 0,
    consecutiveNilReturns: 0, // would need month-by-month data

    itrDeclaredIncome: itrIncome,

    avgMonthlyCredit: avgCredit,
    avgMonthlyDebit: null,
    chequeDishonoursCount: chqDishMatch ? chqDishMatch.length : 0,
    ccUtilisationPct: ccUtil,
    emiOverdueDays: emiOverdue || 0,

    collateralValue: collValue || (officerInsights?.collateralValue || null),
    collateralType: null,
    valuationIndependent: independentVal,
    sarfaesiProceeding: sarfaesi,
    distressDiscount: distressDisc,

    wilfulDefaulter: wilful,
    ncltAdmitted: nclt,
    dinDisqualified: dinDisq,
    litigationCount: Math.min(litMatches.length, 20), // cap
    litigationMaterialValue: litValue,
    directorChangesInFY: Math.min(dirChanges, 10),
    independentDirResigned: indepDirResigned,
    lateROCFiling: lateROC,
    goingConcernNote: goingConcern,

    capacityUtilisation: capUtil || (officerInsights?.capacityUtilisation || null),
    sectorRBIWatchlist: rbiWatchlist,
    restructuringInProgress: restructuring,

    creditRating: ratingMatch ? ratingMatch[1] : null,
    ratingDowngrade: ratingDowngrade,
    ratingDowngradeNotches: ratingDowngrade ? 2 : 0, // default

    requestedAmount: requestedAmt,

    sourceFiles: fileNames,
    totalPages,
    extractionTimestamp: new Date().toISOString(),
  };

  // Layer 4: Fallback estimation
  estimateFromGSTR(data);

  return data;
}
