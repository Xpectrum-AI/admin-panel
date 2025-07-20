const https = require('https');

function makeRequest(url, options) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {}
    };

    const req = https.request(requestOptions, (res) => {
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

async function testLiveAgents() {
  console.log('Testing Live API Agents Endpoint...\n');

  const LIVE_API_BASE_URL = process.env.LIVE_API_BASE_URL || 'https://live.xpectrum-ai.com';
  const LIVE_API_KEY = process.env.LIVE_API_KEY || 'xpectrum-ai@123';

  try {
    console.log('1. Testing /agents/all endpoint...');
    const response = await makeRequest(`${LIVE_API_BASE_URL}/agents/all`, {
      method: 'GET',
      headers: {
        'X-API-Key': LIVE_API_KEY,
        'Content-Type': 'application/json'
      }
    });

    console.log('   Status:', response.status);
    console.log('   Headers:', response.headers);
    
    if (response.ok) {
      const data = await response.json();
      console.log('   Response data:', JSON.stringify(data, null, 2));
      
      // Check different possible structures
      if (data.agents && Array.isArray(data.agents)) {
        console.log('   Found agents in data.agents:', data.agents.length);
      } else if (data.data && Array.isArray(data.data)) {
        console.log('   Found agents in data.data:', data.data.length);
      } else if (Array.isArray(data)) {
        console.log('   Response is directly an array:', data.length);
      } else {
        console.log('   Response structure analysis:');
        for (const key in data) {
          console.log(`     ${key}: ${typeof data[key]} ${Array.isArray(data[key]) ? `(array with ${data[key].length} items)` : ''}`);
        }
      }
    } else {
      const errorText = await response.text();
      console.log('   Error Response:', errorText);
    }
  } catch (error) {
    console.log('   Error:', error.message);
  }

  console.log('\nTest completed.');
}

testLiveAgents(); 