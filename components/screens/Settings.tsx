'use client';
import { useState, useEffect } from 'react';
import { Save, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Settings() {
  const [saved, setSaved] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [weights, setWeights] = useState({ Character:20, Capacity:25, Capital:20, Collateral:20, Conditions:15 });
  const [prefs, setPrefs] = useState([
    { label:'Auto-run research agent on upload', active: true },
    { label:'Apply officer notes to scoring', active: true },
    { label:'Flag GSTR mismatches above 5%', active: true },
    { label:'Enable early warning notifications', active: true },
    { label:'Auto-generate CAM after scoring', active: false },
  ]);

  const total = Object.values(weights).reduce((a,b) => a+b, 0);

  useEffect(() => {
    setApiKey(localStorage.getItem('openrouter_key') || '');
  }, []);

  const handleSave = () => {
    localStorage.setItem('openrouter_key', apiKey.trim());
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const togglePref = (idx: number) => {
    setPrefs(prev => prev.map((p, i) => i === idx ? { ...p, active: !p.active } : p));
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="px-7 py-5 bg-surface border-b border-border flex items-start justify-between">
        <div>
          <h1 className="font-display text-[26px] leading-tight text-ink mb-1">Settings</h1>
          <p className="text-[12.5px] text-muted">Configure scoring model, API connections, and preferences</p>
        </div>
        <button className={cn('btn mt-1 gap-2', saved ? 'btn-green' : 'btn-primary')} onClick={handleSave}>
          {saved ? <><Check size={13}/>Saved</> : <><Save size={13}/>Save Changes</>}
        </button>
      </div>

      <div className="p-7 grid grid-cols-[1fr_1fr] gap-6">
        {/* Scoring weights */}
        <div className="flex flex-col gap-4">
          <div className="card">
            <div className="card-header">
              <span className="card-label">5 C's Scoring Weights</span>
              <span className={cn('tag text-[11px]', total===100?'tag-green':'tag-red')}>Total: {total}%</span>
            </div>
            <div className="p-4 flex flex-col gap-4">
              {Object.entries(weights).map(([key, val]) => (
                <div key={key}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[13px] font-semibold text-ink-2">{key}</span>
                    <span className="text-[13px] font-bold text-brand-blue font-mono-ic">{val}%</span>
                  </div>
                  <input type="range" min={0} max={50} value={val}
                    onChange={e => setWeights(prev => ({ ...prev, [key]: parseInt(e.target.value) }))}
                    className="w-full accent-blue-600"
                  />
                </div>
              ))}
              {total !== 100 && (
                <div className="p-3 bg-brand-red-lt border border-brand-red-md rounded-[7px] text-[12px] text-brand-red">
                  Weights must sum to 100%. Currently: {total}%
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-header"><span className="card-label">Decision Thresholds</span></div>
            <div className="p-4 flex flex-col gap-3">
              {[['Approve threshold','≥ 75 / 100'],['Refer to committee','60 – 74 / 100'],['Reject threshold','< 60 / 100']].map(([l,v]) => (
                <div key={l} className="flex justify-between items-center py-2 border-b border-surface-3 last:border-0">
                  <span className="text-[12.5px] text-muted">{l}</span>
                  <span className="text-[12.5px] font-bold text-ink-2 font-mono-ic">{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* API + preferences */}
        <div className="flex flex-col gap-4">
          <div className="card">
            <div className="card-header"><span className="card-label">API Connections</span></div>
            <div className="p-4 flex flex-col gap-3">
              <div className="py-2 border-b border-surface-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[12.5px] font-semibold text-ink-2">OpenRouter API (BYOK)</span>
                  <span className={cn('tag text-[10.5px]', apiKey ? 'tag-green' : 'tag-amber')}>
                    {apiKey ? 'Configured LOCALLY' : 'Using .env fallback'}
                  </span>
                </div>
                <input 
                  type="password" 
                  placeholder="sk-or-v1-..." 
                  className="w-full bg-surface-2 border border-border rounded-[6px] px-3 py-1.5 text-[12px] font-mono-ic focus:outline-none focus:border-brand-blue"
                  value={apiKey}
                  onChange={e => setApiKey(e.target.value)}
                />
                <p className="text-[11px] text-muted mt-1.5 leading-relaxed">
                  Saves securely to your browser. Overrides the server environment key.
                </p>
              </div>
              {[
                { name:'MCA21 Portal', key:'Configured via OAuth', status:'Connected' },
                { name:'eCourts API', key:'Configured via Gov API', status:'Connected' },
                { name:'CIBIL Commercial', key:'Not configured', status:'Pending' },
                { name:'Databricks', key:'databricks://...cluster', status:'Connected' },
              ].map(api => (
                <div key={api.name} className="flex items-center gap-3 py-2 border-b border-surface-3 last:border-0">
                  <div className="flex-1">
                    <div className="text-[12.5px] font-semibold text-ink-2">{api.name}</div>
                    <div className="text-[11px] text-faint font-mono-ic">{api.key}</div>
                  </div>
                  <span className={cn('tag text-[10.5px]', api.status==='Connected'?'tag-green':'tag-amber')}>
                    {api.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card-header"><span className="card-label">Preferences</span></div>
            <div className="p-4 flex flex-col gap-3">
              {prefs.map((pref, idx) => (
                <div key={pref.label} className="flex items-center justify-between py-1.5">
                  <span className="text-[12.5px] text-ink-2">{pref.label}</span>
                  <button
                    onClick={() => togglePref(idx)}
                    className={cn('w-9 h-5 rounded-full relative cursor-pointer transition-colors duration-200', pref.active ? 'bg-brand-blue' : 'bg-border-2')}
                  >
                    <div className={cn('absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-200', pref.active ? 'right-0.5' : 'left-0.5')} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
