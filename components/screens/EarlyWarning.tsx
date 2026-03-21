'use client';
import { useState, useEffect } from 'react';
import { AlertTriangle, Bell, Activity, ShieldAlert, ArrowDown, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PORTFOLIO_APPRAISALS, EARLY_WARNINGS } from '@/lib/data';

export default function EarlyWarning() {
  const [demoState, setDemoState] = useState<'idle' | 'polling' | 'alerting' | 'dropped'>('idle');
  const [score, setScore] = useState(77);
  
  // Animate score drop
  useEffect(() => {
    if (demoState === 'dropped') {
      let current = 77;
      const t = setInterval(() => {
        current -= 1;
        setScore(current);
        if (current <= 63) clearInterval(t);
      }, 40);
      return () => clearInterval(t);
    } else {
      setScore(77); // reset if idle
    }
  }, [demoState]);

  const simulateAlert = () => {
    setDemoState('polling');
    setTimeout(() => setDemoState('alerting'), 1500);
    setTimeout(() => setDemoState('dropped'), 3000);
  };

  const resetDemo = () => {
    setDemoState('idle');
    setScore(77);
  };

  const getVerdict = (s: number) => {
    if (s >= 75) return { label: 'APPROVE', color: 'bg-brand-green text-white', ring: 'ring-brand-green-md' };
    if (s >= 60) return { label: 'REFER', color: 'bg-brand-amber text-white', ring: 'ring-brand-amber-md' };
    return { label: 'REJECT', color: 'bg-brand-red text-white', ring: 'ring-brand-red-md' };
  };

  const v = getVerdict(score);

  return (
    <div className="flex-1 overflow-y-auto bg-surface">
      <div className="px-7 py-5 bg-surface border-b border-border flex items-center justify-between">
         <div>
           <div className="flex items-center gap-2 mb-1">
             <Activity className="text-brand-purple" size={18} />
             <h1 className="font-display text-[26px] leading-tight text-ink">Early Warning System</h1>
           </div>
           <p className="text-[12.5px] text-muted">Continuous API monitoring across MCA, GSTN, and eCourts</p>
         </div>
         
         <div className="flex gap-2">
           {demoState !== 'idle' && (
             <button 
               className="btn btn-ghost gap-2"
               onClick={resetDemo}
             >
               <RotateCcw size={13} /> Reset Demo
             </button>
           )}
           <button 
             className="btn btn-primary gap-2 shadow-sm relative overflow-hidden group"
             onClick={simulateAlert}
             disabled={demoState !== 'idle'}
           >
             {demoState === 'polling' ? (
               <><div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Fetching Signals...</>
             ) : demoState === 'idle' ? (
               <><Bell size={14} className="group-hover:animate-wiggle" /> Simulate API Webhook Alert</>
             ) : (
               <><ShieldAlert size={14}/> Alert Triggered</>
             )}
             {demoState === 'idle' && (
               <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
             )}
           </button>
         </div>
      </div>

      <div className="p-7 max-w-5xl mx-auto flex flex-col gap-6">
        
        {/* Live Alert Banner */}
        <div className={cn(
          "transition-all duration-500 overflow-hidden rounded-[8px]",
          demoState === 'alerting' || demoState === 'dropped' ? "opacity-100 max-h-[200px]" : "opacity-0 max-h-0"
        )}>
          <div className="bg-brand-red-lt border border-brand-red-md p-4 flex items-center gap-4">
             <div className="w-10 h-10 rounded-full bg-brand-red flex items-center justify-center animate-pulse shadow-[0_0_15px_rgba(176,18,37,0.4)]">
               <AlertTriangle className="text-white" size={20} />
             </div>
             <div>
               <div className="text-[14px] font-bold text-brand-red uppercase tracking-wide flex items-center gap-2">
                 Critical Risk Event Detected
                 <span className="text-[10px] bg-white/50 px-2 py-0.5 rounded font-mono-ic">SOURCE: GSTN API</span>
               </div>
               <div className="text-[13px] text-ink-2 mt-0.5">
                 <strong>Rajasthan Textiles Ltd.</strong> — GSTR-3B non-filing detected for Jan & Feb 2025. 
                 Automated continuous monitoring triggered score recalculation.
               </div>
             </div>
          </div>
        </div>

        {/* Live Profile Card */}
        <div className="card grid grid-cols-[1fr_auto_1fr] items-center p-8 border-t-4 border-t-brand-purple shadow-sm">
           
           <div className="flex flex-col gap-1 text-center">
             <div className="text-[12px] font-bold text-muted uppercase tracking-wider mb-2">Monitored Entity</div>
             <div className="font-display text-[22px] text-ink">Rajasthan Textiles Ltd.</div>
             <div className="text-[12px] text-faint flex items-center justify-center gap-2 mt-1">
               <span className="flex h-2 w-2 relative">
                 <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-green opacity-75"></span>
                 <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-green"></span>
               </span>
               Live Tracking Active
             </div>
           </div>

           <div className="w-px h-32 bg-border mx-8" />

           <div className="flex justify-center items-center gap-12">
             <div className="flex flex-col items-center">
               <div className="text-[11px] font-bold text-muted uppercase tracking-wider mb-2 transition-colors">Composite Score</div>
               <div className="flex items-center gap-2">
                 <div className={cn(
                   "font-display text-[64px] leading-none transition-colors duration-200",
                   score < 75 ? "text-brand-amber" : "text-brand-blue"
                 )}>
                   {score}
                 </div>
                 {demoState === 'dropped' && (
                   <div className="flex flex-col text-brand-red font-bold animate-fade-in text-[13px] bg-brand-red-lt px-2 py-1 rounded">
                     <ArrowDown size={14} className="mb-0.5"/> -14
                   </div>
                 )}
               </div>
             </div>

             <div className="flex flex-col items-center">
               <div className="text-[11px] font-bold text-muted uppercase tracking-wider mb-4">Auto-Verdict</div>
               <div className={cn(
                 "px-5 py-2.5 rounded-[8px] text-[16px] font-bold tracking-wider ring-4 transition-all duration-500",
                 v.color, v.ring
               )}>
                 {v.label}
               </div>
             </div>
           </div>
        </div>

        {/* Early Warning Alerts */}
        <div className="card animate-fade-up">
          <div className="card-header">
            <span className="card-label">Active Warning Signals</span>
            <span className="tag tag-red">{EARLY_WARNINGS.length} alerts</span>
          </div>
          <div className="p-3 flex flex-col gap-2">
            {EARLY_WARNINGS.map((w) => (
              <div key={w.id} className={cn(
                "flex items-start gap-3 p-3 rounded-[8px] border transition-all hover:shadow-sm",
                w.severity === 'critical' ? 'bg-brand-red-lt border-brand-red-md' :
                w.severity === 'high' ? 'bg-brand-amber-lt border-brand-amber-md' :
                w.severity === 'low' ? 'bg-brand-green-lt border-brand-green-md' :
                'bg-surface-2 border-border'
              )}>
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5",
                  w.severity === 'critical' ? 'bg-brand-red' :
                  w.severity === 'high' ? 'bg-brand-amber' :
                  w.severity === 'low' ? 'bg-brand-green' : 'bg-brand-blue'
                )}>
                  <AlertTriangle size={14} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[13px] font-semibold text-ink-2">{w.company}</span>
                    <span className={cn('tag text-[10px]',
                      w.severity === 'critical' ? 'tag-red' :
                      w.severity === 'high' ? 'tag-amber' :
                      w.severity === 'low' ? 'tag-green' : 'tag-blue'
                    )}>{w.type}</span>
                  </div>
                  <p className="text-[12px] text-muted leading-relaxed">{w.description}</p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-[10.5px] text-faint font-mono-ic">{w.detected}</span>
                    <span className={cn(
                      "text-[11px] font-bold",
                      w.score_change > 0 ? 'text-brand-green' : 'text-brand-red'
                    )}>
                      {w.score_change > 0 ? '+' : ''}{w.score_change} pts
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Portfolio Table subset */}
        <div className="card">
          <div className="card-header"><span className="card-label">Active Monitored Portfolio</span></div>
          <table className="w-full">
            <thead className="bg-surface-2 border-b border-border">
              <tr>
                <th className="px-4 py-3 text-left text-[11px] font-semibold text-faint uppercase tracking-wide">Company</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold text-faint uppercase tracking-wide">Sector</th>
                <th className="px-4 py-3 text-center text-[11px] font-semibold text-faint uppercase tracking-wide">Dynamic Score</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold text-faint uppercase tracking-wide">Live Status</th>
              </tr>
            </thead>
            <tbody>
              <tr className={cn("border-b border-surface-3 transition-colors", demoState === 'dropped' ? "bg-brand-red-lt/30" : "")}>
                <td className="px-4 py-3 font-semibold text-[13px] text-ink-2">Rajasthan Textiles Ltd.</td>
                <td className="px-4 py-3 text-[12px] text-muted">Textiles</td>
                <td className="px-4 py-3 text-center">
                  <span className={cn("font-display text-[16px]", score < 75 ? "text-brand-amber font-bold" : "text-brand-blue")}>{score}</span>
                </td>
                <td className="px-4 py-3">
                  {demoState === 'dropped' ? (
                    <span className="tag text-brand-red bg-brand-red-lt border border-brand-red-md"><AlertTriangle size={12} className="mr-1 inline -mt-0.5"/>Risk Detected</span>
                  ) : (
                    <span className="tag tag-green">Stable</span>
                  )}
                </td>
              </tr>
              {PORTFOLIO_APPRAISALS.slice(1, 4).map(a => (
                <tr key={a.id} className="border-b border-surface-3">
                  <td className="px-4 py-3 font-semibold text-[13px] text-ink-2">{a.company}</td>
                  <td className="px-4 py-3 text-[12px] text-muted">{a.sector}</td>
                  <td className="px-4 py-3 text-center font-display text-[16px] text-ink-2">{a.score}</td>
                  <td className="px-4 py-3"><span className="tag tag-green">Stable</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
