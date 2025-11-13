import { NextRequest } from 'next/server';
import { getAuth } from '../config/propelAuth';

export interface AuthenticatedUser {
  userId: string;
  orgId: string;
  orgName?: string;
  email?: string;
}

export async function getUserFromRequest(request: NextRequest): Promise<AuthenticatedUser | null> {
  try {
    const auth = getAuth();
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    // Validate the access token with PropelAuth
    // The correct method is validateAccessTokenAndGetUser and it expects the full "Bearer token" string
    const user = await auth.validateAccessTokenAndGetUser(authHeader);
    
    if (!user) {
      return null;
    }
    // Get the user's organization - PropelAuth returns orgIdToOrgMemberInfo
    const orgId = user.orgIdToOrgMemberInfo 
      ? Object.keys(user.orgIdToOrgMemberInfo)[0] 
      : user.userId; // Fallback to userId if no org
    return {
      userId: user.userId,
      orgId: orgId,
      orgName: user.orgIdToOrgMemberInfo?.[orgId]?.orgName,
      email: user.email
    };
  } catch (error) {
    return null;
  }
}

export function getOrgIdFromKnowledgeBaseName(name: string): string | null {
  // Extract org ID from name pattern: [8-char-hash]KnowledgeBaseName
  // Example: [4f91b0f8]MyKB
  const match = name.match(/^\[([a-f0-9]{8})\]/);
  if (!match) return null;
  
  // Return the 8-character prefix (not the full org ID, but it's unique enough for filtering)
  return match[1];
}

export function addOrgPrefixToName(name: string, orgId: string): string {
  // Add org ID prefix if not already present
  if (name.startsWith('[ORG:')) {
    return name;
  }
  return `[ORG:${orgId}] ${name}`;
}

export function removeOrgPrefixFromName(name: string): string {
  // Remove the org ID prefix for display
  // Handles both old format [ORG:full-uuid] and new format [8-char-hash]
  return name.replace(/^\[(?:ORG:)?[^\]]+\]/, '');
}

