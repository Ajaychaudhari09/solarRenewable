import React, { useState, useEffect, useRef } from 'react';
import {
  Activity,
  ShieldAlert,
  Zap,
  TrendingUp,
  Cpu,
  RefreshCw,
  Terminal,
  CheckCircle,
  AlertTriangle,
  Radio,
  Sliders,
  Database,
  Sun,
  Wind,
  Layers,
  BarChart3,
  DollarSign,
  Leaf,
  Settings,
  Eye,
  X,
  ShoppingBag,
} from 'lucide-react';

interface AgentData {
  id: string;
  name: string;
  tier: string;
  status: string;
  confidence: number;
  metrics: any;
  decision: string;
}

interface ActivityLog {
  id: string;
  timestamp: string;
  agent: string;
  tier: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'calc';
  data?: any;
}

const TIERS = [
  { id: 'all', label: 'All 35 Agents', icon: Cpu, count: 35 },
  { id: 'Tier 1', label: 'Tier 1 · Ingestion & Consensus', icon: Database, count: 4 },
  { id: 'Tier 2', label: 'Tier 2 · Physics & Weather', icon: Sun, count: 6 },
  { id: 'Tier 3', label: 'Tier 3 · Diagnostics & Maint.', icon: ShieldAlert, count: 6 },
  { id: 'Tier 4', label: 'Tier 4 · Grid & Storage', icon: Zap, count: 6 },
  { id: 'Tier 5', label: 'Tier 5 · Trading & Subsidy', icon: ShoppingBag, count: 7 },
  { id: 'Tier 6', label: 'Tier 6 · Financial & Cognitive Twin', icon: DollarSign, count: 6 },
];

export default function AgentHub() {
  const [agents, setAgents] = useState<{ [key: string]: AgentData }>({});
  const [swarmMetrics, setSwarmMetrics] = useState<any>({});
  const [running, setRunning] = useState(false);
  const [autoCycle, setAutoCycle] = useState(true);
  const [selectedTier, setSelectedTier] = useState('all');
  const [selectedAgent, setSelectedAgent] = useState<AgentData | null>(null);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [lastTick, setLastTick] = useState<string | null>(null);
  const logEndRef = useRef<HTMLDivElement>(null);

  const runSwarmPipeline = async () => {
    setRunning(true);
    setError(null);
    try {
      const res = await fetch('/api/agents/run', { method: 'POST' });
      const data = await res.json();

      if (res.ok) {
        setAgents(data.agents || {});
        setSwarmMetrics(data.swarmMetrics || {});
        setLastTick(data.timestamp);

        if (data.activityStream && Array.isArray(data.activityStream)) {
          setLogs(data.activityStream);
        }
      } else {
        setError(data.error || 'Failed to trigger agent swarm');
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setRunning(false);
    }
  };

  useEffect(() => {
    runSwarmPipeline();
  }, []);

  useEffect(() => {
    if (!autoCycle) return;
    const interval = setInterval(() => {
      runSwarmPipeline();
    }, 8000);
    return () => clearInterval(interval);
  }, [autoCycle]);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const agentList = Object.values(agents);
  const filteredAgents =
    selectedTier === 'all'
      ? agentList
      : agentList.filter((a) => a.tier.toLowerCase().includes(selectedTier.toLowerCase()));

  return (
    <div className="space-y-6">
      {/* ── Top Header Banner ── */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-full">
                Challenge 14 · Full Autonomous Swarm
              </span>
              <span className="px-2.5 py-0.5 text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                35 Active Collaborative Agents Online
              </span>
              <span className="px-2.5 py-0.5 text-xs font-semibold bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-full">
                IBM Cloud · watsonx &amp; Granite LLM
              </span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              35-Agent Autonomous Renewable Intelligence Swarm
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-3xl">
              End-to-end multi-agent orchestration for Kutch &amp; Banaskantha hybrid parks: streaming live Open-Meteo weather, executing aerodynamic wind &amp; thermal solar physics, predicting failure with IBM Granite, managing P2P green energy trading, calculating PM Surya Ghar subsidies, and balancing Gujarat GETCO 66kV transmission.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => setAutoCycle(!autoCycle)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                autoCycle
                  ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300 shadow-sm shadow-emerald-500/20'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
              }`}
            >
              <Radio className={`w-3.5 h-3.5 ${autoCycle ? 'text-emerald-400 animate-pulse' : 'text-slate-400'}`} />
              <span>{autoCycle ? 'Swarm Auto-Run (8s)' : 'Auto-Run Paused'}</span>
            </button>

            <button
              onClick={runSwarmPipeline}
              disabled={running}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium text-xs rounded-lg shadow-lg shadow-blue-600/20 transition-all cursor-pointer active:scale-95"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${running ? 'animate-spin' : ''}`} />
              <span>{running ? 'Executing Swarm...' : 'Run Swarm Cycle'}</span>
            </button>
          </div>
        </div>

        {/* ── Fleet Real-Time KPI Strip ── */}
        <div className="mt-5 pt-4 border-t border-slate-800 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
            <span className="text-[10px] text-slate-500 uppercase font-semibold">Active Agents</span>
            <div className="text-lg font-bold text-white mt-0.5 flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-purple-400" />
              <span>35 / 35</span>
            </div>
          </div>
          <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
            <span className="text-[10px] text-slate-500 uppercase font-semibold">Total Hybrid Output</span>
            <div className="text-lg font-bold text-emerald-400 mt-0.5">
              {swarmMetrics.totalOutputMW ?? '—'} <span className="text-xs text-slate-400 font-normal">MW</span>
            </div>
          </div>
          <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
            <span className="text-[10px] text-slate-500 uppercase font-semibold">Solar / Wind Split</span>
            <div className="text-sm font-semibold text-slate-200 mt-1">
              {swarmMetrics.solarMW ?? '0'} MW / {swarmMetrics.windMW ?? '0'} MW
            </div>
          </div>
          <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
            <span className="text-[10px] text-slate-500 uppercase font-semibold">GETCO Headroom</span>
            <div className="text-lg font-bold text-cyan-400 mt-0.5">
              {swarmMetrics.headroomMW ?? '—'} <span className="text-xs text-slate-400 font-normal">MW</span>
            </div>
          </div>
          <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
            <span className="text-[10px] text-slate-500 uppercase font-semibold">Revenue Run-Rate</span>
            <div className="text-sm font-semibold text-amber-300 mt-1">
              ₹{(swarmMetrics.revenuePerHourINR || 0).toLocaleString()} <span className="text-[10px] text-slate-500">/hr</span>
            </div>
          </div>
          <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
            <span className="text-[10px] text-slate-500 uppercase font-semibold">CO₂ Offset</span>
            <div className="text-sm font-semibold text-teal-300 mt-1">
              {(swarmMetrics.carbonOffsetPerHourKg || 0).toLocaleString()} <span className="text-[10px] text-slate-500">kg/hr</span>
            </div>
          </div>
        </div>

        {lastTick && (
          <div className="mt-3 text-[11px] text-slate-500 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span>Last Autonomous Swarm Cycle: {new Date(lastTick).toLocaleTimeString()} ({swarmMetrics.executionDurationMs || 0} ms)</span>
            </div>
            <span className="text-blue-400 font-mono">Open-Meteo REST API + IBM Cloud IAM</span>
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 bg-red-950/50 border border-red-500/30 rounded-lg text-red-300 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ── Operational Tier Filter Tabs ── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {TIERS.map(({ id, label, icon: Icon, count }) => {
          const isActive = selectedTier === id;
          return (
            <button
              key={id}
              onClick={() => setSelectedTier(id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer border ${
                isActive
                  ? 'bg-blue-600 border-blue-500 text-white shadow-md shadow-blue-500/20'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{label}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  isActive ? 'bg-blue-700 text-white' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── 25 Agents Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredAgents.map((agent) => {
          const isSelected = selectedAgent?.id === agent.id;
          return (
            <div
              key={agent.id}
              onClick={() => setSelectedAgent(agent)}
              className={`bg-slate-900 border rounded-xl p-4 shadow-lg flex flex-col justify-between transition-all cursor-pointer hover:scale-[1.01] ${
                isSelected
                  ? 'border-blue-500 ring-1 ring-blue-500/50 shadow-blue-500/10'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                    {agent.tier}
                  </span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 font-mono">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    {Math.round(agent.confidence * 100)}% Conf
                  </span>
                </div>

                <h3 className="text-sm font-bold text-white mb-1">{agent.name}</h3>
                <p className="text-xs text-slate-400 mb-3 line-clamp-2 leading-relaxed">
                  {agent.decision}
                </p>

                {/* ── Key Metrics Preview ── */}
                <div className="bg-slate-950/80 rounded-lg p-2.5 border border-slate-800/80 space-y-1.5 text-xs">
                  {Object.entries(agent.metrics || {})
                    .slice(0, 3)
                    .map(([key, val]) => (
                      <div key={key} className="flex justify-between text-slate-300 text-[11px]">
                        <span className="text-slate-500 capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}:
                        </span>
                        <span className="font-semibold text-slate-200">
                          {typeof val === 'object' ? 'Details...' : String(val)}
                        </span>
                      </div>
                    ))}
                </div>
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
                <span className="capitalize text-emerald-400 font-medium">{agent.status}</span>
                <span className="text-blue-400 flex items-center gap-1 hover:underline">
                  <Eye className="w-3 h-3" /> Inspect Telemetry
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Real-Time Swarm Activity Console ── */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
        <div className="p-3.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-blue-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              35-Agent Autonomous Swarm Decision &amp; Event Stream
            </h3>
            <span className="px-2 py-0.5 text-[10px] rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
              Live Feed
            </span>
          </div>

          <div className="text-[11px] text-slate-500 font-mono flex items-center gap-2">
            <span>Logged Events: {logs.length}</span>
            <button
              onClick={() => setLogs([])}
              className="hover:text-slate-300 underline cursor-pointer"
            >
              Clear
            </button>
          </div>
        </div>

        <div className="p-4 font-mono text-xs max-h-72 overflow-y-auto space-y-1.5 bg-black/40">
          {logs.length === 0 ? (
            <div className="text-slate-600 italic">Waiting for autonomous swarm tick...</div>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="flex items-start gap-2 leading-relaxed">
                <span className="text-slate-500 shrink-0 select-none">[{log.timestamp}]</span>
                <span className="text-slate-600 shrink-0 select-none text-[10px]">[{log.tier}]</span>
                <span
                  className={`font-semibold shrink-0 select-none ${
                    log.type === 'calc'
                      ? 'text-cyan-400'
                      : log.type === 'warning'
                      ? 'text-amber-400'
                      : log.type === 'success'
                      ? 'text-emerald-400'
                      : 'text-purple-400'
                  }`}
                >
                  [{log.agent}]
                </span>
                <span className="text-slate-300">{log.message}</span>
              </div>
            ))
          )}
          <div ref={logEndRef} />
        </div>
      </div>

      {/* ── Detailed Agent Inspection Modal ── */}
      {selectedAgent && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-2xl w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedAgent(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg bg-slate-800 hover:bg-slate-700 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 text-xs font-semibold uppercase bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-full">
                {selectedAgent.tier}
              </span>
              <span className="px-2.5 py-0.5 text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full">
                Status: {selectedAgent.status.toUpperCase()}
              </span>
              <span className="px-2.5 py-0.5 text-xs font-semibold bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-full font-mono">
                {Math.round(selectedAgent.confidence * 100)}% Confidence
              </span>
            </div>

            <h2 className="text-xl font-bold text-white mb-2">{selectedAgent.name}</h2>
            <p className="text-sm text-slate-300 mb-5 p-3 rounded-lg bg-slate-950 border border-slate-800">
              <strong>Autonomous Decision:</strong> {selectedAgent.decision}
            </p>

            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Live Real-Time Telemetry &amp; Physics Variables
            </h3>

            <div className="bg-slate-950 rounded-lg p-4 border border-slate-800 font-mono text-xs overflow-x-auto">
              <pre className="text-slate-300">
                {JSON.stringify(selectedAgent.metrics, null, 2)}
              </pre>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setSelectedAgent(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium rounded-lg cursor-pointer"
              >
                Close Telemetry View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
