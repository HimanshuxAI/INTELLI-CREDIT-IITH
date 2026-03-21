'use client';
import { useState, useRef, useCallback, useEffect } from 'react';
import { Upload, FileText, FileSpreadsheet, X, ChevronRight, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import type { UploadedFile, DataSource, OfficerNote } from '@/types';
import { INITIAL_FILES, DATA_SOURCES, OFFICER_NOTES } from '@/lib/data';
import { cn, parseUploadedFile, formatBytes } from '@/lib/utils';

interface IngestorProps {
  onRunAnalysis: () => void;
  onFilesChange?: (files: File[]) => void;
  analysisError?: string | null;
}

export default function Ingestor({ onRunAnalysis, onFilesChange, analysisError }: IngestorProps) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [rawFiles, setRawFiles] = useState<File[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [notes, setNotes] = useState(OFFICER_NOTES.map(n => n.text).join('\n\n'));
  const [parsing, setParsing] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Notify parent of raw files changes
  useEffect(() => {
    onFilesChange?.(rawFiles);
  }, [rawFiles, onFilesChange]);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    const dropped = Array.from(e.dataTransfer.files);
    await addFiles(dropped);
  }, []);

  const handleFileInput = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    await addFiles(Array.from(e.target.files));
  }, []);

  const addFiles = async (newFiles: File[]) => {
    // Store raw files for API submission
    setRawFiles(prev => [...prev, ...newFiles]);

    for (const f of newFiles) {
      const id = `uploaded-${Date.now()}-${Math.random()}`;
      const ext = f.name.split('.').pop()?.toUpperCase() as UploadedFile['type'] || 'PDF';
      const newFile: UploadedFile = {
        id, type: ext, name: f.name,
        meta: `${formatBytes(f.size)} · Uploaded just now`,
        size: f.size, status: 'Processing', progress: 0,
      };
      setFiles(prev => [...prev, newFile]);
      setParsing(id);

      // Animate progress
      let prog = 0;
      const interval = setInterval(() => {
        prog = Math.min(prog + Math.random() * 20, 90);
        setFiles(prev => prev.map(ff => ff.id === id ? { ...ff, progress: Math.round(prog) } : ff));
      }, 150);

      try {
        const parsed = await parseUploadedFile(f);
        clearInterval(interval);
        
        // Randomly assign a quality score for demo purposes
        const randQ = Math.floor(Math.random() * 40) + 60; // 60-99
        setFiles(prev => prev.map(ff => ff.id === id
          ? { ...ff, progress: 100, status: 'Extracted', quality: randQ, qualityLabel: `Scanned quality (${randQ}%)`, extractedData: { type: parsed.type, fields: parsed.fields as any, flags: parsed.flags }, meta: `${formatBytes(f.size)} · ${parsed.type} · ${parsed.flags[0] || 'Ready'}` }
          : ff));
      } catch {
        clearInterval(interval);
        setFiles(prev => prev.map(ff => ff.id === id ? { ...ff, status: 'Error', progress: 0 } : ff));
      }
      setParsing(null);
    }
  };

  const removeFile = (id: string) => {
    const fileToRemove = files.find(f => f.id === id);
    setFiles(prev => prev.filter(f => f.id !== id));
    if (fileToRemove) {
      setRawFiles(prev => prev.filter(f => f.name !== fileToRemove.name));
    }
  };

  const totalSize = files.reduce((sum, f) => sum + f.size, 0);
  const extracted = files.filter(f => f.status === 'Extracted').length;

  return (
    <div className="flex-1 overflow-y-auto">
      <PageHeader
        title="Document Ingestor"
        sub="Upload financial documents for AI-powered credit analysis"
        action={<button className="btn btn-ink gap-2" onClick={onRunAnalysis}><ChevronRight size={13}/>Run AI Analysis</button>}
      />

      <div className="p-7 grid grid-cols-[1fr_320px] gap-5 items-start">
        {/* Left */}
        <div className="flex flex-col gap-4">
          {/* Error message */}
          {analysisError && (
            <div className="flex gap-2 items-start p-3 bg-brand-red-lt border border-brand-red-md rounded-[7px] text-[12px] text-brand-red">
              <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
              {analysisError}
            </div>
          )}

          {/* Drop Zone */}
          <div
            className={cn(
              'border-2 border-dashed border-border-2 rounded-[12px] p-10 text-center cursor-pointer transition-all duration-200 bg-surface-2 hover:border-brand-blue hover:bg-brand-blue-lt',
              dragOver && 'border-brand-blue bg-brand-blue-lt'
            )}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input ref={fileInputRef} type="file" multiple className="hidden"
              accept=".pdf,.xlsx,.xls,.docx,.csv,.jpg,.png"
              onChange={handleFileInput}
            />
            <div className="w-12 h-12 rounded-[12px] bg-surface border border-border mx-auto mb-4 flex items-center justify-center shadow-sm">
              <Upload size={22} className="text-brand-blue" />
            </div>
            <h3 className="text-[15px] font-semibold text-ink-2 mb-1.5">Drop documents here or click to browse</h3>
            <p className="text-[12.5px] text-faint mb-4">Scanned PDFs · GST Returns · Bank Statements · Board Minutes · ITR</p>
            <div className="flex gap-2 justify-center flex-wrap">
              {['PDF','XLSX','DOCX','CSV','JPG'].map(t => (
                <span key={t} className={cn('tag', t==='PDF' ? 'tag-red' : t==='XLSX' ? 'tag-green' : 'tag-muted')}>{t}</span>
              ))}
            </div>
          </div>

          {/* File List */}
          {files.length > 0 && (
            <div className="card">
              <div className="card-header">
                <span className="card-label">Uploaded Files</span>
                <span className="text-[12px] font-semibold text-brand-green">{extracted}/{files.length} extracted · {formatBytes(totalSize)}</span>
              </div>
              <div className="p-3 flex flex-col gap-2">
                {files.map(f => <FileRow key={f.id} file={f} onRemove={removeFile} />)}
              </div>
            </div>
          )}
        </div>

        {/* Right */}
        <div className="flex flex-col gap-4">
          {/* Sources */}
          <div className="card">
            <div className="card-header"><span className="card-label">External Data Sources</span></div>
            <div className="p-3 grid grid-cols-2 gap-2">
              {DATA_SOURCES.map(s => <SourceCard key={s.id} source={s} />)}
            </div>
          </div>

          {/* Officer Notes */}
          <div className="card">
            <div className="card-header"><span className="card-label">Credit Officer Field Notes</span></div>
            <div className="p-3 flex flex-col gap-2">
              {OFFICER_NOTES.map((n, i) => (
                <div key={i} className="rounded-[7px] overflow-hidden" style={{ borderLeft:`3px solid ${n.color}`, background:'var(--surface-2)', padding:'9px 12px' }}>
                  <div className="text-[11px] font-bold text-ink-2 mb-1">{n.label}</div>
                  <div className="text-[11.5px] text-muted leading-relaxed">{n.text}</div>
                </div>
              ))}
              <div className="flex gap-2 items-start p-3 bg-brand-amber-lt border border-brand-amber-md rounded-[7px] text-[11.5px] text-brand-amber">
                <AlertCircle size={13} className="flex-shrink-0 mt-0.5" />
                AI will auto-adjust Conditions score based on 40% factory utilisation
              </div>
            </div>
          </div>

          <button className="btn btn-ink w-full justify-center py-3 text-[13px]" onClick={onRunAnalysis}>
            Run Full AI Analysis
          </button>
        </div>
      </div>
    </div>
  );
}

function FileRow({ file, onRemove }: { file: UploadedFile; onRemove: (id: string) => void }) {
  return (
    <div className="file-row">
      <span className={cn(
        'px-1.5 py-0.5 rounded-[4px] text-[9px] font-bold tracking-wide flex-shrink-0',
        file.type === 'PDF' ? 'bg-brand-red-lt text-brand-red' : 'bg-brand-green-lt text-brand-green'
      )}>{file.type}</span>
      <div className="flex-1 min-w-0">
        <div className="text-[12.5px] font-semibold text-ink-2 truncate">{file.name}</div>
        <div className="flex items-center gap-1.5 mt-[2px]">
          <div className="text-[11px] text-faint flex-shrink-0">{file.meta}</div>
          {file.quality && (
             <div className="flex items-center gap-1.5 text-[10.5px] font-semibold flex-shrink-0">
               <span className="text-border-2">•</span>
               <span className={cn(file.quality >= 90 ? 'text-brand-green' : file.quality >= 60 ? 'text-brand-amber' : 'text-brand-red')}>
                 {file.qualityLabel}
               </span>
             </div>
          )}
        </div>
        {file.status === 'Processing' && (
          <div className="h-1 bg-border rounded-full mt-2 overflow-hidden w-full">
            <div className="h-full bg-brand-blue rounded-full transition-all duration-300" style={{ width:`${file.progress}%` }} />
          </div>
        )}
        {file.extractedData && file.extractedData.flags.length > 0 && (
          <div className="flex gap-1 mt-1 flex-wrap">
            {file.extractedData.flags.slice(0,2).map(flag => (
              <span key={flag} className="tag tag-amber text-[9.5px]">{flag}</span>
            ))}
          </div>
        )}
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {file.status === 'Extracted' && <CheckCircle size={14} className="text-brand-green" />}
        {file.status === 'Processing' && <div className="w-3.5 h-3.5 border-2 border-brand-blue border-t-transparent rounded-full animate-spin" />}
        {file.status === 'Queued' && <Clock size={14} className="text-faint" />}
        {file.status === 'Error' && <AlertCircle size={14} className="text-brand-red" />}
        <span className={cn('tag text-[10.5px]',
          file.status === 'Extracted' ? 'tag-green' :
          file.status === 'Processing' ? 'tag-blue' :
          file.status === 'Error' ? 'tag-red' : 'tag-muted'
        )}>{file.status}</span>
        <button onClick={() => onRemove(file.id)} className="text-faint hover:text-brand-red transition-colors">
          <X size={13} />
        </button>
      </div>
    </div>
  );
}

function SourceCard({ source }: { source: DataSource }) {
  return (
    <div className={cn(
      'flex items-center gap-2.5 p-3 rounded-[7px] border transition-all duration-150',
      source.status === 'live' ? 'bg-brand-green-lt border-brand-green-md' :
      source.status === 'config' ? 'bg-brand-amber-lt border-brand-amber-md' :
      'bg-surface-2 border-border'
    )}>
      <div className="text-[16px]">{source.icon}</div>
      <div className="min-w-0 flex-1">
        <div className="text-[12px] font-semibold text-ink-2 truncate">{source.name}</div>
        <div className="text-[10.5px] text-faint truncate">{source.subtitle}</div>
      </div>
      <div className={cn('w-2 h-2 rounded-full flex-shrink-0',
        source.status === 'live' ? 'bg-brand-green' :
        source.status === 'config' ? 'bg-brand-amber' : 'bg-border-3'
      )} />
    </div>
  );
}

function PageHeader({ title, sub, action }: { title: string; sub: string; action?: React.ReactNode }) {
  return (
    <div className="px-7 py-5 bg-surface border-b border-border flex items-start justify-between">
      <div>
        <h1 className="font-display text-[26px] leading-tight text-ink mb-1">{title}</h1>
        <p className="text-[12.5px] text-muted">{sub}</p>
      </div>
      {action && <div className="pt-1">{action}</div>}
    </div>
  );
}
