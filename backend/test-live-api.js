import fetch from 'node-fetch';

const LIVE_API_BASE_URL = process.env.LIVE_API_BASE_URL || 'https://live.xpectrum-ai.com';
const LIVE_API_KEY = process.env.LIVE_API_KEY || 'xpectrum-ai@123';

async function testLiveAPI() {
  console.log('Testing Live API Connection...\n');

  // Test 1: Check if the API is reachable
  try {
    console.log('1. Testing API reachability...');
    const response = await fetch(`${LIVE_API_BASE_URL}/health`, {
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
      console.log('   Response:', data);
    } else {
      console.log('   API not reachable or authentication failed');
    }
  } catch (error) {
    console.log('   Error:', error.message);
  }

  // Test 2: Test agent update endpoint
  try {
    console.log('\n2. Testing agent update endpoint...');
    const testPayload = {
      chatbot_api: "https://demo.xpectrum-ai.com/v1/chat-messages",
      chatbot_key: "REDACTED",
      tts_config: {
        voice_id: "e8e5fffb-252c-436d-b842-8879b84445b6",
        tts_api_key: "REDACTED",
        model: "sonic-2",
        speed: 0.5
      },
      stt_config: {
        api_key: "05df4b7e4f1ce81d5e9fdfb4b0cadd02b317c373",
        model: "nova-2",
        language: "en-US"
      }
    };

    const response = await fetch(`${LIVE_API_BASE_URL}/agents/update/test-agent-123`, {
      method: 'POST',
      headers: {
        'X-API-Key': LIVE_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testPayload)
    });

    console.log('   Status:', response.status);
    console.log('   Headers:', response.headers);
    
    if (response.ok) {
      const data = await response.json();
      console.log('   Success Response:', data);
    } else {
      const errorData = await response.text();
      console.log('   Error Response:', errorData);
    }
  } catch (error) {
    console.log('   Error:', error.message);
  }

  // Test 3: Test phone number endpoint
  try {
    console.log('\n3. Testing phone number endpoint...');
    const response = await fetch(`${LIVE_API_BASE_URL}/agents/add_phonenumber/test-agent-123`, {
      method: 'POST',
      headers: {
        'X-API-Key': LIVE_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ phone_number: "+19147684789" })
    });

    console.log('   Status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('   Success Response:', data);
    } else {
      const errorData = await response.text();
      console.log('   Error Response:', errorData);
    }
  } catch (error) {
    console.log('   Error:', error.message);
  }

  console.log('\nTest completed.');
}

testLiveAPI(); 