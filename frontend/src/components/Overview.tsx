import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Legend,
} from 'recharts';

interface OverviewProps {
  dashboard: any;
  onSelectAsset: (id: string) => void;
}

function Stat({ label, value, sub, color }: any) {
  return (
    <div className="card flex flex-col gap-1">
      <div className="stat-label">{label}</div>
      <div className={`stat-value ${color || 'text-white'}`}>{value}</div>
      {sub && <div className="text-xs text-slate-500">{sub}</div>}
    </div>
  );
}

function SeverityBadge({ severity }: { severity: string }) {
  const cls: Record<string, string> = {
    critical: 'badge-critical',
    warning:  'badge-warning',
    info:     'badge-info',
    optimization: 'badge-opt',
  };
  return <span className={cls[severity] || 'badge-info'}>{severity.toUpperCase()}</span>;
}

export default function Overview({ dashboard, onSelectAsset }: OverviewProps) {
  if (!dashboard) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-500">
        <div className="text-center">
          <div className="text-3xl mb-2">⚡</div>
          <div>Loading GridPulse AI...</div>
        </div>
      </div>
    );
  }

  const ov = dashboard.overview || {};
  const weather = dashboard.weather || {};
  const grid = dashboard.grid || {};
  const battery = dashboard.battery || {};
  const alerts = dashboard.alerts || [];
  const turbines = dashboard.turbine_assets || [];

  const pieData = [
    { name: 'Solar',   value: Math.max(0, ov.solar_kw || 0) },
    { name: 'Wind',    value: Math.max(0, ov.wind_kw  || 0) },
  ];
  const COLORS = ['#f59e0b', '#3b82f6'];

  const turbineBar = turbines.slice(0, 16).map((t: any) => ({
    name: t.asset_id,
    health: t.health_score,
    failProb: (t.failure_prob * 100).toFixed(1),
    status: t.status,
  }));

  return (
    <div className="space-y-6">
      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <Stat label="Total Generation" value={`${((ov.total_kw || 0) / 1000).toFixed(1)} MW`} sub={`Expected: ${((ov.expected_kw || 0) / 1000).toFixed(1)} MW`} />
        <Stat label="Solar" value={`${((ov.solar_kw || 0) / 1000).toFixed(1)} MW`} color="text-amber-400" />
        <Stat label="Wind" value={`${((ov.wind_kw || 0) / 1000).toFixed(1)} MW`} color="text-blue-400" />
        <Stat label="Hybrid Efficiency" value={`${(ov.hybrid_efficiency_pct || 0).toFixed(1)}%`} color={ov.hybrid_efficiency_pct > 85 ? 'text-emerald-400' : 'text-amber-400'} />
        <Stat label="Critical Alerts" value={ov.critical_alerts || 0} color={(ov.critical_alerts || 0) > 0 ? 'text-red-400' : 'text-emerald-400'} />
        <Stat label="CO₂ Avoided" value={`${(ov.co2_avoided_today_t || 0).toFixed(1)} t`} sub="Today" color="text-emerald-400" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Stat label="Daily Revenue" value={`₹${((ov.daily_revenue_inr || 0) / 1000).toFixed(0)}K`} color="text-emerald-400" />
        <Stat label="Energy Loss" value={`₹${((ov.daily_loss_inr || 0) / 1000).toFixed(0)}K/day`} color={(ov.daily_loss_inr || 0) > 5000 ? 'text-red-400' : 'text-slate-300'} />
        <Stat label="Assets Online" value={`${ov.assets_online || 0}/${turbines.length}`} />
        <Stat label="Assets at Risk" value={ov.assets_at_risk || 0} color={(ov.assets_at_risk || 0) > 0 ? 'text-amber-400' : 'text-emerald-400'} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Generation mix pie */}
        <div className="card">
          <h3 className="text-sm font-semibold text-slate-300 mb-3">Generation Mix</h3>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={40} outerRadius={65} paddingAngle={3}>
                {pieData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
              </Pie>
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              <Tooltip formatter={(v: any) => `${(v / 1000).toFixed(2)} MW`} contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Turbine health bar chart */}
        <div className="card lg:col-span-2">
          <h3 className="text-sm font-semibold text-slate-300 mb-3">Turbine Health Scores</h3>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={turbineBar} barSize={12}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#94a3b8' }} angle={-45} textAnchor="end" height={40} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 11 }} />
              <Bar dataKey="health" name="Health %">
                {turbineBar.map((entry: any, index: number) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.health < 50 ? '#ef4444' : entry.health < 75 ? '#f59e0b' : '#22c55e'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Grid + Battery + Weather row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card">
          <h3 className="text-sm font-semibold text-slate-300 mb-2">Grid Status</h3>
          <div className="space-y-1 text-xs text-slate-400">
            <div className="flex justify-between"><span>Export</span><span className="text-white">{((grid.export_kw || 0) / 1000).toFixed(2)} MW</span></div>
            <div className="flex justify-between"><span>Available</span><span className="text-white">{((grid.available_capacity_kw || 0) / 1000).toFixed(1)} MW</span></div>
            <div className="flex justify-between"><span>Curtailment</span><span className={grid.curtailment_kw > 100 ? 'text-amber-400' : 'text-white'}>{(grid.curtailment_kw || 0).toFixed(0)} kW</span></div>
            <div className="flex justify-between"><span>Risk Level</span>
              <span className={grid.risk_level === 'critical' ? 'text-red-400' : grid.risk_level === 'high' ? 'text-amber-400' : 'text-emerald-400'}>
                {(grid.risk_level || 'low').toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="text-sm font-semibold text-slate-300 mb-2">Battery Storage</h3>
          <div className="space-y-1 text-xs text-slate-400">
            <div className="flex justify-between"><span>SOC</span><span className="text-white">{(((battery.soc || 0) * 100)).toFixed(1)}%</span></div>
            <div className="flex justify-between"><span>Action</span>
              <span className={battery.action === 'charge' ? 'text-emerald-400' : battery.action === 'discharge' ? 'text-blue-400' : 'text-slate-300'}>
                {(battery.action || 'hold').toUpperCase()}
              </span>
            </div>
          </div>
          <div className="mt-2 h-3 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-600 to-emerald-500 transition-all"
              style={{ width: `${(battery.soc || 0.5) * 100}%` }}
            />
          </div>
        </div>

        <div className="card">
          <h3 className="text-sm font-semibold text-slate-300 mb-2">Weather</h3>
          <div className="space-y-1 text-xs text-slate-400">
            <div className="flex justify-between"><span>Irradiance</span><span className="text-white">{(weather.irradiance_wm2 || 0).toFixed(0)} W/m²</span></div>
            <div className="flex justify-between"><span>Wind</span><span className="text-white">{(weather.wind_speed_ms || 0).toFixed(1)} m/s</span></div>
            <div className="flex justify-between"><span>Temp</span><span className="text-white">{(weather.temperature_c || 0).toFixed(1)}°C</span></div>
            <div className="flex justify-between"><span>Cloud</span><span className="text-white">{(weather.cloud_cover_pct || 0).toFixed(0)}%</span></div>
          </div>
        </div>
      </div>

      {/* Recent Alerts */}
      <div className="card">
        <h3 className="text-sm font-semibold text-slate-300 mb-3">Recent Alerts</h3>
        {alerts.length === 0 ? (
          <div className="text-xs text-slate-500">No active alerts</div>
        ) : (
          <div className="space-y-2">
            {alerts.slice(0, 5).map((a: any) => (
              <div key={a.alert_id} className="flex items-start gap-3 p-2 rounded-lg bg-slate-900/50 border border-slate-700/50">
                <SeverityBadge severity={a.severity} />
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-white font-medium truncate">{a.title}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{a.recommended_action}</div>
                </div>
                <button
                  onClick={() => onSelectAsset(a.asset_id)}
                  className="text-xs text-blue-400 hover:text-blue-300 whitespace-nowrap"
                >
                  View →
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
