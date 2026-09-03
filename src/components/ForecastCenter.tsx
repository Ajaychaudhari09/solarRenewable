import React, { useState, useEffect } from 'react';
import { api } from '../api';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from 'recharts';

export default function ForecastCenter() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    api.forecast().then(setData).catch(console.error);
  }, []);

  const solar = data?.solar?.forecasts || {};
  const wind = data?.wind?.forecasts || {};
  const weather = data?.weather?.results || {};

  function buildChartData(forecast: any) {
    return (forecast?.points || []).map((p: any, i: number) => ({
      name: `+${(i + 1) * 5}m`,
      value: p.value_kw,
      upper: p.upper_kw,
      lower: p.lower_kw,
    }));
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Solar Potential', val: weather.solar_potential || '—' },
          { label: 'Wind Potential',  val: weather.wind_potential  || '—' },
          { label: 'Weather Risk',    val: weather.weather_risk    || 'none' },
          { label: 'Cloud Cover',     val: `${(weather.cloud_cover_pct || 0).toFixed(0)}%` },
        ].map(({ label, val }) => (
          <div key={label} className="card text-center">
            <div className="text-xs text-slate-500 mb-1">{label}</div>
            <div className="text-lg font-bold text-white capitalize">{val}</div>
          </div>
        ))}
      </div>

      {/* Solar forecast */}
      <div className="card">
        <h3 className="text-sm font-semibold text-slate-200 mb-1">Solar Forecast — Next 1 Hour (5-min intervals)</h3>
        <div className="text-xs text-slate-500 mb-3">
          Method: {data?.solar?.method || 'exponential_smoothing_linear_trend'} | 
          Peak: {(solar['1h']?.peak_kw || 0).toFixed(0)} kW | 
          Mean: {(solar['1h']?.mean_kw || 0).toFixed(0)} kW
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={buildChartData(solar['1h'])}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#94a3b8' }} />
            <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} />
            <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', fontSize: 11 }}
                     formatter={(v: any) => [`${v.toFixed(0)} kW`]} />
            <Area type="monotone" dataKey="upper" stroke="none" fill="#f59e0b" fillOpacity={0.1} />
            <Area type="monotone" dataKey="value" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.2} name="Solar kW" />
            <Area type="monotone" dataKey="lower" stroke="none" fill="#f59e0b" fillOpacity={0.05} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Wind forecast */}
      <div className="card">
        <h3 className="text-sm font-semibold text-slate-200 mb-1">Wind Forecast — Next 1 Hour</h3>
        <div className="text-xs text-slate-500 mb-3">
          Method: {data?.wind?.method || 'linear_trend_with_damping'} | 
          Wind: {(data?.wind?.wind_speed_ms || 0).toFixed(1)} m/s | 
          Mean: {(wind['1h']?.mean_kw || 0).toFixed(0)} kW
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={buildChartData(wind['1h'])}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#94a3b8' }} />
            <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} />
            <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', fontSize: 11 }}
                     formatter={(v: any) => [`${v.toFixed(0)} kW`]} />
            <Area type="monotone" dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} name="Wind kW" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Horizon summary */}
      <div className="grid grid-cols-3 gap-4">
        {(['1h', '6h', '24h'] as const).map(h => (
          <div key={h} className="card">
            <div className="text-xs text-slate-500 mb-2">{h} Horizon</div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Solar Mean</span>
                <span className="text-amber-400">{(solar[h]?.mean_kw || 0).toFixed(0)} kW</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Wind Mean</span>
                <span className="text-blue-400">{(wind[h]?.mean_kw || 0).toFixed(0)} kW</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Solar ±</span>
                <span className="text-slate-300">±{(solar[h]?.uncertainty_kw || 0).toFixed(0)} kW</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
