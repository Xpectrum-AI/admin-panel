/**
 * Utility functions for handling agent names and UUIDs
 */

/**
 * Extracts the user-friendly name from a full agent UUID
 * Example: "karthik_hu_da127cc7_49de_4acf_8561_a6d2f8620c0f" -> "karthik_hu"
 * 
 * @param fullAgentId - The full agent ID with UUID
 * @returns The user-friendly name part
 */
export function extractUserFriendlyName(fullAgentId: string): string {
  if (!fullAgentId) return '';
  
  // Split by underscore and take everything before the UUID part
  const parts = fullAgentId.split('_');
  
  if (parts.length < 5) {
    // If it doesn't have the UUID format, return as is
    return fullAgentId;
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
  
  // If it doesn't match any UUID pattern, return as is
  return fullAgentId;
}

/**
 * Gets the display name for an agent, preferring the user-friendly name
 * 
 * @param agent - Agent object with name and id properties
 * @returns The display name to show in UI
 */
export function getAgentDisplayName(agent: { name?: string; id?: string }): string {
  // If agent.name exists and is not the same as the full ID, use it
  if (agent.name && agent.name !== agent.id) {
    return agent.name;
  }
  
  // Otherwise, extract the user-friendly name from the ID
  const userFriendlyName = extractUserFriendlyName(agent.id || '');
  return userFriendlyName;
}

/**
 * Gets the full agent ID for backend operations
 * 
 * @param agent - Agent object with name and id properties
 * @returns The full agent ID for backend use
 */
export function getAgentFullId(agent: { name?: string; id?: string }): string {
  return agent.id || '';
}

/**
 * Checks if an agent ID is a full UUID format
 * 
 * @param agentId - The agent ID to check
 * @returns True if it's a full UUID format
 */
export function isFullUuidFormat(agentId: string): boolean {
  if (!agentId) return false;
  
  const parts = agentId.split('_');
  if (parts.length < 5) return false;
  
  // Check if the last 4 parts form a UUID pattern
  const lastFourParts = parts.slice(-4);
  return lastFourParts.every(part => 
    part.length === 4 || (part.length === 8 && lastFourParts.indexOf(part) === 0)
  );
}
