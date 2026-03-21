'use client';
import { useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { C_SCORES, RISK_SIGNALS, RESEARCH_ITEMS, EXPLAIN_CHAIN, computeComposite } from '@/lib/data';
import { cn } from '@/lib/utils';
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip } from 'recharts';
import type { AnalysisResult } from '@/lib/analysis-types';

interface DashboardProps {
  onGenerateCAM: () => void;
  onCompare: () => void;
  onBack: () => void;
  analysisResult?: AnalysisResult | null;
}

export default function Dashboard({ onGenerateCAM, onCompare, onBack, analysisResult }: DashboardProps) {
  const [animated, setAnimated] = useState(false);
  const [scoreDisplay, setScoreDisplay] = useState(0);

  const [utilization, setUtilization] = useState(40);

  // Use AI data if available, otherwise fall back to hardcoded
  const baseScores = analysisResult?.cScores || C_SCORES;
  const scores = baseScores.map(c => {
    if (c.label === 'Conditions') {
      const boost = Math.round((utilization - 40) / 10 * 2);
      return { ...c, score: Math.min(100, c.score + boost) };
    }
    return c;
  });

  const riskSignals = analysisResult?.riskSignals || RISK_SIGNALS;
  const researchItems = analysisResult?.researchItems || RESEARCH_ITEMS;
  const explainChain = analysisResult?.explainChain || EXPLAIN_CHAIN;
  const rawComposite = parseFloat(scores.reduce((sum, c) => sum + (c.score * c.weight) / 100, 0).toFixed(1));
  const composite = isNaN(rawComposite) ? 0 : rawComposite;
  const targetScore = Math.round(composite);

  // Verdict from AI or default (reactive to simulation)
  const baseVerdict = analysisResult?.verdict || {
    decision: 'APPROVE' as const,
    limit: '₹45 Cr',
    rate: 'MCLR+2.25%',
    tenure: '5 Years',
    rationale: 'Strong collateral offsets factory utilisation risk. Conservative limit vs ₹60 Cr requested. Annual review trigger.',
  };
  
  const currentVerdict = { ...baseVerdict };
  
  if (utilization >= 65) {
    currentVerdict.limit = '₹58 Cr';
  } else {
    currentVerdict.limit = '₹45 Cr';
  }

  if (utilization > 40) {
    if (composite >= 75) {
      currentVerdict.decision = 'APPROVE';
      currentVerdict.rationale = 'Limit increased to ₹58 Cr based on improved factory utilisation simulated scenario.';
    } else if (composite >= 60) {
      currentVerdict.decision = 'REFER';
    } else {
      currentVerdict.decision = 'REJECT';
    }
  }

  const companyName = analysisResult?.companyProfile?.companyName || 'Rajasthan Textiles Ltd.';
  const processingTime = analysisResult?.processingTime || '4m 12s';

  useEffect(() => {
    const t = setTimeout(() => {
      setAnimated(true);
      let n = 0;
      const interval = setInterval(() => {
        n = Math.min(n + 2, targetScore);
        setScoreDisplay(n);
        if (n >= targetScore) clearInterval(interval);
      }, 22);
    }, 150);
    return () => clearTimeout(t);
  }, [targetScore]);

  const radarData = scores.map(c => ({ subject: c.label, value: c.score, fullMark: 100 }));
  const circumference = 2 * Math.PI * 54;
  const offset = circumference * (1 - targetScore / 100);

  const verdictColor = currentVerdict.decision === 'APPROVE' ? 'green' : currentVerdict.decision === 'REJECT' ? 'red' : 'amber';

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Header */}
      <div className="px-7 py-5 bg-surface border-b border-border flex items-start justify-between">
        <div>
          <h1 className="font-display text-[26px] leading-tight text-ink mb-1">Analysis Dashboard</h1>
          <p className="text-[12.5px] text-muted">{companyName} · Processed in {processingTime} · {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
        </div>
        <div className="flex gap-2 pt-1">
          <button className="btn btn-ghost" onClick={onBack}>← Back</button>
          <button className="btn btn-primary bg-brand-purple text-white gap-1 shadow-sm" onClick={onCompare}>Compare Peer</button>
          <button className="btn btn-green gap-1" onClick={onGenerateCAM}>Generate CAM <ArrowRight size={13}/></button>
        </div>
      </div>

      <div className="p-7 flex flex-col gap-5">

        {/* Score Hero */}
        <div className="card animate-fade-up">
          <div className="flex">
            {/* Ring + bars */}
            <div className="flex-1 p-5 border-r border-border flex items-center gap-6 relative">
              {/* SVG Ring */}
              <div className="relative flex-shrink-0">
                <svg width="130" height="130" viewBox="0 0 130 130">
                  <circle cx="65" cy="65" r="54" fill="none" stroke="var(--s3)" strokeWidth="10" />
                  <circle
                    cx="65" cy="65" r="54"
                    fill="none" stroke={`var(--${verdictColor === 'green' ? 'blue' : verdictColor}, #0066CC)`} strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={animated ? offset : circumference}
                    transform="rotate(-90 65 65)"
                    style={{ transition: 'stroke-dashoffset 1.5s cubic-bezier(0.4,0,0.2,1)', stroke: verdictColor === 'green' ? '#0066CC' : verdictColor === 'red' ? '#B01225' : '#96500A' }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-display text-[42px] leading-none text-ink">{scoreDisplay}</span>
                  <span className="text-[12px] text-faint mt-0.5">/100</span>
                </div>
              </div>
              
              <div className="absolute bottom-4 w-[280px] -ml-2 text-center pointer-events-none">
                 <div className="inline-block text-[10.5px] bg-surface-2 px-3 py-1.5 rounded-full border border-border shadow-sm text-ink-2 font-medium">
                    vs Sector Avg 71/100 — <strong className="text-brand-green ml-0.5">Top 35% of peer group</strong>
                 </div>
              </div>

              {/* C Bars */}
              <div className="flex-1">
                <div className="text-[12px] font-semibold text-muted mb-3">Credit Score Breakdown — 5 C's</div>
                <div className="flex flex-col gap-2.5">
                  {scores.map((c, i) => (
                    <div key={c.label} className="flex items-center gap-3">
                      <span className="w-16 text-[12px] font-medium text-muted flex-shrink-0">{c.label}</span>
                      <div className="flex-1 h-2 bg-surface-3 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-[1200ms]"
                          style={{
                            width: animated ? `${c.score}%` : '0%',
                            background: c.color,
                            transitionDelay: `${i * 80}ms`,
                          }}
                        />
                      </div>
                      <span className="w-8 text-[12px] font-bold text-right flex-shrink-0" style={{ color: c.color }}>{c.score}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Verdict */}
            <div className="p-5 flex flex-col gap-4 justify-center" style={{ minWidth: 280 }}>
              <div className={`p-4 bg-brand-${verdictColor}-lt border border-brand-${verdictColor}-md rounded-[10px]`}>
                <div className="flex items-center gap-2 mb-3">
                  <div className={`flex items-center gap-2 px-3 py-1.5 bg-brand-${verdictColor} text-white rounded-[6px] text-[12.5px] font-bold transition-colors`}>
                    {currentVerdict.decision === 'APPROVE' ? '✓' : currentVerdict.decision === 'REJECT' ? '✗' : '⚠'} {currentVerdict.decision}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[['Limit', currentVerdict.limit], ['Rate', currentVerdict.rate], ['Tenure', currentVerdict.tenure]].map(([l, v]) => (
                    <div key={l}>
                      <div className={`text-[9.5px] font-semibold text-brand-${verdictColor} uppercase tracking-wide`}>{l}</div>
                      <div className="text-[15px] font-bold text-ink">{v}</div>
                    </div>
                  ))}
                </div>
                <p className={`text-[11px] text-brand-${verdictColor} mt-3 leading-relaxed transition-colors`}>
                  {currentVerdict.rationale}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Five C's grid */}
        <div className="card animate-fade-up animate-delay-1">
          <div className="card-header"><span className="card-label">Five C's Assessment</span></div>
          <div className="p-4 grid grid-cols-5 gap-3">
            {scores.map(c => (
              <div key={c.label} className="c-card">
                <div className="h-1" style={{ background: c.color }} />
                <div className="p-3 text-center flex flex-col items-center flex-1">
                  <div className="text-[10.5px] font-semibold text-muted uppercase tracking-wide mb-2">{c.label}</div>
                  <div className="font-display text-[30px] leading-none mb-1 flex items-baseline gap-1" style={{ color: c.color }}>
                    {c.score} <span className="text-[11px] font-sans font-normal opacity-60">±{c.interval || 3}</span>
                  </div>
                  <div className="text-[10px] text-faint mb-2">/100</div>
                  <span className={cn('tag text-[10px]', c.tagClass)}>{c.note}</span>
                  <p className="text-[10px] text-faint mt-2 leading-relaxed">{c.detail.substring(0, 60)}...</p>
                  
                  {c.confidenceNote && (
                    <div className="mt-auto pt-2 border-t border-surface-3 w-full text-[9px] text-muted italic leading-tight">
                      {c.confidenceNote}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom row */}
        <div className="grid grid-cols-[1fr_300px] gap-5 animate-fade-up animate-delay-2">
          {/* Risk signals */}
          <div className="card">
            <div className="card-header">
              <span className="card-label">Risk Signals Detected</span>
              <span className="tag tag-amber">{riskSignals.length} signals</span>
            </div>
            <div className="p-3 flex flex-col gap-2">
              {riskSignals.map((r, i) => (
                <div key={i} className="risk-signal" style={{ animationDelay: `${i * 80}ms` }}>
                  <div className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5" style={{ background: r.color }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="text-[12.5px] font-semibold text-ink-2 leading-tight">{r.title}</div>
                      <span className="tag tag-amber text-[9.5px] flex-shrink-0">{r.impact}</span>
                    </div>
                    <p className="text-[11.5px] text-muted mt-1 leading-relaxed">{r.body}</p>
                    <div className="text-[10.5px] text-faint font-mono-ic mt-1.5">{r.meta}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Contradiction + Research + Insight */}
          <div className="flex flex-col gap-4">
            
            {/* Contradiction Matrix */}
            <div className="card border-brand-red-md shadow-[0_2px_10px_rgba(176,18,37,0.06)]">
              <div className="card-header bg-brand-red-lt border-b-0 pb-2"><span className="card-label text-brand-red">Cross-Document Contradiction Detected</span></div>
              <div className="p-4 pt-1">
                <div className="flex gap-3 items-center justify-between">
                  <div className="flex-1 p-2 bg-white rounded-[6px] border border-brand-red-md/30 text-center shadow-sm">
                    <div className="text-[10px] text-muted font-bold uppercase tracking-wider mb-1">Annual Report</div>
                    <div className="font-display text-[20px] text-ink leading-none">₹284 Cr</div>
                  </div>
                  <div className="text-[13px] font-display text-brand-red italic opacity-60">VS</div>
                  <div className="flex-1 p-2 bg-white rounded-[6px] border border-brand-red-md/30 text-center shadow-sm">
                    <div className="text-[10px] text-muted font-bold uppercase tracking-wider mb-1">GSTR-3B</div>
                    <div className="font-display text-[20px] text-ink leading-none">₹261 Cr</div>
                  </div>
                </div>
                <div className="mt-3 text-center text-[10.5px] bg-brand-red text-white py-1 rounded-[4px] font-bold uppercase tracking-wide">
                  8.3% Unexplained Gap Flagged — REFER
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <span className="card-label">Research Agent</span>
                <div className="w-2 h-2 rounded-full bg-brand-green" style={{ animation:'pulseDot 2s infinite' }} />
              </div>
              <div>
                {researchItems.map((r, i) => (
                  <div key={i} className="research-item">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={cn('tag text-[10px]', r.tagClass)}>{r.tag}</span>
                      <span className={cn('text-[10px]',
                        r.sentiment === 'positive' ? 'text-brand-green' :
                        r.sentiment === 'negative' ? 'text-brand-red' : 'text-faint'
                      )}>
                        {r.sentiment === 'positive' ? '↑' : r.sentiment === 'negative' ? '↓' : '→'}
                      </span>
                    </div>
                    <p className="text-[11.5px] text-muted leading-relaxed">{r.body}</p>
                    <div className="text-[10.5px] text-faint font-mono-ic mt-1">{r.meta}</div>
                  </div>
                ))}
              </div>
            </div>

            <button className="btn btn-green w-full justify-center py-3 text-[13px]" onClick={onGenerateCAM}>
              Generate CAM Memo →
            </button>
          </div>
        </div>

        {/* Radar chart & Simulator */}
        <div className="grid grid-cols-2 gap-5 animate-fade-up animate-delay-3">
          <div className="card">
            <div className="card-header"><span className="card-label">5 C's Radar View</span></div>
            <div className="p-4" style={{ height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="var(--border)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: 'var(--muted)', fontFamily: 'Geist' }} />
                  <Radar name="Score" dataKey="value" stroke="#0066CC" fill="#0066CC" fillOpacity={0.12} strokeWidth={2} />
                  <Tooltip
                    contentStyle={{ background:'white', border:'1px solid var(--border)', borderRadius:7, fontSize:12 }}
                    formatter={(val: number) => [`${val}/100`, 'Score']}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="card">
            <div className="card-header">
              <span className="card-label">What-If Simulator</span>
              <span className="tag tag-amber">Claude AI Constraint</span>
            </div>
            <div className="p-6 flex flex-col justify-center h-auto">
              <div className="mb-4 p-3 bg-brand-amber-lt border border-brand-amber-md rounded-[8px] text-[11.5px] text-brand-amber leading-relaxed">
                <strong>AI Insight:</strong> "If DSCR improves to 1.6× and factory utilisation crosses 65%, score goes from 61 to 76 — APPROVE and Limit up to ₹58 Cr."
              </div>
              
              <div className="flex justify-between items-end mb-4">
                <div>
                  <div className="text-[14px] font-semibold text-ink-2">Factory Utilisation</div>
                  <div className="text-[11.5px] text-muted mt-0.5">Drag to simulate operating conditions</div>
                </div>
                <div className="text-[28px] font-display text-brand-blue">{utilization}%</div>
              </div>
              
              <input 
                type="range" min="40" max="100" step="5" 
                value={utilization} 
                onChange={e => setUtilization(parseInt(e.target.value))}
                className="w-full relative z-10 accent-brand-blue cursor-pointer mt-2"
              />
              <div className="flex justify-between text-[10px] text-faint mt-2 font-mono-ic">
                <span>40% (Actual)</span>
                <span>100% (Optimal)</span>
              </div>
              
              <div className="mt-8 p-4 bg-surface-2 border border-border rounded-[10px]">
                <div className="flex justify-between items-center">
                  <span className="text-[12.5px] text-muted font-medium">Conditions Score</span>
                  <span className="text-[16px] font-bold text-ink">{scores.find(s=>s.label==='Conditions')?.score}/100</span>
                </div>
                <div className="flex justify-between items-center mt-2.5 pt-2.5 border-t border-surface-3">
                  <span className="text-[12.5px] text-muted font-medium">Projected Verdict</span>
                  <span className={cn('tag', currentVerdict.decision==='APPROVE' ? 'tag-green' : currentVerdict.decision==='REJECT' ? 'tag-red' : 'tag-amber')}>{currentVerdict.decision}</span>
                </div>
                <div className="flex justify-between items-center mt-2.5 pt-2.5 border-t border-surface-3">
                  <span className="text-[12.5px] text-muted font-medium">Projected Limit</span>
                  <span className={cn('font-display text-[18px]', utilization >= 65 ? 'text-brand-green' : 'text-ink')}>{utilization >= 65 ? '₹58 Cr' : '₹45 Cr'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
