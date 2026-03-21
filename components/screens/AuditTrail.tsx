'use client';
import { useState } from 'react';
import { ShieldCheck, Download, Search, FileText, Fingerprint, ExternalLink, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AuditTrail() {
  const [searchQuery, setSearchQuery] = useState('');
  const [exportState, setExportState] = useState<'idle' | 'loading' | 'done'>('idle');

  const auditLogs = [
    {
       txId: 'TX-8921-A4F',
       timestamp: '2025-02-14 09:22:14 IST',
       company: 'Rajasthan Textiles Ltd.',
       documents: ['raj_tex_fy24.pdf (SHA256: 8f4e2...9a12)', 'gst_returns.xlsx (SHA256: 3c2b1...8d4e)'],
       aiModel: 'Claude 3.5 Sonnet (v2024-10-22)',
       officer: 'Himanshu S.',
       decision: 'APPROVE',
       score: 78
    },
    {
       txId: 'TX-8920-B3E',
       timestamp: '2025-02-10 14:15:22 IST',
       company: 'Bharat Auto Components Pvt. Ltd.',
       documents: ['bharat_auto_financials.pdf (SHA256: e57d...1bc9)'],
       aiModel: 'Claude 3.5 Sonnet (v2024-10-22)',
       officer: 'Priya M.',
       decision: 'APPROVE',
       score: 84
    },
    {
       txId: 'TX-8919-C8D',
       timestamp: '2025-02-07 11:05:40 IST',
       company: 'Deccan Agro Foods Ltd.',
       documents: ['deccan_agro_q3.xlsx (SHA256: 7a82...4f31)'],
       aiModel: 'Claude 3.5 Sonnet (v2024-10-22)',
       officer: 'Rahul K.',
       decision: 'REFER',
       score: 61
    },
  ];

  const filteredLogs = auditLogs.filter(log => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return log.txId.toLowerCase().includes(q) || log.company.toLowerCase().includes(q) || log.officer.toLowerCase().includes(q);
  });

  const handleExportCompliance = () => {
    setExportState('loading');
    setTimeout(() => {
      // Generate CSV
      const headers = ['Transaction ID', 'Timestamp', 'Company', 'Officer', 'AI Model', 'Decision', 'Score', 'Document Hashes'];
      const rows = auditLogs.map(log => [
        log.txId,
        log.timestamp,
        log.company,
        log.officer,
        log.aiModel,
        log.decision,
        String(log.score),
        log.documents.join(' | ')
      ]);
      const csvContent = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `IntelliCredit_Compliance_Report_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      setExportState('done');
      setTimeout(() => setExportState('idle'), 2500);
    }, 800);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-surface">
      <div className="px-7 py-5 bg-surface border-b border-border flex items-center justify-between">
         <div>
           <div className="flex items-center gap-2 mb-1">
             <ShieldCheck className="text-brand-green" size={18} />
             <h1 className="font-display text-[26px] leading-tight text-ink">Enterprise Audit Trail</h1>
           </div>
           <p className="text-[12.5px] text-muted">Immutable decision logs with document hashes for RBI & Internal Compliance</p>
         </div>
         <button
           className={cn('btn gap-2 shadow-sm', exportState === 'done' ? 'btn-green' : 'btn-primary')}
           onClick={handleExportCompliance}
           disabled={exportState === 'loading'}
         >
           {exportState === 'loading' ? (
             <><div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Exporting...</>
           ) : exportState === 'done' ? (
             <><Check size={14}/> Report Downloaded</>
           ) : (
             <><Download size={14}/> Export Compliance Report</>
           )}
         </button>
      </div>

      <div className="p-7 max-w-6xl mx-auto flex flex-col gap-6">
        
        {/* Metric Overview */}
        <div className="grid grid-cols-4 gap-4 animate-fade-up">
          <div className="card p-4">
            <div className="text-[11px] font-bold text-muted uppercase tracking-wider mb-2">Immutable Logs</div>
            <div className="font-display text-[28px] text-ink flex items-center gap-2">
              <Fingerprint size={20} className="text-brand-purple" /> 1,204
            </div>
          </div>
          <div className="card p-4">
            <div className="text-[11px] font-bold text-muted uppercase tracking-wider mb-2">Automated Decisions</div>
            <div className="font-display text-[28px] text-brand-green flex items-center gap-2">
              94.2%
            </div>
          </div>
          <div className="card p-4">
            <div className="text-[11px] font-bold text-muted uppercase tracking-wider mb-2">Core AI Model Base</div>
            <div className="font-display text-[16px] text-ink leading-tight mt-1">
              Claude 3.5 Sonnet<br/>
              <span className="text-[11px] font-normal text-faint">Locked ver. 2024-10-22</span>
            </div>
          </div>
          <div className="card p-4 border border-brand-green-md bg-brand-green-lt justify-center">
            <div className="flex items-center gap-2">
               <ShieldCheck className="text-brand-green" size={24} />
               <div>
                 <div className="text-[14px] font-bold text-brand-green">RBI Compliant</div>
                 <div className="text-[11px] text-brand-green opacity-80">All hashes verified</div>
               </div>
            </div>
          </div>
        </div>

        {/* Audit Log Table */}
        <div className="card animate-fade-up animate-delay-1">
          <div className="card-header gap-3 p-4 border-b border-border">
            <span className="card-label">Cryptographic Decision Logs</span>
            <div className="flex items-center gap-2 ml-auto">
              <div className="relative">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-faint" />
                <input
                  className="pl-8 pr-3 py-1.5 text-[12px] bg-surface-2 border border-border rounded-[6px] outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue-md w-56 transition-all"
                  placeholder="Search TX-ID or Company..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-surface-2 border-b border-border">
                <tr>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold text-faint uppercase tracking-wider">Transaction ID & Time</th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold text-faint uppercase tracking-wider">Entity & Officer</th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold text-faint uppercase tracking-wider">Document Hashes (SHA-256)</th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold text-faint uppercase tracking-wider">Model Config</th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold text-faint uppercase tracking-wider">Decision Outcome</th>
                </tr>
              </thead>
              <tbody className="text-[12.5px]">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-muted text-[13px]">
                      No audit logs match "{searchQuery}"
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => (
                    <tr key={log.txId} className="border-b border-surface-3 hover:bg-surface-2 transition-colors">
                      <td className="px-5 py-4 align-top">
                        <div className="font-mono-ic text-brand-purple font-semibold text-[12px] flex items-center gap-1.5">
                          <Fingerprint size={12} /> {log.txId}
                        </div>
                        <div className="text-[11px] text-faint mt-1 whitespace-nowrap">{log.timestamp}</div>
                      </td>
                      <td className="px-5 py-4 align-top">
                        <div className="font-semibold text-ink-2">{log.company}</div>
                        <div className="text-[11.5px] text-muted mt-0.5">Officer: {log.officer}</div>
                      </td>
                      <td className="px-5 py-4 align-top max-w-[280px]">
                        <div className="flex flex-col gap-1.5">
                          {log.documents.map((doc, idx) => (
                            <div key={idx} className="flex items-start gap-1.5 text-[11px] text-muted bg-surface rounded p-1.5 border border-surface-3">
                              <FileText size={12} className="text-faint flex-shrink-0 mt-0.5" />
                              <span className="font-mono-ic leading-relaxed break-all">{doc}</span>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="px-5 py-4 align-top">
                        <div className="inline-flex items-center gap-1.5 bg-surface border border-border px-2 py-1 rounded text-[11px] text-muted">
                          <ExternalLink size={10} /> {log.aiModel}
                        </div>
                      </td>
                      <td className="px-5 py-4 align-top">
                        <div className="flex items-center justify-between w-full">
                          <span className={cn(
                            'px-2.5 py-1 rounded-[6px] text-[11px] font-bold tracking-wide',
                            log.decision === 'APPROVE' ? 'bg-brand-green-lt text-brand-green border border-brand-green-md' :
                            log.decision === 'REFER' ? 'bg-brand-amber-lt text-brand-amber border border-brand-amber-md' :
                            'bg-brand-red-lt text-brand-red border border-brand-red-md'
                          )}>
                            {log.decision}
                          </span>
                          <span className="font-display text-[18px] text-ink">{log.score}</span>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
