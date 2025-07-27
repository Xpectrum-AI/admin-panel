const https = require('https');

const API_BASE = 'https://admin-test.xpectrum-ai.com';
const API_KEY = 'xpectrum-ai@123';

const headers = {
  'X-API-Key': API_KEY,
  'Content-Type': 'application/json'
};

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: { ...headers, ...options.headers }
    };

    const req = https.request(requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: data
        });
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

async function testEndpoints() {
  console.log('Testing backend endpoints...\n');

  // Test 1: Root endpoint
  try {
    console.log('1. Testing root endpoint...');
    const response = await makeRequest(`${API_BASE}/`);
    console.log(`   Status: ${response.status}`);
    console.log(`   Response: ${response.data}\n`);
  } catch (error) {
    console.log(`   Error: ${error.message}\n`);
  }

  // Test 2: Agents all endpoint
  try {
    console.log('2. Testing /agents/all endpoint...');
    const response = await makeRequest(`${API_BASE}/agents/all`);
    console.log(`   Status: ${response.status}`);
    console.log(`   Response: ${response.data}\n`);
  } catch (error) {
    console.log(`   Error: ${error.message}\n`);
  }

  // Test 3: Agents trunks endpoint
  try {
    console.log('3. Testing /agents/trunks endpoint...');
    const response = await makeRequest(`${API_BASE}/agents/trunks`);
    console.log(`   Status: ${response.status}`);
    console.log(`   Response: ${response.data}\n`);
  } catch (error) {
    console.log(`   Error: ${error.message}\n`);
  }

  // Test 4: API org endpoint
  try {
    console.log('4. Testing /api/org/fetch-orgs-query endpoint...');
    const response = await makeRequest(`${API_BASE}/api/org/fetch-orgs-query`, {
      method: 'POST',
      body: JSON.stringify({})
    });
    console.log(`   Status: ${response.status}`);
    console.log(`   Response: ${response.data}\n`);
  } catch (error) {
    console.log(`   Error: ${error.message}\n`);
  }

  console.log('Testing completed!');
}

testEndpoints().catch(console.error); 