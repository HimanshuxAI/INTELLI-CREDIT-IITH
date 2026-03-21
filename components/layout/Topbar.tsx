import { useState, useEffect } from 'react';
import type { Screen } from '@/types';
import { cn } from '@/lib/utils';
import { Zap } from 'lucide-react';

const RBI_CIRCULARS = [
  "RBI/2024-25/87: Tighter NBFC lending norms for Textile sector exposure",
  "RBI/2024-25/92: Enhancements to MSME TreDS Discounting platform",
  "RBI/2024-25/104: Revised limits for unhedged foreign currency exposure",
  "RBI/2024-25/112: Climate risk stress testing framework draft for SCBs",
  "RBI/2024-25/119: Master Direction on Fraud Risk Management updated",
];

interface TopbarProps {
  current: Screen;
  elapsed: number;
  onAction: () => void;
  onReset: () => void;
}

const LABELS: Record<Screen, string> = {
  'ingestor': 'New Appraisal',
  'dashboard': 'Analysis',
  'cam': 'CAM Output',
  'portfolio': 'All Appraisals',
  'early-warning': 'Early Warnings',
  'settings': 'Settings',
  'comparison': 'Peer Comparison',
  'audit': 'Enterprise Audit',
};

const ACTIONS: Record<Screen, string> = {
  'ingestor': 'Run Analysis',
  'dashboard': 'Generate CAM →',
  'cam': 'Export',
  'portfolio': 'New Appraisal',
  'early-warning': 'Refresh',
  'settings': 'Save',
  'comparison': 'Auto-Select',
  'audit': 'Download Logs',
};

export default function Topbar({ current, elapsed, onAction, onReset }: TopbarProps) {
  const m = String(Math.floor(elapsed / 60)).padStart(2, '0');
  const s = String(elapsed % 60).padStart(2, '0');

  const [pulseIdx, setPulseIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => {
      setPulseIdx(i => (i + 1) % RBI_CIRCULARS.length);
    }, 5000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="flex flex-col flex-shrink-0 z-10 w-full relative">
      {/* Regulatory Pulse Ticker */}
      <div className="h-8 bg-ink border-b border-white/10 flex items-center px-6 gap-4 text-[11px] font-mono-ic uppercase tracking-wider overflow-hidden relative shadow-sm">
        <div className="flex items-center gap-2 flex-shrink-0 z-10 bg-ink pr-2">
          <Zap size={12} className="text-brand-amber animate-pulse" />
          <span className="text-white/60 font-bold">Regulatory Pulse</span>
        </div>
        <div className="flex-1 relative h-full flex items-center overflow-hidden">
           {RBI_CIRCULARS.map((text, i) => (
             <div 
               key={i} 
               className={cn(
                 "absolute left-0 right-0 flex items-center transition-all duration-700 ease-in-out",
                 i === pulseIdx ? "opacity-100 translate-y-0" : "opacity-0 translate-y-full"
               )}
             >
               <span className="truncate text-white/90">{text}</span>
             </div>
           ))}
        </div>
        <div className="text-brand-green ml-auto pl-4 border-l border-white/20 z-10 bg-ink flex-shrink-0 font-bold flex items-center gap-1.5 animate-pulse">
          <div className="w-1.5 h-1.5 rounded-full bg-brand-green" />
          Live RBI Feed
        </div>
      </div>

      <header className="h-[52px] bg-surface border-b border-border flex items-center px-6 gap-3">
        {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-[13px] text-faint">
        <span>IntelliCredit</span>
        <span className="opacity-40">/</span>
        <span className="font-semibold text-ink">{LABELS[current]}</span>
      </div>

      <div className="ml-auto flex items-center gap-2">
        {/* Live pill */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-brand-green-lt border border-brand-green-md rounded-full text-[11px] font-semibold text-brand-green">
          <span className="w-1.5 h-1.5 rounded-full bg-brand-green" style={{ animation:'pulseDot 2s infinite' }} />
          System Live
        </div>

        {/* Timer */}
        <div className="font-mono-ic text-[12px] font-medium text-muted bg-surface-2 border border-border px-2.5 py-1 rounded-[6px]">
          {m}:{s}
        </div>

        <button className="btn btn-ghost text-[12.5px]" onClick={onReset}>↺ Reset</button>
        <button className="btn btn-primary text-[12.5px]" onClick={onAction}>{ACTIONS[current]}</button>
      </div>
      </header>
    </div>
  );
}
