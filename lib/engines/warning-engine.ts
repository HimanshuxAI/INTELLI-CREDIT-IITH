// ─────────────────────────────────────────────────
// warning-engine.ts — Early Warning System
// ─────────────────────────────────────────────────
// Zero AI — pure event triggers.
// Critical / High / Medium / Low severity levels.

import type { ValidatedData } from './validator';
import type { GSTRResult } from './gstr-engine';

export interface WarningTrigger {
  severity: 'critical' | 'high' | 'medium' | 'low';
  type: string;
  title: string;
  description: string;
  scoreImpact: number; // negative = bad, positive = good
}

export interface WarningResult {
  triggers: WarningTrigger[];
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
}

export function runWarningEngine(data: ValidatedData, gstr: GSTRResult): WarningResult {
  const triggers: WarningTrigger[] = [];

  // ── CRITICAL TRIGGERS ──

  // GSTR non-filing 2+ consecutive months
  if (data.consecutiveNilReturns >= 2 || gstr.consecutiveNilReturns >= 2) {
    triggers.push({
      severity: 'critical',
      type: 'GST Non-Filing',
      title: 'GSTR Non-Filing — Consecutive Months',
      description: `GSTR-3B not filed for ${Math.max(data.consecutiveNilReturns, gstr.consecutiveNilReturns)} consecutive months. NPA early warning protocol triggered.`,
      scoreImpact: -14,
    });
  }

  // Cheque dishonour
  if (data.chequeDishonoursCount > 0) {
    triggers.push({
      severity: 'critical',
      type: 'Cheque Dishonour',
      title: `Cheque Dishonour Detected — ${data.chequeDishonoursCount} instance(s)`,
      description: `${data.chequeDishonoursCount} cheque dishonour(s) detected in bank statement. Cash flow stress indicator.`,
      scoreImpact: -10,
    });
  }

  // NCLT petition
  if (data.ncltAdmitted) {
    triggers.push({
      severity: 'critical',
      type: 'NCLT Petition',
      title: 'NCLT Petition Admitted',
      description: 'National Company Law Tribunal petition has been admitted. Insolvency risk.',
      scoreImpact: -20,
    });
  }

  // Credit rating downgrade (2+ notches)
  if (data.ratingDowngrade && data.ratingDowngradeNotches >= 2) {
    triggers.push({
      severity: 'critical',
      type: 'Rating Downgrade',
      title: `Credit Rating Downgrade — ${data.ratingDowngradeNotches} Notches`,
      description: `Credit rating downgraded by ${data.ratingDowngradeNotches} notches. ${data.creditRating ? `Current: ${data.creditRating}` : ''}`,
      scoreImpact: -12,
    });
  }

  // EMI overdue > 60 days (SMA-2)
  if (data.emiOverdueDays > 60) {
    triggers.push({
      severity: 'critical',
      type: 'EMI Overdue (SMA-2)',
      title: `EMI Overdue ${data.emiOverdueDays} Days — SMA-2 Threshold`,
      description: `EMI payment overdue by ${data.emiOverdueDays} days. Crosses SMA-2 threshold (60 days). NPA transition risk.`,
      scoreImpact: -15,
    });
  }

  // ── HIGH TRIGGERS ──

  // New litigation above ₹1 Cr
  if (data.litigationMaterialValue && data.litigationMaterialValue > 1) {
    triggers.push({
      severity: 'high',
      type: 'Material Litigation',
      title: `Material Litigation — ₹${data.litigationMaterialValue} Cr`,
      description: `New litigation/FIR above ₹1 Cr threshold detected. Material increase in legal risk.`,
      scoreImpact: -8,
    });
  }

  // Independent director resignation
  if (data.independentDirResigned) {
    triggers.push({
      severity: 'high',
      type: 'Director Resignation',
      title: 'Independent Director Resigned — Governance Flag',
      description: 'Independent director resigned citing governance concerns. Board stability risk.',
      scoreImpact: -6,
    });
  }

  // Revenue decline > 20% QoQ
  if (data.previousYearRevenue && data._revenue > 0) {
    const decline = ((data.previousYearRevenue - data._revenue) / data.previousYearRevenue) * 100;
    if (decline > 20) {
      triggers.push({
        severity: 'high',
        type: 'Revenue Decline',
        title: `Revenue Decline ${decline.toFixed(0)}% vs Previous Year`,
        description: `Revenue dropped from ₹${data.previousYearRevenue} Cr to ₹${data._revenue} Cr. ${decline.toFixed(1)}% decline.`,
        scoreImpact: -10,
      });
    }
  }

  // CC utilisation > 90%
  if (data.ccUtilisationPct && data.ccUtilisationPct > 90) {
    triggers.push({
      severity: 'high',
      type: 'CC Utilisation',
      title: `Cash Credit Utilisation ${data.ccUtilisationPct}% — Stress Signal`,
      description: `CC utilisation at ${data.ccUtilisationPct}% exceeds 90% threshold. Working capital stress.`,
      scoreImpact: -5,
    });
  }

  // ── MEDIUM TRIGGERS ──

  // Single late GSTR filing
  if (data.lateFilings > 0 && data.lateFilings <= 3) {
    triggers.push({
      severity: 'medium',
      type: 'Late GSTR Filing',
      title: `Late GSTR Filing — ${data.lateFilings} Instance(s)`,
      description: `${data.lateFilings} late GSTR filing(s) detected. Minor compliance concern.`,
      scoreImpact: -2,
    });
  }

  // DSCR drops below 1.5×
  if (data._dscr < 1.5 && data._dscr >= 1.0) {
    triggers.push({
      severity: 'medium',
      type: 'DSCR Decline',
      title: `DSCR Below 1.5× — Currently ${data._dscr}×`,
      description: `Debt service coverage ratio at ${data._dscr}× is below the 1.5× comfort threshold.`,
      scoreImpact: -4,
    });
  }

  // Capacity utilisation drops below 60%
  if (data._capacityUtilisation < 60 && data._capacityUtilisation >= 40) {
    triggers.push({
      severity: 'medium',
      type: 'Low Capacity',
      title: `Capacity Utilisation ${data._capacityUtilisation}% — Below 60%`,
      description: `Factory/plant operating at ${data._capacityUtilisation}% capacity. Revenue growth concern.`,
      scoreImpact: -3,
    });
  }

  // Rating downgrade (1 notch)
  if (data.ratingDowngrade && data.ratingDowngradeNotches < 2) {
    triggers.push({
      severity: 'medium',
      type: 'Rating Watch',
      title: 'Credit Rating Outlook Negative',
      description: `Rating outlook moved to negative. ${data.creditRating ? `Current: ${data.creditRating}` : 'Monitor closely.'}`,
      scoreImpact: -3,
    });
  }

  // ── LOW (POSITIVE) TRIGGERS ──

  // DSCR > 2.0 → positive
  if (data._dscr >= 2.0) {
    triggers.push({
      severity: 'low',
      type: 'Strong DSCR',
      title: `DSCR ${data._dscr}× — Strong Debt Servicing`,
      description: `Healthy debt service coverage ratio above 2.0× threshold.`,
      scoreImpact: +2,
    });
  }

  // High capacity utilisation
  if (data._capacityUtilisation >= 75) {
    triggers.push({
      severity: 'low',
      type: 'High Capacity',
      title: `Capacity Utilisation ${data._capacityUtilisation}% — Optimal`,
      description: `Factory utilisation above 75%. Strong operational signal.`,
      scoreImpact: +2,
    });
  }

  const criticalCount = triggers.filter(t => t.severity === 'critical').length;
  const highCount = triggers.filter(t => t.severity === 'high').length;
  const mediumCount = triggers.filter(t => t.severity === 'medium').length;
  const lowCount = triggers.filter(t => t.severity === 'low').length;

  return { triggers, criticalCount, highCount, mediumCount, lowCount };
}
