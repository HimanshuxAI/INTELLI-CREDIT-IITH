// ─────────────────────────────────────────────────
// limit-engine.ts — Loan Limit & Interest Rate Engine
// ─────────────────────────────────────────────────
// BASE_LIMIT = MIN(net_worth×0.40, turnover×0.18, collateral×0.65, requested)
// Adjustments for DSCR, GSTR gap, capacity, going concern.
// Interest = MCLR + spread (risk-based).

import type { ValidatedData } from './validator';
import type { GSTRResult } from './gstr-engine';
import type { ScoringResult } from './scoring-engine';

export interface LimitBreakdown {
  netWorthBased: number;
  turnoverBased: number;
  collateralBased: number;
  requestedAmount: number;
  baseLimit: number;
  adjustments: { rule: string; factor: number; reason: string }[];
  finalLimit: number;
}

export interface LimitResult {
  limit: number;          // in Cr
  limitFormatted: string; // "₹45 Cr"
  interestRate: string;   // "MCLR+2.25%"
  spread: number;         // percentage points
  tenure: string;
  breakdown: LimitBreakdown;
}

export function runLimitEngine(
  data: ValidatedData,
  gstr: GSTRResult,
  scoring: ScoringResult
): LimitResult {
  // ── BASE LIMIT ──
  const netWorthBased = data._netWorth * 0.40;
  const turnoverBased = data._revenue * 0.18;
  const collateralBased = data._collateralValue * 0.65;
  const requestedAmount = data._requestedAmount;

  const candidates = [netWorthBased, turnoverBased, requestedAmount];
  if (collateralBased > 0) candidates.push(collateralBased);

  let baseLimit = Math.min(...candidates.filter(v => v > 0));
  if (baseLimit <= 0 || !isFinite(baseLimit)) baseLimit = requestedAmount;

  // ── ADJUSTMENTS ──
  const adjustments: { rule: string; factor: number; reason: string }[] = [];

  if (data._dscr < 1.25) {
    adjustments.push({ rule: 'DSCR_CONSERVATIVE', factor: 0.75, reason: `DSCR ${data._dscr}× < 1.25 → limit × 0.75` });
    baseLimit *= 0.75;
  }

  if (gstr.itcMismatchPct !== null && gstr.itcMismatchPct > 8) {
    adjustments.push({ rule: 'GSTR_GAP_ADJUSTMENT', factor: 0.85, reason: `GSTR gap ${gstr.itcMismatchPct.toFixed(1)}% > 8% → limit × 0.85` });
    baseLimit *= 0.85;
  }

  if (data._capacityUtilisation < 50) {
    adjustments.push({ rule: 'CAPACITY_LOW', factor: 0.80, reason: `Capacity ${data._capacityUtilisation}% < 50% → limit × 0.80` });
    baseLimit *= 0.80;
  }

  if (data.goingConcernNote) {
    adjustments.push({ rule: 'GOING_CONCERN', factor: 0.50, reason: 'Going concern note → limit × 0.50 or auto reject' });
    baseLimit *= 0.50;
  }

  const finalLimit = parseFloat(Math.max(0, baseLimit).toFixed(1));

  // ── INTEREST RATE ──
  const mclr = 8.50; // current MCLR assumption
  let spread = 1.50; // base spread

  if (scoring.compositeScore >= 85) {
    spread += 0.50;
  } else if (scoring.compositeScore >= 75) {
    spread += 0.75;
  } else if (scoring.compositeScore >= 65) {
    spread += 1.25;
  } else if (scoring.compositeScore >= 60) {
    spread += 2.00;
  } else {
    spread += 2.50;
  }

  const totalRate = mclr + spread;
  const interestRate = `MCLR+${spread.toFixed(2)}%`;

  // ── TENURE ──
  let tenure = '5 Years';
  if (scoring.compositeScore < 65) tenure = '3 Years';
  if (scoring.compositeScore >= 80) tenure = '7 Years';

  return {
    limit: finalLimit,
    limitFormatted: `₹${finalLimit} Cr`,
    interestRate,
    spread,
    tenure,
    breakdown: {
      netWorthBased: parseFloat(netWorthBased.toFixed(1)),
      turnoverBased: parseFloat(turnoverBased.toFixed(1)),
      collateralBased: parseFloat(collateralBased.toFixed(1)),
      requestedAmount: parseFloat(requestedAmount.toFixed(1)),
      baseLimit: parseFloat(Math.min(...candidates.filter(v => v > 0)).toFixed(1)),
      adjustments,
      finalLimit,
    },
  };
}
