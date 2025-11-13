import { NextRequest } from 'next/server';

export async function authenticateApiKey(request: NextRequest) {
  try {
    // Authentication is required in all environments

    // Get API key from headers (check both lowercase and uppercase)
    const apiKey = request.headers.get('x-api-key') || 
                   request.headers.get('X-API-Key') ||
                   request.headers.get('authorization')?.replace('Bearer ', '');
// Check if API key exists
    if (!apiKey) {
      return { success: false, error: 'API key missing' };
    }

    // Get environment variables
    const liveApiKey = process.env.NEXT_PUBLIC_LIVE_API_KEY;
    const propelauthApiKey = process.env.NEXT_PUBLIC_DEVELOPMENT_PROPELAUTH_API_KEY;
    // Validate API key (you can implement your own validation logic)
    const validApiKeys = [liveApiKey, propelauthApiKey].filter(Boolean);
// Check if the received API key matches any of the valid keys
    const isValidKey = validApiKeys.some(validKey => validKey === apiKey);
    
    // Fallback: If no environment variables are loaded, allow the specific key from the user
    if (!isValidKey && validApiKeys.length === 0) {
      if (apiKey === 'xpectrum-ai@123') {
        return { success: true };
      }
    }
    
    if (!isValidKey) {
      return { success: false, error: 'Invalid API key' };
    }
    return { success: true };
  } catch (error) {
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
  //   
  //   return { success: false, error: 'User authentication failed' };
  // }
  return { success: true };
}
