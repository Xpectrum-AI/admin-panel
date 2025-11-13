// Debug script to test Dify integration step by step
// Test 1: Check if the API endpoint is accessible
async function testApiEndpoint() {
  try {
    const response = await fetch("/api/dify/create-agent", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": process.env.NEXT_PUBLIC_LIVE_API_KEY || "",
      },
      body: JSON.stringify({
        agentName: "debug-test-agent",
        organizationId: process.env.NEXT_PUBLIC_DEVELOPMENT_PROPELAUTH_URL
          ? "test-org"
          : "Xpectrum_AI",
        modelProvider: "langgenius/openai/openai",
        modelName: "gpt-4o",
      }),
    });
const result = await response.json();
    if (response.ok) {
      return true;
    } else {
      return false;
    }
  } catch (error) {
    return false;
  }
}

// Test 2: Check environment variables
function testEnvironmentVariables() {
  const requiredVars = [
    "NEXT_PUBLIC_LIVE_API_KEY",
    "NEXT_PUBLIC_CHATBOT_API_URL",
    "NEXT_PUBLIC_CHATBOT_API_KEY",
  ];

  requiredVars.forEach((varName) => {
    const value = process.env[varName];
    if (value) {
}
  });
}

// Test 3: Check Dify credentials (from environment variables)
function testDifyCredentials() {
  const credentials = {
    consoleOrigin: process.env.NEXT_PUBLIC_DIFY_CONSOLE_ORIGIN || "",
    adminEmail: process.env.NEXT_PUBLIC_DIFY_ADMIN_EMAIL || "",
    adminPassword: process.env.NEXT_PUBLIC_DIFY_ADMIN_PASSWORD || "",
    workspaceId: process.env.NEXT_PUBLIC_DIFY_WORKSPACE_ID || "",
  };
}

// Test 4: Test Dify login endpoint
async function testDifyLogin() {
  try {
    const consoleOrigin = process.env.NEXT_PUBLIC_DIFY_CONSOLE_ORIGIN;
    const adminEmail = process.env.NEXT_PUBLIC_DIFY_ADMIN_EMAIL;
    const adminPassword = process.env.NEXT_PUBLIC_DIFY_ADMIN_PASSWORD;
    if (!consoleOrigin || !adminEmail || !adminPassword) {
      return false;
    }

    const response = await fetch(`${consoleOrigin}/console/api/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: adminEmail,
        password: adminPassword,
      }),
    });
    if (response.ok) {
      const result = await response.json();
      return true;
    } else {
      const errorText = await response.text();
      return false;
    }
  } catch (error) {
    return false;
  }
}

// Run all tests
async function runAllTests() {
  testEnvironmentVariables();
  testDifyCredentials();

  const loginSuccess = await testDifyLogin();
  const apiSuccess = await testApiEndpoint();
  if (!loginSuccess) {
  }

  if (!apiSuccess) {
  }
}

// Export for browser console usage
if (typeof window !== "undefined") {
  window.debugDify = runAllTests;
}

// Auto-run if in Node.js
if (typeof module !== "undefined" && module.exports) {
  runAllTests();
}
