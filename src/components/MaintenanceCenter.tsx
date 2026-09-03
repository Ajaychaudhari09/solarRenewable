import React, { useState, useEffect } from 'react';
import { api } from '../api';

function UrgencyBadge({ urgency }: { urgency: string }) {
  const cls: Record<string, string> = {
    immediate: 'badge-critical',
    high:      'badge-warning',
    medium:    'bg-amber-900/40 text-amber-400 border border-amber-700/40 text-xs px-2 py-0.5 rounded-full font-semibold',
    low:       'badge-info',
    scheduled: 'bg-slate-700 text-slate-400 border border-slate-600 text-xs px-2 py-0.5 rounded-full font-semibold',
  };
  return <span className={cls[urgency] || cls.scheduled}>{urgency.toUpperCase()}</span>;
}

export default function MaintenanceCenter() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    api.maintenance().then(setData).catch(console.error);
  }, []);

  const queue = data?.priority_queue || [];
  const schedule = data?.schedule || [];

  return (
    <div className="space-y-6">
      <h2 className="text-base font-semibold text-white">Maintenance Priority Queue</h2>

      <div className="overflow-x-auto">
        <table className="w-full text-xs text-slate-300">
          <thead>
            <tr className="text-slate-500 border-b border-slate-700">
              <th className="text-left py-2 px-3">Rank</th>
              <th className="text-left py-2 px-3">Asset</th>
              <th className="text-left py-2 px-3">Priority</th>
              <th className="text-left py-2 px-3">Urgency</th>
              <th className="text-right py-2 px-3">Failure Prob</th>
              <th className="text-right py-2 px-3">Daily Loss</th>
              <th className="text-right py-2 px-3">Days to Failure</th>
              <th className="text-left py-2 px-3">Recommended Action</th>
            </tr>
          </thead>
          <tbody>
            {queue.map((item: any, i: number) => (
              <tr key={item.asset_id} className={`border-b border-slate-800 ${i === 0 ? 'bg-red-950/20' : 'hover:bg-slate-800/40'}`}>
                <td className="py-2 px-3 text-slate-500">{i + 1}</td>
                <td className="py-2 px-3 font-bold text-white">{item.asset_id}</td>
                <td className="py-2 px-3">
                  <div className="flex items-center gap-1">
                    <div className="h-1.5 bg-slate-700 rounded-full w-16">
                      <div className="h-1.5 bg-blue-500 rounded-full" style={{ width: `${item.priority_score}%` }} />
                    </div>
                    <span>{item.priority_score?.toFixed(0)}</span>
                  </div>
                </td>
                <td className="py-2 px-3"><UrgencyBadge urgency={item.urgency} /></td>
                <td className="py-2 px-3 text-right">{((item.failure_probability || 0) * 100).toFixed(1)}%</td>
                <td className="py-2 px-3 text-right text-red-400">₹{(item.estimated_daily_loss_inr || 0).toLocaleString()}</td>
                <td className="py-2 px-3 text-right">{item.days_to_failure}</td>
                <td className="py-2 px-3 text-slate-400">{item.recommended_action}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {queue.length === 0 && <div className="text-slate-500 text-sm text-center py-8">No maintenance data</div>}
      </div>

      <h2 className="text-base font-semibold text-white mt-4">Maintenance Schedule</h2>
      <div className="space-y-2">
        {schedule.map((s: any, i: number) => (
          <div key={i} className="card flex items-center gap-4">
            <div className="w-16 shrink-0 text-center">
              <UrgencyBadge urgency={s.urgency} />
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold text-white">{s.asset_id}</div>
              <div className="text-xs text-slate-500 mt-0.5">{s.reason}</div>
            </div>
            <div className="text-xs text-slate-400 text-right">
              <div>From: {s.recommended_window_start?.slice(0, 10)}</div>
              <div>Downtime: {s.estimated_downtime_h}h</div>
              <div className="text-red-400">Loss: ₹{(s.estimated_energy_loss_inr || 0).toLocaleString()}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
