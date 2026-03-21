'use client';
import { useState } from 'react';
import { Search, Filter, TrendingUp, TrendingDown, Minus, X, ArrowRight, FileText, Eye } from 'lucide-react';
import { PORTFOLIO_APPRAISALS, getVerdictColor, C_SCORES } from '@/lib/data';
import type { Appraisal } from '@/types';
import { cn } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LineChart, Line, RadarChart, PolarGrid, PolarAngleAxis, Radar } from 'recharts';

const SECTORS = [
  { name: 'IT Services', risk: 'low', count: 42 },
  { name: 'Auto Ancillary', risk: 'low', count: 38 },
  { name: 'Pharma', risk: 'low', count: 31 },
  { name: 'FMCG', risk: 'low', count: 29 },
  { name: 'Agriculture', risk: 'low', count: 24 },
  { name: 'Renewables', risk: 'low', count: 18 },
  { name: 'Textiles', risk: 'medium', count: 45 },
  { name: 'Steel / Metals', risk: 'medium', count: 22 },
  { name: 'Chemicals', risk: 'medium', count: 19 },
  { name: 'Logistics', risk: 'medium', count: 15 },
  { name: 'Real Estate', risk: 'high', count: 8 },
  { name: 'Aviation', risk: 'high', count: 3 },
];

// Simulated 5C scores for each borrower
const BORROWER_SCORES: Record<string, {label:string, score:number, color:string}[]> = {
  'Rajasthan Textiles Ltd.': [
    { label:'Character', score:82, color:'#157A45' },
    { label:'Capacity', score:74, color:'#96500A' },
    { label:'Capital', score:78, color:'#0066CC' },
    { label:'Collateral', score:85, color:'#6428C8' },
    { label:'Conditions', score:70, color:'#B01225' },
  ],
  'Bharat Auto Components Pvt. Ltd.': [
    { label:'Character', score:88, color:'#157A45' },
    { label:'Capacity', score:84, color:'#96500A' },
    { label:'Capital', score:80, color:'#0066CC' },
    { label:'Collateral', score:92, color:'#6428C8' },
    { label:'Conditions', score:75, color:'#B01225' },
  ],
  'Deccan Agro Foods Ltd.': [
    { label:'Character', score:72, color:'#157A45' },
    { label:'Capacity', score:58, color:'#96500A' },
    { label:'Capital', score:64, color:'#0066CC' },
    { label:'Collateral', score:55, color:'#6428C8' },
    { label:'Conditions', score:60, color:'#B01225' },
  ],
  'Sunrise Pharma Industries': [
    { label:'Character', score:90, color:'#157A45' },
    { label:'Capacity', score:88, color:'#96500A' },
    { label:'Capital', score:85, color:'#0066CC' },
    { label:'Collateral', score:91, color:'#6428C8' },
    { label:'Conditions', score:82, color:'#B01225' },
  ],
  'Coastal Shipping & Logistics': [
    { label:'Character', score:60, color:'#157A45' },
    { label:'Capacity', score:45, color:'#96500A' },
    { label:'Capital', score:52, color:'#0066CC' },
    { label:'Collateral', score:48, color:'#6428C8' },
    { label:'Conditions', score:55, color:'#B01225' },
  ],
  'North Star Steel Works': [
    { label:'Character', score:85, color:'#157A45' },
    { label:'Capacity', score:79, color:'#96500A' },
    { label:'Capital', score:76, color:'#0066CC' },
    { label:'Collateral', score:82, color:'#6428C8' },
    { label:'Conditions', score:72, color:'#B01225' },
  ],
};

export default function Portfolio({ onNewAppraisal }: { onNewAppraisal?: () => void }) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<string>('all');
  const [sectorFilter, setSectorFilter] = useState<string>('all');
  const [selectedAppraisal, setSelectedAppraisal] = useState<Appraisal | null>(null);

  const filtered = PORTFOLIO_APPRAISALS.filter(a => {
    const matchSearch = a.company.toLowerCase().includes(search.toLowerCase()) || a.sector.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || a.verdict.toLowerCase() === filter || a.status.toLowerCase().replace(' ','') === filter;
    const matchSector = sectorFilter === 'all' || a.sector.includes(sectorFilter.split(' ')[0]) || sectorFilter.includes(a.sector.split(' ')[0]);
    return matchSearch && matchFilter && matchSector;
  });

  const stats = {
    total: PORTFOLIO_APPRAISALS.length,
    approved: PORTFOLIO_APPRAISALS.filter(a => a.verdict === 'APPROVE').length,
    rejected: PORTFOLIO_APPRAISALS.filter(a => a.verdict === 'REJECT').length,
    avgScore: Math.round(PORTFOLIO_APPRAISALS.reduce((s, a) => s + a.score, 0) / PORTFOLIO_APPRAISALS.length),
  };

  const chartData = PORTFOLIO_APPRAISALS.map(a => ({ name: a.company.split(' ')[0], score: a.score, verdict: a.verdict }));

  const trendData = [
    { term: 'FY22', score: 68 },
    { term: 'FY23', score: 72 },
    { term: 'Q2 FY24', score: 71 },
    { term: 'FY24', score: 78 }
  ];

  const selectedScores = selectedAppraisal ? BORROWER_SCORES[selectedAppraisal.company] || BORROWER_SCORES['Rajasthan Textiles Ltd.'] : null;
  const radarData = selectedScores?.map(s => ({ subject: s.label, value: s.score, fullMark: 100 }));

  return (
    <div className="flex-1 overflow-y-auto relative">
      <div className="px-7 py-5 bg-surface border-b border-border flex items-start justify-between">
        <div>
          <h1 className="font-display text-[26px] leading-tight text-ink mb-1">All Appraisals</h1>
          <p className="text-[12.5px] text-muted">Portfolio overview · FY 2024–25 · 6 appraisals</p>
        </div>
        <button className="btn btn-ink mt-1" onClick={onNewAppraisal}>+ New Appraisal</button>
      </div>

      <div className="p-7 flex flex-col gap-6">
        
        {/* Sector Heatmap */}
        <div className="card animate-fade-up">
          <div className="card-header border-b border-border pb-3">
            <span className="card-label">Sector Risk Heatmap (RBI Linked Exposure)</span>
            {sectorFilter !== 'all' && (
               <button className="text-[11px] text-brand-blue font-bold px-3 py-1 bg-brand-blue-lt rounded-full" onClick={() => setSectorFilter('all')}>Clear Filter</button>
            )}
          </div>
          <div className="p-4 grid grid-cols-6 gap-3">
            {SECTORS.map(s => (
               <div key={s.name} className={cn(
                 "p-3 rounded-[8px] border text-center cursor-pointer transition-all hover:-translate-y-0.5 shadow-sm",
                 sectorFilter === s.name ? "ring-2 ring-brand-purple ring-offset-2" : "",
                 s.risk === 'low' ? 'bg-brand-green-lt border-brand-green-md text-brand-green' :
                 s.risk === 'medium' ? 'bg-brand-amber-lt border-brand-amber-md text-brand-amber' :
                 'bg-brand-red-lt border-brand-red-md text-brand-red'
               )} onClick={() => setSectorFilter(s.name)}>
                 <div className="text-[10px] font-bold uppercase tracking-wider mb-1 opacity-80">{s.name}</div>
                 <div className="font-display text-[22px] leading-none">{s.count}</div>
               </div>
            ))}
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-4 animate-fade-up animate-delay-1">
          {[
            { label:'Total Appraisals', value: stats.total, icon:'📋', color:'text-ink' },
            { label:'Approved', value: stats.approved, icon:'✅', color:'text-brand-green' },
            { label:'Rejected', value: stats.rejected, icon:'❌', color:'text-brand-red' },
            { label:'Avg Credit Score', value: stats.avgScore, icon:'📊', color:'text-brand-blue' },
          ].map(s => (
            <div key={s.label} className="card p-4 flex items-center gap-3">
              <span className="text-[22px]">{s.icon}</span>
              <div>
                <div className={cn('font-display text-[28px] leading-none', s.color)}>{s.value}</div>
                <div className="text-[11px] text-faint mt-0.5">{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-2 gap-5 animate-fade-up animate-delay-1">
          <div className="card">
            <div className="card-header"><span className="card-label">Score Distribution</span></div>
            <div className="p-4" style={{ height: 180 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} barSize={28}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--muted)', fontFamily: 'Geist' }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: 'var(--faint)', fontFamily: 'Geist' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background:'white', border:'1px solid var(--border)', borderRadius:7, fontSize:12, fontFamily:'Geist' }}
                    formatter={(val: number) => [`${val}/100`, 'Score']}
                  />
                  <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                    {chartData.map((d, i) => (
                      <Cell key={i} fill={d.verdict==='APPROVE'?'#157A45':d.verdict==='REJECT'?'#B01225':'#96500A'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="card">
            <div className="card-header">
              <span className="card-label">Historical Trend (Rajasthan Textiles)</span>
            </div>
            <div className="p-4" style={{ height: 180 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="term" tick={{ fontSize: 11, fill: 'var(--muted)', fontFamily: 'Geist' }} axisLine={false} tickLine={false} />
                  <YAxis domain={[50, 100]} tick={{ fontSize: 11, fill: 'var(--faint)', fontFamily: 'Geist' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background:'white', border:'1px solid var(--border)', borderRadius:7, fontSize:12, fontFamily:'Geist' }} formatter={(val: number) => [`${val}/100`, 'Score']} />
                  <Line type="monotone" dataKey="score" stroke="#0066CC" strokeWidth={3} dot={{ r: 4, fill: '#0066CC', strokeWidth: 2, stroke: 'white' }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="card animate-fade-up animate-delay-2">
          <div className="card-header gap-3">
            <span className="card-label">Appraisal Records</span>
            <div className="flex items-center gap-2 ml-auto">
              <div className="relative">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-faint" />
                <input
                  className="pl-8 pr-3 py-1.5 text-[12px] bg-surface-2 border border-border rounded-[6px] outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue-md w-44 transition-all"
                  placeholder="Search company..."
                  value={search} onChange={e => setSearch(e.target.value)}
                />
              </div>
              {['all','approve','reject','refer'].map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  className={cn('btn text-[11px] py-1 px-2.5', filter===f ? 'btn-primary' : 'btn-ghost')}>
                  {f.charAt(0).toUpperCase()+f.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-surface-2">
                {['ID','Company','Sector','Amount','Score','Verdict','Officer','Status'].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left text-[11px] font-semibold text-faint uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((a, i) => {
                const vc = getVerdictColor(a.verdict);
                const isSelected = selectedAppraisal?.id === a.id;
                return (
                  <tr
                    key={a.id}
                    className={cn(
                      "border-b border-surface-3 hover:bg-surface-2 transition-colors cursor-pointer",
                      isSelected && "bg-brand-blue-lt border-l-2 border-l-brand-blue"
                    )}
                    style={{ animationDelay:`${i*40}ms` }}
                    onClick={() => setSelectedAppraisal(isSelected ? null : a)}
                  >
                    <td className="px-4 py-3 text-[12px] font-mono-ic text-faint">{a.id}</td>
                    <td className="px-4 py-3">
                      <div className="text-[12.5px] font-semibold text-ink-2">{a.company}</div>
                      <div className="text-[11px] text-faint">{a.date}</div>
                    </td>
                    <td className="px-4 py-3 text-[12px] text-muted">{a.sector}</td>
                    <td className="px-4 py-3 text-[12.5px] font-semibold text-ink">{a.amount}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-12 h-1.5 bg-surface-3 rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width:`${a.score}%`, background: a.score>=75?'#157A45':a.score>=60?'#96500A':'#B01225' }} />
                        </div>
                        <span className="text-[12px] font-bold" style={{ color: a.score>=75?'#157A45':a.score>=60?'#96500A':'#B01225' }}>{a.score}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn('px-2.5 py-1 rounded-[5px] text-[11px] font-bold', vc.bg, vc.text)}>{a.verdict}</span>
                    </td>
                    <td className="px-4 py-3 text-[12px] text-muted">{a.officer}</td>
                    <td className="px-4 py-3">
                      <span className={cn('tag text-[10.5px]',
                        a.status==='Completed'?'tag-green':a.status==='In Progress'?'tag-blue':'tag-amber'
                      )}>{a.status}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Side Panel */}
      <div className={cn(
        "fixed top-0 right-0 h-full w-[420px] bg-surface border-l border-border shadow-xl flex flex-col z-40 transition-transform duration-300",
        selectedAppraisal ? "translate-x-0" : "translate-x-full"
      )}>
        {selectedAppraisal && (() => {
          const scores = BORROWER_SCORES[selectedAppraisal.company] || BORROWER_SCORES['Rajasthan Textiles Ltd.'];
          const radarD = scores.map(s => ({ subject: s.label, value: s.score, fullMark: 100 }));
          const vc = getVerdictColor(selectedAppraisal.verdict);
          const verdictIcon = selectedAppraisal.verdict === 'APPROVE' ? '✓' : selectedAppraisal.verdict === 'REJECT' ? '✗' : '⚠';

          return (
            <>
              {/* Header */}
              <div className="px-5 py-4 border-b border-border bg-surface-2 flex items-start justify-between flex-shrink-0">
                <div>
                  <div className="text-[10px] font-bold text-faint uppercase tracking-wider mb-1">Appraisal Detail</div>
                  <div className="text-[16px] font-display text-ink leading-tight">{selectedAppraisal.company}</div>
                  <div className="text-[11px] text-muted mt-0.5">{selectedAppraisal.id} · {selectedAppraisal.date} · {selectedAppraisal.officer}</div>
                </div>
                <button onClick={() => setSelectedAppraisal(null)} className="text-faint hover:text-ink transition-colors mt-1">
                  <X size={16} />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-5">
                
                {/* Verdict + Score Hero */}
                <div className="flex items-center gap-4">
                  <div className="flex flex-col items-center">
                    <div className={cn(
                      "font-display text-[52px] leading-none",
                      selectedAppraisal.score >= 75 ? "text-brand-green" :
                      selectedAppraisal.score >= 60 ? "text-brand-amber" : "text-brand-red"
                    )}>
                      {selectedAppraisal.score}
                    </div>
                    <div className="text-[10px] text-faint mt-0.5">/ 100</div>
                  </div>
                  <div className="flex-1">
                    <div className={cn('inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] text-[12px] font-bold mb-2', vc.bg, vc.text)}>
                      {verdictIcon} {selectedAppraisal.verdict}
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <div className="p-2 bg-surface-2 border border-border rounded-[6px]">
                        <div className="text-[9px] font-bold text-faint uppercase tracking-wider">Amount</div>
                        <div className="text-[14px] font-bold text-ink">{selectedAppraisal.amount}</div>
                      </div>
                      <div className="p-2 bg-surface-2 border border-border rounded-[6px]">
                        <div className="text-[9px] font-bold text-faint uppercase tracking-wider">Sector</div>
                        <div className="text-[14px] font-bold text-ink">{selectedAppraisal.sector}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 5C Breakdown */}
                <div className="bg-surface-2 border border-border rounded-[10px] p-4">
                  <div className="text-[10px] font-bold text-muted uppercase tracking-wider mb-3">5 C's Breakdown</div>
                  <div className="flex flex-col gap-2.5">
                    {scores.map(c => (
                      <div key={c.label} className="flex items-center gap-3">
                        <span className="w-[72px] text-[11.5px] font-medium text-muted flex-shrink-0">{c.label}</span>
                        <div className="flex-1 h-2 bg-surface-3 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${c.score}%`, background: c.color }}
                          />
                        </div>
                        <span className="w-7 text-[11.5px] font-bold text-right flex-shrink-0" style={{ color: c.color }}>{c.score}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Radar */}
                <div className="bg-surface-2 border border-border rounded-[10px] p-4">
                  <div className="text-[10px] font-bold text-muted uppercase tracking-wider mb-2">Radar View</div>
                  <div style={{ height: 220 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={radarD}>
                        <PolarGrid stroke="var(--border)" />
                        <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: 'var(--muted)' }} />
                        <Radar dataKey="value" stroke="#0066CC" fill="#0066CC" fillOpacity={0.12} strokeWidth={2} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Status + Meta */}
                <div className="bg-surface-2 border border-border rounded-[10px] p-4">
                  <div className="text-[10px] font-bold text-muted uppercase tracking-wider mb-3">Appraisal Status</div>
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-center py-1.5 border-b border-surface-3">
                      <span className="text-[12px] text-muted">Status</span>
                      <span className={cn('tag text-[10.5px]',
                        selectedAppraisal.status==='Completed'?'tag-green':selectedAppraisal.status==='In Progress'?'tag-blue':'tag-amber'
                      )}>{selectedAppraisal.status}</span>
                    </div>
                    <div className="flex justify-between items-center py-1.5 border-b border-surface-3">
                      <span className="text-[12px] text-muted">Credit Officer</span>
                      <span className="text-[12px] font-semibold text-ink-2">{selectedAppraisal.officer}</span>
                    </div>
                    <div className="flex justify-between items-center py-1.5">
                      <span className="text-[12px] text-muted">Date</span>
                      <span className="text-[12px] font-semibold text-ink-2">{selectedAppraisal.date}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="px-5 py-3 border-t border-border bg-surface flex gap-2 flex-shrink-0">
                <button className="btn btn-ghost flex-1 justify-center gap-1.5 text-[12px]">
                  <FileText size={13}/> View CAM
                </button>
                <button className="btn btn-primary flex-1 justify-center gap-1.5 text-[12px]">
                  <Eye size={13}/> Open Dashboard <ArrowRight size={11}/>
                </button>
              </div>
            </>
          );
        })()}
      </div>
    </div>
  );
}
