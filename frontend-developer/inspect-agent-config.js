#!/usr/bin/env node

/**
 * Script to inspect agent configuration and verify API key usage
 * Run this in the browser console or as a Node.js script
 */

// Method 1: Check localStorage for agent configurations
function checkLocalStorageConfigs() {
  const allKeys = Object.keys(localStorage);
  const agentKeys = allKeys.filter(key => 
    key.includes('modelConfig') || 
    key.includes('voiceConfig') || 
    key.includes('transcriberConfig')
  );
  agentKeys.forEach(key => {
    const value = localStorage.getItem(key);
    try {
      const parsed = JSON.parse(value);
      // Check if it has a dynamic API key
      if (parsed.chatbot_key && parsed.chatbot_key.length > 20) {
}
    } catch (e) {
    }
  });
}

// Method 2: Check if agent is using dynamic API key
function isUsingDynamicApiKey(agentConfig) {
  const staticApiKey = process.env.NEXT_PUBLIC_MODEL_API_KEY || '';
  const agentApiKey = agentConfig.chatbot_key || '';
  
  return agentApiKey && 
         agentApiKey !== staticApiKey && 
         agentApiKey.length > 20 &&
         agentApiKey.startsWith('app-');
}

// Method 3: Compare with environment variable
function compareApiKeys(agentConfig) {
  const staticApiKey = process.env.NEXT_PUBLIC_MODEL_API_KEY || '';
  const agentApiKey = agentConfig.chatbot_key || '';
if (agentApiKey && agentApiKey !== staticApiKey) {
return true;
  } else {
return false;
  }
}

// Method 4: Check agent data structure
function inspectAgentData(agentData) {
  if (agentData.chatbot_key) {
}
  
  if (agentData.chatbot_api) {
  }
  
  return isUsingDynamicApiKey(agentData);
}

// Export functions for use in browser console
if (typeof window !== 'undefined') {
  window.checkLocalStorageConfigs = checkLocalStorageConfigs;
  window.isUsingDynamicApiKey = isUsingDynamicApiKey;
  window.compareApiKeys = compareApiKeys;
  window.inspectAgentData = inspectAgentData;
}

// For Node.js usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    checkLocalStorageConfigs,
    isUsingDynamicApiKey,
    compareApiKeys,
    inspectAgentData
  };
}