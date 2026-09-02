import React, { useState, useEffect } from 'react';
import { api } from '../api';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from 'recharts';

export default function GridCenter() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    api.grid().then(setData).catch(console.error);
  }, []);

  const integ = data?.integration || {};
  const risk = data?.risk || {};
  const storage = data?.storage || {};
  const balance = data?.balance || {};
  const raw = data?.raw || {};

  const barData = [
    { name: 'Generation', value: integ.total_generation_kw || 0 },
    { name: 'Export',     value: integ.export_kw || 0 },
    { name: 'Available',  value: integ.available_capacity_kw || 0 },
    { name: 'Curtailed',  value: integ.curtailment_kw || 0 },
  ];

  const riskColor = risk.risk_level === 'critical' ? 'text-red-400' :
                    risk.risk_level === 'high'     ? 'text-amber-400' :
                    risk.risk_level === 'medium'   ? 'text-yellow-400' : 'text-emerald-400';

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card text-center">
          <div className="text-xs text-slate-500">Grid Risk</div>
          <div className={`text-xl font-bold ${riskColor}`}>{(risk.risk_level || 'low').toUpperCase()}</div>
          <div className="text-xs text-slate-600">{((risk.overall_risk || 0) * 100).toFixed(0)}% risk score</div>
        </div>
        <div className="card text-center">
          <div className="text-xs text-slate-500">Utilization</div>
          <div className="text-xl font-bold text-white">{(integ.utilization_pct || 0).toFixed(1)}%</div>
        </div>
        <div className="card text-center">
          <div className="text-xs text-slate-500">Curtailment</div>
          <div className={`text-xl font-bold ${(integ.curtailment_kw || 0) > 100 ? 'text-amber-400' : 'text-emerald-400'}`}>
            {(integ.curtailment_kw || 0).toFixed(0)} kW
          </div>
        </div>
        <div className="card text-center">
          <div className="text-xs text-slate-500">Battery Action</div>
          <div className={`text-xl font-bold ${storage.action === 'charge' ? 'text-emerald-400' : storage.action === 'discharge' ? 'text-blue-400' : 'text-slate-300'}`}>
            {(storage.action || 'hold').toUpperCase()}
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="text-sm font-semibold text-slate-200 mb-3">Generation vs Grid Capacity</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={barData} barSize={40}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} />
            <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={(v) => `${(v / 1000).toFixed(1)}MW`} />
            <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', fontSize: 11 }}
                     formatter={(v: any) => [`${(v / 1000).toFixed(2)} MW`]} />
            <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card">
          <h3 className="text-sm font-semibold text-slate-200 mb-3">Grid Risk Breakdown</h3>
          <div className="space-y-2 text-xs">
            {[
              { label: 'Overload Risk',     val: risk.overload_risk || 0 },
              { label: 'Curtailment Risk',  val: risk.curtailment_risk || 0 },
              { label: 'Volatility Risk',   val: risk.volatility_risk || 0 },
            ].map(({ label, val }) => (
              <div key={label}>
                <div className="flex justify-between text-slate-400 mb-1">
                  <span>{label}</span>
                  <span>{(val * 100).toFixed(1)}%</span>
                </div>
                <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${val > 0.6 ? 'bg-red-500' : val > 0.3 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                       style={{ width: `${val * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h3 className="text-sm font-semibold text-slate-200 mb-3">Storage Optimization</h3>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between"><span className="text-slate-400">Action</span>
              <span className="text-white font-semibold">{(storage.action || 'hold').toUpperCase()}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Battery SOC</span>
              <span className="text-white">{((storage.current_soc || 0.5) * 100).toFixed(1)}%</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Price</span>
              <span className={storage.is_peak_hour ? 'text-emerald-400' : 'text-white'}>
                ₹{(storage.current_price_inr_per_mwh || 0).toLocaleString()}/MWh {storage.is_peak_hour ? '(PEAK)' : ''}
              </span>
            </div>
            <div className="flex justify-between"><span className="text-slate-400">Discharge Potential</span>
              <span className="text-emerald-400">₹{(storage.discharge_potential_inr || 0).toLocaleString()}</span></div>
            <div className="mt-2 p-2 bg-slate-900 rounded text-slate-300 leading-relaxed">
              {storage.rationale || 'No active recommendation'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
