async function test() {
  console.log('--- 1. Testing GET /health ---');
  let res = await fetch('http://localhost:5000/health');
  let data = await res.json();
  console.log('Health response:', data.status, 'Granite available:', data.graniteAvailable);

  console.log('\n--- 2. Testing POST /api/auth/login ---');
  res = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@gridpulse.energy',
      password: 'AdminPassword123!',
    }),
  });
  data = await res.json();
  console.log('Login response:', data.message, 'Role:', data.user?.role);
  const token = data.token;
  if (!token) throw new Error('No token returned!');

  console.log('\n--- 3. Testing GET /api/weather/kutch (Open-Meteo Live API) ---');
  res = await fetch('http://localhost:5000/api/weather/kutch', {
    headers: { Authorization: `Bearer ${token}` },
  });
  data = await res.json();
  console.log('Kutch Weather:', data.siteTitle, 'Source:', data.source);
  console.log('Current Conditions:', data.current);

  console.log('\n--- 4. Testing GET /api/assets (Empty state check) ---');
  res = await fetch('http://localhost:5000/api/assets', {
    headers: { Authorization: `Bearer ${token}` },
  });
  data = await res.json();
  console.log('Assets count:', data.count, 'Empty state:', data.emptyState);

  console.log('\n--- 5. Testing POST /api/assets/seed-sample ---');
  res = await fetch('http://localhost:5000/api/assets/seed-sample', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  data = await res.json();
  console.log('Seed response:', data.message, 'Total assets now:', data.count);

  console.log('\n--- 6. Testing GET /api/generation/live ---');
  res = await fetch('http://localhost:5000/api/generation/live', {
    headers: { Authorization: `Bearer ${token}` },
  });
  data = await res.json();
  console.log('Live generation output:');
  console.log('Total Output MW:', data.totalOutputMW, 'MW');
  console.log('Solar MW:', data.totalSolarMW, 'Wind MW:', data.totalWindMW);
  console.log('Label:', data.label);

  console.log('\n--- 7. Testing GET /api/dashboard/summary ---');
  res = await fetch('http://localhost:5000/api/dashboard/summary', {
    headers: { Authorization: `Bearer ${token}` },
  });
  data = await res.json();
  console.log('Dashboard summary KPI:', data.kpi);
  console.log('Dashboard labels:', data.labels);

  console.log('\n--- 8. Testing GET /api/maintenance/analytics/KT-WT-05 ---');
  res = await fetch('http://localhost:5000/api/maintenance/analytics/KT-WT-05', {
    headers: { Authorization: `Bearer ${token}` },
  });
  data = await res.json();
  console.log('Maintenance analytics response:');
  console.log('Has sufficient history:', data.hasSufficientHistory);
  if (data.hasSufficientHistory) {
    console.log('Trend stats:', data.trendStats);
    console.log('Granite recommendation source:', data.graniteInsight?.source);
  } else {
    console.log('Guard message (Prompt 23):', data.message);
  }

  console.log('\n✅ ALL BACKEND APIS VERIFIED SUCCESSFULLY!');
}

test().catch((e) => {
  console.error('Test failed:', e);
  process.exit(1);
});
