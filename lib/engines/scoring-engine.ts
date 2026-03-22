// ─────────────────────────────────────────────────
// scoring-engine.ts — 5 C's Deterministic Rule Matrix
// ─────────────────────────────────────────────────
// Base 100 per C, deductions per coded rule.
// Auto-reject if any C < 40.
// Returns scores + full RuleAuditEntry[] trail.

import type { ValidatedData } from './validator';
import type { GSTRResult } from './gstr-engine';
import type { ContradictionResult } from './contradiction-engine';

export interface RuleAuditEntry {
  rule: string;
  deduction: number;
  category: 'Character' | 'Capacity' | 'Capital' | 'Collateral' | 'Conditions' | 'AutoReject';
  source: string;
  value: string;
  threshold: string;
  confidence: 'high' | 'medium' | 'low';
}

export interface CScoreResult {
  label: string;
  score: number;
  weight: number;
  deductions: RuleAuditEntry[];
}

export interface ScoringResult {
  character: CScoreResult;
  capacity: CScoreResult;
  capital: CScoreResult;
  collateral: CScoreResult;
  conditions: CScoreResult;
  compositeScore: number;
  autoReject: boolean;
  autoRejectReason: string | null;
  allAuditEntries: RuleAuditEntry[];
}

function getConfidence(data: ValidatedData, field: string): 'high' | 'medium' | 'low' {
  const fc = data.fieldConfidences.find(f => f.field === field);
  return fc?.confidence || 'low';
}

// ── CHARACTER (Base: 100, max deductions: −40) ──

function scoreCharacter(data: ValidatedData): CScoreResult {
  let score = 100;
  const deductions: RuleAuditEntry[] = [];

  if (data.wilfulDefaulter) {
    const d = -40;
    score += d;
    deductions.push({ rule: 'WILFUL_DEFAULTER', deduction: d, category: 'Character', source: 'MCA/CIBIL', value: 'Wilful defaulter found', threshold: 'Wilful defaulter → −40 (auto disqualify)', confidence: 'high' });
  }

  if (data.ncltAdmitted) {
    const d = -35;
    score += d;
    deductions.push({ rule: 'NCLT_ADMITTED', deduction: d, category: 'Character', source: 'MCA Portal', value: 'NCLT petition admitted', threshold: 'NCLT admitted → −35', confidence: 'high' });
  }

  if (data.dinDisqualified) {
    const d = -30;
    score += d;
    deductions.push({ rule: 'DIN_DISQUALIFIED', deduction: d, category: 'Character', source: 'MCA Portal', value: 'DIN disqualified', threshold: 'DIN disqualified → −30', confidence: 'high' });
  }

  if (data.litigationMaterialValue && data.litigationMaterialValue > 1) { // > ₹1 Cr
    const d = -8;
    score += d;
    deductions.push({ rule: 'LITIGATION_HIGH', deduction: d, category: 'Character', source: 'eCourts', value: `Material litigation ₹${data.litigationMaterialValue} Cr`, threshold: '>₹1 Cr material → −8', confidence: 'high' });
  } else if (data.litigationCount > 0) {
    const d = -4;
    score += d;
    deductions.push({ rule: 'LITIGATION_MEDIUM', deduction: d, category: 'Character', source: 'eCourts', value: `${data.litigationCount} litigation(s)`, threshold: 'Sub-judice <₹1 Cr → −4', confidence: 'medium' });
  }

  if (data.lateROCFiling) {
    const d = -3;
    score += d;
    deductions.push({ rule: 'LATE_ROC_FILING', deduction: d, category: 'Character', source: 'MCA Portal', value: 'Late ROC filing detected', threshold: 'Late ROC filing → −3', confidence: 'high' });
  }

  if (data.directorChangesInFY > 2) {
    const d = -5;
    score += d;
    deductions.push({ rule: 'DIRECTOR_CHANGE_HIGH', deduction: d, category: 'Character', source: 'MCA Portal', value: `${data.directorChangesInFY} director changes in FY`, threshold: '>2 changes in FY → −5', confidence: 'medium' });
  }

  if (data.independentDirResigned) {
    const d = -6;
    score += d;
    deductions.push({ rule: 'INDEP_DIR_RESIGNED', deduction: d, category: 'Character', source: 'Board Minutes', value: 'Independent director resigned', threshold: 'Citing governance concerns → −6', confidence: 'medium' });
  }

  score = Math.max(0, score);

  return { label: 'Character', score, weight: 20, deductions };
}

// ── CAPACITY (Base: 100, max deductions: −45) ──

function scoreCapacity(data: ValidatedData, gstr: GSTRResult): CScoreResult {
  let score = 100;
  const deductions: RuleAuditEntry[] = [];
  const dscrConf = getConfidence(data, 'dscr');

  // DSCR rules
  if (data._dscr >= 2.0) {
    // No deduction
  } else if (data._dscr >= 1.5) {
    const d = -4;
    score += d;
    deductions.push({ rule: 'DSCR_1.5_2.0', deduction: d, category: 'Capacity', source: 'P&L / Bank', value: `DSCR: ${data._dscr}×`, threshold: 'DSCR 1.5–2.0 → −4', confidence: dscrConf });
  } else if (data._dscr >= 1.25) {
    const d = -8;
    score += d;
    deductions.push({ rule: 'DSCR_1.25_1.5', deduction: d, category: 'Capacity', source: 'P&L / Bank', value: `DSCR: ${data._dscr}×`, threshold: 'DSCR 1.25–1.5 → −8', confidence: dscrConf });
  } else if (data._dscr >= 1.0) {
    const d = -15;
    score += d;
    deductions.push({ rule: 'DSCR_1.0_1.25', deduction: d, category: 'Capacity', source: 'P&L / Bank', value: `DSCR: ${data._dscr}×`, threshold: 'DSCR 1.0–1.25 → −15', confidence: dscrConf });
  } else {
    const d = -30;
    score += d;
    deductions.push({ rule: 'DSCR_LT_1.0', deduction: d, category: 'Capacity', source: 'P&L / Bank', value: `DSCR: ${data._dscr}×`, threshold: 'DSCR < 1.0 → −30 (cannot service debt)', confidence: dscrConf });
  }

  // GSTR mismatch deductions
  if (gstr.itcMismatchPct !== null) {
    if (gstr.itcMismatchPct > 20) {
      const d = -12;
      score += d;
      deductions.push({ rule: 'GSTR_MISMATCH_20PCT', deduction: d, category: 'Capacity', source: 'GSTR Returns', value: `ITC mismatch: ${gstr.itcMismatchPct.toFixed(1)}%`, threshold: 'Mismatch > 20% → −12', confidence: 'high' });
    } else if (gstr.itcMismatchPct > 8) {
      const d = -4;
      score += d;
      deductions.push({ rule: 'GSTR_MISMATCH_8PCT', deduction: d, category: 'Capacity', source: 'GSTR Returns', value: `ITC mismatch: ${gstr.itcMismatchPct.toFixed(1)}%`, threshold: 'Mismatch > 8% → −4', confidence: 'high' });
    }
  }

  // Revenue declining 3 years
  if (data.previousYearRevenue && data._revenue < data.previousYearRevenue * 0.9) {
    const d = -10;
    score += d;
    deductions.push({ rule: 'REVENUE_DECLINING_3Y', deduction: d, category: 'Capacity', source: 'P&L', value: `Current: ₹${data._revenue} Cr vs Prev: ₹${data.previousYearRevenue} Cr`, threshold: 'Revenue declining → −10', confidence: getConfidence(data, 'revenue') });
  }

  // EBITDA margin
  if (data._ebitdaMargin < 5) {
    const d = -8;
    score += d;
    deductions.push({ rule: 'EBITDA_MARGIN_LOW', deduction: d, category: 'Capacity', source: 'P&L', value: `EBITDA margin: ${data._ebitdaMargin}%`, threshold: 'EBITDA margin < 5% → −8', confidence: getConfidence(data, 'ebitdaMargin') });
  }

  score = Math.max(0, score);

  return { label: 'Capacity', score, weight: 25, deductions };
}

// ── CAPITAL (Base: 100, max deductions: −40) ──

function scoreCapital(data: ValidatedData): CScoreResult {
  let score = 100;
  const deductions: RuleAuditEntry[] = [];
  const deConf = getConfidence(data, 'deRatio');

  // D/E ratio
  if (data._deRatio < 1.0) {
    // No deduction
  } else if (data._deRatio <= 2.0) {
    const d = -5;
    score += d;
    deductions.push({ rule: 'DE_1_2', deduction: d, category: 'Capital', source: 'Balance Sheet', value: `D/E: ${data._deRatio}×`, threshold: 'D/E 1.0–2.0 → −5', confidence: deConf });
  } else if (data._deRatio <= 3.0) {
    const d = -12;
    score += d;
    deductions.push({ rule: 'DE_2_3', deduction: d, category: 'Capital', source: 'Balance Sheet', value: `D/E: ${data._deRatio}×`, threshold: 'D/E 2.0–3.0 → −12', confidence: deConf });
  } else if (data._deRatio <= 5.0) {
    const d = -20;
    score += d;
    deductions.push({ rule: 'DE_3_5', deduction: d, category: 'Capital', source: 'Balance Sheet', value: `D/E: ${data._deRatio}×`, threshold: 'D/E 3.0–5.0 → −20', confidence: deConf });
  } else {
    const d = -35;
    score += d;
    deductions.push({ rule: 'DE_GT_5', deduction: d, category: 'Capital', source: 'Balance Sheet', value: `D/E: ${data._deRatio}×`, threshold: 'D/E > 5.0 → −35', confidence: deConf });
  }

  // Net Worth eroding
  // (Simplified — would need multi-year data for full check)
  if (data.accumulatedLosses) {
    const d = -20;
    score += d;
    deductions.push({ rule: 'ACCUMULATED_LOSSES', deduction: d, category: 'Capital', source: 'Balance Sheet', value: 'Accumulated losses present', threshold: 'Accumulated losses → −20', confidence: 'high' });
  }

  // PAT margin < 3%
  if (data._patMargin < 3) {
    const d = -8;
    score += d;
    deductions.push({ rule: 'PAT_MARGIN_LOW', deduction: d, category: 'Capital', source: 'P&L', value: `PAT margin: ${data._patMargin}%`, threshold: 'PAT margin < 3% → −8', confidence: getConfidence(data, 'patMargin') });
  }

  score = Math.max(0, score);

  return { label: 'Capital', score, weight: 20, deductions };
}

// ── COLLATERAL (Base: 100, max deductions: −35) ──

function scoreCollateral(data: ValidatedData): CScoreResult {
  let score = 100;
  const deductions: RuleAuditEntry[] = [];

  // Collateral coverage
  const cover = data._requestedAmount > 0 ? data._collateralValue / data._requestedAmount : 0;

  if (cover >= 1.5) {
    // No deduction
  } else if (cover >= 1.2) {
    const d = -5;
    score += d;
    deductions.push({ rule: 'COLLATERAL_COVER_1.2_1.5', deduction: d, category: 'Collateral', source: 'Valuation Report', value: `Coverage: ${cover.toFixed(2)}×`, threshold: 'Cover 1.2–1.5× → −5', confidence: getConfidence(data, 'collateralValue') });
  } else if (cover >= 1.0) {
    const d = -15;
    score += d;
    deductions.push({ rule: 'COLLATERAL_COVER_1.0_1.2', deduction: d, category: 'Collateral', source: 'Valuation Report', value: `Coverage: ${cover.toFixed(2)}×`, threshold: 'Cover 1.0–1.2× → −15', confidence: getConfidence(data, 'collateralValue') });
  } else {
    const d = -30;
    score += d;
    deductions.push({ rule: 'COLLATERAL_COVER_LT_1', deduction: d, category: 'Collateral', source: 'Valuation Report', value: `Coverage: ${cover.toFixed(2)}×`, threshold: 'Cover < 1.0× → −30', confidence: getConfidence(data, 'collateralValue') });
  }

  // Valuation self-reported
  if (!data.valuationIndependent) {
    const d = -10;
    score += d;
    deductions.push({ rule: 'VALUATION_SELF_REPORTED', deduction: d, category: 'Collateral', source: 'Valuation Report', value: 'No independent valuation found', threshold: 'Self-reported valuation → −10', confidence: 'medium' });
  }

  // SARFAESI
  if (data.sarfaesiProceeding) {
    const d = -20;
    score += d;
    deductions.push({ rule: 'SARFAESI_PROCEEDING', deduction: d, category: 'Collateral', source: 'Legal Records', value: 'SARFAESI proceeding active', threshold: 'SARFAESI proceeding → −20', confidence: 'high' });
  }

  // Distress discount
  if (data.distressDiscount && data.distressDiscount > 30) {
    const d = -15;
    score += d;
    deductions.push({ rule: 'DISTRESS_DISCOUNT_HIGH', deduction: d, category: 'Collateral', source: 'Valuation Report', value: `Distress discount: ${data.distressDiscount}%`, threshold: 'Distress discount > 30% → −15', confidence: 'medium' });
  }

  score = Math.max(0, score);

  return { label: 'Collateral', score, weight: 20, deductions };
}

// ── CONDITIONS (Base: 100, max deductions: −40) ──

function scoreConditions(data: ValidatedData): CScoreResult {
  let score = 100;
  const deductions: RuleAuditEntry[] = [];

  // Sector RBI watchlist
  if (data.sectorRBIWatchlist) {
    const d = -8;
    score += d;
    deductions.push({ rule: 'SECTOR_RBI_WATCHLIST', deduction: d, category: 'Conditions', source: 'RBI Portal', value: 'Sector on RBI watchlist', threshold: 'Sector RBI watchlist → −8', confidence: 'high' });
  }

  // Capacity utilisation
  if (data._capacityUtilisation < 50) {
    const d = -10;
    score += d;
    deductions.push({ rule: 'CAPACITY_UTIL_LT_50', deduction: d, category: 'Conditions', source: 'Officer Notes / Annual Report', value: `Capacity: ${data._capacityUtilisation}%`, threshold: 'Capacity util < 50% → −10', confidence: getConfidence(data, 'capacityUtilisation') });
  } else if (data._capacityUtilisation < 65) {
    const d = -5;
    score += d;
    deductions.push({ rule: 'CAPACITY_UTIL_50_65', deduction: d, category: 'Conditions', source: 'Officer Notes / Annual Report', value: `Capacity: ${data._capacityUtilisation}%`, threshold: 'Capacity util 50–65% → −5', confidence: getConfidence(data, 'capacityUtilisation') });
  }

  // Going concern
  if (data.goingConcernNote) {
    const d = -25;
    score += d;
    deductions.push({ rule: 'GOING_CONCERN_NOTE', deduction: d, category: 'Conditions', source: 'Audit Report', value: 'Going concern note present', threshold: 'Going concern note → −25', confidence: 'high' });
  }

  // Restructuring
  if (data.restructuringInProgress) {
    const d = -15;
    score += d;
    deductions.push({ rule: 'RESTRUCTURING_IN_PROG', deduction: d, category: 'Conditions', source: 'Annual Report', value: 'Restructuring in progress', threshold: 'Restructuring → −15', confidence: 'high' });
  }

  score = Math.max(0, score);

  return { label: 'Conditions', score, weight: 15, deductions };
}

// ── COMPOSITE SCORING ──

export function runScoringEngine(
  data: ValidatedData,
  gstr: GSTRResult,
  _contradiction: ContradictionResult
): ScoringResult {
  const character = scoreCharacter(data);
  const capacity = scoreCapacity(data, gstr);
  const capital = scoreCapital(data);
  const collateral = scoreCollateral(data);
  const conditions = scoreConditions(data);

  // Weighted composite
  const compositeScore = parseFloat(
    (
      character.score * 0.20 +
      capacity.score * 0.25 +
      capital.score * 0.20 +
      collateral.score * 0.20 +
      conditions.score * 0.15
    ).toFixed(1)
  );

  // Auto-reject if any C < 40
  let autoReject = false;
  let autoRejectReason: string | null = null;
  const allScores = [character, capacity, capital, collateral, conditions];
  for (const s of allScores) {
    if (s.score < 40) {
      autoReject = true;
      autoRejectReason = `${s.label} score ${s.score} < 40 — auto reject`;
      break;
    }
  }

  const allAuditEntries = [
    ...character.deductions,
    ...capacity.deductions,
    ...capital.deductions,
    ...collateral.deductions,
    ...conditions.deductions,
  ];

  return {
    character,
    capacity,
    capital,
    collateral,
    conditions,
    compositeScore,
    autoReject,
    autoRejectReason,
    allAuditEntries,
  };
}
