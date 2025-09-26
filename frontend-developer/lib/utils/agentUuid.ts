import { v4 as uuidv4 } from 'uuid';

/**
 * Utility functions for handling agent UUIDs in the format "agent_name_uuid"
 */

/**
 * Generates a UUID and combines it with the agent name
 * @param agentName - The user-entered agent name
 * @returns Combined string in format "agent_name_uuid"
 */
export function generateAgentUuid(agentName: string): string {
  const uuid = uuidv4().replace(/-/g, '_');
  return `${agentName}_${uuid}`;
}

/**
 * Extracts the agent name from the combined UUID format
 * @param agentNameUuid - The combined agent name and UUID
 * @returns The original agent name (display name)
 */
export function extractAgentName(agentNameUuid: string): string {
  if (!agentNameUuid) return '';
  
  const parts = agentNameUuid.split('_');
  
  if (parts.length < 5) {
    // If it doesn't have the UUID format, return as is
    return agentNameUuid;
  }
  
  // Check for different UUID patterns
  // Pattern 1: 8_4_4_4_12 characters (like da127cc7_49de_4acf_8561_a6d2f8620c0f)
  const lastFiveParts = parts.slice(-5);
  const isUuidPattern1 = lastFiveParts.length === 5 && 
    lastFiveParts[0].length === 8 && 
    lastFiveParts[1].length === 4 && 
    lastFiveParts[2].length === 4 && 
    lastFiveParts[3].length === 4 &&
    lastFiveParts[4].length === 12;
  
  if (isUuidPattern1) {
    // Remove the last 5 parts (UUID) and join the rest
    return parts.slice(0, -5).join('_');
  }
  
  // Pattern 2: 4_4_4_4 characters (like 3eade638_bb3e_40e4_a716)
  const lastFourParts = parts.slice(-4);
  const isUuidPattern2 = lastFourParts.length === 4 && 
    lastFourParts[0].length === 8 && 
    lastFourParts[1].length === 4 && 
    lastFourParts[2].length === 4 && 
    lastFourParts[3].length === 4;
  
  if (isUuidPattern2) {
    // Remove the last 4 parts (UUID) and join the rest
    return parts.slice(0, -4).join('_');
  }
  
  // Fallback: split by the last underscore to separate name from UUID
  const lastUnderscoreIndex = agentNameUuid.lastIndexOf('_');
  if (lastUnderscoreIndex === -1) {
    // If no underscore found, return the original string (backward compatibility)
    return agentNameUuid;
  }
  
  return agentNameUuid.substring(0, lastUnderscoreIndex);
}

/**
 * Extracts the UUID from the combined format
 * @param agentNameUuid - The combined agent name and UUID
 * @returns The UUID part
 */
export function extractUuid(agentNameUuid: string): string {
  const lastUnderscoreIndex = agentNameUuid.lastIndexOf('_');
  if (lastUnderscoreIndex === -1) {
    // If no underscore found, return empty string
    return '';
  }
  
  return agentNameUuid.substring(lastUnderscoreIndex + 1);
}

/**
 * Validates if a string is in the correct agent_name_uuid format
 * @param agentNameUuid - The string to validate
 * @returns True if valid format, false otherwise
 */
export function isValidAgentUuidFormat(agentNameUuid: string): boolean {
  const lastUnderscoreIndex = agentNameUuid.lastIndexOf('_');
  if (lastUnderscoreIndex === -1) {
    return false;
  }
  
  const uuid = agentNameUuid.substring(lastUnderscoreIndex + 1);
  // Basic UUID validation (8-4-4-4-12 format with underscores instead of hyphens)
  const uuidRegex = /^[0-9a-f]{8}_[0-9a-f]{4}_[0-9a-f]{4}_[0-9a-f]{4}_[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Creates a display-friendly version of the agent name
 * @param agentNameUuid - The combined agent name and UUID
 * @returns Display name for UI
 */
export function getDisplayName(agentNameUuid: string): string {
  return extractAgentName(agentNameUuid);
}

/**
 * Creates a unique identifier for API calls
 * @param agentNameUuid - The combined agent name and UUID
 * @returns The full agent_name_uuid for backend operations
 */
export function getAgentIdentifier(agentNameUuid: string): string {
  return agentNameUuid;
}
