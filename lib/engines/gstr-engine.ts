// ─────────────────────────────────────────────────
// gstr-engine.ts — GSTR Reconciliation Engine
// ─────────────────────────────────────────────────
// ITC mismatch, NIL return checks, late filing flags.
// Deterministic. Same input = same output. No API.

import type { ValidatedData } from './validator';

export interface GSTRFlag {
  severity: 'critical' | 'high' | 'medium' | 'low';
  rule: string;
  title: string;
  detail: string;
  impact: string;
}

export interface GSTRResult {
  itcMismatchPct: number | null;
  itcMismatchValue: number | null;
  revenueSuppressionFlag: boolean;
  circularTradingFlag: boolean;
  criticalMismatchFlag: boolean;
  lateFilingsCount: number;
  nilReturnsCount: number;
  consecutiveNilReturns: number;
  complianceRisk: boolean;
  flags: GSTRFlag[];
}

export function runGSTREngine(data: ValidatedData): GSTRResult {
  const flags: GSTRFlag[] = [];
  let itcMismatchPct: number | null = null;
  let itcMismatchValue: number | null = null;
  let revenueSuppressionFlag = false;
  let circularTradingFlag = false;
  let criticalMismatchFlag = false;
  let complianceRisk = false;

  // ── ITC MISMATCH ──
  // ITC_MISMATCH = (GSTR2A_ITC - GSTR3B_ITC_CLAIMED) / GSTR2A_ITC × 100
  if (data.gstr2aITC && data.gstr3bITCClaimed && data.gstr2aITC > 0) {
    itcMismatchValue = data.gstr2aITC - data.gstr3bITCClaimed;
    itcMismatchPct = (itcMismatchValue / data.gstr2aITC) * 100;

    if (itcMismatchPct > 35) {
      criticalMismatchFlag = true;
      flags.push({
        severity: 'critical',
        rule: 'ITC_MISMATCH_35PCT',
        title: `CRITICAL ITC Mismatch — ${itcMismatchPct.toFixed(1)}%`,
        detail: `GSTR-2A ITC: ₹${data.gstr2aITC} Cr vs GSTR-3B Claimed: ₹${data.gstr3bITCClaimed} Cr. Gap: ₹${Math.abs(itcMismatchValue).toFixed(1)} Cr. Auto REJECT trigger.`,
        impact: 'Auto REJECT trigger',
      });
    } else if (itcMismatchPct > 20) {
      circularTradingFlag = true;
      flags.push({
        severity: 'high',
        rule: 'ITC_MISMATCH_20PCT',
        title: `Circular Trading Suspected — ${itcMismatchPct.toFixed(1)}% ITC Gap`,
        detail: `GSTR-2A ITC: ₹${data.gstr2aITC} Cr vs GSTR-3B Claimed: ₹${data.gstr3bITCClaimed} Cr. Refer to GST Intelligence.`,
        impact: 'Refer to GST Intel',
      });
    } else if (itcMismatchPct > 8) {
      flags.push({
        severity: 'high',
        rule: 'ITC_MISMATCH_8PCT',
        title: `ITC Mismatch — ${itcMismatchPct.toFixed(1)}%`,
        detail: `GSTR-2A ITC: ₹${data.gstr2aITC} Cr vs GSTR-3B Claimed: ₹${data.gstr3bITCClaimed} Cr. Revenue inflation risk flagged. Gap: ₹${Math.abs(itcMismatchValue).toFixed(1)} Cr.`,
        impact: 'Capacity −4 pts',
      });
    }
  }

  // ── NIL RETURN CHECK ──
  // IF GSTR1_declared = 0 AND books_revenue > 0 → Revenue suppression
  if (data.gstr1Revenue !== null && data.gstr1Revenue === 0 && data._revenue > 0) {
    revenueSuppressionFlag = true;
    flags.push({
      severity: 'critical',
      rule: 'NIL_RETURN_REVENUE_SUPPRESSION',
      title: 'Revenue Suppression Detected',
      detail: `GSTR-1 declares ₹0 revenue but books show ₹${data._revenue} Cr. Revenue suppression suspected.`,
      impact: 'Capacity −10 pts',
    });
  }

  // ── CONSECUTIVE NIL RETURNS ──
  if (data.consecutiveNilReturns >= 2) {
    flags.push({
      severity: 'critical',
      rule: 'CONSECUTIVE_NIL_RETURNS',
      title: 'Critical Non-Compliance — Consecutive NIL Returns',
      detail: `${data.consecutiveNilReturns} consecutive NIL returns filed. Critical non-compliance flag.`,
      impact: 'Auto REJECT consideration',
    });
  }

  // ── LATE FILINGS ──
  if (data.lateFilings > 3) {
    complianceRisk = true;
    flags.push({
      severity: 'high',
      rule: 'LATE_FILINGS_GT_3',
      title: `Compliance Risk — ${data.lateFilings} Late Filings`,
      detail: `${data.lateFilings} late GSTR filings detected in FY. Character −2 pts applied.`,
      impact: 'Character −2 pts',
    });
  } else if (data.lateFilings > 0) {
    flags.push({
      severity: 'medium',
      rule: 'LATE_FILING_SINGLE',
      title: `Late GSTR Filing — ${data.lateFilings} instance(s)`,
      detail: `${data.lateFilings} late GSTR filing(s) detected. Minor compliance concern.`,
      impact: 'Monitoring',
    });
  }

  // ── GSTR vs P&L REVENUE CHECK ──
  if (data.gstr3bRevenue && data._revenue > 0) {
    const gap = Math.abs(data.gstr3bRevenue - data._revenue) / data._revenue * 100;
    if (gap > 10) {
      flags.push({
        severity: 'high',
        rule: 'GSTR_VS_PL_REVENUE_GAP',
        title: `Revenue Gap — GSTR-3B vs P&L: ${gap.toFixed(1)}%`,
        detail: `GSTR-3B turnover: ₹${data.gstr3bRevenue} Cr vs P&L revenue: ₹${data._revenue} Cr. ${gap.toFixed(1)}% unexplained gap.`,
        impact: 'Capacity −4 pts',
      });
    }
  }

  return {
    itcMismatchPct,
    itcMismatchValue,
    revenueSuppressionFlag,
    circularTradingFlag,
    criticalMismatchFlag,
    lateFilingsCount: data.lateFilings,
    nilReturnsCount: data.nilReturns,
    consecutiveNilReturns: data.consecutiveNilReturns,
    complianceRisk,
    flags,
  };
}
