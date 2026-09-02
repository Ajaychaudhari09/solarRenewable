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
import RooftopSolar from './components/RooftopSolar';
import IndiaContext from './components/IndiaContext';

type Tab = 'overview' | 'assets' | 'alerts' | 'maintenance' | 'forecast' | 'grid' | 'agents' | 'copilot' | 'rooftop' | 'india';
type UserMode = 'operator' | 'simple';

function App() {
  const [tab, setTab] = useState<Tab>('overview');
  const [dashboard, setDashboard] = useState<any>(null);
  const [selectedAsset, setSelectedAsset] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastTick, setLastTick] = useState<string>('');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [userMode, setUserMode] = useState<UserMode>('operator');
  const [location, setLocation] = useState('kutch');
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.dashboard();
      setDashboard(data);
      setLastTick(new Date().toLocaleTimeString());
    } catch (e: any) {
      setError('Cannot connect to backend. Start backend with: cd backend && python main.py');
      console.error('Dashboard error', e);
    } finally {
      setLoading(false);
    }
  }, []);

  const tick = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      await api.tick();
      await refresh();
    } catch (e: any) {
      setError('Tick failed — ' + e.message);
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

  const criticalCount = dashboard?.overview?.critical_alerts || 0;
  const faultActive = dashboard?.fault_state && Object.values(dashboard.fault_state).some(Boolean);

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'overview',    label: 'Overview',    icon: '⚡' },
    { id: 'india',       label: 'India',       icon: '🇮🇳' },
    { id: 'rooftop',     label: 'Rooftop',     icon: '🏠' },
    { id: 'assets',      label: 'Assets',      icon: '🏭' },
    { id: 'alerts',      label: criticalCount > 0 ? `Alerts (${criticalCount})` : 'Alerts', icon: '🔔' },
    { id: 'maintenance', label: 'Maintenance', icon: '🔧' },
    { id: 'forecast',    label: 'Forecast',    icon: '📈' },
    { id: 'grid',        label: 'Grid',        icon: '⚙️' },
    { id: 'agents',      label: 'Agents',      icon: '🤖' },
    { id: 'copilot',     label: 'AI Copilot',  icon: '💬' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* ── Header ── */}
      <header className="border-b border-slate-800 bg-slate-900/95 backdrop-blur sticky top-0 z-50">
        <div className="max-w-screen-2xl mx-auto px-3 sm:px-6">
          <div className="flex items-center justify-between h-14">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-sm shrink-0">GP</div>
              <div className="hidden sm:block">
                <div className="text-sm font-bold text-white leading-none">GridPulse AI</div>
                <div className="text-xs text-slate-500">Kutch-Banaskantha · Gujarat, India</div>
              </div>
            </div>

            {/* Center: mode toggle */}
            <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-0.5">
              {(['operator', 'simple'] as UserMode[]).map(m => (
                <button
                  key={m}
                  onClick={() => setUserMode(m)}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                    userMode === m ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {m === 'operator' ? '⚙️ Operator' : '👤 Simple'}
                </button>
              ))}
            </div>

            {/* Right controls */}
            <div className="flex items-center gap-2">
              {loading && <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />}
              {lastTick && <span className="text-xs text-slate-500 hidden sm:block">{lastTick}</span>}
              <button
                onClick={() => setAutoRefresh(v => !v)}
                className={`px-2 py-1 rounded text-xs font-medium ${autoRefresh ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-400'}`}
              >
                {autoRefresh ? '⏸ Live' : '▶ Live'}
              </button>
              <button onClick={tick} disabled={loading}
                className="px-2 py-1 rounded bg-slate-700 text-slate-400 hover:bg-slate-600 text-xs disabled:opacity-50">
                ↻
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ── Error banner ── */}
      {error && (
        <div className="bg-red-900/60 border-b border-red-700/50 text-red-300 text-xs px-4 py-2 text-center">
          ⚠ {error}
        </div>
      )}

      {/* ── Demo Controls ── */}
      <DemoControls onFaultInjected={refresh} onCleared={refresh} />

      {/* ── Fault banner ── */}
      {faultActive && (
        <div className="bg-red-950/60 border-b border-red-800/50 text-red-300 text-xs px-4 py-1.5 text-center font-medium">
          🚨 SIMULATION ACTIVE:{' '}
          {Object.entries(dashboard.fault_state)
            .filter(([, v]) => v)
            .map(([k]) => k.replace(/_/g, ' ').toUpperCase())
            .join(' · ')}
        </div>
      )}

      {/* ── Simple mode banner ── */}
      {userMode === 'simple' && (
        <div className="bg-blue-950/60 border-b border-blue-800/50 text-blue-300 text-xs px-4 py-1.5 text-center">
          👤 Simple Mode — explanations in plain language
        </div>
      )}

      {/* ── Navigation ── */}
      <nav className="border-b border-slate-800 bg-slate-900/40">
        <div className="max-w-screen-2xl mx-auto px-3 sm:px-6">
          <div className="flex gap-0.5 overflow-x-auto py-1.5 scrollbar-hide">
            {tabs.map(t => (
              <button
                key={t.id}
                onClick={() => { setTab(t.id); if (t.id !== 'assets') setSelectedAsset(null); }}
                className={`nav-btn whitespace-nowrap flex items-center gap-1.5 ${tab === t.id ? 'active' : ''} ${
                  t.id === 'alerts' && criticalCount > 0 ? 'text-red-400' : ''
                }`}
              >
                <span className="text-base leading-none">{t.icon}</span>
                <span className="hidden sm:inline">{t.label}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* ── Main content ── */}
      <main className="max-w-screen-2xl mx-auto px-3 sm:px-6 py-5 w-full flex-1">
        {tab === 'overview' && (
          <Overview
            dashboard={dashboard}
            userMode={userMode}
            onSelectAsset={(id) => { setSelectedAsset(id); setTab('assets'); }}
          />
        )}
        {tab === 'india' && <IndiaContext location={location} onLocationChange={setLocation} />}
        {tab === 'rooftop' && <RooftopSolar location={location} userMode={userMode} />}
        {tab === 'assets' && !selectedAsset && (
          <AssetMap dashboard={dashboard} onSelect={setSelectedAsset} />
        )}
        {tab === 'assets' && selectedAsset && (
          <AssetDetail assetId={selectedAsset} onBack={() => setSelectedAsset(null)} userMode={userMode} />
        )}
        {tab === 'alerts' && <AlertCenter userMode={userMode} />}
        {tab === 'maintenance' && <MaintenanceCenter />}
        {tab === 'forecast' && <ForecastCenter />}
        {tab === 'grid' && <GridCenter />}
        {tab === 'agents' && <AgentMonitor />}
        {tab === 'copilot' && <Copilot userMode={userMode} location={location} />}
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-slate-800 text-center text-xs text-slate-600 py-3 px-4">
        GridPulse AI · IBM Hackathon 2024 · Challenge 14 — Solar-Wind Hybrid Asset Monitoring
        · Kutch & Banaskantha, Gujarat, India · Built with IBM Bob + IBM Granite
      </footer>
    </div>
  );
}

export default App;
