'use client';
import { useState, useEffect } from 'react';
import type { Screen } from '@/types';
import {
  FilePlus2, BarChart3, FileText, Layers, AlertTriangle,
  Settings, ChevronRight, Zap, ShieldCheck
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  current: Screen;
  onNavigate: (s: Screen) => void;
}

const NAV_TOP = [
  { id: 'ingestor' as Screen, label: 'New Appraisal', icon: FilePlus2, badge: 'Live' },
  { id: 'dashboard' as Screen, label: 'Analysis', icon: BarChart3 },
  { id: 'cam' as Screen, label: 'CAM Output', icon: FileText },
];
const NAV_PORTFOLIO = [
  { id: 'portfolio' as Screen, label: 'All Appraisals', icon: Layers },
  { id: 'early-warning' as Screen, label: 'Early Warnings', icon: AlertTriangle, badge: '3' },
];
const NAV_SYS = [
  { id: 'settings' as Screen, label: 'Settings', icon: Settings },
  { id: 'audit' as Screen, label: 'Audit Trail', icon: ShieldCheck },
];

export default function Sidebar({ current, onNavigate }: SidebarProps) {
  return (
    <aside className="w-[224px] flex-shrink-0 bg-surface border-r border-border flex flex-col overflow-y-auto">
      {/* Logo */}
      <div className="px-4 py-[17px] border-b border-border flex items-center gap-2.5">
        <div className="w-8 h-8 bg-ink rounded-[8px] flex items-center justify-center flex-shrink-0">
          <span className="text-[11px] font-bold text-white tracking-tight">IC</span>
        </div>
        <div className="leading-tight">
          <div className="text-[13.5px] font-semibold text-ink">
            Intelli<span className="text-brand-blue">Credit</span>
          </div>
          <div className="text-[10px] text-faint">AI Credit Decisioning</div>
        </div>
      </div>

      {/* Nav sections */}
      <NavSection label="Appraisal" items={NAV_TOP} current={current} onNavigate={onNavigate} />
      <div className="mx-3 my-1 h-px bg-border" />
      <NavSection label="Portfolio" items={NAV_PORTFOLIO} current={current} onNavigate={onNavigate} />
      <div className="mx-3 my-1 h-px bg-border" />
      <NavSection label="System" items={NAV_SYS} current={current} onNavigate={onNavigate} />

      {/* Footer Wrapper - Stacks User Profile and Time Saved cleanly */}
      <div className="mt-auto flex flex-col shrink-0">
        <div className="border-t border-border px-4 py-3 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-ink flex items-center justify-center flex-shrink-0 shadow-sm">
            <span className="text-[11px] font-bold text-white">HS</span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[12.5px] font-semibold text-ink-2 truncate leading-tight">Himanshu S.</div>
            <div className="text-[11px] text-faint truncate">Credit Officer</div>
          </div>
          <div
            className="w-2 h-2 rounded-full bg-brand-green flex-shrink-0"
            style={{ animation: 'pulseDot 2s infinite' }}
          />
        </div>

        <div className="px-4 py-4 border-t border-border bg-surface-2">
          <div className="bg-surface rounded-[8px] p-3 text-center border border-border shadow-sm">
            <div className="text-[10px] text-faint font-bold uppercase tracking-wider mb-2 flex items-center justify-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-brand-green animate-pulse" />
              Time Saved vs Manual
            </div>
            <div className="font-mono-ic text-[14px] font-bold text-ink tracking-widest leading-none mb-1.5">
               <TimeSavedCounter />
            </div>
            <div className="text-[10px] text-brand-green font-semibold italic mt-2 bg-brand-green-lt py-1.5 rounded-[4px] border border-brand-green-md">
              Across 2,104 Appraisals
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

function TimeSavedCounter() {
  const [seconds, setSeconds] = useState(47 * 60 + 12);
  useEffect(() => {
    const t = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const hrs = 812 + Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  return (
    <>{hrs}h : {mins.toString().padStart(2, '0')}m : {secs.toString().padStart(2, '0')}s</>
  );
}

function NavSection({ label, items, current, onNavigate }: {
  label: string;
  items: typeof NAV_TOP;
  current: Screen;
  onNavigate: (s: Screen) => void;
}) {
  return (
    <div className="px-2 py-2">
      <div className="text-[10px] font-semibold text-faint uppercase tracking-[0.06em] px-2 mb-1">{label}</div>
      {items.map(item => {
        const Icon = item.icon;
        const active = current === item.id;
        return (
          <div
            key={item.id}
            className={cn('nav-item', active && 'active')}
            onClick={() => onNavigate(item.id)}
          >
            <Icon size={14} className="flex-shrink-0 opacity-70" />
            <span className="flex-1 truncate">{item.label}</span>
            {item.badge && (
              <span className={cn(
                'text-[10px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0',
                item.badge === 'Live'
                  ? 'bg-brand-green-lt text-brand-green'
                  : 'bg-brand-red-lt text-brand-red'
              )}>
                {item.badge}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
