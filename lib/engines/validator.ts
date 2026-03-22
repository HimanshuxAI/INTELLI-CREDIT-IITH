// ─────────────────────────────────────────────────
// validator.ts — Null Safety + Conservative Defaults
// ─────────────────────────────────────────────────
// Fills missing fields with conservative defaults.
// Flags every field as high/medium/low confidence.
// Ensures downstream engines never crash on null.

import type { ExtractedData } from './extractor';

export type ConfidenceLevel = 'high' | 'medium' | 'low';

export interface FieldConfidence {
  field: string;
  confidence: ConfidenceLevel;
  source: 'extracted' | 'estimated' | 'defaulted';
  note: string;
}

export interface ValidatedData extends ExtractedData {
  // All numeric fields guaranteed non-null after validation
  _revenue: number;
  _netWorth: number;
  _totalDebt: number;
  _deRatio: number;
  _currentRatio: number;
  _dscr: number;
  _pat: number;
  _patMargin: number;
  _ebitdaMargin: number;
  _collateralValue: number;
  _capacityUtilisation: number;
  _requestedAmount: number;
  _interestExpense: number;
  _depreciation: number;

  // Confidence map
  fieldConfidences: FieldConfidence[];
}

function fc(field: string, value: unknown, fallback: number, note: string): { val: number; conf: FieldConfidence } {
  if (value !== null && value !== undefined && !isNaN(value as number)) {
    return {
      val: value as number,
      conf: { field, confidence: 'high', source: 'extracted', note: `Extracted: ${value}` },
    };
  }
  return {
    val: fallback,
    conf: { field, confidence: 'low', source: 'defaulted', note: `Defaulted to ${fallback}. ${note}` },
  };
}

export function validateAndFillDefaults(data: ExtractedData): ValidatedData {
  const confidences: FieldConfidence[] = [];

  // Revenue — conservative default ₹100 Cr
  const rev = fc('revenue', data.revenue, 100, 'No revenue found in documents');
  confidences.push(rev.conf);

  // Net Worth — conservative default ₹50 Cr
  const nw = fc('netWorth', data.netWorth, 50, 'No net worth found');
  confidences.push(nw.conf);

  // Total Debt — conservative default ₹100 Cr (assumes leveraged)
  const debt = fc('totalDebt', data.totalDebt, 100, 'No debt figure found — assumed leveraged');
  confidences.push(debt.conf);

  // D/E ratio
  let deVal: number;
  let deConf: FieldConfidence;
  if (data.deRatio !== null) {
    deVal = data.deRatio;
    deConf = { field: 'deRatio', confidence: 'high', source: 'extracted', note: `Extracted: ${data.deRatio}` };
  } else if (nw.val > 0 && debt.val > 0) {
    deVal = parseFloat((debt.val / nw.val).toFixed(2));
    deConf = { field: 'deRatio', confidence: 'medium', source: 'estimated', note: `Calculated from debt/netWorth: ${deVal}` };
  } else {
    deVal = 2.0; // conservative
    deConf = { field: 'deRatio', confidence: 'low', source: 'defaulted', note: 'Defaulted to 2.0 (conservative)' };
  }
  confidences.push(deConf);

  // Current Ratio — conservative default 1.2
  const cr = fc('currentRatio', data.currentRatio, 1.2, 'No current ratio found');
  confidences.push(cr.conf);

  // DSCR — conservative default 1.1
  let dscrVal: number;
  let dscrConf: FieldConfidence;
  if (data.dscr !== null) {
    dscrVal = data.dscr;
    dscrConf = { field: 'dscr', confidence: 'high', source: 'extracted', note: `Extracted: ${data.dscr}. Source: ${data.dscrSource}` };
  } else if (data.avgMonthlyCredit && debt.val > 0) {
    // Estimate from bank statement
    const annualCredit = data.avgMonthlyCredit * 12;
    const annualDebtService = debt.val * 0.15; // rough 15% servicing
    dscrVal = annualDebtService > 0 ? parseFloat((annualCredit / annualDebtService).toFixed(2)) : 1.1;
    dscrConf = { field: 'dscr', confidence: 'medium', source: 'estimated', note: `Estimated from bank statement credits: ${dscrVal}` };
  } else {
    dscrVal = 1.1;
    dscrConf = { field: 'dscr', confidence: 'low', source: 'defaulted', note: 'Defaulted to 1.1 (conservative)' };
  }
  confidences.push(dscrConf);

  // PAT
  const patR = fc('pat', data.pat, rev.val * 0.05, 'Estimated as 5% of revenue');
  confidences.push(patR.conf);

  // PAT Margin
  let patMarginVal: number;
  let patMarginConf: FieldConfidence;
  if (data.patMargin !== null) {
    patMarginVal = data.patMargin;
    patMarginConf = { field: 'patMargin', confidence: 'high', source: 'extracted', note: `Extracted: ${data.patMargin}%` };
  } else if (patR.val > 0 && rev.val > 0) {
    patMarginVal = parseFloat(((patR.val / rev.val) * 100).toFixed(1));
    patMarginConf = { field: 'patMargin', confidence: 'medium', source: 'estimated', note: `Calculated: ${patMarginVal}%` };
  } else {
    patMarginVal = 5.0;
    patMarginConf = { field: 'patMargin', confidence: 'low', source: 'defaulted', note: 'Defaulted to 5.0%' };
  }
  confidences.push(patMarginConf);

  // EBITDA Margin
  let ebitdaMarginVal: number;
  let ebitdaMarginConf: FieldConfidence;
  if (data.ebitdaMargin !== null) {
    ebitdaMarginVal = data.ebitdaMargin;
    ebitdaMarginConf = { field: 'ebitdaMargin', confidence: 'high', source: 'extracted', note: `Extracted: ${data.ebitdaMargin}%` };
  } else {
    ebitdaMarginVal = 10.0;
    ebitdaMarginConf = { field: 'ebitdaMargin', confidence: 'low', source: 'defaulted', note: 'Defaulted to 10.0%' };
  }
  confidences.push(ebitdaMarginConf);

  // Collateral
  const coll = fc('collateralValue', data.collateralValue, 0, 'No collateral data found');
  confidences.push(coll.conf);

  // Capacity utilisation
  const capU = fc('capacityUtilisation', data.capacityUtilisation, 65, 'Defaulted to 65%');
  confidences.push(capU.conf);

  // Requested amount
  const req = fc('requestedAmount', data.requestedAmount, rev.val * 0.18, 'Estimated as 18% of revenue');
  confidences.push(req.conf);

  // Interest expense
  const intExp = fc('interestExpense', data.interestExpense, debt.val * 0.10, 'Estimated as 10% of total debt');
  confidences.push(intExp.conf);

  // Depreciation
  const dep = fc('depreciation', data.depreciation, rev.val * 0.03, 'Estimated as 3% of revenue');
  confidences.push(dep.conf);

  // Boolean fields — already have safe defaults (false)
  // String fields — already have null (handled downstream)

  return {
    ...data,
    _revenue: rev.val,
    _netWorth: nw.val,
    _totalDebt: debt.val,
    _deRatio: deVal,
    _currentRatio: cr.val,
    _dscr: dscrVal,
    _pat: patR.val,
    _patMargin: patMarginVal,
    _ebitdaMargin: ebitdaMarginVal,
    _collateralValue: coll.val,
    _capacityUtilisation: capU.val,
    _requestedAmount: req.val,
    _interestExpense: intExp.val,
    _depreciation: dep.val,
    fieldConfidences: confidences,
  };
}
