import React, { useState } from 'react';
import { api } from '../api';

interface RooftopSolarProps {
  location: string;
  userMode: string;
}

const LOCATIONS = [
  { id: 'kutch',       label: 'Kutch' },
  { id: 'banaskantha', label: 'Banaskantha' },
  { id: 'ahmedabad',   label: 'Ahmedabad' },
  { id: 'rajkot',      label: 'Rajkot' },
  { id: 'surat',       label: 'Surat' },
];

const PANEL_TYPES = [
  { id: 'monocrystalline', label: 'Monocrystalline (Best)' },
  { id: 'polycrystalline', label: 'Polycrystalline (Standard)' },
  { id: 'thin_film',       label: 'Thin Film (Economy)' },
];

const ORIENTATIONS = [
  { id: 'south', label: 'South (Best for India)' },
  { id: 'southeast', label: 'South-East' },
  { id: 'southwest', label: 'South-West' },
  { id: 'east', label: 'East' },
  { id: 'west', label: 'West' },
];

function StatusIcon({ status }: { status: string }) {
  return status === 'healthy' ? <span className="text-emerald-400">●</span> :
         status === 'below_expected' ? <span className="text-amber-400">●</span> :
         status === 'underperforming' ? <span className="text-orange-400">●</span> :
         <span className="text-red-400">●</span>;
}

export default function RooftopSolar({ location: defaultLocation, userMode }: RooftopSolarProps) {
  const [form, setForm] = useState({
    location_id: defaultLocation,
    capacity_kw: 5,
    panel_type: 'monocrystalline',
    system_age_years: 3,
    tilt_deg: 15,
    orientation: 'south',
    custom_tariff_inr: '',
  });
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const analyze = async () => {
    setLoading(true);
    setError('');
    try {
      const params: Record<string, unknown> = {
        location_id: form.location_id,
        capacity_kw: form.capacity_kw,
        panel_type: form.panel_type,
        system_age_years: form.system_age_years,
        tilt_deg: form.tilt_deg,
        orientation: form.orientation,
      };
      if (form.custom_tariff_inr) params.custom_tariff_inr = parseFloat(form.custom_tariff_inr);
      const r = await api.analyzeRooftop(params);
      setResult(r);
    } catch (e: any) {
      setError('Analysis failed. Make sure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const F = (label: string, children: React.ReactNode) => (
    <div>
      <label className="text-xs text-slate-400 mb-1 block">{label}</label>
      {children}
    </div>
  );

  const inputCls = "w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-white">Rooftop Solar Analyzer</h2>
        <p className="text-sm text-slate-400 mt-1">
          {userMode === 'simple'
            ? 'Enter your solar system details to understand how it\'s performing and what you\'re saving.'
            : 'Calculate expected generation, performance ratio, savings, and CO₂ impact for a rooftop installation.'}
        </p>
      </div>

      {/* Input form */}
      <div className="card">
        <h3 className="text-sm font-semibold text-white mb-4">System Configuration</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {F('Location', (
            <select value={form.location_id} onChange={e => setForm(f => ({ ...f, location_id: e.target.value }))} className={inputCls}>
              {LOCATIONS.map(l => <option key={l.id} value={l.id}>{l.label}</option>)}
            </select>
          ))}
          {F('System Capacity (kW)', (
            <input type="number" min={0.5} max={500} step={0.5} value={form.capacity_kw}
              onChange={e => setForm(f => ({ ...f, capacity_kw: parseFloat(e.target.value) }))} className={inputCls} />
          ))}
          {F('Panel Type', (
            <select value={form.panel_type} onChange={e => setForm(f => ({ ...f, panel_type: e.target.value }))} className={inputCls}>
              {PANEL_TYPES.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
            </select>
          ))}
          {F('System Age (years)', (
            <input type="number" min={0} max={25} step={1} value={form.system_age_years}
              onChange={e => setForm(f => ({ ...f, system_age_years: parseFloat(e.target.value) }))} className={inputCls} />
          ))}
          {F('Panel Orientation', (
            <select value={form.orientation} onChange={e => setForm(f => ({ ...f, orientation: e.target.value }))} className={inputCls}>
              {ORIENTATIONS.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
            </select>
          ))}
          {F('Tilt Angle (°)', (
            <input type="number" min={0} max={45} step={1} value={form.tilt_deg}
              onChange={e => setForm(f => ({ ...f, tilt_deg: parseFloat(e.target.value) }))} className={inputCls} />
          ))}
          {F('Custom Electricity Tariff (₹/kWh, optional)', (
            <input type="number" min={1} max={20} step={0.1} placeholder="Leave blank to use location default"
              value={form.custom_tariff_inr}
              onChange={e => setForm(f => ({ ...f, custom_tariff_inr: e.target.value }))} className={inputCls} />
          ))}
        </div>
        <button
          onClick={analyze}
          disabled={loading}
          className="mt-4 px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Analyzing...' : 'Analyze My Solar System'}
        </button>
        {error && <div className="mt-2 text-xs text-red-400">{error}</div>}
      </div>

      {/* Results */}
      {result && (
        <div className="space-y-4">
          {/* Health summary — prominent */}
          <div className={`card border-2 ${
            result.health?.status === 'healthy' ? 'border-emerald-700/60 bg-emerald-950/20' :
            result.health?.status === 'below_expected' ? 'border-amber-700/60 bg-amber-950/20' :
            'border-red-700/60 bg-red-950/20'
          }`}>
            <div className="flex items-start gap-3">
              <div className="text-2xl mt-0.5">
                {result.health?.status === 'healthy' ? '✅' :
                 result.health?.status === 'below_expected' ? '⚠️' : '🔴'}
              </div>
              <div>
                <div className="text-sm font-bold text-white mb-1">{result.health?.message}</div>
                <div className="text-xs text-slate-400">{result.health?.advice}</div>
              </div>
            </div>
          </div>

          {/* KPI grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: userMode === 'simple' ? 'Today\'s Generation' : 'Daily Generation', val: `${result.performance?.daily_kwh} kWh`, color: 'text-amber-400' },
              { label: 'Monthly Estimate', val: `${(result.performance?.monthly_kwh || 0).toFixed(0)} kWh`, color: 'text-amber-300' },
              { label: 'Daily Savings', val: `₹${result.savings?.daily_savings_inr?.toFixed(0)}`, color: 'text-emerald-400' },
              { label: 'Monthly Savings', val: `₹${(result.savings?.monthly_savings_inr || 0).toLocaleString()}`, color: 'text-emerald-300' },
            ].map(({ label, val, color }) => (
              <div key={label} className="card text-center">
                <div className="text-xs text-slate-500 mb-1">{label}</div>
                <div className={`text-xl font-bold ${color}`}>{val}</div>
              </div>
            ))}
          </div>

          {/* Performance detail */}
          {userMode === 'operator' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="card">
                <h3 className="text-sm font-semibold text-white mb-3">Performance Analysis</h3>
                <div className="space-y-1 text-xs">
                  {[
                    ['Performance Ratio', `${(result.performance?.performance_ratio * 100).toFixed(1)}%`],
                    ['Expected Output (now)', `${result.performance?.expected_kw} kW`],
                    ['Effective Efficiency', `${result.performance?.effective_efficiency_pct}%`],
                    ['Temp Derating Factor', `${(result.performance?.temp_factor * 100).toFixed(1)}%`],
                    ['Degradation Factor', `${(result.performance?.degradation_factor * 100).toFixed(1)}%`],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between py-1 border-b border-slate-800">
                      <span className="text-slate-400">{k}</span>
                      <span className="text-white font-medium">{v}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card">
                <h3 className="text-sm font-semibold text-white mb-3">Environmental Impact</h3>
                <div className="space-y-1 text-xs">
                  {[
                    ['Annual Generation', `${(result.environment?.annual_kwh || 0).toLocaleString()} kWh`],
                    ['CO₂ Avoided/Year', `${(result.environment?.co2_avoided_annual_tonnes || 0)} tonnes`],
                    ['Equivalent Trees', `${(result.environment?.equivalent_trees || 0).toLocaleString()}`],
                    ['Annual Revenue', `₹${(result.savings?.annual_savings_inr || 0).toLocaleString()}`],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between py-1 border-b border-slate-800">
                      <span className="text-slate-400">{k}</span>
                      <span className="text-emerald-400 font-medium">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Simple mode environment */}
          {userMode === 'simple' && (
            <div className="card bg-emerald-950/20 border-emerald-700/40">
              <h3 className="text-sm font-semibold text-emerald-300 mb-2">Your Environmental Impact</h3>
              <div className="text-xs text-slate-300 space-y-1">
                <div>Every year, your solar system prevents <span className="font-bold text-emerald-400">{result.environment?.co2_avoided_annual_tonnes} tonnes</span> of CO₂ from entering the atmosphere.</div>
                <div>That's equivalent to planting <span className="font-bold text-emerald-400">{(result.environment?.equivalent_trees || 0).toLocaleString()} trees</span>.</div>
              </div>
            </div>
          )}

          {/* Recommendations */}
          <div className="card">
            <h3 className="text-sm font-semibold text-white mb-3">Recommendations</h3>
            <div className="space-y-2">
              {(result.recommendations || []).map((rec: string, i: number) => (
                <div key={i} className="flex items-start gap-2 text-xs text-slate-300 p-2 bg-slate-900/50 rounded">
                  <span className="text-blue-400 shrink-0 mt-0.5">→</span>
                  <span>{rec}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Assumptions */}
          <div className="text-xs text-slate-600 border-t border-slate-800 pt-3">
            <span className="font-medium text-slate-500">Assumptions: </span>
            {(result.assumptions || []).join(' · ')}
          </div>
        </div>
      )}
    </div>
  );
}
