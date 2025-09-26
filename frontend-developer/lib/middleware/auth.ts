import { NextRequest } from 'next/server';

export async function authenticateApiKey(request: NextRequest) {
  try {
    // Authentication is required in all environments

    // Get API key from headers (check both lowercase and uppercase)
    const apiKey = request.headers.get('x-api-key') || 
                   request.headers.get('X-API-Key') ||
                   request.headers.get('authorization')?.replace('Bearer ', '');

    console.log('🔍 API Key received:', apiKey ? 'Present' : 'Missing');
    console.log('🔍 Request headers:', Object.fromEntries(request.headers.entries()));

    // Check if API key exists
    if (!apiKey) {
      console.log('❌ API key missing from request');
      return { success: false, error: 'API key missing' };
    }

    // Get environment variables
    const liveApiKey = process.env.NEXT_PUBLIC_LIVE_API_KEY;
    const propelauthApiKey = process.env.NEXT_PUBLIC_PROPELAUTH_API_KEY;
    
    console.log('🔍 Environment variables:');
    console.log('🔍 NEXT_PUBLIC_LIVE_API_KEY:', liveApiKey ? 'Present' : 'Missing');
    console.log('🔍 NEXT_PUBLIC_LIVE_API_KEY value:', liveApiKey);
    console.log('🔍 NEXT_PUBLIC_PROPELAUTH_API_KEY:', propelauthApiKey ? 'Present' : 'Missing');

    // Validate API key (you can implement your own validation logic)
    const validApiKeys = [liveApiKey, propelauthApiKey].filter(Boolean);

    console.log('🔍 Valid API keys:', validApiKeys.map(key => key ? 'Present' : 'Missing'));
    console.log('🔍 Received API key:', apiKey);
    console.log('🔍 Expected API key:', liveApiKey);

    // Check if the received API key matches any of the valid keys
    const isValidKey = validApiKeys.some(validKey => validKey === apiKey);
    
    // Fallback: If no environment variables are loaded, allow the specific key from the user
    if (!isValidKey && validApiKeys.length === 0) {
      console.log('⚠️ No environment variables loaded, allowing fallback authentication');
      if (apiKey === 'xpectrum-ai@123') {
        console.log('✅ Fallback authentication successful');
        return { success: true };
      }
    }
    
    if (!isValidKey) {
      console.log('❌ Invalid API key provided');
      console.log('❌ Expected one of:', validApiKeys);
      console.log('❌ Received:', apiKey);
      return { success: false, error: 'Invalid API key' };
    }

    console.log('✅ API key validation successful');

    return { success: true };
  } catch (error) {
    console.error('Authentication error:', error);
    return { success: false, error: 'Authentication failed' };
  }
}

export async function authenticateUser(request: NextRequest) {
  // try {
  //   // Get user token from headers
  //   const token = request.headers.get('authorization')?.replace('Bearer ', '');

  //   if (!token) {
  //     return { success: false, error: 'Token missing' };
  //   }

  //   // Validate user token (implement your JWT validation logic here)
  //   // For now, return success
  //   return { success: true, user: { id: 'user1', role: 'admin' } };
  // } catch (error) {
  //   console.error('User authentication error:', error);
  //   return { success: false, error: 'User authentication failed' };
  // }
  return { success: true };
}
