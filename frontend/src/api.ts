const API = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const api = {
  tick: () => fetch(`${API}/api/tick`).then(r => r.json()),
  dashboard: () => fetch(`${API}/api/dashboard`).then(r => r.json()),
  state: () => fetch(`${API}/api/state`).then(r => r.json()),
  asset: (id: string) => fetch(`${API}/api/asset/${id}`).then(r => r.json()),
  alerts: () => fetch(`${API}/api/alerts`).then(r => r.json()),
  maintenance: () => fetch(`${API}/api/maintenance`).then(r => r.json()),
  forecast: () => fetch(`${API}/api/forecast`).then(r => r.json()),
  grid: () => fetch(`${API}/api/grid`).then(r => r.json()),
  twin: () => fetch(`${API}/api/digital-twin`).then(r => r.json()),
  carbon: () => fetch(`${API}/api/carbon`).then(r => r.json()),
  agentChain: () => fetch(`${API}/api/agent-chain`).then(r => r.json()),
  parkConfig: () => fetch(`${API}/api/park-config`).then(r => r.json()),

  copilot: (question: string) =>
    fetch(`${API}/api/copilot`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question }),
    }).then(r => r.json()),

  injectFault: (fault_type: string) =>
    fetch(`${API}/api/inject-fault`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fault_type }),
    }).then(r => r.json()),

  clearFaults: () =>
    fetch(`${API}/api/clear-faults`, { method: 'POST' }).then(r => r.json()),

  runScenario: (scenario: Record<string, unknown>) =>
    fetch(`${API}/api/scenario`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(scenario),
    }).then(r => r.json()),
};
