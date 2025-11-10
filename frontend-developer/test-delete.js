// Test script to verify delete agent functionality
const testDeleteAgent = async () => {
  console.log("🧪 Testing delete agent functionality...");

  try {
    // Test 1: Test the Dify delete API endpoint
    console.log("1. Testing Dify delete API endpoint...");
    const difyResponse = await fetch(
      "http://localhost:3001/api/dify/delete-agent",
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": process.env.NEXT_PUBLIC_LIVE_API_KEY || "",
        },
        body: JSON.stringify({
          agentName: "test-agent",
          organizationId: "test-org",
        }),
      }
    );

    const difyResult = await difyResponse.json();
    console.log("✅ Dify delete API response:", difyResult);

    // Test 2: Test the backend delete API endpoint
    console.log("2. Testing backend delete API endpoint...");
    const backendResponse = await fetch(
      "http://localhost:3001/api/agents/delete-by-org/test-org",
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": process.env.NEXT_PUBLIC_LIVE_API_KEY || "",
        },
        body: JSON.stringify({
          agentName: "test-agent",
        }),
      }
    );

    const backendResult = await backendResponse.json();
    console.log("✅ Backend delete API response:", backendResult);

    console.log("🎉 All delete functionality tests completed!");
  } catch (error) {
    console.error("❌ Test failed:", error);
  }
};

// Run the test
testDeleteAgent();
