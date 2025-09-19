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

// Get current organization ID from user context
const getCurrentOrganizationId = (): string | null => {
  // This will be handled by the component using the user context
  return null;
};

// Helper function to mask API keys - show only last 4 characters
export const maskApiKey = (apiKey: string): string => {
  if (!apiKey || apiKey.length < 4) return '••••••••';
  if (apiKey.length <= 8) return '••••' + apiKey.substring(apiKey.length - 4);
  return '••••••••••••••••••••••••••••••••' + apiKey.substring(apiKey.length - 4);
};

// Get environment variables
// Environment variables are accessed directly using process.env.NEXT_PUBLIC_*

export const agentConfigService = {
  // Create a new agent
  async createAgent(agentData: { name: string; status: string; description: string; model: string; provider: string; organization_id: string }): Promise<AgentConfigResponse> {
    try {
      console.log('🚀 Creating new agent...');
      
      // Using local API - no need to validate external environment variables
      console.log('🔍 Using local API for agent creation');

      // Create a basic agent configuration with defaults
      const basicConfig: AgentConfigRequest = {
        organization_id: agentData.organization_id,
        chatbot_api: process.env.NEXT_PUBLIC_CHATBOT_API_URL || '',
        chatbot_key: process.env.NEXT_PUBLIC_CHATBOT_API_KEY || '',
        tts_config: {
          provider: 'openai',
          openai: {
            api_key: process.env.NEXT_PUBLIC_OPEN_AI_API_KEY || '',
            voice: 'alloy',
            response_format: 'mp3',
            quality: 'standard',
            speed: 1.0
          }
        },
        stt_config: {
          provider: 'deepgram',
          deepgram: {
            api_key: process.env.NEXT_PUBLIC_DEEPGRAM_API_KEY || '',
            model: 'nova-2',
            language: 'en-US',
            punctuate: true,
            smart_format: true,
            interim_results: true
          }
        },
        initial_message: "Hello! I'm your AI assistant, how can I help you today?",
        nudge_text: "Hello, Are you still there?",
        nudge_interval: 15,
        max_nudges: 3,
        typing_volume: 0.8,
        max_call_duration: 300
      };

      // Use local API to create the agent
      const response = await fetch(`/api/agents/update/${agentData.name}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': process.env.NEXT_PUBLIC_LIVE_API_KEY || '',
        },
        body: JSON.stringify(basicConfig),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ Agent creation response:', result);
      return {
        success: true,
        data: { ...agentData, ...result },
        message: 'Agent created successfully'
      };
    } catch (error) {
      console.error('Agent creation error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to create agent'
      };
    }
  },

  // Configure agent with complete configuration
  async configureAgent(agentName: string, config: Partial<AgentConfigRequest>): Promise<AgentConfigResponse> {
    try {
      console.log('🚀 Starting agent configuration...');
      // Environment variables are accessed directly
      
      // Use local API instead of external API - no need to validate external env vars
      console.log('🔍 Using local API for agent configuration');
      const apiKey = process.env.NEXT_PUBLIC_LIVE_API_KEY || '';
      console.log('🔑 API Key being used:', apiKey ? 'Present' : 'Missing');

      // Fill in missing fields with defaults
      const completeConfig: AgentConfigRequest = {
        organization_id: config.organization_id,
        chatbot_api: config.chatbot_api || process.env.NEXT_PUBLIC_CHATBOT_API_URL || '',
        chatbot_key: config.chatbot_key || process.env.NEXT_PUBLIC_CHATBOT_API_KEY || '',
        tts_config: config.tts_config || {
          provider: 'openai',
          openai: {
            api_key: process.env.NEXT_PUBLIC_OPEN_AI_API_KEY || '',
            voice: 'alloy',
            response_format: 'mp3',
            quality: 'standard',
            speed: 1.0
          }
        },
        stt_config: config.stt_config || {
          provider: 'deepgram',
          deepgram: {
            api_key: process.env.NEXT_PUBLIC_DEEPGRAM_API_KEY || '',
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


      // Use local API instead of external API
      const response = await fetch(`/api/agents/update/${agentName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey,
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
      // Environment variables are accessed directly
      
      // Using local API - no need to validate external environment variables

      // Use local API for getting agent info
      console.log('🚀 Fetching agent info for:', agentName);
      
      const response = await fetch(`/api/agents/info/${agentName}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': process.env.NEXT_PUBLIC_LIVE_API_KEY || '',
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

  // Get all agents for the organization
  async getAllAgents(organizationId: string, signal?: AbortSignal): Promise<{ success: boolean; data?: any[]; message: string }> {
    try {
      // Use local API instead of external API
      console.log('🚀 Fetching agents for organization:', organizationId);
      
      const response = await fetch(`/api/agents/by-org/${organizationId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': process.env.NEXT_PUBLIC_LIVE_API_KEY || '',
        },
        signal,
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

      console.log('✅ Successfully fetched agents for organization:', organizationId, agents.length);
      console.log('🔍 Agents data:', agents);
      return {
        success: true,
        data: agents,
        message: 'Agents retrieved successfully'
      };
    } catch (error) {
      // Abort is expected during rapid refresh/changes
      if (error instanceof DOMException && error.name === 'AbortError') {
        console.log('Fetch aborted for getAllAgents');
        return { success: true, data: [], message: 'Aborted' };
      }
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
  async getAgentsByOrg(organizationId: string, signal?: AbortSignal): Promise<{ success: boolean; data?: any[]; message: string }> {
    try {
      // Environment variables are accessed directly
      
      console.log('🚀 Fetching agents for organization:', organizationId);
      
      const response = await fetch(`/api/agents/by-org/${organizationId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': process.env.NEXT_PUBLIC_LIVE_API_KEY || '',
        },
        signal,
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
      if (error instanceof DOMException && error.name === 'AbortError') {
        console.log('Fetch aborted for getAgentsByOrg');
        return { success: true, data: [], message: 'Aborted' };
      }
      console.error('Get agents by organization error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get agents by organization'
      };
    }
  },

  // Delete agent by organization
  async deleteAgent(agentName: string, organizationId: string): Promise<{ success: boolean; message: string }> {
    try {
      console.log('🚀 Deleting agent:', agentName, 'from organization:', organizationId);
      
      const response = await fetch(`/api/agents/delete-by-org/${organizationId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': process.env.NEXT_PUBLIC_LIVE_API_KEY || '',
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
      // Environment variables are accessed directly
      
      console.log('🚀 Deleting agent:', agentName, 'from organization:', organizationId);
      
      const response = await fetch(`/api/agents/delete-by-org/${organizationId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': process.env.NEXT_PUBLIC_LIVE_API_KEY || '',
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
    // Environment variables are accessed directly
    return {
      ELEVEN_LABS_API_KEY: maskApiKey(process.env.NEXT_PUBLIC_ELEVEN_LABS_API_KEY || ''),
      OPEN_AI_API_KEY: maskApiKey(process.env.NEXT_PUBLIC_OPEN_AI_API_KEY || ''),
      WHISPER_API_KEY: maskApiKey(process.env.NEXT_PUBLIC_WHISPER_API_KEY || ''),
      DEEPGRAM_API_KEY: maskApiKey(process.env.NEXT_PUBLIC_DEEPGRAM_API_KEY || ''),
      CARTESIA_API_KEY: maskApiKey(process.env.NEXT_PUBLIC_CARTESIA_API_KEY || '')
    };
  },

  // Get default voice IDs
  getDefaultVoiceIds() {
    // Environment variables are accessed directly
    return {
      elevenlabs: process.env.NEXT_PUBLIC_ELEVEN_LABS_VOICE_ID || '••••••••',
      cartesia: process.env.NEXT_PUBLIC_CARTESIA_VOICE_ID || '••••••••'
    };
  },

  // Get full API keys (for actual API calls)
  getFullApiKeys() {
    // Environment variables are accessed directly
    return {
      elevenlabs: process.env.NEXT_PUBLIC_ELEVEN_LABS_API_KEY || '',
      openai: process.env.NEXT_PUBLIC_OPEN_AI_API_KEY || '',
      whisper: process.env.NEXT_PUBLIC_WHISPER_API_KEY || '',
      deepgram: process.env.NEXT_PUBLIC_DEEPGRAM_API_KEY || '',
      cartesia: process.env.NEXT_PUBLIC_CARTESIA_API_KEY || ''
    };
  },

  // Get current organization ID
  getCurrentOrganizationId(): string | null {
    return getCurrentOrganizationId();
  }
};
