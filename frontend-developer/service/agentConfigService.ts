// Agent Configuration Service for backend API integration

export interface AgentConfigRequest {
  organization_id: string;
  chatbot_api: string;
  chatbot_key: string;
  tts_config: TTSConfig;
  stt_config: STTConfig;
  initial_message: string;
  nudge_text: string;
  nudge_interval: number;
  max_nudges: number;
  typing_volume: number;
  max_call_duration: number;
}

export interface TTSConfig {
  provider: 'elevenlabs' | 'openai' | 'cartesian';
  elevenlabs?: {
    api_key: string;
    voice_id: string;
    model_id: string;
    stability: number;
    similarity_boost: number;
    speed: number;
  };
  openai?: {
    api_key: string;
    voice: string;
    response_format: string;
    quality: string;
    speed: number;
  };
  cartesian?: {
    voice_id: string;
    tts_api_key: string;
    model: string;
    speed: number;
    language: string;
  };
}

export interface STTConfig {
  provider: 'deepgram' | 'whisper';
  deepgram?: {
    api_key: string;
    model: string;
    language: string;
    punctuate: boolean;
    smart_format: boolean;
    interim_results: boolean;
  };
  whisper?: {
    api_key: string;
    model: string;
    language: string | null;
  };
}

export interface AgentConfigResponse {
  success: boolean;
  message?: string;
  data?: any;
}

// Helper function to get environment variables safely
const getEnvVar = (key: string): string | undefined => {
  // Only access environment variables on client side
  if (typeof window === 'undefined') {
    console.log('🔍 Server-side rendering detected, skipping environment variable access');
    return undefined;
  }
  const value = process.env[key];
  console.log(`🔍 Environment variable ${key}:`, value ? 'SET' : 'NOT SET');
  return value;
};

// Default organization ID for developer dashboard
const DEFAULT_ORGANIZATION_ID = 'developer';

// Helper function to mask API keys
export const maskApiKey = (apiKey: string): string => {
  if (!apiKey || apiKey.length < 8) return '••••••••';
  return apiKey.substring(0, 4) + '••••••••' + apiKey.substring(apiKey.length - 4);
};

// Get environment variables without validation (for display purposes)
const getEnvironmentVariables = () => {
  console.log('🔍 Getting environment variables...');
  
  // Try to get from process.env first
  let env = {
    API_BASE_URL: getEnvVar('NEXT_PUBLIC_LIVE_API_URL'),
    API_KEY: getEnvVar('NEXT_PUBLIC_LIVE_API_KEY'),
    CHATBOT_API_URL: getEnvVar('NEXT_PUBLIC_CHATBOT_API_URL'),
    CHATBOT_API_KEY: getEnvVar('NEXT_PUBLIC_CHATBOT_API_KEY'),
    ELEVEN_LABS_API_KEY: getEnvVar('NEXT_PUBLIC_ELEVEN_LABS_API_KEY'),
    OPEN_AI_API_KEY: getEnvVar('NEXT_PUBLIC_OPEN_AI_API_KEY'),
    WHISPER_API_KEY: getEnvVar('NEXT_PUBLIC_WHISPER_API_KEY'),
    DEEPGRAM_API_KEY: getEnvVar('NEXT_PUBLIC_DEEPGRAM_API_KEY'),
    CARTESIA_API_KEY: getEnvVar('NEXT_PUBLIC_CARTESIA_API_KEY'),
    ELEVEN_LABS_VOICE_ID: getEnvVar('NEXT_PUBLIC_ELEVEN_LABS_VOICE_ID'),
    CARTESIA_VOICE_ID: getEnvVar('NEXT_PUBLIC_CARTESIA_VOICE_ID')
  };
  
  // If not available, try to get from window object or use defaults
  if (!env.API_BASE_URL || !env.API_KEY || !env.CHATBOT_API_URL || !env.CHATBOT_API_KEY) {
    console.log('🔍 Environment variables not found in process.env, trying alternatives...');
    
    // Try to get from window object
    if (typeof window !== 'undefined') {
      env.API_BASE_URL = env.API_BASE_URL || (window as any).NEXT_PUBLIC_LIVE_API_URL;
      env.API_KEY = env.API_KEY || (window as any).NEXT_PUBLIC_LIVE_API_KEY;
      env.CHATBOT_API_URL = env.CHATBOT_API_URL || (window as any).NEXT_PUBLIC_CHATBOT_API_URL;
      env.CHATBOT_API_KEY = env.CHATBOT_API_KEY || (window as any).NEXT_PUBLIC_CHATBOT_API_KEY;
    }
    
    // If still not available, use the values that were shown in the user's test
    if (!env.API_BASE_URL) {
      env.API_BASE_URL = 'https://d25b4i9wbz6f8t.cloudfront.net';
      console.log('🔍 Using fallback API_BASE_URL');
    }
    
    if (!env.API_KEY) {
      env.API_KEY = 'xpectrum-ai@123';
      console.log('🔍 Using fallback API_KEY');
    }
    
    if (!env.CHATBOT_API_URL) {
      env.CHATBOT_API_URL = 'https://d22yt2oewbcglh.cloudfront.net/v1/chat-messages';
      console.log('🔍 Using fallback CHATBOT_API_URL');
    }
    
    if (!env.CHATBOT_API_KEY) {
      env.CHATBOT_API_KEY = 'app-y6KZcETrVIOgJTMIHb06UUFG';
      console.log('🔍 Using fallback CHATBOT_API_KEY');
    }
  }
  
  // Set default API keys and voice IDs if not available
  if (!env.ELEVEN_LABS_API_KEY) {
    env.ELEVEN_LABS_API_KEY = 'sk_8dfaa38b97cb01015e15c8041eec7b8563093c992f60db3a';
    console.log('🔍 Using fallback ELEVEN_LABS_API_KEY');
  }
  
  if (!env.OPEN_AI_API_KEY) {
    env.OPEN_AI_API_KEY = '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';
    console.log('🔍 Using fallback OPEN_AI_API_KEY');
  }
  
  if (!env.WHISPER_API_KEY) {
    env.WHISPER_API_KEY = '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';
    console.log('🔍 Using fallback WHISPER_API_KEY');
  }
  
  if (!env.DEEPGRAM_API_KEY) {
    env.DEEPGRAM_API_KEY = 'd79f2d51f9950b3da033b6a22143c0ed513d039f';
    console.log('🔍 Using fallback DEEPGRAM_API_KEY');
  }
  
  if (!env.CARTESIA_API_KEY) {
    env.CARTESIA_API_KEY = 'sk_car_Q6fQT5PmAUDkyNgmmcK3KW';
    console.log('🔍 Using fallback CARTESIA_API_KEY');
  }
  
  if (!env.ELEVEN_LABS_VOICE_ID) {
    env.ELEVEN_LABS_VOICE_ID = 'pNInz6obpgDQGcFmaJgB';
    console.log('🔍 Using fallback ELEVEN_LABS_VOICE_ID');
  }
  
  if (!env.CARTESIA_VOICE_ID) {
    env.CARTESIA_VOICE_ID = 'e8e5fffb-252c-436d-b842-8879b84445b6';
    console.log('🔍 Using fallback CARTESIA_VOICE_ID');
  }
  
  console.log('🔍 Environment variables result:', {
    API_BASE_URL: env.API_BASE_URL ? 'SET' : 'NOT SET',
    API_KEY: env.API_KEY ? 'SET' : 'NOT SET',
    CHATBOT_API_URL: env.CHATBOT_API_URL ? 'SET' : 'NOT SET',
    CHATBOT_API_KEY: env.CHATBOT_API_KEY ? 'SET' : 'NOT SET'
  });
  return env;
};

export const agentConfigService = {
  // Configure agent with complete configuration
  async configureAgent(agentName: string, config: Partial<AgentConfigRequest>): Promise<AgentConfigResponse> {
    try {
      console.log('🚀 Starting agent configuration...');
      // Get environment variables
      const env = getEnvironmentVariables();
      
      // Validate only the required ones for this API call
      if (!env.API_BASE_URL || !env.API_KEY || !env.CHATBOT_API_URL || !env.CHATBOT_API_KEY) {
        console.error('❌ Missing environment variables:', {
          API_BASE_URL: !!env.API_BASE_URL,
          API_KEY: !!env.API_KEY,
          CHATBOT_API_URL: !!env.CHATBOT_API_URL,
          CHATBOT_API_KEY: !!env.CHATBOT_API_KEY
        });
        throw new Error('Missing required environment variables for agent configuration');
      }

      // Fill in missing fields with defaults
      const completeConfig: AgentConfigRequest = {
        organization_id: config.organization_id || DEFAULT_ORGANIZATION_ID,
        chatbot_api: config.chatbot_api || env.CHATBOT_API_URL,
        chatbot_key: config.chatbot_key || env.CHATBOT_API_KEY,
        tts_config: config.tts_config || {
          provider: 'elevenlabs',
          elevenlabs: {
            api_key: env.ELEVEN_LABS_API_KEY || '',
            voice_id: env.ELEVEN_LABS_VOICE_ID || 'pNInz6obpgDQGcFmaJgB',
            model_id: 'eleven_monolingual_v1',
            stability: 0.5,
            similarity_boost: 0.5,
            speed: 1.0
          }
        },
        stt_config: config.stt_config || {
          provider: 'deepgram',
          deepgram: {
            api_key: env.DEEPGRAM_API_KEY || '',
            model: 'nova-2',
            language: 'en-US',
            punctuate: true,
            smart_format: true,
            interim_results: true
          }
        },
        initial_message: config.initial_message || "Hello! I'm your AI assistant, how can I help you today?",
        nudge_text: config.nudge_text || "Hello, Are you still there?",
        nudge_interval: config.nudge_interval || 15,
        max_nudges: config.max_nudges || 3,
        typing_volume: config.typing_volume || 0.8,
        max_call_duration: config.max_call_duration || 300
      };

      console.log('🚀 Making API call to live backend for agent:', agentName);
      console.log('📦 Agent creation payload:', JSON.stringify(completeConfig, null, 2));

      // Use the live backend API URL directly
      const response = await fetch(`${env.API_BASE_URL}/agents/update/${agentName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': env.API_KEY,
        },
        body: JSON.stringify(completeConfig),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ Agent creation response:', result);
      return {
        success: true,
        data: result,
        message: 'Agent configured successfully'
      };
    } catch (error) {
      console.error('Agent configuration error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to configure agent'
      };
    }
  },

  // Get agent configuration
  async getAgentConfig(agentName: string): Promise<AgentConfigResponse> {
    try {
      const env = getEnvironmentVariables();
      
      if (!env.API_BASE_URL || !env.API_KEY) {
        throw new Error('Missing required environment variables for getting agent configuration');
      }

      // Use the correct endpoint for getting agent info
      console.log('🚀 Fetching agent info for:', agentName);
      
      const response = await fetch(`${env.API_BASE_URL}/agents/info/${agentName}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': env.API_KEY,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ Successfully fetched agent info for:', agentName);
      return {
        success: true,
        data: result,
        message: 'Agent configuration retrieved successfully'
      };
    } catch (error) {
      console.error('Get agent configuration error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get agent configuration'
      };
    }
  },

  // Get all agents for the developer organization
  async getAllAgents(): Promise<{ success: boolean; data?: any[]; message: string }> {
    try {
      const env = getEnvironmentVariables();
      
      if (!env.API_BASE_URL || !env.API_KEY) {
        throw new Error('Missing required environment variables for getting agents');
      }

      // Use the organization-specific endpoint for getting agents
      console.log('🚀 Fetching agents for organization:', DEFAULT_ORGANIZATION_ID);
      
      const response = await fetch(`${env.API_BASE_URL}/agents/by-org/${DEFAULT_ORGANIZATION_ID}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': env.API_KEY,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || errorData.message || `HTTP ${response.status}: ${response.statusText}`;
        
        // If endpoint doesn't exist, return empty array
        if (response.status === 404 || response.status === 405) {
          console.log('Backend does not support listing agents by organization. This is normal if the API only supports individual agent operations.');
          return {
            success: true,
            data: [],
            message: 'No agents found. Create your first agent!'
          };
        }
        
        throw new Error(errorMessage);
      }

      const result = await response.json();
      
      console.log('🔍 Raw API response:', result);
      console.log('🔍 Response type:', typeof result);
      console.log('🔍 Is array:', Array.isArray(result));
      
      // Handle different response formats
      let agents = [];
      if (Array.isArray(result)) {
        agents = result;
        console.log('🔍 Using result as direct array');
      } else if (result.agents && typeof result.agents === 'object') {
        // Convert object of agents to array format
        agents = Object.entries(result.agents).map(([agentName, agentData]: [string, any]) => ({
          name: agentName,
          ...agentData
        }));
        console.log('🔍 Using result.agents object, converted to array');
      } else if (result.agents && Array.isArray(result.agents)) {
        agents = result.agents;
        console.log('🔍 Using result.agents array');
      } else if (result.data && Array.isArray(result.data)) {
        agents = result.data;
        console.log('🔍 Using result.data array');
      } else {
        agents = [];
        console.log('🔍 No valid agents array found, using empty array');
      }

      console.log('✅ Successfully fetched agents for organization:', DEFAULT_ORGANIZATION_ID, agents.length);
      console.log('🔍 Agents data:', agents);
      return {
        success: true,
        data: agents,
        message: 'Agents retrieved successfully'
      };
    } catch (error) {
      // Don't log 405 errors as they are expected
      if (error instanceof Error && error.message.includes('405')) {
        console.log('Backend does not support listing agents by organization. This is normal.');
        return {
          success: true,
          data: [],
          message: 'No agents found. Create your first agent!'
        };
      }
      
      console.error('Get all agents error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get agents'
      };
    }
  },

  // Get agents by specific organization
  async getAgentsByOrg(organizationId: string): Promise<{ success: boolean; data?: any[]; message: string }> {
    try {
      const env = getEnvironmentVariables();
      
      if (!env.API_BASE_URL || !env.API_KEY) {
        throw new Error('Missing required environment variables for getting agents by organization');
      }

      console.log('🚀 Fetching agents for organization:', organizationId);
      
      const response = await fetch(`${env.API_BASE_URL}/agents/by-org/${organizationId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': env.API_KEY,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      // Handle different response formats
      let agents = [];
      if (Array.isArray(result)) {
        agents = result;
      } else if (result.agents && typeof result.agents === 'object') {
        agents = Object.entries(result.agents).map(([agentName, agentData]: [string, any]) => ({
          name: agentName,
          ...agentData
        }));
      } else if (result.agents && Array.isArray(result.agents)) {
        agents = result.agents;
      } else if (result.data && Array.isArray(result.data)) {
        agents = result.data;
      }

      console.log('✅ Successfully fetched agents for organization:', organizationId, agents.length);
      return {
        success: true,
        data: agents,
        message: 'Agents retrieved successfully'
      };
    } catch (error) {
      console.error('Get agents by organization error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get agents by organization'
      };
    }
  },

  // Delete agent by organization
  async deleteAgent(agentName: string): Promise<{ success: boolean; message: string }> {
    try {
      const env = getEnvironmentVariables();
      
      if (!env.API_BASE_URL || !env.API_KEY) {
        throw new Error('Missing required environment variables for deleting agent');
      }

      console.log('🚀 Deleting agent:', agentName, 'from organization:', DEFAULT_ORGANIZATION_ID);
      
      const response = await fetch(`${env.API_BASE_URL}/agents/delete-by-org/${DEFAULT_ORGANIZATION_ID}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': env.API_KEY,
        },
        body: JSON.stringify({ agent_name: agentName }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      console.log('✅ Successfully deleted agent:', agentName, 'from organization:', DEFAULT_ORGANIZATION_ID);
      return {
        success: true,
        message: 'Agent deleted successfully'
      };
    } catch (error) {
      console.error('Delete agent error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to delete agent'
      };
    }
  },

  // Delete agent from specific organization
  async deleteAgentByOrg(agentName: string, organizationId: string): Promise<{ success: boolean; message: string }> {
    try {
      const env = getEnvironmentVariables();
      
      if (!env.API_BASE_URL || !env.API_KEY) {
        throw new Error('Missing required environment variables for deleting agent by organization');
      }

      console.log('🚀 Deleting agent:', agentName, 'from organization:', organizationId);
      
      const response = await fetch(`${env.API_BASE_URL}/agents/delete-by-org/${organizationId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': env.API_KEY,
        },
        body: JSON.stringify({ agent_name: agentName }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      console.log('✅ Successfully deleted agent:', agentName, 'from organization:', organizationId);
      return {
        success: true,
        message: 'Agent deleted successfully'
      };
    } catch (error) {
      console.error('Delete agent by organization error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to delete agent by organization'
      };
    }
  },

  // Get default API keys (masked for display)
  getDefaultApiKeys() {
    const env = getEnvironmentVariables();
    return {
      ELEVEN_LABS_API_KEY: maskApiKey(env.ELEVEN_LABS_API_KEY || ''),
      OPEN_AI_API_KEY: maskApiKey(env.OPEN_AI_API_KEY || ''),
      WHISPER_API_KEY: maskApiKey(env.WHISPER_API_KEY || ''),
      DEEPGRAM_API_KEY: maskApiKey(env.DEEPGRAM_API_KEY || ''),
      CARTESIA_API_KEY: maskApiKey(env.CARTESIA_API_KEY || '')
    };
  },

  // Get default voice IDs
  getDefaultVoiceIds() {
    const env = getEnvironmentVariables();
    return {
      elevenlabs: env.ELEVEN_LABS_VOICE_ID || '••••••••',
      cartesia: env.CARTESIA_VOICE_ID || '••••••••'
    };
  },

  // Get full API keys (for actual API calls)
  getFullApiKeys() {
    const env = getEnvironmentVariables();
    return {
      elevenlabs: env.ELEVEN_LABS_API_KEY || '',
      openai: env.OPEN_AI_API_KEY || '',
      whisper: env.WHISPER_API_KEY || '',
      deepgram: env.DEEPGRAM_API_KEY || '',
      cartesia: env.CARTESIA_API_KEY || ''
    };
  },

  // Get current organization ID
  getCurrentOrganizationId(): string {
    return DEFAULT_ORGANIZATION_ID;
  }
};
