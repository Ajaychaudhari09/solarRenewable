import React, { useState, useEffect } from 'react';
import { api } from '../api';

interface IndiaContextProps {
  location: string;
  onLocationChange: (id: string) => void;
}

const DATA_MODE_BADGE: Record<string, string> = {
  simulated: 'bg-amber-900/40 text-amber-300 border border-amber-700/40',
  reference: 'bg-blue-900/40 text-blue-300 border border-blue-700/40',
  live:      'bg-emerald-900/40 text-emerald-300 border border-emerald-700/40',
};

export default function IndiaContext({ location, onLocationChange }: IndiaContextProps) {
  const [locations, setLocations] = useState<any[]>([]);
  const [locationDetail, setLocationDetail] = useState<any>(null);
  const [weatherCtx, setWeatherCtx] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.indiaLocations().then(d => setLocations(d.locations || [])).catch(() => {});
    api.indiaRenewableStats().then(setStats).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.indiaLocation(location).catch(() => null),
      api.indiaWeatherContext(location).catch(() => null),
    ]).then(([loc, ctx]) => {
      setLocationDetail(loc);
      setWeatherCtx(ctx);
    }).finally(() => setLoading(false));
  }, [location]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">India Renewable Energy Context</h2>
        <span className={`text-xs px-2 py-0.5 rounded ${DATA_MODE_BADGE.simulated}`}>
          Simulated Data
        </span>
      </div>

      {/* Location selector */}
      <div>
        <div className="text-xs text-slate-500 mb-2 uppercase tracking-wider">Select Location</div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {locations.map((loc: any) => (
            <button
              key={loc.id}
              onClick={() => onLocationChange(loc.id)}
              className={`card text-left transition-all hover:border-blue-600/60 ${
                location === loc.id ? 'border-blue-500 bg-blue-950/30' : ''
              }`}
            >
              <div className="text-xs font-semibold text-white">{loc.name.split(',')[0]}</div>
              <div className="text-xs text-slate-500">{loc.state}</div>
              <div className="mt-1 text-xs text-amber-400">{loc.avg_irradiance} kWh/m²/day</div>
              <div className="text-xs text-blue-400">{loc.solar_installed_mw} MW solar</div>
            </button>
          ))}
        </div>
      </div>

      {/* Location detail */}
      {locationDetail && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="card">
            <h3 className="text-sm font-semibold text-white mb-3">{locationDetail.name}</h3>
            <p className="text-xs text-slate-400 mb-3 leading-relaxed">{locationDetail.description}</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                { label: 'Avg Irradiance', val: `${locationDetail.avg_irradiance_kwh_m2_day} kWh/m²/day`, color: 'text-amber-400' },
                { label: 'Avg Wind Speed', val: `${locationDetail.avg_wind_speed_ms} m/s`, color: 'text-blue-400' },
                { label: 'Peak Sun Hours', val: `${locationDetail.peak_sun_hours} h/day`, color: 'text-amber-300' },
                { label: 'Avg Temperature', val: `${locationDetail.avg_temp_c}°C`, color: 'text-slate-300' },
                { label: 'Solar Installed', val: `${locationDetail.solar_installed_mw} MW`, color: 'text-emerald-400' },
                { label: 'Wind Installed', val: `${locationDetail.wind_installed_mw} MW`, color: 'text-blue-400' },
                { label: 'Electricity Tariff', val: `₹${locationDetail.electricity_tariff_inr_kwh}/kWh`, color: 'text-emerald-300' },
              ].map(({ label, val, color }) => (
                <div key={label} className="p-2 bg-slate-900/50 rounded">
                  <div className="text-slate-500">{label}</div>
                  <div className={`font-semibold ${color}`}>{val}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Seasonal notes */}
          <div className="card">
            <h3 className="text-sm font-semibold text-white mb-3">Seasonal Renewable Energy Patterns</h3>
            <div className="space-y-2">
              {Object.entries(locationDetail.seasonal_notes || {}).map(([season, note]) => (
                <div key={season} className="p-2 bg-slate-900/50 rounded-lg border border-slate-700/50">
                  <div className="text-xs font-semibold text-slate-300 capitalize mb-0.5">{season}</div>
                  <div className="text-xs text-slate-500 leading-relaxed">{note as string}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Weather context */}
      {weatherCtx && (
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-white">Current Weather Impact on Renewables</h3>
            <span className={`text-xs px-2 py-0.5 rounded ${DATA_MODE_BADGE.simulated}`}>Simulated</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              { title: 'Solar Conditions', text: weatherCtx.implications?.solar, icon: '☀️' },
              { title: 'Temperature Effect', text: weatherCtx.implications?.temperature, icon: '🌡️' },
              { title: 'Wind Conditions', text: weatherCtx.implications?.wind, icon: '💨' },
            ].map(({ title, text, icon }) => (
              <div key={title} className="p-3 bg-slate-900/50 rounded-lg border border-slate-700/40">
                <div className="text-sm mb-1">{icon} <span className="text-white font-medium text-xs">{title}</span></div>
                <div className="text-xs text-slate-400 leading-relaxed">{text}</div>
              </div>
            ))}
          </div>
          {weatherCtx.location_context?.seasonal_note && (
            <div className="mt-3 p-3 bg-blue-950/30 border border-blue-700/30 rounded-lg text-xs text-blue-300">
              <span className="font-semibold">Season ({weatherCtx.location_context?.season}):</span>{' '}
              {weatherCtx.location_context.seasonal_note}
            </div>
          )}
        </div>
      )}

      {/* India renewable stats */}
      {stats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-white">India Renewable Energy</h3>
              <span className={`text-xs px-2 py-0.5 rounded ${DATA_MODE_BADGE.reference}`}>Reference Data</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 bg-slate-900/50 rounded">
                <div className="text-slate-500">Total Renewable</div>
                <div className="text-xl font-bold text-emerald-400">{stats.india?.total_renewable_gw} GW</div>
              </div>
              <div className="p-2 bg-slate-900/50 rounded">
                <div className="text-slate-500">Solar</div>
                <div className="text-xl font-bold text-amber-400">{stats.india?.solar_gw} GW</div>
              </div>
              <div className="p-2 bg-slate-900/50 rounded">
                <div className="text-slate-500">Wind</div>
                <div className="text-xl font-bold text-blue-400">{stats.india?.wind_gw} GW</div>
              </div>
              <div className="p-2 bg-slate-900/50 rounded">
                <div className="text-slate-500">Target 2030</div>
                <div className="text-xl font-bold text-purple-400">{stats.india?.target_2030_gw} GW</div>
              </div>
            </div>
            <div className="mt-2 text-xs text-slate-600">{stats.disclaimer}</div>
          </div>

          <div className="card">
            <h3 className="text-sm font-semibold text-white mb-3">Gujarat Renewable Leadership</h3>
            <div className="space-y-2 text-xs">
              {[
                { label: 'Solar Installed', val: `${stats.gujarat?.solar_gw} GW` },
                { label: 'Wind Installed',  val: `${stats.gujarat?.wind_gw} GW`  },
                { label: 'Solar Ranking',   val: stats.gujarat?.rank_solar },
                { label: 'Wind Ranking',    val: stats.gujarat?.rank_wind  },
              ].map(({ label, val }) => (
                <div key={label} className="flex justify-between p-1.5 bg-slate-900/40 rounded">
                  <span className="text-slate-500">{label}</span>
                  <span className="text-white font-medium">{val}</span>
                </div>
              ))}
              <div className="p-2 bg-amber-950/30 border border-amber-700/30 rounded text-amber-300 mt-2">
                {stats.gujarat?.notable}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
