import React, { useState } from 'react';
import { api } from '../api';

interface DemoControlsProps {
  onFaultInjected: () => void;
  onCleared: () => void;
}

const FAULTS = [
  { id: 'wt07_bearing',          label: '⚡ Inject WT-07 Bearing Fault',          color: 'bg-red-800/60 border-red-700/50 hover:bg-red-700/60 text-red-300' },
  { id: 'solar_underperformance', label: '☀️ Simulate Solar Underperformance',      color: 'bg-amber-800/60 border-amber-700/50 hover:bg-amber-700/60 text-amber-300' },
  { id: 'severe_weather',         label: '🌩️ Simulate Severe Weather',              color: 'bg-blue-800/60 border-blue-700/50 hover:bg-blue-700/60 text-blue-300' },
  { id: 'grid_constraint',        label: '⚙️ Simulate Grid Constraint',             color: 'bg-orange-800/60 border-orange-700/50 hover:bg-orange-700/60 text-orange-300' },
  { id: 'sensor_failure',         label: '📡 Simulate Sensor Failure',              color: 'bg-purple-800/60 border-purple-700/50 hover:bg-purple-700/60 text-purple-300' },
];

export default function DemoControls({ onFaultInjected, onCleared }: DemoControlsProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [lastResult, setLastResult] = useState<string | null>(null);

  const inject = async (faultId: string) => {
    setLoading(faultId);
    setLastResult(null);
    try {
      const res = await api.injectFault(faultId);
      const alerts = res.immediate_tick?.critical_alerts || 0;
      const anomalies = res.immediate_tick?.anomaly_count || 0;
      setLastResult(`✅ ${faultId.replace(/_/g, ' ')} injected — ${alerts} critical alerts, ${anomalies} anomalies detected`);
      onFaultInjected();
    } catch (e: any) {
      setLastResult(`❌ Error: ${e.message}`);
    } finally {
      setLoading(null);
    }
  };

  const clear = async () => {
    setLoading('clear');
    try {
      await api.clearFaults();
      setLastResult('✅ All faults cleared — simulation reset');
      onCleared();
    } catch (e: any) {
      setLastResult(`❌ Error: ${e.message}`);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="bg-slate-900/60 border-b border-slate-800">
      <div className="max-w-screen-2xl mx-auto px-4">
        <div className="flex items-center gap-3 py-2">
          <button
            onClick={() => setExpanded(v => !v)}
            className="text-xs font-semibold text-slate-400 hover:text-white flex items-center gap-1"
          >
            🎮 DEMO CONTROL CENTER {expanded ? '▲' : '▼'}
          </button>

          {!expanded && (
            <div className="flex gap-2 overflow-x-auto">
              {FAULTS.slice(0, 2).map(f => (
                <button
                  key={f.id}
                  onClick={() => inject(f.id)}
                  disabled={loading !== null}
                  className={`shrink-0 text-xs px-3 py-1 rounded border font-medium transition-colors ${f.color} disabled:opacity-50`}
                >
                  {loading === f.id ? '⏳' : f.label}
                </button>
              ))}
              <button
                onClick={clear}
                disabled={loading !== null}
                className="shrink-0 text-xs px-3 py-1 rounded border border-slate-600 bg-slate-700 text-slate-300 hover:bg-slate-600 disabled:opacity-50"
              >
                {loading === 'clear' ? '⏳' : '↺ Reset'}
              </button>
            </div>
          )}

          {lastResult && (
            <span className="text-xs text-slate-400 truncate max-w-xs">{lastResult}</span>
          )}
        </div>

        {expanded && (
          <div className="pb-3">
            <div className="flex flex-wrap gap-2 mb-2">
              {FAULTS.map(f => (
                <button
                  key={f.id}
                  onClick={() => inject(f.id)}
                  disabled={loading !== null}
                  className={`text-xs px-3 py-1.5 rounded border font-medium transition-colors ${f.color} disabled:opacity-50`}
                >
                  {loading === f.id ? '⏳ Injecting…' : f.label}
                </button>
              ))}
              <button
                onClick={clear}
                disabled={loading !== null}
                className="text-xs px-3 py-1.5 rounded border border-slate-600 bg-slate-700 text-slate-300 hover:bg-slate-600 disabled:opacity-50"
              >
                {loading === 'clear' ? '⏳ Resetting…' : '↺ Reset All Faults'}
              </button>
            </div>
            {lastResult && <div className="text-xs text-slate-300">{lastResult}</div>}
            <div className="text-xs text-slate-600 mt-1">
              These are explicitly labeled simulation controls for hackathon demonstration purposes only.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
