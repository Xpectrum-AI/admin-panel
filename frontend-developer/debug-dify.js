// Debug script to test Dify integration step by step

console.log('🔍 Debugging Dify Integration...');

// Test 1: Check if the API endpoint is accessible
async function testApiEndpoint() {
  console.log('\n🧪 Test 1: API Endpoint Accessibility');
  
  try {
    const response = await fetch('/api/dify/create-agent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': process.env.NEXT_PUBLIC_LIVE_API_KEY || 'test-key',
      },
      body: JSON.stringify({
        agentName: 'debug-test-agent',
        organizationId: 'Xpectrum_AI',
        modelProvider: 'langgenius/openai/openai',
        modelName: 'gpt-4o'
      }),
    });

    console.log('📊 Response status:', response.status);
    console.log('📊 Response headers:', Object.fromEntries(response.headers.entries()));

    const result = await response.json();
    console.log('📋 Response body:', result);

    if (response.ok) {
      console.log('✅ API endpoint is accessible');
      return true;
    } else {
      console.log('❌ API endpoint returned error:', result.error);
      return false;
    }
  } catch (error) {
    console.error('💥 API endpoint test failed:', error);
    return false;
  }
}

// Test 2: Check environment variables
function testEnvironmentVariables() {
  console.log('\n🧪 Test 2: Environment Variables');
  
  const requiredVars = [
    'NEXT_PUBLIC_LIVE_API_KEY',
    'NEXT_PUBLIC_CHATBOT_API_URL',
    'NEXT_PUBLIC_CHATBOT_API_KEY'
  ];

  requiredVars.forEach(varName => {
    const value = process.env[varName];
    console.log(`${varName}: ${value ? '✅ Set' : '❌ Missing'}`);
    if (value) {
      console.log(`  Value: ${value.substring(0, 10)}...`);
    }
  });
}

// Test 3: Check Dify credentials (from the script)
function testDifyCredentials() {
  console.log('\n🧪 Test 3: Dify Credentials');
  
  const credentials = {
    consoleOrigin: 'https://agent-dev.xpectrum-ai.com',
    adminEmail: 'ghosh.ishw@gmail.com',
    adminPassword: 'Ghosh1@*123',
    workspaceId: 'ffd028ab-6128-44fa-84cf-f3c12633e6da'
  };

  console.log('Dify Console Origin:', credentials.consoleOrigin);
  console.log('Admin Email:', credentials.adminEmail);
  console.log('Admin Password:', credentials.adminPassword ? '✅ Set' : '❌ Missing');
  console.log('Workspace ID:', credentials.workspaceId);
}

// Test 4: Test Dify login endpoint
async function testDifyLogin() {
  console.log('\n🧪 Test 4: Dify Login Endpoint');
  
  try {
    const response = await fetch('https://agent-dev.xpectrum-ai.com/console/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'ghosh.ishw@gmail.com',
        password: 'Ghosh1@*123'
      }),
    });

    console.log('📊 Login response status:', response.status);
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Dify login successful');
      console.log('📋 Login response:', result);
      return true;
    } else {
      const errorText = await response.text();
      console.log('❌ Dify login failed:', errorText);
      return false;
    }
  } catch (error) {
    console.error('💥 Dify login test failed:', error);
    return false;
  }
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting Dify Integration Debug Tests...\n');
  
  testEnvironmentVariables();
  testDifyCredentials();
  
  const loginSuccess = await testDifyLogin();
  const apiSuccess = await testApiEndpoint();
  
  console.log('\n📊 Test Results Summary:');
  console.log('Dify Login:', loginSuccess ? '✅ Success' : '❌ Failed');
  console.log('API Endpoint:', apiSuccess ? '✅ Success' : '❌ Failed');
  
  if (!loginSuccess) {
    console.log('\n💡 Possible Issues:');
    console.log('- Dify credentials are incorrect');
    console.log('- Dify server is down or unreachable');
    console.log('- Network connectivity issues');
  }
  
  if (!apiSuccess) {
    console.log('\n💡 Possible Issues:');
    console.log('- API key authentication failed');
    console.log('- Server not running on correct port');
    console.log('- API endpoint not properly configured');
  }
}

// Export for browser console usage
if (typeof window !== 'undefined') {
  window.debugDify = runAllTests;
  console.log('🔧 Debug function loaded! Run debugDify() in console to test.');
}

// Auto-run if in Node.js
if (typeof module !== 'undefined' && module.exports) {
  runAllTests();
}
