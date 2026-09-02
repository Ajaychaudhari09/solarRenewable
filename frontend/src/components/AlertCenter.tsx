import React, { useState, useEffect } from 'react';
import { api } from '../api';

export default function AlertCenter() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    api.alerts().then(setData).catch(console.error);
  }, []);

  const current = data?.current || [];
  const summary = data?.summary || {};

  const sev = (s: string) =>
    s === 'critical' ? 'badge-critical' :
    s === 'warning'  ? 'badge-warning'  :
    s === 'optimization' ? 'badge-opt'  : 'badge-info';

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Critical', val: summary.critical || 0, color: 'text-red-400' },
          { label: 'Warning',  val: summary.warning  || 0, color: 'text-amber-400' },
          { label: 'Optimization', val: summary.optimization || 0, color: 'text-purple-400' },
          { label: 'Total', val: current.length, color: 'text-white' },
        ].map(({ label, val, color }) => (
          <div key={label} className="card text-center">
            <div className="text-2xl font-bold" style={{ color: color.replace('text-', '') }}>{val}</div>
            <div className="text-xs text-slate-500 mt-1">{label}</div>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        {current.length === 0 && <div className="text-slate-500 text-sm text-center py-8">No active alerts</div>}
        {current.map((a: any) => (
          <div key={a.alert_id} className={`card border ${a.severity === 'critical' ? 'border-red-700/60 bg-red-950/20' : a.severity === 'warning' ? 'border-amber-700/40' : 'border-slate-700'}`}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <span className={sev(a.severity)}>{a.severity.toUpperCase()}</span>
                <div>
                  <div className="text-sm font-semibold text-white">{a.title}</div>
                  <div className="text-xs text-slate-400 mt-1">{a.description}</div>
                </div>
              </div>
              <div className="text-xs text-slate-500 whitespace-nowrap">{a.asset_id}</div>
            </div>
            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
              <div className="p-2 bg-slate-900/50 rounded">
                <span className="text-slate-500">Impact: </span>
                <span className="text-slate-300">{a.impact}</span>
              </div>
              <div className="p-2 bg-slate-900/50 rounded">
                <span className="text-slate-500">Action: </span>
                <span className="text-slate-300">{a.recommended_action}</span>
              </div>
            </div>
            {a.requires_human_approval && (
              <div className="mt-2 flex items-center gap-2">
                <span className="text-xs text-red-400 font-semibold">⚠ Human Approval Required</span>
                <button className="text-xs px-3 py-1 bg-red-800/60 border border-red-700/50 text-red-300 rounded hover:bg-red-700/60">
                  Approve Action
                </button>
                <button className="text-xs px-3 py-1 bg-slate-700 border border-slate-600 text-slate-300 rounded hover:bg-slate-600">
                  Defer
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
