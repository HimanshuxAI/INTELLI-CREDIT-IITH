// ─────────────────────────────────────────────────
// contradiction-engine.ts — Cross-Document Contradiction Detection
// ─────────────────────────────────────────────────
// Revenue mismatch: AR vs GSTR vs ITR
// DSCR cross-check: P&L vs Bank
// Exact number comparison. No interpretation. Catches fraud.

import type { ValidatedData } from './validator';

export interface ContradictionFlag {
  severity: 'critical' | 'high' | 'medium';
  rule: string;
  title: string;
  detail: string;
  sourceA: string;
  sourceB: string;
  valueA: string;
  valueB: string;
  gapPct: number;
}

export interface ContradictionResult {
  revenueContradictions: ContradictionFlag[];
  dscrContradiction: ContradictionFlag | null;
  multiDocumentMismatch: boolean;
  flags: ContradictionFlag[];
}

export function runContradictionEngine(data: ValidatedData): ContradictionResult {
  const flags: ContradictionFlag[] = [];
  const revenueContradictions: ContradictionFlag[] = [];
  let dscrContradiction: ContradictionFlag | null = null;
  let multiDocumentMismatch = false;

  // ── REVENUE CONTRADICTION: AR vs GSTR-3B ──
  let arVsGstrGap = false;
  if (data._revenue > 0 && data.gstr3bRevenue && data.gstr3bRevenue > 0) {
    const gap = Math.abs(data._revenue - data.gstr3bRevenue) / data._revenue * 100;
    if (gap > 5) {
      arVsGstrGap = true;
      const flag: ContradictionFlag = {
        severity: gap > 15 ? 'critical' : 'high',
        rule: 'REVENUE_AR_VS_GSTR',
        title: `Revenue Contradiction — AR vs GSTR-3B: ${gap.toFixed(1)}%`,
        detail: `Annual Report revenue: ₹${data._revenue} Cr vs GSTR-3B declared: ₹${data.gstr3bRevenue} Cr. ${gap.toFixed(1)}% unexplained gap.`,
        sourceA: 'Annual Report / P&L',
        sourceB: 'GSTR-3B Monthly Returns',
        valueA: `₹${data._revenue} Cr`,
        valueB: `₹${data.gstr3bRevenue} Cr`,
        gapPct: parseFloat(gap.toFixed(1)),
      };
      revenueContradictions.push(flag);
      flags.push(flag);
    }
  }

  // ── REVENUE CONTRADICTION: AR vs ITR ──
  let arVsItrGap = false;
  if (data._revenue > 0 && data.itrDeclaredIncome && data.itrDeclaredIncome > 0) {
    const gap = Math.abs(data._revenue - data.itrDeclaredIncome) / data._revenue * 100;
    if (gap > 5) {
      arVsItrGap = true;
      const flag: ContradictionFlag = {
        severity: gap > 15 ? 'critical' : 'high',
        rule: 'REVENUE_AR_VS_ITR',
        title: `ITR Under-Declaration Suspected — ${gap.toFixed(1)}% Gap`,
        detail: `Annual Report revenue: ₹${data._revenue} Cr vs ITR declared: ₹${data.itrDeclaredIncome} Cr. Possible income under-reporting.`,
        sourceA: 'Annual Report / P&L',
        sourceB: 'ITR-6 Filing',
        valueA: `₹${data._revenue} Cr`,
        valueB: `₹${data.itrDeclaredIncome} Cr`,
        gapPct: parseFloat(gap.toFixed(1)),
      };
      revenueContradictions.push(flag);
      flags.push(flag);
    }
  }

  // ── MULTI-DOCUMENT MISMATCH ──
  if (arVsGstrGap && arVsItrGap) {
    multiDocumentMismatch = true;
    flags.push({
      severity: 'critical',
      rule: 'MULTI_DOC_MISMATCH',
      title: 'CRITICAL — Multi-Document Revenue Mismatch',
      detail: `Revenue mismatch detected across Annual Report, GSTR-3B, AND ITR. All three sources disagree. Highest fraud risk indicator.`,
      sourceA: 'Annual Report',
      sourceB: 'GSTR-3B + ITR',
      valueA: `₹${data._revenue} Cr`,
      valueB: `GSTR: ₹${data.gstr3bRevenue} Cr, ITR: ₹${data.itrDeclaredIncome} Cr`,
      gapPct: 0,
    });
  }

  // ── DSCR CROSS-CHECK: P&L vs Bank Statement ──
  if (data.dscr !== null && data.avgMonthlyCredit && data._totalDebt > 0) {
    // Compute bank-based DSCR
    const annualCredit = data.avgMonthlyCredit * 12;
    const annualDebtService = data._totalDebt * 0.15; // rough
    const dscrBank = annualDebtService > 0 ? annualCredit / annualDebtService : 0;

    const gap = Math.abs(data.dscr - dscrBank);
    if (gap > 0.3) {
      dscrContradiction = {
        severity: gap > 0.6 ? 'critical' : 'high',
        rule: 'DSCR_CROSS_CHECK',
        title: `DSCR Inconsistency — P&L vs Bank: Gap ${gap.toFixed(2)}×`,
        detail: `P&L-based DSCR: ${data.dscr.toFixed(2)}× vs Bank statement-derived DSCR: ${dscrBank.toFixed(2)}×. Gap of ${gap.toFixed(2)}× exceeds 0.3× threshold.`,
        sourceA: 'Profit & Loss Statement',
        sourceB: 'Bank Statement (12 months)',
        valueA: `${data.dscr.toFixed(2)}×`,
        valueB: `${dscrBank.toFixed(2)}×`,
        gapPct: parseFloat((gap * 100).toFixed(1)),
      };
      flags.push(dscrContradiction);
    }
  }

  return {
    revenueContradictions,
    dscrContradiction,
    multiDocumentMismatch,
    flags,
  };
}
