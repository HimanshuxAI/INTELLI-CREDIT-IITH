'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import Pipeline from '@/components/layout/Pipeline';
import ProcessingOverlay from '@/components/ProcessingOverlay';
import Ingestor from '@/components/screens/Ingestor';
import Dashboard from '@/components/screens/Dashboard';
import CAM from '@/components/screens/CAM';
import Portfolio from '@/components/screens/Portfolio';
import EarlyWarning from '@/components/screens/EarlyWarning';
import Settings from '@/components/screens/Settings';
import AuditTrail from '@/components/screens/AuditTrail';
import Comparison from '@/components/screens/Comparison';
import type { Screen, ProcessingStep } from '@/types';
import type { AnalysisResult } from '@/lib/analysis-types';

export default function Home() {
  const [screen, setScreen] = useState<Screen>('ingestor');
  const [processing, setProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState<ProcessingStep>('uploading');
  const [streamTokens, setStreamTokens] = useState('');
  const [elapsed, setElapsed] = useState(0);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [uploadedRawFiles, setUploadedRawFiles] = useState<File[]>([]);
  const [extractionInfo, setExtractionInfo] = useState<any>(null);
  const [presentationMode, setPresentationMode] = useState(false);
  const [tourStep, setTourStep] = useState(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'p' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;
        setPresentationMode(p => !p);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    const hasSeenT = localStorage.getItem('intellicredit_tour');
    if (!hasSeenT) {
       setTimeout(() => setTourStep(1), 1000);
       localStorage.setItem('intellicredit_tour', 'true');
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    let t: NodeJS.Timeout;
    if (processing) {
      t = setInterval(() => setElapsed(e => e + 1), 1000);
    }
    return () => clearInterval(t!);
  }, [processing]);

  const showPipeline = ['ingestor', 'dashboard', 'cam'].includes(screen);

  const handleFilesChange = useCallback((files: File[]) => {
    setUploadedRawFiles(files);
  }, []);

  const handleRunAnalysis = useCallback(async () => {
    if (uploadedRawFiles.length === 0) {
      setAnalysisError('Please upload at least one file before running analysis.');
      return;
    }

    setProcessing(true);
    setProcessingStep('uploading');
    setStreamTokens('');
    setAnalysisError(null);
    setElapsed(0);
    setExtractionInfo(null);

    try {
      const formData = new FormData();
      uploadedRawFiles.forEach(file => {
        formData.append('files', file);
      });

      setProcessingStep('extracting');

      const headers: HeadersInit = {};
      const customKey = localStorage.getItem('gemini_key');
      if (customKey) {
        headers['X-API-Key'] = customKey.trim();
      }

      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers,
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Analysis failed');
      }

      // Read SSE stream
      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response stream');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6).trim();
          if (!data) continue;

          try {
            const event = JSON.parse(data);

            if (event.type === 'extraction') {
              setExtractionInfo(event);
              setProcessingStep('extracting');
            } else if (event.type === 'status') {
              setProcessingStep('ai_calling');
            } else if (event.type === 'token') {
              setProcessingStep('ai_streaming');
              setStreamTokens(prev => prev + event.token);
            } else if (event.type === 'complete') {
              setAnalysisResult(event.result as AnalysisResult);
              setProcessingStep('complete');
              setTimeout(() => {
                setProcessing(false);
                setScreen('dashboard');
              }, 800);
            } else if (event.type === 'error') {
              throw new Error(event.error);
            }
          } catch (parseErr: any) {
            if (parseErr.message && !parseErr.message.includes('JSON')) {
              throw parseErr;
            }
          }
        }
      }
    } catch (err: any) {
      console.error('Analysis failed:', err);
      setAnalysisError(err.message || 'AI analysis failed. Please try again.');
      setProcessing(false);
      setProcessingStep('error');
    }
  }, [uploadedRawFiles]);

  const handleTopbarAction = () => {
    if (screen === 'ingestor') handleRunAnalysis();
    else if (screen === 'dashboard') setScreen('cam');
    else if (screen === 'cam' || screen === 'comparison') alert('Exporting... (connect ReportLab in backend)');
    else if (screen === 'portfolio') setScreen('ingestor');
    else if (screen === 'early-warning') window.location.reload();
    else if (screen === 'audit') {
      // Trigger audit log CSV download
      const csv = 'Transaction ID,Timestamp,Company,Decision,Score\nTX-8921-A4F,2025-02-14 09:22:14,Rajasthan Textiles Ltd.,APPROVE,78\nTX-8920-B3E,2025-02-10 14:15:22,Bharat Auto Components,APPROVE,84\nTX-8919-C8D,2025-02-07 11:05:40,Deccan Agro Foods Ltd.,REFER,61';
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'audit_logs.csv'; a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-surface">
      {/* Guided Tour Overlay */}
      {tourStep > 0 && (
         <div className="fixed bottom-6 right-6 bg-ink text-white p-5 rounded-[12px] shadow-2xl z-[200] w-[320px] animate-fade-up border border-white/10">
           <div className="flex justify-between items-start mb-3">
             <div className="text-[14px] font-bold flex items-center gap-2">
               <div className="w-5 h-5 rounded-full bg-brand-blue flex items-center justify-center text-[11px]">{tourStep}</div>
               Guided Tour
             </div>
             <button onClick={() => setTourStep(0)} className="text-faint hover:text-white transition-colors"><X size={14}/></button>
           </div>
           <p className="text-[12.5px] text-white/80 mb-5 leading-relaxed min-h-[40px]">
             {tourStep === 1 && "Step 1: Welcome! Upload your borrower documents securely here in the dropzone."}
             {tourStep === 2 && "Step 2: Rule engines extract data, run deterministic scoring, and generate auditable results in seconds."}
             {tourStep === 3 && "Step 3: Review the CAM. Export it to PDF, simulate risks, or click Peer Compare."}
           </p>
           <button 
             className="w-full py-2.5 bg-brand-blue hover:bg-brand-blue-dk transition-colors rounded-[8px] text-[12px] font-bold shadow-sm"
             onClick={() => setTourStep(s => s >= 3 ? 0 : s + 1)}
           >
             {tourStep === 3 ? "Finish Tour" : "Next Step →"}
           </button>
         </div>
      )}

      {/* Presentation Mode Wrapper */}
      <div className={cn("flex flex-1 overflow-hidden transition-all duration-500", presentationMode ? "fixed inset-0 z-[150] bg-surface" : "")}>
        {!presentationMode && <Sidebar current={screen} onNavigate={setScreen} />}

        <div className="flex flex-col flex-1 min-w-0 overflow-hidden relative">
          {!presentationMode && (
            <Topbar
              current={screen}
              elapsed={elapsed}
              onAction={handleTopbarAction}
              onReset={() => { setScreen('ingestor'); setElapsed(0); setAnalysisResult(null); setStreamTokens(''); }}
            />
          )}

          {showPipeline && !presentationMode && <Pipeline current={screen} />}

        <div className="flex-1 overflow-hidden flex flex-col">
          {screen === 'ingestor' && (
            <Ingestor
              onRunAnalysis={handleRunAnalysis}
              onFilesChange={handleFilesChange}
              analysisError={analysisError}
            />
          )}
          {screen === 'dashboard' && (
            <Dashboard
              onGenerateCAM={() => setScreen('cam')}
              onCompare={() => setScreen('comparison')}
              onBack={() => setScreen('ingestor')}
              analysisResult={analysisResult}
            />
          )}
          {screen === 'cam' && (
            <CAM
              onBack={() => setScreen('dashboard')}
              analysisResult={analysisResult}
            />
          )}
          {screen === 'comparison' && (
             <Comparison onBack={() => setScreen('dashboard')} />
          )}
          {screen === 'portfolio' && <Portfolio onNewAppraisal={() => setScreen('ingestor')} />}
          {screen === 'early-warning' && <EarlyWarning />}
          {screen === 'settings' && <Settings />}
          {screen === 'audit' && <AuditTrail />}
        </div>
        </div>
      </div>

      <ProcessingOverlay
        active={processing}
        step={processingStep}
        extractionInfo={extractionInfo}
        streamTokens={streamTokens}
        elapsed={elapsed}
        fileCount={uploadedRawFiles.length}
        onComplete={() => {}}
      />
    </div>
  );
}
