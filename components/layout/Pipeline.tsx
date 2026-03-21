'use client';
import type { Screen } from '@/types';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

const STEPS = ['Upload', 'Extract', 'Research', 'Score', 'CAM'];

const SCREEN_STEP: Record<Screen, number> = {
  'ingestor': 1,
  'dashboard': 4,
  'cam': 5,
  'portfolio': 5,
  'early-warning': 5,
  'settings': 5,
  'comparison': 5,
  'audit': 5,
};

export default function Pipeline({ current }: { current: Screen }) {
  const activeStep = SCREEN_STEP[current];

  return (
    <div className="flex items-center px-7 bg-surface border-b border-border">
      {STEPS.map((step, i) => {
        const stepNum = i + 1;
        const done = stepNum < activeStep;
        const active = stepNum === activeStep;

        return (
          <div key={step} className="flex items-center">
            <div className={cn(
              'flex items-center gap-2 py-3 text-[12px] font-medium transition-all duration-300',
              done && 'text-brand-green',
              active && 'text-brand-blue font-semibold',
              !done && !active && 'text-faint'
            )}>
              <div className={cn(
                'w-[22px] h-[22px] rounded-full flex items-center justify-center text-[10px] font-bold transition-all duration-300 flex-shrink-0',
                done  && 'bg-brand-green text-white',
                active && 'bg-brand-blue text-white',
                !done && !active && 'bg-surface-3 border border-border-2 text-faint'
              )}>
                {done ? <Check size={11} strokeWidth={3} /> : stepNum}
              </div>
              {step}
            </div>
            {i < STEPS.length - 1 && (
              <div className="mx-4 flex-1 h-px bg-border-2 w-8" />
            )}
          </div>
        );
      })}
    </div>
  );
}
