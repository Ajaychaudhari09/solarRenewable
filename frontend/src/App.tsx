import React, { useState, useEffect, useCallback } from 'react';
import { api } from './api';
import Overview from './components/Overview';
import AssetMap from './components/AssetMap';
import AssetDetail from './components/AssetDetail';
import AlertCenter from './components/AlertCenter';
import MaintenanceCenter from './components/MaintenanceCenter';
import ForecastCenter from './components/ForecastCenter';
import GridCenter from './components/GridCenter';
import AgentMonitor from './components/AgentMonitor';
import Copilot from './components/Copilot';
import DemoControls from './components/DemoControls';

type Tab = 'overview' | 'assets' | 'alerts' | 'maintenance' | 'forecast' | 'grid' | 'agents' | 'copilot';

function App() {
  const [tab, setTab] = useState<Tab>('overview');
  const [dashboard, setDashboard] = useState<any>(null);
  const [selectedAsset, setSelectedAsset] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastTick, setLastTick] = useState<string>('');
  const [autoRefresh, setAutoRefresh] = useState(false);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.dashboard();
      setDashboard(data);
      setLastTick(new Date().toLocaleTimeString());
    } catch (e) {
      console.error('Dashboard error', e);
    } finally {
      setLoading(false);
    }
  }, []);

  const tick = useCallback(async () => {
    try {
      setLoading(true);
      await api.tick();
      await refresh();
    } catch (e) {
      console.error('Tick error', e);
    } finally {
      setLoading(false);
    }
  }, [refresh]);

  useEffect(() => { refresh(); }, [refresh]);

  useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(tick, 5000);
    return () => clearInterval(id);
  }, [autoRefresh, tick]);

  const tabs: { id: Tab; label: string }[] = [
    { id: 'overview',    label: '⚡ Overview' },
    { id: 'assets',      label: '🏭 Assets' },
    { id: 'alerts',      label: `🔔 Alerts${dashboard?.overview?.critical_alerts ? ` (${dashboard.overview.critical_alerts})` : ''}` },
    { id: 'maintenance', label: '🔧 Maintenance' },
    { id: 'forecast',    label: '📈 Forecast' },
    { id: 'grid',        label: '⚙️ Grid' },
    { id: 'agents',      label: '🤖 Agents' },
    { id: 'copilot',     label: '💬 Copilot' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-screen-2xl mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-sm font-bold">GP</div>
              <div>
                <div className="text-sm font-bold text-white leading-none">GridPulse AI</div>
                <div className="text-xs text-slate-500">Kutch-Banaskantha Hybrid Park</div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              {loading && <span className="text-blue-400 animate-pulse">●</span>}
              {lastTick && <span>Updated {lastTick}</span>}
              <button
                onClick={() => setAutoRefresh(v => !v)}
                className={`px-2 py-1 rounded text-xs ${autoRefresh ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-400'}`}
              >
                {autoRefresh ? '⏸ Live' : '▶ Start Live'}
              </button>
              <button onClick={tick} className="px-2 py-1 rounded bg-slate-700 text-slate-400 hover:bg-slate-600">
                ↻ Tick
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Demo Controls bar */}
      <DemoControls onFaultInjected={refresh} onCleared={refresh} />

      {/* Navigation */}
      <nav className="border-b border-slate-800 bg-slate-900/40">
        <div className="max-w-screen-2xl mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto py-2">
            {tabs.map(t => (
              <button
                key={t.id}
                onClick={() => { setTab(t.id); setSelectedAsset(null); }}
                className={`nav-btn whitespace-nowrap ${tab === t.id ? 'active' : ''}`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Fault state banner */}
      {dashboard?.fault_state && Object.values(dashboard.fault_state).some(Boolean) && (
        <div className="bg-red-900/40 border-b border-red-700/50 text-red-300 text-xs px-4 py-2 text-center">
          🚨 SIMULATION ACTIVE:{' '}
          {Object.entries(dashboard.fault_state)
            .filter(([, v]) => v)
            .map(([k]) => k.replace(/_/g, ' ').toUpperCase())
            .join(' | ')}
        </div>
      )}

      {/* Main content */}
      <main className="max-w-screen-2xl mx-auto px-4 py-6">
        {tab === 'overview' && <Overview dashboard={dashboard} onSelectAsset={(id) => { setSelectedAsset(id); setTab('assets'); }} />}
        {tab === 'assets' && !selectedAsset && <AssetMap dashboard={dashboard} onSelect={setSelectedAsset} />}
        {tab === 'assets' && selectedAsset && (
          <AssetDetail assetId={selectedAsset} onBack={() => setSelectedAsset(null)} />
        )}
        {tab === 'alerts' && <AlertCenter />}
        {tab === 'maintenance' && <MaintenanceCenter />}
        {tab === 'forecast' && <ForecastCenter />}
        {tab === 'grid' && <GridCenter />}
        {tab === 'agents' && <AgentMonitor />}
        {tab === 'copilot' && <Copilot />}
      </main>
    </div>
  );
}

export default App;
