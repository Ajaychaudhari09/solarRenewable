import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import AssetManagement from './pages/admin/AssetManagement';
import MaintenanceView from './pages/MaintenanceView';
import UserManagement from './pages/admin/UserManagement';
import GridCenter from './components/GridCenter';
import Copilot from './components/Copilot';
import AgentHub from './pages/AgentHub';
import EnergyMarketplace from './pages/EnergyMarketplace';
import GujaratMap from './pages/GujaratMap';

type NavView = 'dashboard' | 'map' | 'agents' | 'marketplace' | 'assets' | 'maintenance' | 'grid' | 'admin' | 'copilot';

function MainApp() {
  const { user, role, logout, isAuthenticated, isLoading } = useAuth();
  const [currentView, setCurrentView] = useState<NavView>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-slate-400 font-mono">Initializing GridPulse Intelligence...</span>
        </div>
      </div>
    );
  }

  // If not authenticated, show Login or Register view
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between">
        <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur py-3 px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-sm text-white">
              GP
            </div>
            <div>
              <div className="text-sm font-bold text-white leading-none">GridPulse AI</div>
              <div className="text-[11px] text-slate-400">Kutch & Banaskantha Renewable Monitoring</div>
            </div>
          </div>
          <div className="text-xs text-slate-500 font-mono hidden sm:block">
            Gujarat Hybrid Solar-Wind Operations
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center">
          {authMode === 'login' ? (
            <Login
              onSuccess={() => setCurrentView('dashboard')}
              onGoToRegister={() => setAuthMode('register')}
            />
          ) : (
            <Register
              onSuccess={() => setCurrentView('dashboard')}
              onGoToLogin={() => setAuthMode('login')}
            />
          )}
        </main>

        <footer className="border-t border-slate-800/80 text-center text-xs text-slate-600 py-3 px-4">
          GridPulse AI · IBM Hackathon Challenge 14 · Auth &amp; MongoDB Enabled · Built with IBM Granite LLM
        </footer>
      </div>
    );
  }

  const navItems: { id: NavView; label: string; icon: string; adminOnly?: boolean }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: '⚡' },
    { id: 'map', label: 'Gujarat GIS Map', icon: '🗺️' },
    { id: 'agents', label: '35 AI Agents Swarm', icon: '🤖' },
    { id: 'marketplace', label: 'Energy Market & Subsidy', icon: '💰' },
    { id: 'assets', label: 'Assets', icon: '🏭' },
    { id: 'maintenance', label: 'Maintenance', icon: '🔧' },
    { id: 'grid', label: 'Grid Optimization', icon: '⚙️' },
    { id: 'copilot', label: 'Multilingual Copilot', icon: '💬' },
    { id: 'admin', label: 'User Admin', icon: '👥', adminOnly: true },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* ── Top Header ── */}
      <header className="border-b border-slate-800 bg-slate-900/95 backdrop-blur sticky top-0 z-40">
        <div className="px-4 sm:px-6 h-14 flex items-center justify-between">
          {/* Left: Mobile hamburger + Logo */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              aria-label="Toggle navigation"
            >
              ☰
            </button>

            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-sm text-white shrink-0 shadow-md shadow-blue-600/30">
              GP
            </div>
            <div>
              <div className="text-sm font-bold text-white leading-none">GridPulse AI</div>
              <div className="text-[11px] text-slate-400 hidden sm:block">
                Kutch &amp; Banaskantha · Gujarat, India
              </div>
            </div>
          </div>

          {/* Center: Live Weather & Generation Attributions (Prompt 24) */}
          <div className="hidden lg:flex items-center gap-2 text-[11px] font-mono">
            <span className="bg-slate-800/90 text-cyan-300 border border-slate-700 px-2.5 py-1 rounded-full flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              Live weather: Open-Meteo
            </span>
            <span className="bg-slate-800/90 text-amber-300 border border-slate-700 px-2.5 py-1 rounded-full">
              Generation: modeled from live weather data
            </span>
          </div>

          {/* Right: User Profile + Logout */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-800/80 border border-slate-700/70 rounded-full py-1 px-3">
              <div className="w-6 h-6 rounded-full bg-blue-700 flex items-center justify-center font-semibold text-xs text-white">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-xs font-semibold text-white leading-none">{user?.name}</div>
                <span
                  className={`text-[9px] font-mono font-bold uppercase tracking-wider ${
                    role === 'admin'
                      ? 'text-amber-400'
                      : role === 'operator'
                      ? 'text-emerald-400'
                      : 'text-blue-400'
                  }`}
                >
                  {role}
                </span>
              </div>
            </div>

            <button
              onClick={logout}
              title="Sign Out"
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-slate-300 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* ── Body with Left Sidebar + Primary View (Prompt 24) ── */}
      <div className="flex flex-1 relative">
        {/* Left Sidebar Nav */}
        <aside
          className={`fixed md:sticky top-14 left-0 z-30 h-[calc(100vh-3.5rem)] w-56 bg-slate-900 border-r border-slate-800 p-3 transition-transform duration-200 ease-in-out flex flex-col justify-between ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
          }`}
        >
          <div className="space-y-1">
            <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider px-3 py-2">
              Navigation
            </div>
            {navItems.map((item) => {
              if (item.adminOnly && role !== 'admin') return null;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setCurrentView(item.id);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <span className="text-base">{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Sidebar Footer: System Status */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 text-[11px] text-slate-400 space-y-1">
            <div className="text-slate-300 font-semibold flex items-center justify-between">
              <span>DB Status:</span>
              <span className="text-emerald-400 font-mono">Local Mongo</span>
            </div>
            <div className="flex items-center justify-between text-[10px]">
              <span>Granite Copilot:</span>
              <span className="text-purple-300 font-mono">Active</span>
            </div>
          </div>
        </aside>

        {/* Mobile backdrop overlay */}
        {sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-slate-950/80 z-20 md:hidden"
          />
        )}

        {/* Primary View Content Container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-screen-2xl mx-auto w-full overflow-y-auto">
          {currentView === 'dashboard' && <Dashboard onNavigateTab={(tab) => setCurrentView(tab as NavView)} />}
          {currentView === 'map' && <GujaratMap />}
          {currentView === 'agents' && <AgentHub />}
          {currentView === 'marketplace' && <EnergyMarketplace />}
          {currentView === 'assets' && <AssetManagement />}
          {currentView === 'maintenance' && <MaintenanceView />}
          {currentView === 'grid' && <GridCenter />}
          {currentView === 'copilot' && <Copilot userMode={role === 'viewer' ? 'simple' : 'operator'} location="kutch" />}
          {currentView === 'admin' && (
            <ProtectedRoute allowedRoles={['admin']} onNavigate={(t) => setCurrentView(t as NavView)}>
              <UserManagement />
            </ProtectedRoute>
          )}
        </main>
      </div>

      {/* ── Footer ── */}
      <footer className="border-t border-slate-800 text-center text-xs text-slate-600 py-3 px-4 bg-slate-900/50">
        GridPulse AI · Challenge 14: Smart Renewable Energy Asset Monitoring · Kutch &amp; Banaskantha, Gujarat · Built with IBM Bob + IBM Granite
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
