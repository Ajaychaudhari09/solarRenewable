import React, { useState, useEffect } from 'react';
import { api } from '../api';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  ResponsiveContainer, Tooltip,
} from 'recharts';

interface AssetDetailProps {
  assetId: string;
  onBack: () => void;
}

function Field({ label, value, color }: any) {
  return (
    <div className="flex justify-between items-center py-1 border-b border-slate-800 text-xs">
      <span className="text-slate-400">{label}</span>
      <span className={`font-semibold ${color || 'text-white'}`}>{value}</span>
    </div>
  );
}

function Section({ title, children }: any) {
  return (
    <div className="card">
      <h3 className="text-sm font-semibold text-slate-200 mb-3">{title}</h3>
      {children}
    </div>
  );
}

export default function AssetDetail({ assetId, onBack, userMode = 'operator' }: AssetDetailProps & { userMode?: string }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const d = await api.asset(assetId);
        setData(d);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [assetId]);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-48 text-slate-500">
        <span className="animate-pulse">Loading {assetId}...</span>
      </div>
    );
  }

  const tel = data.telemetry || {};
  const perf = data.performance || {};
  const health = data.health || {};
  const maint = data.predictive_maintenance || {};
  const anomaly = data.anomaly || {};
  const rca = data.root_cause || {};
  const loss = data.energy_loss || {};

  const radarData = [
    { subject: 'Performance', value: Math.round((perf.performance_ratio || 1) * 100) },
    { subject: 'Health', value: Math.round(health.health_score || 100) },
    { subject: 'Vibration OK', value: Math.max(0, 100 - (tel.vibration_ms2 || 0) * 10) },
    { subject: 'Temp OK', value: Math.max(0, 100 - Math.max(0, (tel.temperature_c || 40) - 50) * 3) },
    { subject: 'No Fault', value: Math.round((1 - (tel.fault_progression || 0)) * 100) },
  ];

  const statusColor = health.status === 'critical' ? 'text-red-400' :
                      health.status === 'at_risk'   ? 'text-orange-400' :
                      health.status === 'degraded'  ? 'text-amber-400' : 'text-emerald-400';

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="text-slate-400 hover:text-white text-sm">← Back to Assets</button>
        <h2 className="text-lg font-bold text-white">{assetId}</h2>
        <span className={`text-sm font-semibold ${statusColor}`}>{(health.status || 'healthy').toUpperCase()}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Radar */}
        <div className="card">
          <h3 className="text-sm font-semibold text-slate-200 mb-2">Asset Health Profile</h3>
          <ResponsiveContainer width="100%" height={200}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#334155" />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <Radar dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', fontSize: 11 }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Telemetry */}
        <Section title="Live Telemetry">
          <Field label="Power Output" value={`${(tel.power_kw || 0).toFixed(1)} kW`} />
          <Field label="Expected Power" value={`${(tel.expected_power_kw || 0).toFixed(1)} kW`} />
          <Field label="Wind Speed" value={`${(tel.wind_speed_ms || 0).toFixed(2)} m/s`} />
          <Field label="Bearing Temp" value={`${(tel.temperature_c || 0).toFixed(1)}°C`}
            color={(tel.temperature_c || 0) > 60 ? 'text-red-400' : undefined} />
          <Field label="Vibration" value={`${(tel.vibration_ms2 || 0).toFixed(3)} m/s²`}
            color={(tel.vibration_ms2 || 0) > 2 ? 'text-amber-400' : undefined} />
          <Field label="Rotor RPM" value={`${(tel.rotor_rpm || 0).toFixed(1)}`} />
          <Field label="Fault Progression" value={`${((tel.fault_progression || 0) * 100).toFixed(1)}%`}
            color={(tel.fault_progression || 0) > 0.3 ? 'text-red-400' : undefined} />
        </Section>

        {/* Maintenance */}
        <Section title="Predictive Maintenance">
          <Field label="Health Score" value={`${(health.health_score || 100).toFixed(1)}/100`} color={statusColor} />
          <Field label="Failure Probability" value={`${((maint.failure_probability || 0) * 100).toFixed(1)}%`}
            color={(maint.failure_probability || 0) > 0.5 ? 'text-red-400' : undefined} />
          <Field label="Urgency" value={(maint.urgency || 'scheduled').toUpperCase()}
            color={maint.urgency === 'immediate' ? 'text-red-400' : maint.urgency === 'high' ? 'text-amber-400' : undefined} />
          <Field label="Days to Failure" value={maint.days_to_estimated_failure || 'N/A'} />
          <div className="mt-2 p-2 bg-slate-900 rounded text-xs text-slate-300 leading-relaxed">
            {maint.recommended_action || 'No immediate action required'}
          </div>
        </Section>
      </div>

      {/* Anomaly + RCA */}
      {anomaly.is_anomalous && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Section title="⚠️ Anomaly Detection">
            <div className="text-xs space-y-1">
              <Field label="Anomaly Score" value={`${((anomaly.anomaly_score || 0) * 100).toFixed(1)}%`} color="text-amber-400" />
              {(anomaly.flags || []).map((f: any, i: number) => (
                <div key={i} className="p-1.5 bg-amber-950/30 border border-amber-700/30 rounded text-amber-300">
                  {f.type?.replace(/_/g, ' ')}: {typeof f.value === 'number' ? f.value.toFixed(3) : f.value}
                  {f.z_score && <span className="text-slate-500 ml-1">(Z={f.z_score})</span>}
                </div>
              ))}
            </div>
          </Section>

          <Section title="🔍 Root Cause Analysis">
            <div className="text-xs space-y-2">
              {(rca.hypotheses || []).slice(0, 4).map((h: any, i: number) => (
                <div key={i} className="p-2 bg-slate-900 rounded border border-slate-700">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-white">{h.cause?.replace(/_/g, ' ')}</span>
                    <span className="text-blue-400">{((h.confidence || 0) * 100).toFixed(0)}%</span>
                  </div>
                  <div className="text-slate-500 mt-1">{h.description}</div>
                  <div className="text-slate-600 mt-0.5">Indicators: {(h.matching_indicators || []).join(', ')}</div>
                </div>
              ))}
            </div>
          </Section>
        </div>
      )}

      {/* Financial Impact */}
      {loss.daily_lost_inr > 0 && (
        <Section title="💰 Financial Impact">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-xs text-slate-500">Daily Energy Loss</div>
              <div className="text-lg font-bold text-red-400">₹{(loss.daily_lost_inr || 0).toLocaleString()}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500">Lost kWh/day</div>
              <div className="text-lg font-bold text-amber-400">{(loss.daily_lost_kwh || 0).toFixed(0)}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500">90-Day Risk</div>
              <div className="text-lg font-bold text-red-300">₹{((loss.projected_90day_loss_inr || 0) / 1000).toFixed(0)}K</div>
            </div>
          </div>
        </Section>
      )}

      {/* WHAT / WHY / EVIDENCE / IMPACT / ACTION */}
      {anomaly.is_anomalous && (
        <div className="card border-amber-700/40 bg-amber-950/20">
          <h3 className="text-sm font-bold text-amber-300 mb-3">🔎 Explainability</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {[
              ['WHAT', `${assetId} is showing anomalous behavior with a score of ${((anomaly.anomaly_score || 0) * 100).toFixed(0)}%.`],
              ['WHY', `Root cause analysis indicates ${rca.top_cause?.replace(/_/g, ' ') || 'unknown cause'} (confidence: ${((rca.hypotheses?.[0]?.confidence || 0) * 100).toFixed(0)}%).`],
              ['EVIDENCE', (anomaly.flags || []).map((f: any) => f.type?.replace(/_/g, ' ')).join(', ') || 'Telemetry deviation'],
              ['IMPACT', loss.daily_lost_inr > 0 ? `₹${loss.daily_lost_inr.toLocaleString()}/day energy loss. Failure in ~${maint.days_to_estimated_failure} days if untreated.` : 'Monitor closely'],
              ['ACTION', maint.recommended_action || 'Inspect asset'],
            ].map(([title, text]) => (
              <div key={title} className="p-2 bg-slate-900/50 rounded border border-slate-700/50">
                <div className="text-amber-400 font-bold text-xs mb-1">{title}</div>
                <div className="text-slate-300 leading-relaxed">{text}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
