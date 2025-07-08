const http = require('http');

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || 80,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {}
    };

    const req = http.request(requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          ok: res.statusCode >= 200 && res.statusCode < 300,
          status: res.statusCode,
          headers: res.headers,
          json: async () => {
            try {
              return JSON.parse(data);
            } catch (e) {
              throw new Error('Invalid JSON response');
            }
          },
          text: async () => data
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
  console.log('Testing Backend Endpoints...\n');

  const baseUrl = 'http://localhost:8000';
  const headers = {
    'X-API-Key': 'xpectrum-ai@123',
    'Content-Type': 'application/json'
  };

  // Test 1: Root endpoint
  try {
    console.log('1. Testing root endpoint...');
    const response = await makeRequest(`${baseUrl}/`, { headers });
    console.log('   Status:', response.status);
    if (response.ok) {
      const data = await response.json();
      console.log('   Response:', data);
    }
  } catch (error) {
    console.log('   Error:', error.message);
  }

  // Test 2: Agents all endpoint
  try {
    console.log('\n2. Testing /agents/all endpoint...');
    const response = await makeRequest(`${baseUrl}/agents/all`, { headers });
    console.log('   Status:', response.status);
    if (response.ok) {
      const data = await response.json();
      console.log('   Response:', data);
    } else {
      const errorText = await response.text();
      console.log('   Error Response:', errorText);
    }
  } catch (error) {
    console.log('   Error:', error.message);
  }

  // Test 3: Agents health endpoint
  try {
    console.log('\n3. Testing /agents/health endpoint...');
    const response = await makeRequest(`${baseUrl}/agents/health`, { headers });
    console.log('   Status:', response.status);
    if (response.ok) {
      const data = await response.json();
      console.log('   Response:', data);
    } else {
      const errorText = await response.text();
      console.log('   Error Response:', errorText);
    }
  } catch (error) {
    console.log('   Error:', error.message);
  }

  console.log('\nTest completed.');
}

testEndpoints(); 