import { NextRequest } from 'next/server';

/**
 * Extract the current organization from the request headers or user context
 * This function should be used in API routes to get the current user's organization
 */
export function getCurrentOrganization(request: NextRequest): string | null {
  try {
    // Try to get organization from headers first
    const orgFromHeader = request.headers.get('x-organization-id') || 
                         request.headers.get('x-organization-name');
    
    if (orgFromHeader) {
      return orgFromHeader;
    }

    // Try to get from authorization header (if it contains org info)
    const authHeader = request.headers.get('authorization');
    if (authHeader) {
      // This is a placeholder - in a real implementation, you might decode a JWT
      // or make a call to PropelAuth to get the user's organization
    }

    // For now, return a default organization name from environment
    // In a real implementation, this should be extracted from the user's session/token
    return process.env.NEXT_PUBLIC_DEFAULT_ORG_NAME || 'Xpectrum_AI'; // Default organization name
    
  } catch (error) {
    return process.env.NEXT_PUBLIC_DEFAULT_ORG_NAME || 'Xpectrum_AI'; // Fallback organization
  }
}

/**
 * Get organization from request body or headers
 */
export function getOrganizationFromRequest(request: NextRequest, body?: any): string {
  // Priority order:
  // 1. From request body
  // 2. From headers
  // 3. From current user context
  // 4. Default fallback
  
  if (body?.organization_id) {
    return body.organization_id;
  }
  
  const orgFromHeader = request.headers.get('x-organization-id') || 
                       request.headers.get('x-organization-name');
  
  if (orgFromHeader) {
    return orgFromHeader;
  }
  
  return getCurrentOrganization(request) || process.env.NEXT_PUBLIC_DEFAULT_ORG_NAME || 'Xpectrum_AI';
}
