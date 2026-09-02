import React, { useState, useEffect } from 'react';
import { api } from '../api';

const STATUS_ICON: Record<string, string> = {
  success: '✅',
  warning: '⚠️',
  error:   '❌',
  running: '⏳',
  skipped: '⏭️',
};

const AGENT_DESCRIPTIONS: Record<string, string> = {
  data_quality:              'Validates telemetry — missing values, ranges, duplicates',
  sensor_health:             'Detects sensor drift, spikes, flatlines, comm failures',
  data_normalization:        'Normalizes raw readings to internal schema',
  solar_performance:         'Actual vs expected solar generation, efficiency',
  wind_performance:          'Turbine output vs power curve, capacity factor',
  hybrid_performance:        'Solar+Wind combined efficiency',
  weather_intelligence:      'Irradiance, wind, cloud cover, weather risk',
  solar_forecast:            'Solar generation forecast 1h/6h/24h (exp. smoothing)',
  wind_forecast:             'Wind forecast 1h/6h/24h (linear trend+damping)',
  anomaly_detection:         'Z-score + threshold anomaly detection',
  root_cause_analysis:       'Ranked hypotheses for observed anomalies',
  asset_health_scoring:      'Composite 0–100 health score per asset',
  predictive_maintenance:    'Failure probability + urgency (logistic model)',
  maintenance_prioritization:'Priority queue by risk × revenue × safety',
  maintenance_scheduling:    'Optimal maintenance windows from forecast',
  grid_integration:          'Generation vs grid capacity, curtailment',
  grid_risk:                 'Overload, curtailment, volatility risk',
  hybrid_balance_optimization:'Solar/Wind/Storage/Grid dispatch optimization',
  energy_storage_optimization:'Charge/Discharge/Hold with pricing logic',
  energy_loss_impact:        'Lost MWh, daily revenue loss, 90-day projection',
  financial_optimization:    'Revenue, maintenance ROI, peak pricing',
  carbon_impact:             'CO₂ avoided, sustainability metrics',
  operational_alerting:      'Critical/Warning/Optimization alerts',
  human_approval:            'Critical item escalation requiring operator review',
  digital_twin:              'Digital representation of energy park',
};

export default function AgentMonitor() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const refresh = async () => {
    setLoading(true);
    try {
      const d = await api.agentChain();
      setData(d);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { refresh(); }, []);

  const chain = data?.chain_log || [];
  const duration = data?.duration_ms || 0;
  const history = data?.execution_history || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-white">Agent Execution Chain</h2>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500">{duration.toFixed(0)} ms total</span>
          <button onClick={refresh} className="text-xs px-3 py-1 bg-slate-700 text-slate-300 rounded hover:bg-slate-600">
            {loading ? '⏳ Running…' : '↻ Refresh'}
          </button>
        </div>
      </div>

      {/* Chain visualization */}
      <div className="space-y-2">
        {chain.map((step: any, i: number) => (
          <div key={i} className={`agent-step ${step.status}`}>
            <span className="text-base">{STATUS_ICON[step.status] || '○'}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-white font-medium text-xs">{step.agent_id.replace(/_/g, ' ')}</span>
                <span className="text-slate-600 text-xs truncate hidden md:block">
                  {AGENT_DESCRIPTIONS[step.agent_id] || ''}
                </span>
              </div>
              {step.warnings?.length > 0 && (
                <div className="text-amber-400 text-xs mt-0.5">{step.warnings[0]}</div>
              )}
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span className="text-slate-500 text-xs">{step.duration_ms?.toFixed(1)}ms</span>
              <div className="w-12 h-1 bg-slate-700 rounded-full">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(step.confidence || 0) * 100}%` }} />
              </div>
              <span className="text-slate-500 text-xs">{((step.confidence || 0) * 100).toFixed(0)}%</span>
            </div>
            {i < chain.length - 1 && (
              <span className="absolute left-4 text-slate-700 text-xs" style={{ display: 'none' }}>↓</span>
            )}
          </div>
        ))}
      </div>

      {chain.length === 0 && (
        <div className="text-center text-slate-500 py-8">No agent chain data — click ↻ Refresh</div>
      )}

      {/* Execution history */}
      <div className="card">
        <h3 className="text-sm font-semibold text-slate-200 mb-3">Execution History</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-slate-400">
            <thead>
              <tr className="text-slate-500 border-b border-slate-700">
                <th className="text-left py-1 px-2">Timestamp</th>
                <th className="text-right py-1 px-2">Duration</th>
                <th className="text-right py-1 px-2">Alerts</th>
              </tr>
            </thead>
            <tbody>
              {history.slice(-10).reverse().map((h: any, i: number) => (
                <tr key={i} className="border-b border-slate-800">
                  <td className="py-1 px-2">{h.timestamp?.slice(0, 19)}</td>
                  <td className="py-1 px-2 text-right">{h.duration_ms?.toFixed(0)}ms</td>
                  <td className="py-1 px-2 text-right">{h.alert_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
