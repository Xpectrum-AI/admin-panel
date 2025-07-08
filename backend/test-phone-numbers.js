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

async function testPhoneNumbers() {
  console.log('Testing Phone Number Functionality...\n');

  const LIVE_API_BASE_URL = 'https://live.xpectrum-ai.com';
  const LIVE_API_KEY = 'xpectrum-ai@123';
  const TEST_AGENT = 'agent-1';
  const TEST_PHONE = '+19147684790'; // Different phone number

  try {
    // Test 1: Check current agents
    console.log('1. Checking current agents...');
    const agentsResponse = await makeRequest(`${LIVE_API_BASE_URL}/agents/all`, {
      method: 'GET',
      headers: {
        'X-API-Key': LIVE_API_KEY,
        'Content-Type': 'application/json'
      }
    });

    if (agentsResponse.ok) {
      const agentsData = await agentsResponse.json();
      console.log('   Agents response:', JSON.stringify(agentsData, null, 2));
      
      if (agentsData.agents && agentsData.agents[TEST_AGENT]) {
        console.log(`   Agent ${TEST_AGENT} exists`);
        console.log(`   Agent ${TEST_AGENT} data:`, JSON.stringify(agentsData.agents[TEST_AGENT], null, 2));
      } else {
        console.log(`   Agent ${TEST_AGENT} not found`);
      }
    }

    // Test 2: Add phone number
    console.log('\n2. Adding phone number...');
    const addPhoneResponse = await makeRequest(`${LIVE_API_BASE_URL}/agents/add_phonenumber/${TEST_AGENT}`, {
      method: 'POST',
      headers: {
        'X-API-Key': LIVE_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ phone_number: TEST_PHONE })
    });

    console.log('   Add phone status:', addPhoneResponse.status);
    if (addPhoneResponse.ok) {
      const addPhoneData = await addPhoneResponse.json();
      console.log('   Add phone response:', JSON.stringify(addPhoneData, null, 2));
    } else {
      const errorText = await addPhoneResponse.text();
      console.log('   Add phone error:', errorText);
    }

    // Test 3: Check agents again to see if phone number appears
    console.log('\n3. Checking agents after adding phone...');
    const agentsResponse2 = await makeRequest(`${LIVE_API_BASE_URL}/agents/all`, {
      method: 'GET',
      headers: {
        'X-API-Key': LIVE_API_KEY,
        'Content-Type': 'application/json'
      }
    });

    if (agentsResponse2.ok) {
      const agentsData2 = await agentsResponse2.json();
      console.log('   Updated agents response:', JSON.stringify(agentsData2, null, 2));
      
      if (agentsData2.agents && agentsData2.agents[TEST_AGENT]) {
        console.log(`   Agent ${TEST_AGENT} after phone addition:`, JSON.stringify(agentsData2.agents[TEST_AGENT], null, 2));
      }
    }

    // Test 4: Check if there's a separate phone number endpoint
    console.log('\n4. Checking for separate phone number endpoint...');
    const phoneResponse = await makeRequest(`${LIVE_API_BASE_URL}/agents/phones`, {
      method: 'GET',
      headers: {
        'X-API-Key': LIVE_API_KEY,
        'Content-Type': 'application/json'
      }
    });

    console.log('   Phone numbers status:', phoneResponse.status);
    if (phoneResponse.ok) {
      const phoneData = await phoneResponse.json();
      console.log('   Phone numbers response:', JSON.stringify(phoneData, null, 2));
    } else {
      console.log('   No separate phone numbers endpoint found');
    }

  } catch (error) {
    console.log('   Error:', error.message);
  }

  console.log('\nTest completed.');
}

testPhoneNumbers(); 