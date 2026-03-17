
const axios = require('axios');

const API_URL = 'http://localhost:5000/api';
const CONCURRENT_REQUESTS = 100;
const TEST_EMAIL = 'demo@medcore.in';
const TEST_PASSWORD = 'demo123';

async function runStressTest() {
  console.log('🚀 Starting Senior QA Stress Test...');
  console.log(`📊 Concurrency: ${CONCURRENT_REQUESTS} requests`);
  
  let successCount = 0;
  let failCount = 0;
  const start = Date.now();

  // 1. Authenticate first
  console.log('🔑 Authenticating...');
  let token;
  try {
    const loginRes = await axios.post(`${API_URL}/auth/login`, {
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    });
    token = loginRes.data.user.token;
    console.log('✅ Authenticated.');
  } catch (err) {
    console.error('❌ Authentication failed. Make sure the server is running on port 5000.');
    return;
  }

  // 2. Prepare payload
  const createPayload = (i) => ({
    patients: [{
      mobile: `stress_${Date.now()}_${i}`,
      name: `Stress Patient ${i}`,
      age: 30,
      gender: 'Male'
    }],
    visits: [],
    families: [],
    appointments: [],
    reports: [],
    customDiagnoses: [],
    templates: []
  });

  // 3. Fire concurrent requests
  console.log('🔥 Pushing concurrent records...');
  const requests = Array.from({ length: CONCURRENT_REQUESTS }).map((_, i) => {
    return axios.post(`${API_URL}/sync/push-all`, createPayload(i), {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(() => { successCount++; })
    .catch((err) => { 
      failCount++; 
      console.error(`Request ${i} failed: ${err.message}`);
    });
  });

  await Promise.all(requests);

  const duration = (Date.now() - start) / 1000;
  console.log('\n--- 🏁 Stress Test Results ---');
  console.log(`⏱️  Duration: ${duration.toFixed(2)}s`);
  console.log(`✅ Success: ${successCount}`);
  console.log(`❌ Failed: ${failCount}`);
  console.log(`📈 Throughput: ${(successCount / duration).toFixed(2)} req/s`);
  
  if (failCount > 0) {
    console.log('⚠️  WARNING: High failure rate detected under concurrency.');
  } else {
    console.log('💎 EXCELLENT: Server handled concurrency with 0% error rate.');
  }
}

runStressTest();
