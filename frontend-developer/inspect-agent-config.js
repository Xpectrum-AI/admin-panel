#!/usr/bin/env node

/**
 * Script to inspect agent configuration and verify API key usage
 * Run this in the browser console or as a Node.js script
 */

// Method 1: Check localStorage for agent configurations
function checkLocalStorageConfigs() {
  console.log('🔍 Checking localStorage for agent configurations...');
  
  const allKeys = Object.keys(localStorage);
  const agentKeys = allKeys.filter(key => 
    key.includes('modelConfig') || 
    key.includes('voiceConfig') || 
    key.includes('transcriberConfig')
  );
  
  console.log('📋 Found agent-related keys:', agentKeys);
  
  agentKeys.forEach(key => {
    const value = localStorage.getItem(key);
    try {
      const parsed = JSON.parse(value);
      console.log(`\n📝 ${key}:`, parsed);
      
      // Check if it has a dynamic API key
      if (parsed.chatbot_key && parsed.chatbot_key.length > 20) {
        console.log('✅ Dynamic API key detected:', parsed.chatbot_key.substring(0, 10) + '...');
      }
    } catch (e) {
      console.log(`\n📝 ${key}:`, value);
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
  
  console.log('🔑 Static API Key (env):', staticApiKey ? staticApiKey.substring(0, 10) + '...' : 'Not set');
  console.log('🔑 Agent API Key:', agentApiKey ? agentApiKey.substring(0, 10) + '...' : 'Not set');
  
  if (agentApiKey && agentApiKey !== staticApiKey) {
    console.log('✅ Agent is using a DIFFERENT API key (likely dynamic)');
    return true;
  } else {
    console.log('⚠️ Agent is using the SAME API key as environment (static)');
    return false;
  }
}

// Method 4: Check agent data structure
function inspectAgentData(agentData) {
  console.log('🔍 Inspecting agent data structure...');
  console.log('📋 Full agent data:', agentData);
  
  if (agentData.chatbot_key) {
    console.log('🔑 chatbot_key found:', agentData.chatbot_key.substring(0, 10) + '...');
    console.log('🔑 chatbot_key length:', agentData.chatbot_key.length);
    console.log('🔑 chatbot_key starts with "app-":', agentData.chatbot_key.startsWith('app-'));
  }
  
  if (agentData.chatbot_api) {
    console.log('🌐 chatbot_api:', agentData.chatbot_api);
  }
  
  return isUsingDynamicApiKey(agentData);
}

// Export functions for use in browser console
if (typeof window !== 'undefined') {
  window.checkLocalStorageConfigs = checkLocalStorageConfigs;
  window.isUsingDynamicApiKey = isUsingDynamicApiKey;
  window.compareApiKeys = compareApiKeys;
  window.inspectAgentData = inspectAgentData;
  
  console.log('🔧 Agent inspection functions loaded!');
  console.log('📝 Available functions:');
  console.log('  - checkLocalStorageConfigs()');
  console.log('  - isUsingDynamicApiKey(agentConfig)');
  console.log('  - compareApiKeys(agentConfig)');
  console.log('  - inspectAgentData(agentData)');
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
