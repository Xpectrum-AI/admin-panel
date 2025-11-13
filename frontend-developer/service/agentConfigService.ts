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
  system_prompt?: string;
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
    model: string;
    response_format: string;
    voice: string;
    language: string;
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
  provider: 'deepgram' | 'openai';
  deepgram?: {
    api_key: string;
    model: string;
    language: string;
    punctuate: boolean;
    smart_format: boolean;
    interim_results: boolean;
  };
  openai?: {
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
      // Using local API - no need to validate external environment variables
      // Create a basic agent configuration with defaults
      const basicConfig: AgentConfigRequest = {
        organization_id: agentData.organization_id,
        chatbot_api: process.env.NEXT_PUBLIC_CHATBOT_API_URL || '',
        chatbot_key: process.env.NEXT_PUBLIC_CHATBOT_API_KEY || '',
        tts_config: {
          provider: 'openai',
          openai: {
            api_key: '',
            model: 'gpt-4o-mini-tts',
            response_format: 'mp3',
            voice: 'alloy',
            language: 'en',
            speed: 1
          },
          elevenlabs: null
        },
        stt_config: {
          provider: 'openai',
          deepgram: null,
          openai: {
            api_key: '',
            model: 'gpt-4o-mini-transcribe',
            language: 'en'
          }
        },
        initial_message: "Hello! I'm your AI assistant, how can I help you today?",
        nudge_text: "Hello, Are you still there?",
        nudge_interval: 15,
        max_nudges: 3,
        typing_volume: 0.8,
        max_call_duration: 300,
        system_prompt: `# Appointment Scheduling Agent Prompt

## Identity & Purpose
You are Riley, an appointment scheduling voice agent for Wellness Partners, a multi-specialty health clinic. Your primary purpose is to efficiently schedule, confirm, reschedule, or cancel appointments while providing clear information about services and ensuring a smooth booking experience.

## Voice & Persona
### Personality
- Sound friendly, organized, and efficient
- Project a helpful and patient demeanor, especially with elderly or confused callers
- Maintain a warm but professional tone throughout the conversation
- Convey confidence and competence in managing the scheduling system

### Speech Characteristics
- Speak clearly and at a moderate pace
- Use simple, direct language that's easy to understand
- Avoid medical jargon unless the caller uses it first
- Be concise but thorough in your responses

## Core Responsibilities
1. *Appointment Scheduling*: Help callers book new appointments
2. *Appointment Management*: Confirm, reschedule, or cancel existing appointments
3. *Service Information*: Provide details about available services and providers
4. *Calendar Navigation*: Check availability and suggest optimal time slots
5. *Patient Support*: Address questions about appointments, policies, and procedures

## Key Guidelines
- Always verify caller identity before accessing appointment information
- Confirm all appointment details (date, time, provider, service) before finalizing
- Be proactive in suggesting alternative times if preferred slots are unavailable
- Maintain patient confidentiality and follow HIPAA guidelines
- Escalate complex medical questions to appropriate staff members
- End calls with clear confirmation of next steps

## Service Areas
- Primary Care
- Cardiology
- Dermatology
- Orthopedics
- Pediatrics
- Women's Health
- Mental Health Services

## Operating Hours
- Monday-Friday: 8:00 AM - 6:00 PM
- Saturday: 9:00 AM - 2:00 PM
- Sunday: Closed

Remember: You are the first point of contact for many patients. Your professionalism and helpfulness directly impact their experience with Wellness Partners.`
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
      return {
        success: true,
        data: { ...agentData, ...result },
        message: 'Agent created successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to create agent'
      };
    }
  },

  // Configure agent with complete configuration
  async configureAgent(agentName: string, config: Partial<AgentConfigRequest>): Promise<AgentConfigResponse> {
    try {
      // Environment variables are accessed directly
      
      // Use local API instead of external API - no need to validate external env vars
      const apiKey = process.env.NEXT_PUBLIC_LIVE_API_KEY || '';
      // Fill in missing fields with defaults
      const completeConfig: AgentConfigRequest = {
        organization_id: config.organization_id,
        chatbot_api: config.chatbot_api || process.env.NEXT_PUBLIC_CHATBOT_API_URL || '',
        chatbot_key: config.chatbot_key || process.env.NEXT_PUBLIC_CHATBOT_API_KEY || '',
        tts_config: config.tts_config || {
          provider: 'openai',
          openai: {
            api_key: '',
            model: 'gpt-4o-mini-tts',
            response_format: 'mp3',
            voice: 'alloy',
            language: 'en',
            speed: 1
          },
          elevenlabs: null
        },
        stt_config: config.stt_config || {
          provider: 'openai',
          deepgram: null,
          openai: {
            api_key: '',
            model: 'gpt-4o-mini-transcribe',
            language: 'en'
          }
        },
        initial_message: config.initial_message || "Hello! I'm your AI assistant, how can I help you today?",
        nudge_text: config.nudge_text || "Hello, Are you still there?",
        nudge_interval: config.nudge_interval || 15,
        max_nudges: config.max_nudges || 3,
        typing_volume: config.typing_volume || 0.8,
        max_call_duration: config.max_call_duration || 300,
        system_prompt: config.system_prompt || `# Appointment Scheduling Agent Prompt

## Identity & Purpose
You are Riley, an appointment scheduling voice agent for Wellness Partners, a multi-specialty health clinic. Your primary purpose is to efficiently schedule, confirm, reschedule, or cancel appointments while providing clear information about services and ensuring a smooth booking experience.

## Voice & Persona
### Personality
- Sound friendly, organized, and efficient
- Project a helpful and patient demeanor, especially with elderly or confused callers
- Maintain a warm but professional tone throughout the conversation
- Convey confidence and competence in managing the scheduling system

### Speech Characteristics
- Speak clearly and at a moderate pace
- Use simple, direct language that's easy to understand
- Avoid medical jargon unless the caller uses it first
- Be concise but thorough in your responses

## Core Responsibilities
1. *Appointment Scheduling*: Help callers book new appointments
2. *Appointment Management*: Confirm, reschedule, or cancel existing appointments
3. *Service Information*: Provide details about available services and providers
4. *Calendar Navigation*: Check availability and suggest optimal time slots
5. *Patient Support*: Address questions about appointments, policies, and procedures

## Key Guidelines
- Always verify caller identity before accessing appointment information
- Confirm all appointment details (date, time, provider, service) before finalizing
- Be proactive in suggesting alternative times if preferred slots are unavailable
- Maintain patient confidentiality and follow HIPAA guidelines
- Escalate complex medical questions to appropriate staff members
- End calls with clear confirmation of next steps

## Service Areas
- Primary Care
- Cardiology
- Dermatology
- Orthopedics
- Pediatrics
- Women's Health
- Mental Health Services

## Operating Hours
- Monday-Friday: 8:00 AM - 6:00 PM
- Saturday: 9:00 AM - 2:00 PM
- Sunday: Closed

Remember: You are the first point of contact for many patients. Your professionalism and helpfulness directly impact their experience with Wellness Partners.`
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
      return {
        success: true,
        data: result,
        message: 'Agent configured successfully'
      };
    } catch (error) {
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
      return {
        success: true,
        data: result,
        message: 'Agent configuration retrieved successfully'
      };
    } catch (error) {
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
          return {
            success: true,
            data: [],
            message: 'No agents found. Create your first agent!'
          };
        }
        
        throw new Error(errorMessage);
      }

      const result = await response.json();
// Handle different response formats
      let agents = [];
      if (Array.isArray(result)) {
        agents = result;
      } else if (result.agents && typeof result.agents === 'object') {
        // Convert object of agents to array format
        agents = Object.entries(result.agents).map(([agentName, agentData]: [string, any]) => ({
          name: agentName,
          ...agentData
        }));
      } else if (result.agents && Array.isArray(result.agents)) {
        agents = result.agents;
      } else if (result.data && Array.isArray(result.data)) {
        agents = result.data;
      } else {
        agents = [];
      }
      return {
        success: true,
        data: agents,
        message: 'Agents retrieved successfully'
      };
    } catch (error) {
      // Abort is expected during rapid refresh/changes
      if (error instanceof DOMException && error.name === 'AbortError') {
        return { success: true, data: [], message: 'Aborted' };
      }
      // Don't log 405 errors as they are expected
      if (error instanceof Error && error.message.includes('405')) {
        return {
          success: true,
          data: [],
          message: 'No agents found. Create your first agent!'
        };
      }
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
      return {
        success: true,
        data: agents,
        message: 'Agents retrieved successfully'
      };
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return { success: true, data: [], message: 'Aborted' };
      }
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get agents by organization'
      };
    }
  },

  // Delete agent by organization
  async deleteAgent(agentName: string, organizationId: string): Promise<{ success: boolean; message: string }> {
    try {
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
      return {
        success: true,
        message: 'Agent deleted successfully'
      };
    } catch (error) {
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
      return {
        success: true,
        message: 'Agent deleted successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to delete agent by organization'
      };
    }
  },

  // Delete agent by name using FastAPI endpoint
  async deleteAgentByName(agentName: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`/api/agents/delete/${agentName}`, {
        method: 'DELETE',
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
      return {
        success: true,
        message: result.message || 'Agent deleted successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to delete agent by name'
      };
    }
  },

  // Get default API keys (masked for display)
  // Now returns empty strings - API keys are handled by backend or user input
  getDefaultApiKeys() {
    return {
      ELEVEN_LABS_API_KEY: '',
      OPEN_AI_API_KEY: '',
      WHISPER_API_KEY: '',
      DEEPGRAM_API_KEY: '',
      CARTESIA_API_KEY: ''
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
  // Now returns empty strings - API keys are handled by backend or user input
  getFullApiKeys() {
    return {
      elevenlabs: '',
      openai: '',
      deepgram: '',
      cartesia: ''
    };
  },

  // Get current organization ID
  getCurrentOrganizationId(): string | null {
    return getCurrentOrganizationId();
  }
};
