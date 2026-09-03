import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

interface Ticket {
  _id: string;
  assetId: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  recommendedAction: string;
  estimatedDowntimeHrs: number;
  status: 'open' | 'in-progress' | 'resolved';
  graniteRationale?: string;
  notes?: string;
  createdAt: string;
  resolvedAt?: string;
}

export const MaintenanceView: React.FC = () => {
  const { token, role } = useAuth();
  const canModify = role === 'operator' || role === 'admin';

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedAssetId, setSelectedAssetId] = useState('KT-WT-05');
  const [analytics, setAnalytics] = useState<any>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [seedLoading, setSeedLoading] = useState(false);

  const fetchTickets = useCallback(async () => {
    if (!token) return;
    try {
      setTicketsLoading(true);
      const res = await fetch('/api/maintenance/tickets', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setTickets(data.tickets || []);
      }
    } catch (e) {
      console.error('Error fetching tickets', e);
    } finally {
      setTicketsLoading(false);
    }
  }, [token]);

  const fetchAssetAnalytics = useCallback(async (assetId: string) => {
    if (!token || !assetId) return;
    try {
      setAnalyticsLoading(true);
      setError(null);
      const res = await fetch(`/api/maintenance/analytics/${assetId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setAnalytics(data);
      } else {
        setError(data.error || 'Failed to fetch asset analytics');
      }
    } catch (e) {
      setError('Network error analyzing asset');
    } finally {
      setAnalyticsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchTickets();
    fetchAssetAnalytics(selectedAssetId);
  }, [fetchTickets, fetchAssetAnalytics, selectedAssetId]);

  const updateTicketStatus = async (ticketId: string, newStatus: string) => {
    if (!token || !canModify) return;
    try {
      setError(null);
      const res = await fetch(`/api/maintenance/tickets/${ticketId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMsg(data.message);
        fetchTickets();
      } else {
        setError(data.error || 'Failed to update ticket status');
      }
    } catch (e) {
      setError('Network error updating ticket');
    }
  };

  const handleGenerateTicket = async () => {
    if (!token || !canModify) return;
    try {
      setError(null);
      const res = await fetch('/api/maintenance/generate-ticket', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ assetId: selectedAssetId }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMsg(data.message);
        fetchTickets();
      } else {
        setError(data.error || 'Failed to generate ticket');
      }
    } catch (e) {
      setError('Network error generating ticket');
    }
  };

  const handleSeedHistory = async () => {
    if (!token) return;
    try {
      setSeedLoading(true);
      setError(null);
      const res = await fetch('/api/generation/seed-history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ days: 30 }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMsg(data.message);
        fetchAssetAnalytics(selectedAssetId);
      } else {
        setError(data.error || 'Failed to seed history');
      }
    } catch (e) {
      setError('Network error seeding history');
    } finally {
      setSeedLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">🔧</span>
            <h1 className="text-xl font-bold text-white">Predictive Maintenance & IBM Granite RCA</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Historical time-series trend analysis (rolling average, decline rate, variance) + LLM reasoning
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSeedHistory}
            disabled={seedLoading}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs font-medium text-amber-300 transition-colors"
          >
            {seedLoading ? 'Seeding...' : '⚡ Seed 30-Day Snapshots'}
          </button>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-3 rounded-lg bg-red-950/70 border border-red-800 text-red-300 text-xs flex items-center justify-between">
          <span>⚠ {error}</span>
          <button onClick={() => setError(null)} className="text-red-400">✕</button>
        </div>
      )}
      {successMsg && (
        <div className="p-3 rounded-lg bg-emerald-950/70 border border-emerald-800 text-emerald-300 text-xs flex items-center justify-between">
          <span>✓ {successMsg}</span>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-400">✕</button>
        </div>
      )}

      {/* Asset Predictive Intelligence Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-3 border-b border-slate-800">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <span>🧠</span>
              <span>Asset Health Diagnostic & Granite Copilot</span>
            </h2>
            <span className="text-[10px] font-mono text-purple-300 bg-purple-950/40 border border-purple-800/40 px-2 py-0.5 rounded mt-1 inline-block">
              AI-generated recommendation: IBM Granite LLM
            </span>
          </div>

          {/* Asset Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Select Asset:</span>
            <select
              value={selectedAssetId}
              onChange={(e) => setSelectedAssetId(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-blue-500"
            >
              <option value="KT-WT-05">KT-WT-05 (Kutch Wind Turbine - Degraded)</option>
              <option value="KT-WT-01">KT-WT-01 (Kutch Wind Turbine - Operational)</option>
              <option value="KT-PV-01">KT-PV-01 (Kutch Solar PV Array)</option>
              <option value="BK-PV-03">BK-PV-03 (Banaskantha Solar Array)</option>
              <option value="NEW-TEST-ASSET">NEW-TEST-ASSET (New Asset - Test &lt; 3 Days Guard)</option>
            </select>
          </div>
        </div>

        {analyticsLoading && (
          <div className="py-8 text-center text-xs text-slate-400">
            <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Computing time-series trend statistics and consulting IBM Granite...
          </div>
        )}

        {/* Insufficient History Guard (Prompt 23 requirement) */}
        {!analyticsLoading && analytics && !analytics.hasSufficientHistory && (
          <div className="p-6 bg-slate-950/60 border border-amber-800/50 rounded-xl text-center">
            <div className="text-2xl mb-2">⏳</div>
            <h3 className="text-sm font-bold text-amber-300 mb-1">
              {analytics.message || 'Insufficient history yet — check back after a few days of data'}
            </h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto mb-4">
              GridPulse requires at least 3 calendar days of historical telemetry snapshots in MongoDB before running Granite predictive regression.
            </p>
            <button
              onClick={handleSeedHistory}
              className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-medium transition-colors"
            >
              Seed 30-Day Simulated Telemetry Snapshots
            </button>
          </div>
        )}

        {/* Trend Statistics & Granite Insights */}
        {!analyticsLoading && analytics && analytics.hasSufficientHistory && (
          <div className="space-y-4">
            {/* Stat Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3">
                <div className="text-[10px] uppercase font-semibold text-slate-400">30-Day Rolling Avg</div>
                <div className="text-lg font-bold text-white mt-1">
                  {analytics.trendStats?.rollingAvgMW} MW
                </div>
                <div className="text-[10px] text-slate-500">
                  {analytics.trendStats?.avgCapacityFactor}% Capacity Factor
                </div>
              </div>

              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3">
                <div className="text-[10px] uppercase font-semibold text-slate-400">Decline Rate</div>
                <div className={`text-lg font-bold mt-1 ${analytics.trendStats?.rateOfDeclinePct > 8 ? 'text-red-400' : 'text-emerald-400'}`}>
                  {analytics.trendStats?.rateOfDeclinePct}%
                </div>
                <div className="text-[10px] text-slate-500">Window half-over-half</div>
              </div>

              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3">
                <div className="text-[10px] uppercase font-semibold text-slate-400">Output Variance</div>
                <div className="text-lg font-bold text-cyan-400 mt-1">
                  ±{analytics.trendStats?.varianceMW} MW
                </div>
                <div className="text-[10px] text-slate-500">Historical fluctuation</div>
              </div>

              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3">
                <div className="text-[10px] uppercase font-semibold text-slate-400">Evaluated Snapshots</div>
                <div className="text-lg font-bold text-purple-300 mt-1">
                  {analytics.trendStats?.snapshotCount}
                </div>
                <div className="text-[10px] text-slate-500">Spanning {analytics.trendStats?.historySpanDays} days</div>
              </div>
            </div>

            {/* Granite Explanation Box */}
            <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-800/40 text-xs">
              <div className="flex items-center justify-between mb-2">
                <div className="font-bold text-purple-300 flex items-center gap-1.5">
                  <span>✨</span>
                  <span>IBM Granite Root Cause & Recommendation</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">
                  {analytics.graniteInsight?.source}
                </span>
              </div>

              <div className="text-slate-200 whitespace-pre-line leading-relaxed bg-slate-950/60 p-3 rounded-lg border border-purple-900/30">
                {analytics.graniteInsight?.text}
              </div>

              {canModify && (
                <div className="mt-3 flex justify-end">
                  <button
                    onClick={handleGenerateTicket}
                    className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-medium transition-colors shadow-lg shadow-purple-600/30"
                  >
                    + Persist to MongoDB Maintenance Tickets
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Persistent Maintenance Tickets Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <span>📋</span>
              <span>Persistent Maintenance Tickets ({tickets.length})</span>
            </h2>
            <p className="text-xs text-slate-400">Stored in MongoDB MaintenanceTicket collection</p>
          </div>
          <button
            onClick={fetchTickets}
            disabled={ticketsLoading}
            className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 rounded-lg border border-slate-700"
          >
            Refresh
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="p-3">Asset</th>
                <th className="p-3">Urgency</th>
                <th className="p-3">Recommended Action</th>
                <th className="p-3">Est. Downtime</th>
                <th className="p-3">Status</th>
                <th className="p-3">Created</th>
                {canModify && <th className="p-3 text-right">Update Status</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {tickets.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    No open maintenance tickets in MongoDB.
                  </td>
                </tr>
              )}
              {tickets.map((t) => (
                <tr key={t._id} className="hover:bg-slate-800/40">
                  <td className="p-3 font-mono font-bold text-white">{t.assetId}</td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                        t.urgency === 'critical'
                          ? 'bg-red-950 text-red-400 border border-red-800'
                          : t.urgency === 'high'
                          ? 'bg-amber-950 text-amber-400 border border-amber-800'
                          : 'bg-blue-950 text-blue-400 border border-blue-800'
                      }`}
                    >
                      {t.urgency}
                    </span>
                  </td>
                  <td className="p-3 text-slate-200 max-w-xs">{t.recommendedAction}</td>
                  <td className="p-3 text-slate-400">{t.estimatedDowntimeHrs} hrs</td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                        t.status === 'open'
                          ? 'bg-amber-950 text-amber-400 border border-amber-800'
                          : t.status === 'in-progress'
                          ? 'bg-blue-950 text-blue-400 border border-blue-800'
                          : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      }`}
                    >
                      {t.status}
                    </span>
                  </td>
                  <td className="p-3 text-slate-400">
                    {new Date(t.createdAt).toLocaleDateString()}
                  </td>
                  {canModify && (
                    <td className="p-3 text-right space-x-1.5">
                      {t.status === 'open' && (
                        <button
                          onClick={() => updateTicketStatus(t._id, 'in-progress')}
                          className="px-2 py-1 bg-blue-900/60 hover:bg-blue-800 border border-blue-700 text-blue-200 rounded text-xs"
                        >
                          Start Work
                        </button>
                      )}
                      {t.status === 'in-progress' && (
                        <button
                          onClick={() => updateTicketStatus(t._id, 'resolved')}
                          className="px-2 py-1 bg-emerald-900/60 hover:bg-emerald-800 border border-emerald-700 text-emerald-200 rounded text-xs"
                        >
                          Resolve
                        </button>
                      )}
                      {t.status === 'resolved' && (
                        <span className="text-emerald-400 text-xs">✓ Complete</span>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MaintenanceView;
