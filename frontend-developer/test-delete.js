// Test script to verify delete agent functionality
const testDeleteAgent = async () => {
  try {
    // Test 1: Test the Dify delete API endpoint
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
    // Test 2: Test the backend delete API endpoint
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
  } catch (error) {
  }
};

// Run the test
testDeleteAgent();
