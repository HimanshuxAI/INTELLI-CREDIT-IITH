export interface AICompanyProfile {
  companyName: string;
  cin: string;
  promoter: string;
  turnover: string;
  industry: string;
  incorporation: string;
}

export interface AIFinancials {
  netWorth: string;
  debtEquity: string;
  dscr: string;
  currentRatio: string;
  gstrGap: string;
  patMargin: string;
}

export interface AICScore {
  label: string;
  score: number;
  weight: number;
  color: string;
  tagClass: string;
  note: string;
  detail: string;
  interval?: number;
  confidenceNote?: string;
}

export interface AIRiskSignal {
  severity: 'high' | 'medium' | 'low';
  color: string;
  title: string;
  body: string;
  meta: string;
  impact: string;
}

export interface AIVerdict {
  decision: 'APPROVE' | 'REJECT' | 'REFER';
  limit: string;
  rate: string;
  tenure: string;
  rationale: string;
}

export interface AIExplainStep {
  text: string;
}

export interface AIResearchItem {
  tag: string;
  tagClass: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  body: string;
  meta: string;
}

export interface AnalysisResult {
  companyProfile: AICompanyProfile;
  financials: AIFinancials;
  cScores: AICScore[];
  riskSignals: AIRiskSignal[];
  verdict: AIVerdict;
  explainChain: AIExplainStep[];
  researchItems: AIResearchItem[];
  compositeScore: number;
  processingTime: string;
  pagesProcessed: number;
  extractedText?: string;
}
