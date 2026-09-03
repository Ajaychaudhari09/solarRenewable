import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface DashboardProps {
  onNavigateTab: (tab: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigateTab }) => {
  const { token } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSite, setSelectedSite] = useState<'Kutch' | 'Banaskantha'>('Kutch');
  const [chartMode, setChartMode] = useState<'all' | 'solar' | 'wind'>('all');

  const fetchDashboardData = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await fetch('/api/dashboard/summary', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (res.ok) {
        setData(json);
      }
    } catch (err) {
      console.error('Error loading dashboard summary', err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  const kpi = data?.kpi || {
    totalOutputMW: 24.8,
    totalCapacityMW: 37.5,
    solarOutputMW: 14.2,
    windOutputMW: 10.6,
    performanceRatio: 74.2,
    carbonOffsetKgPerHour: 17608,
    revenueINRPerHour: 79360,
    assetCount: 13,
    openTicketCount: 2,
  };

  const weather = data?.weather?.[selectedSite.toLowerCase()] || data?.weather?.kutch || {};
  const currentW = weather?.current || {
    temperature: 33.5,
    windSpeed: 8.2,
    shortwaveRadiation: 790,
    cloudCover: 12,
  };

  const hourlyChart = data?.hourlyChart || [];

  return (
    <div className="space-y-6">
      {/* ── Weather Strip (Prompt 21 & 24) ── */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-xl text-cyan-400">
              🌤️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white">Live Environmental Conditions</h2>
                <span className="bg-cyan-950 text-cyan-300 border border-cyan-800/60 text-[10px] px-2 py-0.5 rounded-full font-semibold">
                  Live weather: Open-Meteo
                </span>
                {weather?.cacheNotice && (
                  <span className="text-[10px] text-amber-400 font-mono">
                    ({weather.cacheNotice})
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400">
                Real-time weather station telemetry feeding deterministic generation curves
              </p>
            </div>
          </div>

          {/* Site Selector */}
          <div className="flex items-center gap-2 self-start md:self-auto">
            <button
              onClick={() => setSelectedSite('Kutch')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                selectedSite === 'Kutch'
                  ? 'bg-cyan-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              📍 Kutch Park (23.73°N, 69.86°E)
            </button>
            <button
              onClick={() => setSelectedSite('Banaskantha')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                selectedSite === 'Banaskantha'
                  ? 'bg-cyan-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              📍 Banaskantha Park (24.17°N, 72.44°E)
            </button>
          </div>
        </div>

        {/* Live Metrics Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-3 border-t border-slate-800/80">
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-2.5">
            <div className="text-[10px] uppercase font-semibold text-slate-400">Ambient Temp</div>
            <div className="text-lg font-bold text-white mt-0.5">{currentW.temperature}°C</div>
            <div className="text-[10px] text-slate-500">PV Derating active above 25°C</div>
          </div>

          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-2.5">
            <div className="text-[10px] uppercase font-semibold text-slate-400">Wind Velocity (10m)</div>
            <div className="text-lg font-bold text-cyan-400 mt-0.5">{currentW.windSpeed} m/s</div>
            <div className="text-[10px] text-slate-500">
              {currentW.windSpeed >= 3.5 ? 'Cut-in active (> 3.5 m/s)' : 'Below turbine cut-in'}
            </div>
          </div>

          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-2.5">
            <div className="text-[10px] uppercase font-semibold text-slate-400">Solar Irradiance (GHI)</div>
            <div className="text-lg font-bold text-amber-400 mt-0.5">
              {currentW.shortwaveRadiation || currentW.directNormalIrradiance || 0} W/m²
            </div>
            <div className="text-[10px] text-slate-500">Standard STC: 1000 W/m²</div>
          </div>

          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-2.5">
            <div className="text-[10px] uppercase font-semibold text-slate-400">Cloud Cover</div>
            <div className="text-lg font-bold text-slate-300 mt-0.5">{currentW.cloudCover}%</div>
            <div className="text-[10px] text-slate-500">Optical diffusion impact</div>
          </div>
        </div>
      </div>

      {/* ── KPI Summary Row (Prompt 22 & 24) ── */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Portfolio Generation Performance
          </span>
          <span className="text-[11px] font-mono text-amber-400/90 bg-amber-950/40 border border-amber-800/40 px-2 py-0.5 rounded">
            Generation: modeled from live weather data — not live SCADA
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {/* Total Generation */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 relative overflow-hidden">
            <div className="text-xs font-semibold text-slate-400 uppercase">Total Output</div>
            <div className="text-2xl font-black text-white mt-1">
              {kpi.totalOutputMW} <span className="text-sm font-normal text-slate-400">MW</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              of {kpi.totalCapacityMW} MW installed
            </div>
            <div className="absolute top-0 right-0 w-1.5 h-full bg-blue-500" />
          </div>

          {/* Solar vs Wind Split */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 relative overflow-hidden">
            <div className="text-xs font-semibold text-slate-400 uppercase">Solar / Wind Split</div>
            <div className="text-lg font-bold text-white mt-1 flex items-center gap-2">
              <span className="text-amber-400">☀️ {kpi.solarOutputMW}</span>
              <span className="text-slate-600">|</span>
              <span className="text-cyan-400">💨 {kpi.windOutputMW}</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Hybrid balancing active</div>
            <div className="absolute top-0 right-0 w-1.5 h-full bg-cyan-500" />
          </div>

          {/* Performance Ratio */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 relative overflow-hidden">
            <div className="text-xs font-semibold text-slate-400 uppercase">Performance Ratio</div>
            <div className="text-2xl font-black text-emerald-400 mt-1">{kpi.performanceRatio}%</div>
            <div className="text-[11px] text-slate-400 mt-1">Weighted park efficiency</div>
            <div className="absolute top-0 right-0 w-1.5 h-full bg-emerald-500" />
          </div>

          {/* Carbon Offset */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 relative overflow-hidden">
            <div className="text-xs font-semibold text-slate-400 uppercase">CO₂ Abatement</div>
            <div className="text-2xl font-black text-purple-300 mt-1">
              {(kpi.carbonOffsetKgPerHour / 1000).toFixed(1)}{' '}
              <span className="text-sm font-normal text-slate-400">t/hr</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">0.71 kg CO₂/kWh grid factor</div>
            <div className="absolute top-0 right-0 w-1.5 h-full bg-purple-500" />
          </div>

          {/* Economic Yield */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 relative overflow-hidden">
            <div className="text-xs font-semibold text-slate-400 uppercase">Revenue Run-rate</div>
            <div className="text-2xl font-black text-amber-300 mt-1">
              ₹{(kpi.revenueINRPerHour / 1000).toFixed(0)}k{' '}
              <span className="text-sm font-normal text-slate-400">/hr</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">PPA benchmark ₹3,200/MWh</div>
            <div className="absolute top-0 right-0 w-1.5 h-full bg-amber-500" />
          </div>
        </div>
      </div>

      {/* ── Main Layout: Generation Chart + Alerts Panel (Prompt 24) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Unified 24h Generation Chart */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>📈</span>
                  <span>24-Hour Weather-Driven Generation Profile</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Modeled hourly output based on Open-Meteo forecast curve
                </p>
              </div>

              {/* Chart Mode Toggle */}
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                <button
                  onClick={() => setChartMode('all')}
                  className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                    chartMode === 'all' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Hybrid Combined
                </button>
                <button
                  onClick={() => setChartMode('solar')}
                  className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                    chartMode === 'solar' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Solar Only
                </button>
                <button
                  onClick={() => setChartMode('wind')}
                  className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                    chartMode === 'wind' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Wind Only
                </button>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={hourlyChart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="solarGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="windGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="totalGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="time" stroke="#64748b" fontSize={10} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={10} tickLine={false} unit=" MW" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />

                  {(chartMode === 'all' || chartMode === 'solar') && (
                    <Area
                      type="monotone"
                      dataKey="solarMW"
                      name="Solar Output (MW)"
                      stroke="#f59e0b"
                      fillOpacity={1}
                      fill="url(#solarGrad)"
                    />
                  )}

                  {(chartMode === 'all' || chartMode === 'wind') && (
                    <Area
                      type="monotone"
                      dataKey="windMW"
                      name="Wind Output (MW)"
                      stroke="#06b6d4"
                      fillOpacity={1}
                      fill="url(#windGrad)"
                    />
                  )}

                  {chartMode === 'all' && (
                    <Area
                      type="monotone"
                      dataKey="totalMW"
                      name="Total Hybrid Output (MW)"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#totalGrad)"
                    />
                  )}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
            <span>Model: STC Irradiance + Cubic Turbine Power Curve</span>
            <button
              onClick={() => onNavigateTab('assets')}
              className="text-blue-400 hover:text-blue-300 font-semibold"
            >
              Inspect Individual Assets →
            </button>
          </div>
        </div>

        {/* Alerts & AI Insights Panel */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>🔔</span>
                <span>Active Operational Alerts</span>
              </h3>
              <span className="text-[10px] bg-red-950 text-red-400 border border-red-800 px-2 py-0.5 rounded-full font-semibold">
                {data?.alerts?.length || 0} Alerts
              </span>
            </div>

            {/* AI Source label */}
            <div className="text-[10px] font-mono text-purple-300 bg-purple-950/40 border border-purple-800/40 px-2 py-1 rounded mb-3">
              AI-generated recommendation: IBM Granite LLM
            </div>

            {/* Alert List */}
            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {(!data?.alerts || data.alerts.length === 0) && (
                <div className="p-6 text-center text-slate-500 text-xs bg-slate-950/40 rounded-xl border border-slate-800/50">
                  ✓ No critical alerts. All hybrid assets operating within parameters.
                </div>
              )}

              {data?.alerts?.map((alert: any) => (
                <div
                  key={alert.id}
                  className={`p-3 rounded-xl border text-xs transition-colors ${
                    alert.urgency === 'critical'
                      ? 'bg-red-950/30 border-red-800/60 text-red-200'
                      : alert.urgency === 'high'
                      ? 'bg-amber-950/30 border-amber-800/60 text-amber-200'
                      : 'bg-slate-800/50 border-slate-700 text-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${alert.urgency === 'critical' ? 'bg-red-400 animate-ping' : 'bg-amber-400'}`} />
                      {alert.assetId} · {alert.urgency}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(alert.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-slate-300 line-clamp-2">
                    {alert.message}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 mt-3 border-t border-slate-800/80 flex items-center justify-between">
            <button
              onClick={() => onNavigateTab('maintenance')}
              className="w-full text-center py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition-colors"
            >
              View Full Maintenance Tickets & Granite Analytics →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
