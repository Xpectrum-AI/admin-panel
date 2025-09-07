// Agent Configuration Service for external API integration

const AGENT_API_BASE_URL = process.env.NEXT_PUBLIC_AGENT_API_BASE_URL || 'https://d22yt2oewbcglh.cloudfront.net/v1';
const AGENT_API_KEY = process.env.NEXT_PUBLIC_AGENT_API_KEY || 'app-CV6dxVdo4K226Yvm3vBj3iUO';

const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${AGENT_API_KEY}`,
};

export interface AgentConfigRequest {
  organization_id: string;
  initial_message: string;
  nudge_text: string;
  nudge_interval: number;
  max_nudges: number;
  typing_volume: number;
  max_call_duration: number;
  tts_config: any;
  stt_config: any;
}

export interface AgentConfigResponse {
  success: boolean;
  message?: string;
  data?: any;
}

export interface VoiceConfigRequest {
  provider: string;
  cartesian?: any;
  openai?: any;
  elevenlabs?: any;
}

export interface VoiceConfigResponse {
  success: boolean;
  message?: string;
  data?: any;
}

export interface TranscriberConfigRequest {
  provider: string;
  deepgram?: any;
  whisper?: any;
}

export interface TranscriberConfigResponse {
  success: boolean;
  message?: string;
  data?: any;
}

export const agentConfigService = {
  // Get current agent configuration
  async getCurrentAgentConfig(agentName: string): Promise<AgentConfigResponse> {
    try {
      const response = await fetch(`${AGENT_API_BASE_URL}/agents/${agentName}`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        if (response.status === 404) {
          return {
            success: false,
            message: 'No agent configuration found',
          };
        }
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get agent configuration',
      };
    }
  },

  // Configure agent
  async configureAgent(agentName: string, config: AgentConfigRequest): Promise<AgentConfigResponse> {
    try {
      const response = await fetch(`${AGENT_API_BASE_URL}/agents/${agentName}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(config),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to configure agent',
      };
    }
  },

  // Configure voice settings
  async configureVoice(agentName: string, config: VoiceConfigRequest): Promise<VoiceConfigResponse> {
    try {
      const response = await fetch(`${AGENT_API_BASE_URL}/agents/${agentName}/voice`, {
        method: 'POST',
        headers,
        body: JSON.stringify(config),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to configure voice',
      };
    }
  },

  // Get current voice configuration
  async getCurrentVoiceConfig(agentName: string): Promise<VoiceConfigResponse> {
    try {
      const response = await fetch(`${AGENT_API_BASE_URL}/agents/${agentName}/voice`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        if (response.status === 404) {
          return {
            success: false,
            message: 'No voice configuration found',
          };
        }
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get voice configuration',
      };
    }
  },

  // Configure transcriber settings
  async configureTranscriber(agentName: string, config: TranscriberConfigRequest): Promise<TranscriberConfigResponse> {
    try {
      const response = await fetch(`${AGENT_API_BASE_URL}/agents/${agentName}/transcriber`, {
        method: 'POST',
        headers,
        body: JSON.stringify(config),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to configure transcriber',
      };
    }
  },

  // Get current transcriber configuration
  async getCurrentTranscriberConfig(agentName: string): Promise<TranscriberConfigResponse> {
    try {
      const response = await fetch(`${AGENT_API_BASE_URL}/agents/${agentName}/transcriber`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        if (response.status === 404) {
          return {
            success: false,
            message: 'No transcriber configuration found',
          };
        }
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get transcriber configuration',
      };
    }
  },

  // Get default API keys (for development)
  getFullApiKeys() {
    return {
      openai: process.env.NEXT_PUBLIC_OPENAI_API_KEY || 'sk-default-openai-key',
      elevenlabs: process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY || 'sk-default-elevenlabs-key',
      cartesia: process.env.NEXT_PUBLIC_CARTESIA_API_KEY || 'sk-default-cartesia-key',
      deepgram: process.env.NEXT_PUBLIC_DEEPGRAM_API_KEY || 'sk-default-deepgram-key',
      whisper: process.env.NEXT_PUBLIC_WHISPER_API_KEY || 'sk-default-whisper-key',
    };
  },

  // Get default voice IDs (for development)
  getDefaultVoiceIds() {
    return {
      elevenlabs: process.env.NEXT_PUBLIC_ELEVENLABS_VOICE_ID || 'default-voice-id',
      cartesia: process.env.NEXT_PUBLIC_CARTESIA_VOICE_ID || 'default-voice-id',
    };
  },

  // Get agents by specific organization
  async getAgentsByOrg(organizationId: string): Promise<{ success: boolean; data?: any[]; message: string }> {
    try {
      
      const response = await fetch(`${AGENT_API_BASE_URL}/agents/by-org/${organizationId}`, {
        method: 'GET',
        headers,
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

      return {
        success: true,
        data: agents,
        message: 'Agents retrieved successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get agents by organization'
      };
    }
  },

  // Mask API key for display
  maskApiKey(apiKey: string): string {
    if (!apiKey || apiKey.length < 8) return '••••••••••••••••••••••••••••••••';
    return apiKey.substring(0, 4) + '••••••••••••••••••••••••••••••••' + apiKey.substring(apiKey.length - 4);
  },
};

// Export the maskApiKey function for use in components
export const maskApiKey = agentConfigService.maskApiKey;
