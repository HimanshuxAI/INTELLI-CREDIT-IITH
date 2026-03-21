import type { UploadedFile, DataSource, OfficerNote, CScore, RiskSignal, ResearchItem, Appraisal, EarlyWarning } from '@/types';

export const INITIAL_FILES: UploadedFile[] = [
  { id:'f1', type:'PDF', name:'Rajasthan_Textiles_AnnualReport_FY24.pdf', meta:'4.2 MB · Scanned PDF · 142 pages', size:4200, status:'Extracted', progress:100, quality: 92, qualityLabel: 'High quality (92%)' },
  { id:'f2', type:'XLSX', name:'GSTR_Returns_FY23_FY24.xlsx', meta:'1.1 MB · Excel · GSTR-1, 2A, 3B', size:1100, status:'Extracted', progress:100, quality: 67, qualityLabel: 'Medium quality, 3 tabs corrupted (67%)' },
  { id:'f3', type:'PDF', name:'BankStatement_HDFC_12months.pdf', meta:'2.8 MB · Digital PDF · 12 months', size:2800, status:'Extracted', progress:100, quality: 98, qualityLabel: 'High quality (98%)' },
  { id:'f4', type:'PDF', name:'BoardMeetingMinutes_Q3_Q4.pdf', meta:'0.9 MB · Scanned · Handwritten annotations', size:900, status:'Processing', progress:64, quality: 41, qualityLabel: 'Low quality, handwritten (41%)' },
  { id:'f5', type:'PDF', name:'CreditRating_ICRA_Report.pdf', meta:'1.4 MB · Rating Agency Report', size:1400, status:'Queued', progress:0 },
  { id:'f6', type:'XLSX', name:'ITR_FY22_FY23_FY24.xlsx', meta:'0.7 MB · Income Tax Returns', size:700, status:'Queued', progress:0 },
];

export const DATA_SOURCES: DataSource[] = [
  { id:'s1', icon:'🏛', name:'MCA21', subtitle:'Min. of Corporate Affairs', status:'live' },
  { id:'s2', icon:'⚖️', name:'eCourts', subtitle:'National Court Portal', status:'live' },
  { id:'s3', icon:'📰', name:'News Feed', subtitle:'ET · Mint · Biz Standard', status:'live' },
  { id:'s4', icon:'🏦', name:'RBI Portal', subtitle:'Regulatory Monitor', status:'live' },
  { id:'s5', icon:'📊', name:'CIBIL Commercial', subtitle:'Configure API Key', status:'config' },
  { id:'s6', icon:'💾', name:'Databricks', subtitle:'Delta Lake · Analytics', status:'live' },
];

export const OFFICER_NOTES: OfficerNote[] = [
  { label:'Factory Visit — 12 Jan 2025', date:'12 Jan 2025', text:'Plant operating at ~40% capacity. Raw material supply constraints from China-linked vendors cited. Management expects recovery in Q2 FY26.', color:'#96500A' },
  { label:'Management Interview', date:'15 Jan 2025', text:'MD Mr. Ramesh Sharma cooperative. Order book healthy — confirmed ₹120 Cr UAE export order for Q1 FY26. Succession plan in place.', color:'#157A45' },
  { label:'Collateral Assessment', date:'18 Jan 2025', text:'P&M independently valued at ₹62 Cr by M/s. Jain & Associates. FD lien of ₹8 Cr with HDFC Bank confirmed and verified.', color:'#0066CC' },
];

export const C_SCORES: CScore[] = [
  { label:'Character', score:82, weight:20, color:'#157A45', tagClass:'tag-green', note:'Clean MCA', detail:'Clean MCA, 2 minor litigations (low risk), no wilful default, promoter DIN active', interval: 2, confidenceNote: 'High confidence — verified MCA APIs' },
  { label:'Capacity', score:74, weight:25, color:'#96500A', tagClass:'tag-amber', note:'GSTR Gap', detail:'DSCR 1.42×, GSTR-2A vs 3B gap 8.3% flagged, revenue adjusted downward', interval: 6, confidenceNote: 'Low confidence — GSTR data incomplete' },
  { label:'Capital', score:78, weight:20, color:'#0066CC', tagClass:'tag-blue', note:'D/E 1.8×', detail:'Net Worth ₹124 Cr, D/E ratio 1.8× (sector-acceptable), PAT margin 6.8%', interval: 3, confidenceNote: 'Medium confidence — audited financials' },
  { label:'Collateral', score:85, weight:20, color:'#6428C8', tagClass:'tag-purple', note:'₹70 Cr val.', detail:'P&M ₹62 Cr independently valued + FD lien ₹8 Cr with HDFC = ₹70 Cr total', interval: 1, confidenceNote: 'High confidence — bank liens confirmed' },
  { label:'Conditions', score:70, weight:15, color:'#B01225', tagClass:'tag-red', note:'40% util.', detail:'Factory at 40% capacity, RBI NBFC textile circular Oct 2024, export sector headwind', interval: 4, confidenceNote: 'Medium confidence — field visit variance' },
];

export const RISK_SIGNALS: RiskSignal[] = [
  { severity:'high', color:'#96500A', title:'GSTR-2A vs 3B Mismatch — 8.3%', body:'ITC gap of ₹2.1 Cr detected across FY24. Revenue inflation flag raised. Capacity score adjusted −4 pts.', meta:'SOURCE: GST Returns FY24 · Detected via automated reconciliation', impact:'Capacity −4 pts' },
  { severity:'high', color:'#96500A', title:'Factory Utilisation — Primary Insight Applied', body:'Credit officer site visit confirms 40% capacity utilisation. Supply chain constraint from China-linked vendors. AI auto-applied −8 pts to Conditions.', meta:'SOURCE: Credit Officer Field Note · 12 Jan 2025', impact:'Conditions −8 pts' },
  { severity:'medium', color:'#0066CC', title:'RBI NBFC Circular — Textile Sector Exposure', body:'New exposure norms (RBI/2024-25/87) mandate tighter NBFC lending to textile sector. Sector headwind flagged.', meta:'SOURCE: RBI.org.in · Oct 2024', impact:'Conditions −3 pts' },
  { severity:'low', color:'#157A45', title:'Minor Litigation — eCourts', body:'2 civil disputes found in Rajasthan HC. Sub-judice, values under ₹50 L each. Low materiality.', meta:'SOURCE: eCourts National Portal · Live query', impact:'Character −2 pts' },
];

export const RESEARCH_ITEMS: ResearchItem[] = [
  { tag:'News', tagClass:'tag-blue', sentiment:'positive', body:'Rajasthan Textiles secures ₹120 Cr UAE export order — Q1 FY26 order book strengthened significantly.', meta:'Economic Times · 14 Jan 2025 · Positive signal' },
  { tag:'MCA21', tagClass:'tag-green', sentiment:'positive', body:'Director Ramesh Sharma — no disqualification. SBI charge satisfied FY23. ROC annual filings current.', meta:'MCA Portal · Live query · Risk: Low' },
  { tag:'RBI', tagClass:'tag-amber', sentiment:'negative', body:'Textile sector NBFC exposure circular (Oct 2024) — new limits on fresh disbursements flagged.', meta:'RBI.org.in · Oct 2024 · Risk: Medium' },
  { tag:'eCourts', tagClass:'tag-amber', sentiment:'neutral', body:'2 civil matters — supplier payment dispute pending (₹38 L) + labour case disposed Nov 2023.', meta:'eCourts Portal · Risk: Low-Medium' },
  { tag:'Sector', tagClass:'tag-green', sentiment:'positive', body:'India textile exports +8.4% YoY in Q3 FY25. Rajasthan cluster outperforming national average.', meta:'Ministry of Textiles · Feb 2025 · Positive' },
];

export const EXPLAIN_CHAIN = [
  { text:'<strong>GSTR-2A vs 3B gap 8.3%</strong> (₹2.1 Cr) → ITC mismatch → revenue inflation flag → <span class="text-brand-amber font-semibold">Capacity −4 pts</span>' },
  { text:'<strong>Factory 40% utilisation</strong> confirmed via officer site visit → AI auto-applied → <span class="text-brand-red font-semibold">Conditions −8 pts</span>' },
  { text:'<strong>eCourts: 2 civil disputes</strong> (Rajasthan HC, sub-judice, value <₹50 L each) → low materiality → <span class="text-brand-amber font-semibold">Character −2 pts</span>' },
  { text:'<strong>RBI Circular Oct 2024</strong> textile NBFC exposure norms → sector headwind → <span class="text-brand-red font-semibold">Conditions −3 pts</span>' },
  { text:'<strong>Collateral ₹70 Cr</strong> (P&M ₹62 Cr + FD ₹8 Cr, independently valued) → risk offset → <span class="text-brand-blue font-semibold">conservative limit ₹45 Cr</span>' },
  { text:'<strong>Final decision:</strong> APPROVE ₹45 Cr at MCLR+2.25% — 5 year tenure, annual review trigger embedded' },
];

export const PORTFOLIO_APPRAISALS: Appraisal[] = [
  { id:'#2024-089', company:'Rajasthan Textiles Ltd.', sector:'Textiles', amount:'₹45 Cr', score:78, verdict:'APPROVE', date:'14 Feb 2025', officer:'Himanshu S.', status:'Completed' },
  { id:'#2024-088', company:'Bharat Auto Components Pvt. Ltd.', sector:'Auto Ancillary', amount:'₹120 Cr', score:84, verdict:'APPROVE', date:'10 Feb 2025', officer:'Priya M.', status:'Completed' },
  { id:'#2024-087', company:'Deccan Agro Foods Ltd.', sector:'Agriculture', amount:'₹28 Cr', score:61, verdict:'REFER', date:'7 Feb 2025', officer:'Rahul K.', status:'Pending Review' },
  { id:'#2024-086', company:'Sunrise Pharma Industries', sector:'Pharmaceuticals', amount:'₹200 Cr', score:88, verdict:'APPROVE', date:'3 Feb 2025', officer:'Himanshu S.', status:'Completed' },
  { id:'#2024-085', company:'Coastal Shipping & Logistics', sector:'Logistics', amount:'₹75 Cr', score:52, verdict:'REJECT', date:'28 Jan 2025', officer:'Priya M.', status:'Completed' },
  { id:'#2024-084', company:'North Star Steel Works', sector:'Steel / Metals', amount:'₹340 Cr', score:79, verdict:'APPROVE', date:'22 Jan 2025', officer:'Rahul K.', status:'In Progress' },
];

export const EARLY_WARNINGS: EarlyWarning[] = [
  { id:'w1', company:'Coastal Shipping & Logistics', type:'GST Non-Filing', severity:'critical', description:'GSTR-3B not filed for Jan & Feb 2025. Consecutive non-filing triggers NPA early warning protocol.', detected:'2 hours ago', score_change:-14 },
  { id:'w2', company:'Deccan Agro Foods Ltd.', type:'Litigation Alert', severity:'high', description:'New FIR filed against promoter Suresh Patel in Hyderabad HC. Material increase in litigation risk.', detected:'Yesterday', score_change:-8 },
  { id:'w3', company:'North Star Steel Works', type:'Credit Rating Downgrade', severity:'high', description:'ICRA downgraded outlook from Stable to Negative. Steel sector headwinds cited.', detected:'3 days ago', score_change:-6 },
  { id:'w4', company:'Rajasthan Textiles Ltd.', type:'Export Order Update', severity:'low', description:'UAE export order ₹120 Cr confirmed and shipped. Positive signal — revenue trajectory improving.', detected:'5 days ago', score_change:+4 },
];

export function computeComposite(scores: CScore[]): number {
  return parseFloat(scores.reduce((sum, c) => sum + (c.score * c.weight / 100), 0).toFixed(1));
}

export function getVerdictColor(verdict: string) {
  if (verdict === 'APPROVE') return { bg: 'bg-brand-green', text: 'text-white' };
  if (verdict === 'REJECT')  return { bg: 'bg-brand-red', text: 'text-white' };
  return { bg: 'bg-brand-amber', text: 'text-white' };
}

export function getSeverityClass(severity: string) {
  if (severity === 'critical') return 'tag-red';
  if (severity === 'high')     return 'tag-amber';
  if (severity === 'medium')   return 'tag-blue';
  return 'tag-green';
}
