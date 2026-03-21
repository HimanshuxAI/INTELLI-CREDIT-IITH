'use client';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import type { ProcessingStep } from '@/types';

const STEP_LABELS: Record<ProcessingStep, string> = {
  uploading: 'Uploading files to server...',
  extracting: 'Extracting text from PDFs & spreadsheets...',
  ai_calling: 'Sending documents to Claude for analysis...',
  ai_streaming: 'Claude is reading and scoring your documents...',
  complete: 'Analysis complete — opening dashboard',
  error: 'Analysis failed',
};

const STEPS = [
  { id: 'upload', label: 'Uploading documents to server' },
  { id: 'extract', label: 'Extracting text — PDF parsing + XLSX reader' },
  { id: 'ai', label: 'Claude analysing documents + scoring 5 C\'s' },
  { id: 'score', label: 'Computing weighted scores + risk signals' },
  { id: 'cam', label: 'Generating CAM rationale' },
];

function getStepIndex(step: ProcessingStep): number {
  switch (step) {
    case 'uploading': return 0;
    case 'extracting': return 1;
    case 'ai_calling': return 2;
    case 'ai_streaming': return 3;
    case 'complete': return 5;
    default: return -1;
  }
}

interface ProcessingOverlayProps {
  active: boolean;
  step?: ProcessingStep;
  extractionInfo?: any;
  streamTokens?: string;
  elapsed?: number;
  fileCount?: number;
  onComplete: () => void;
}

export default function ProcessingOverlay({ active, step = 'uploading', extractionInfo, streamTokens, elapsed = 0, fileCount = 0, onComplete }: ProcessingOverlayProps) {
  if (!active) return null;

  const currentIdx = getStepIndex(step);
  const m = String(Math.floor(elapsed / 60)).padStart(2, '0');
  const s = String(elapsed % 60).padStart(2, '0');

  // Show streaming tokens indicator
  const tokenCount = streamTokens ? streamTokens.length : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background:'rgba(246,245,242,0.92)', backdropFilter:'blur(6px)' }}>
      <div className="bg-surface border border-border rounded-[16px] shadow-xl p-10 w-[480px] flex flex-col items-center gap-6">
        {/* Spinner */}
        <div className="relative">
          <div className="w-20 h-20 rounded-full border-[3px] border-border" />
          <div className="absolute inset-0 w-20 h-20 rounded-full border-[3px] border-transparent border-t-brand-blue animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[11px] font-mono-ic font-semibold text-muted">{m}:{s}</span>
          </div>
        </div>

        {/* Title */}
        <div className="text-center">
          <h2 className="font-display text-[22px] text-ink mb-1.5">
            {step === 'complete' ? 'Analysis Complete' : 'Analysing Documents'}
          </h2>
          <p className="text-[13px] text-muted">
            {STEP_LABELS[step]}
          </p>
        </div>

        {/* Extraction info */}
        {extractionInfo && (
          <div className="w-full px-3 py-2 bg-brand-green-lt border border-brand-green-md rounded-[8px] text-[12px] text-brand-green text-center">
            ✓ Extracted text from {extractionInfo.files?.filter((f: any) => f.extracted).length || 0}/{extractionInfo.files?.length || 0} files · {extractionInfo.totalPages || 0} pages detected
          </div>
        )}

        {/* Steps */}
        <div className="w-full flex flex-col gap-2">
          {STEPS.map((s, i) => {
            const done = i < currentIdx;
            const running = i === currentIdx || (i === 2 && step === 'ai_streaming');
            const isAIStep = i >= 2 && step === 'ai_streaming';
            return (
              <div key={s.id} className={cn('proc-step', running && 'running', done && 'done')}>
                <div className={cn(
                  'w-[18px] h-[18px] rounded-full flex-shrink-0 flex items-center justify-center text-[9px] font-bold',
                  done ? 'bg-brand-green text-white' :
                  running ? 'bg-brand-blue text-white' :
                  'bg-surface-3 text-faint'
                )}>
                  {done ? '✓' : running ? <div className="w-2.5 h-2.5 border border-white border-t-transparent rounded-full animate-spin"/> : i+1}
                </div>
                <span>{s.label}</span>
              </div>
            );
          })}
        </div>

        {/* Streaming indicator */}
        {step === 'ai_streaming' && tokenCount > 0 && (
          <div className="w-full">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-semibold text-brand-blue">AI is writing analysis...</span>
              <span className="text-[10px] font-mono-ic text-faint">{tokenCount} chars</span>
            </div>
            <div className="h-1.5 bg-border rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-blue rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, (tokenCount / 3000) * 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Done message */}
        {step === 'complete' && (
          <div className="flex items-center gap-2 text-[13px] font-semibold text-brand-green animate-fade-in">
            ✓ Analysis complete — opening dashboard
          </div>
        )}

        {/* File count */}
        <div className="text-[11px] text-faint text-center">
          {fileCount} file{fileCount !== 1 ? 's' : ''} being processed · Real AI analysis via Claude
        </div>
      </div>
    </div>
  );
}
