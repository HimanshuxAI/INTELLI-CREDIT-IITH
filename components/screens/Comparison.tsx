'use client';
import { useState } from 'react';
import { ArrowLeft, Zap, Crown, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip } from 'recharts';
import { C_SCORES } from '@/lib/data';

export default function Comparison({ onBack }: { onBack: () => void }) {
  const [winner, setWinner] = useState<'A' | 'B' | null>(null);

  const comp1 = {
    name: 'Rajasthan Textiles Ltd.',
    scores: C_SCORES,
    composite: 78,
    verdict: 'APPROVE',
    color: '#0066CC'
  };

  const comp2 = {
    name: 'Bharat Auto Components Pvt. Ltd.',
    scores: [
      { label: 'Character', score: 88, weight: 20 },
      { label: 'Capacity', score: 84, weight: 25 },
      { label: 'Capital', score: 80, weight: 20 },
      { label: 'Collateral', score: 92, weight: 20 },
      { label: 'Conditions', score: 75, weight: 15 }
    ],
    composite: 84,
    verdict: 'APPROVE',
    color: '#6428C8'
  };

  const radarData = comp1.scores.map((c, i) => ({
    subject: c.label,
    A: c.score,
    B: comp2.scores[i].score,
    fullMark: 100
  }));

  const handleAutoSelect = () => {
    // Determine winner based on composite score
    setWinner(comp1.composite >= comp2.composite ? 'A' : 'B');
  };

  const winnerData = winner === 'A' ? comp1 : winner === 'B' ? comp2 : null;
  const aWins = radarData.filter(d => d.A > d.B).length;
  const bWins = radarData.filter(d => d.B > d.A).length;

  return (
    <div className="flex-1 overflow-y-auto bg-surface relative z-0">
      <div className="sticky top-0 z-10 px-7 py-5 bg-surface/95 backdrop-blur-sm border-b border-border flex items-center justify-between">
         <div>
           <h1 className="font-display text-[26px] leading-tight text-ink mb-1">Peer Comparison</h1>
           <p className="text-[12.5px] text-muted">Comparative side-by-side analysis model</p>
         </div>
         <div className="flex gap-2">
            <button className="btn btn-ghost gap-1" onClick={onBack}><ArrowLeft size={13}/>Dashboard</button>
            <button
              className={cn("btn gap-1 shadow-sm transition-all", winner ? "btn-green" : "btn-primary")}
              onClick={handleAutoSelect}
            >
              {winner ? <><Trophy size={13}/>Winner Selected</> : <><Zap size={13}/>Auto-Select Winner</>}
            </button>
         </div>
      </div>

      <div className="p-7 flex flex-col gap-6 max-w-5xl mx-auto">
         {/* Head to head overview */}
         <div className="grid grid-cols-[1fr_auto_1fr] gap-6 items-center animate-fade-up">
           <div className={cn(
             "card p-6 flex flex-col items-center text-center border-t-4 shadow-sm transition-all duration-500",
             winner === 'A' ? "ring-2 ring-brand-blue shadow-glow-blue" : winner === 'B' ? "opacity-60" : ""
           )} style={{ borderColor: comp1.color }}>
             {winner === 'A' && (
               <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex items-center gap-1 px-3 py-1 bg-brand-blue text-white text-[10px] font-bold rounded-full shadow-md z-10">
                 <Crown size={11} /> WINNER
               </div>
             )}
             <div className="text-[12px] font-bold text-muted uppercase tracking-wider mb-2">Borrower A</div>
             <div className="font-display text-[20px] text-ink">{comp1.name}</div>
             <div className="mt-4 font-display text-[52px] leading-none tracking-tight" style={{ color: comp1.color }}>{comp1.composite}</div>
             <div className="text-[11px] text-faint mt-1 mb-4 uppercase tracking-[0.1em]">Composite Score</div>
             <span className="px-3 py-1.5 rounded-[6px] bg-brand-green-lt border border-brand-green-md text-brand-green text-[11px] font-bold tracking-wide">{comp1.verdict}</span>
           </div>

           <div className="text-[20px] font-display text-faint italic px-2">VS</div>

           <div className={cn(
             "card p-6 flex flex-col items-center text-center border-t-4 shadow-sm transition-all duration-500",
             winner === 'B' ? "ring-2 ring-brand-purple shadow-[0_0_0_3px_rgba(100,40,200,0.15)]" : winner === 'A' ? "opacity-60" : ""
           )} style={{ borderColor: comp2.color }}>
             {winner === 'B' && (
               <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex items-center gap-1 px-3 py-1 bg-brand-purple text-white text-[10px] font-bold rounded-full shadow-md z-10">
                 <Crown size={11} /> WINNER
               </div>
             )}
             <div className="text-[12px] font-bold text-muted uppercase tracking-wider mb-2">Borrower B</div>
             <div className="font-display text-[20px] text-ink">{comp2.name}</div>
             <div className="mt-4 font-display text-[52px] leading-none tracking-tight" style={{ color: comp2.color }}>{comp2.composite}</div>
             <div className="text-[11px] text-faint mt-1 mb-4 uppercase tracking-[0.1em]">Composite Score</div>
             <span className="px-3 py-1.5 rounded-[6px] bg-brand-green-lt border border-brand-green-md text-brand-green text-[11px] font-bold tracking-wide">{comp2.verdict}</span>
           </div>
         </div>

         {/* Winner Summary Card */}
         {winner && winnerData && (
           <div className={cn(
             "card p-5 animate-fade-up border-t-4 shadow-md",
             winner === 'A' ? "border-t-brand-blue" : "border-t-brand-purple"
           )}>
             <div className="flex items-center gap-4">
               <div className={cn(
                 "w-12 h-12 rounded-full flex items-center justify-center",
                 winner === 'A' ? "bg-brand-blue" : "bg-brand-purple"
               )}>
                 <Trophy size={22} className="text-white" />
               </div>
               <div className="flex-1">
                 <div className="text-[14px] font-semibold text-ink">AI Recommendation: <strong>{winnerData.name}</strong></div>
                 <p className="text-[12px] text-muted mt-1 leading-relaxed">
                   {winnerData.name} scores <strong>{winnerData.composite}/100</strong> composite, winning in <strong>{winner === 'A' ? aWins : bWins} of 5</strong> credit dimensions.
                   {winner === 'B'
                     ? ' Stronger Collateral (92) and Character (88) scores indicate lower default risk and better repayment capacity.'
                     : ' Despite lower composite, strong sector-specific positioning and existing relationship may warrant consideration.'}
                 </p>
               </div>
               <div className="flex flex-col items-center gap-1 pl-4 border-l border-border">
                 <div className="text-[10px] font-bold text-muted uppercase tracking-wider">Confidence</div>
                 <div className={cn("font-display text-[28px]", winner === 'A' ? "text-brand-blue" : "text-brand-purple")}>
                   {winner === 'B' ? '87%' : '72%'}
                 </div>
               </div>
             </div>
           </div>
         )}

         {/* Radar comparison */}
         <div className="card animate-fade-up animate-delay-1 flex p-6 gap-10 items-center justify-center shadow-sm">
            <div className="w-1/2" style={{ height: 380 }}>
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="var(--border)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12, fill: 'var(--ink)' }} />
                  <Radar name={comp1.name} dataKey="A" stroke={comp1.color} fill={comp1.color} fillOpacity={0.15} strokeWidth={2} />
                  <Radar name={comp2.name} dataKey="B" stroke={comp2.color} fill={comp2.color} fillOpacity={0.15} strokeWidth={2} />
                  <Tooltip 
                    contentStyle={{ background:'white', borderRadius:8, border: '1px solid var(--border)', fontSize: '13px' }}
                    itemStyle={{ padding: 2 }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            
            <div className="w-1/2 flex flex-col gap-3">
               <h3 className="font-display text-[18px] text-ink mb-2">Dimension Breakdown</h3>
               {radarData.map(d => {
                 const diff = d.B - d.A;
                 const dimWinner = diff > 0 ? 'B' : diff < 0 ? 'A' : 'Tie';
                 return (
                   <div key={d.subject} className={cn(
                     "flex flex-col gap-2 p-3.5 rounded-[10px] bg-surface-2 border transition-all",
                     winner && dimWinner === winner ? "border-2" : "border-border",
                   )} style={{
                     borderColor: winner && dimWinner === winner ? (dimWinner === 'A' ? comp1.color : comp2.color) : undefined
                   }}>
                     <div className="flex justify-between items-center text-[13px] font-semibold text-ink-2">
                       <span>{d.subject}</span>
                       {dimWinner !== 'Tie' ? (
                         <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: dimWinner === 'A' ? `${comp1.color}20` : `${comp2.color}20`, color: dimWinner === 'A' ? comp1.color : comp2.color }}>
                           +{Math.abs(diff)} pts {dimWinner === 'A' ? 'Borrower A' : 'Borrower B'}
                         </span>
                       ) : (
                         <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-surface-3 text-muted">Tie</span>
                       )}
                     </div>
                     <div className="flex flex-col gap-1.5 mt-1">
                       <div className="flex gap-2 items-center">
                         <span className="text-[11px] w-5 font-bold text-right" style={{ color: comp1.color }}>{d.A}</span>
                         <div className="flex-1 h-1.5 bg-surface-3 rounded-full overflow-hidden flex">
                           <div className="h-full rounded-full" style={{ width: `${d.A}%`, background: comp1.color }} />
                         </div>
                       </div>
                       <div className="flex gap-2 items-center">
                         <span className="text-[11px] w-5 font-bold text-right" style={{ color: comp2.color }}>{d.B}</span>
                         <div className="flex-1 h-1.5 bg-surface-3 rounded-full overflow-hidden flex">
                           <div className="h-full rounded-full" style={{ width: `${d.B}%`, background: comp2.color }} />
                         </div>
                       </div>
                     </div>
                   </div>
                 )
               })}
            </div>
         </div>
      </div>
    </div>
  );
}
