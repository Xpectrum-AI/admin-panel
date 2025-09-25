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
  const uuid = uuidv4();
  return `${agentName}_${uuid}`;
}

/**
 * Extracts the agent name from the combined UUID format
 * @param agentNameUuid - The combined agent name and UUID
 * @returns The original agent name (display name)
 */
export function extractAgentName(agentNameUuid: string): string {
  // Split by the last underscore to separate name from UUID
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
  // Basic UUID validation (8-4-4-4-12 format)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
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
