// ─────────────────────────────────────────────────
// confidence-engine.ts — Per-C Confidence Scoring
// ─────────────────────────────────────────────────
// Determines how confident each C score is based on
// whether data was extracted, estimated, or defaulted.

import type { ValidatedData } from './validator';

export type ConfLevel = 'high' | 'medium' | 'low';

export interface ConfidenceReport {
  Character: ConfLevel;
  Capacity: ConfLevel;
  Capital: ConfLevel;
  Collateral: ConfLevel;
  Conditions: ConfLevel;
  overallConfidence: ConfLevel;
  notes: string[];
}

function getFieldConf(data: ValidatedData, field: string): ConfLevel {
  const fc = data.fieldConfidences.find(f => f.field === field);
  return fc?.confidence || 'low';
}

export function computeConfidence(data: ValidatedData): ConfidenceReport {
  const notes: string[] = [];

  // Character confidence: driven by CIN found and litigation checked
  let charConf: ConfLevel;
  if (data.cinFound && data.litigationCount >= 0) {
    charConf = 'high';
  } else if (data.cinFound || data.litigationCount > 0) {
    charConf = 'medium';
    notes.push('Character: partial data — CIN or litigation check incomplete');
  } else {
    charConf = 'low';
    notes.push('Character: no CIN found, no litigation data — low confidence');
  }

  // Capacity confidence: driven by DSCR source and GST data
  let capConf: ConfLevel;
  const dscrConf = getFieldConf(data, 'dscr');
  const hasGSTR = !!(data.gstr2aITC || data.gstr3bITCClaimed || data.gstr3bRevenue);
  if (dscrConf === 'high' && hasGSTR) {
    capConf = 'high';
  } else if (dscrConf !== 'low' || hasGSTR) {
    capConf = 'medium';
    notes.push('Capacity: DSCR or GST data partially available');
  } else {
    capConf = 'low';
    notes.push('Capacity: no DSCR found, no GST data — low confidence');
  }

  // Capital confidence: driven by net worth and D/E ratio source
  let capitalConf: ConfLevel;
  const nwConf = getFieldConf(data, 'netWorth');
  const deConf = getFieldConf(data, 'deRatio');
  if (nwConf === 'high' && deConf === 'high') {
    capitalConf = 'high';
  } else if (nwConf !== 'low' && deConf !== 'low') {
    capitalConf = 'medium';
    notes.push('Capital: net worth or D/E ratio partially estimated');
  } else {
    capitalConf = 'low';
    notes.push('Capital: net worth and/or D/E ratio defaulted — low confidence');
  }

  // Collateral confidence: independent valuation present
  let collConf: ConfLevel;
  const collValConf = getFieldConf(data, 'collateralValue');
  if (collValConf === 'high' && data.valuationIndependent) {
    collConf = 'high';
  } else if (collValConf !== 'low') {
    collConf = 'medium';
    notes.push('Collateral: valuation may not be independent');
  } else {
    collConf = 'low';
    notes.push('Collateral: no valuation data found — low confidence');
  }

  // Conditions confidence: officer notes and capacity utilisation
  let condConf: ConfLevel;
  const capUtilConf = getFieldConf(data, 'capacityUtilisation');
  if (capUtilConf === 'high') {
    condConf = 'high';
  } else if (capUtilConf === 'medium') {
    condConf = 'medium';
    notes.push('Conditions: capacity utilisation estimated or from limited data');
  } else {
    condConf = 'medium'; // conditions are always at least medium (sector is always determinable)
    notes.push('Conditions: capacity utilisation defaulted');
  }

  // Overall confidence
  const confValues = [charConf, capConf, capitalConf, collConf, condConf];
  const lowCount = confValues.filter(c => c === 'low').length;
  const highCount = confValues.filter(c => c === 'high').length;

  let overallConfidence: ConfLevel;
  if (lowCount >= 3) {
    overallConfidence = 'low';
  } else if (highCount >= 3) {
    overallConfidence = 'high';
  } else {
    overallConfidence = 'medium';
  }

  return {
    Character: charConf,
    Capacity: capConf,
    Capital: capitalConf,
    Collateral: collConf,
    Conditions: condConf,
    overallConfidence,
    notes,
  };
}
