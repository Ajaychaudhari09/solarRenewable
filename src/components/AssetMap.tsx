import React from 'react';

interface AssetMapProps {
  dashboard: any;
  onSelect: (id: string) => void;
}

function statusColor(status: string) {
  return status === 'healthy'    ? 'border-emerald-500 bg-emerald-900/30 text-emerald-300' :
         status === 'degraded'   ? 'border-amber-500 bg-amber-900/30 text-amber-300' :
         status === 'at_risk'    ? 'border-orange-500 bg-orange-900/30 text-orange-300' :
         status === 'critical'   ? 'border-red-500 bg-red-900/40 text-red-300 animate-pulse' :
                                   'border-slate-600 bg-slate-800 text-slate-400';
}

function urgencyBadge(urgency: string) {
  const map: Record<string, string> = {
    immediate: 'bg-red-900/60 text-red-300 border-red-700/50',
    high:      'bg-orange-900/60 text-orange-300 border-orange-700/50',
    medium:    'bg-amber-900/60 text-amber-300 border-amber-700/50',
    low:       'bg-blue-900/40 text-blue-300 border-blue-700/50',
    scheduled: 'bg-slate-800 text-slate-400 border-slate-700',
  };
  return `text-xs px-1.5 py-0.5 rounded border font-medium ${map[urgency] || map.scheduled}`;
}

export default function AssetMap({ dashboard, onSelect }: AssetMapProps) {
  const turbines = dashboard?.turbine_assets || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-white">Wind Turbine Fleet</h2>
        <div className="flex gap-3 text-xs text-slate-500">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Healthy</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500 inline-block" /> Degraded</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-500 inline-block" /> At Risk</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> Critical</span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {turbines.map((t: any) => (
          <button
            key={t.asset_id}
            onClick={() => onSelect(t.asset_id)}
            className={`card cursor-pointer border-2 text-left hover:opacity-90 transition-all ${statusColor(t.status)}`}
          >
            <div className="text-xs font-bold">{t.asset_id}</div>
            <div className="text-lg font-bold mt-1">{(t.health_score || 0).toFixed(0)}</div>
            <div className="text-xs opacity-70">Health</div>
            <div className="mt-2 flex items-center justify-between">
              <span className={urgencyBadge(t.urgency || 'scheduled')}>{(t.urgency || 'ok').slice(0, 4)}</span>
              <span className="text-xs opacity-60">{((t.failure_prob || 0) * 100).toFixed(0)}%</span>
            </div>
          </button>
        ))}
      </div>

      {turbines.length === 0 && (
        <div className="text-center text-slate-500 py-12">No asset data — click ↻ Tick to load</div>
      )}

      <div className="text-xs text-slate-500 mt-2">
        Click any turbine card to see detailed diagnostics. Numbers: Health score / Maintenance urgency / Failure probability.
      </div>
    </div>
  );
}
