// Test script for agent configuration API integration
const API_BASE_URL = 'https://d2batbqeoehmxe.cloudfront.net';
const API_KEY = 'xpectrum-ai@123';

async function testAgentConfiguration() {
  const testAgentName = 'test-agent-' + Date.now();
  
  const testConfig = {
    organization_id: undefined,
    chatbot_api: undefined,
    chatbot_key: undefined,
    tts_config: {
      provider: 'openai',
      openai: {
        api_key: 'test-openai-key',
        voice: 'alloy',
        response_format: 'mp3',
        quality: 'standard',
        speed: 1.0
      }
    },
    stt_config: {
      provider: 'whisper',
      whisper: {
        api_key: 'test-whisper-key',
        model: 'whisper-1',
        language: null
      }
    },
    initial_message: 'Hello! This is a test agent. How can I help you today?',
    nudge_text: undefined,
    nudge_interval: undefined,
    max_nudges: undefined,
    typing_volume: undefined,
    max_call_duration: undefined
  };

  try {
    console.log('Testing agent configuration...');
    console.log('Agent name:', testAgentName);
    console.log('Config:', JSON.stringify(testConfig, null, 2));

    const response = await fetch(`${API_BASE_URL}/agents/update/${testAgentName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY,
      },
      body: JSON.stringify(testConfig),
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', errorText);
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('Success response:', JSON.stringify(result, null, 2));
    
    console.log('✅ Agent configuration test passed!');
  } catch (error) {
    console.error('❌ Agent configuration test failed:', error.message);
  }
}

// Run the test
testAgentConfiguration();
