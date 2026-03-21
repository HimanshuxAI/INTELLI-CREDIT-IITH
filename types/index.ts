export type Screen = 'ingestor' | 'dashboard' | 'cam' | 'portfolio' | 'early-warning' | 'settings' | 'comparison' | 'audit';
export type ProcessingStep = 'uploading' | 'extracting' | 'ai_calling' | 'ai_streaming' | 'complete' | 'error';

export interface UploadedFile {
  id: string;
  type: 'PDF' | 'XLSX' | 'DOCX' | 'CSV' | 'JPG';
  name: string;
  meta: string;
  size: number;
  status: 'Extracted' | 'Processing' | 'Queued' | 'Error';
  progress: number;
  quality?: number;
  qualityLabel?: string;
  extractedData?: ExtractedData;
}

export interface ExtractedData {
  type: string;
  fields: Record<string, string | number>;
  flags: string[];
}

export interface DataSource {
  id: string;
  icon: string;
  name: string;
  subtitle: string;
  status: 'live' | 'config' | 'error';
}

export interface OfficerNote {
  label: string;
  text: string;
  color: string;
  date: string;
}

export interface CScore {
  label: string;
  score: number;
  color: string;
  tagClass: string;
  note: string;
  detail: string;
  weight: number;
  interval?: number;
  confidenceNote?: string;
}

export interface RiskSignal {
  color: string;
  severity: 'high' | 'medium' | 'low';
  title: string;
  body: string;
  meta: string;
  impact: string;
}

export interface ResearchItem {
  tag: string;
  tagClass: string;
  body: string;
  meta: string;
  sentiment: 'positive' | 'negative' | 'neutral';
}

export interface Appraisal {
  id: string;
  company: string;
  sector: string;
  amount: string;
  score: number;
  verdict: 'APPROVE' | 'REJECT' | 'REFER';
  date: string;
  officer: string;
  status: 'Completed' | 'In Progress' | 'Pending Review';
}

export interface EarlyWarning {
  id: string;
  company: string;
  type: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  detected: string;
  score_change: number;
}
