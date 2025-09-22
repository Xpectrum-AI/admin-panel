// Model Configuration Service for external API integration

export interface ModelConfigRequest {
  provider: string;
  model: string;
  api_key?: string;
  chatbot_api_key?: string;
}

export interface PromptConfigRequest {
  prompt: string;
  chatbot_api_key?: string;
}

export interface ModelConfigResponse {
  success: boolean;
  message?: string;
  data?: any;
}

// Get environment variables
const getEnvironmentVariables = () => {
  return {
    DIFY_BASE_URL: process.env.NEXT_PUBLIC_DIFY_BASE_URL || '',
    CHATBOT_API_KEY: process.env.NEXT_PUBLIC_CHATBOT_API_KEY || ''
  };
};

export const modelConfigService = {
  // Configure model
  async configureModel(config: ModelConfigRequest): Promise<ModelConfigResponse> {
    try {
      const env = getEnvironmentVariables();
      
      // Validate only when making the API call
      if (!env.DIFY_BASE_URL || !env.CHATBOT_API_KEY) {
        throw new Error('Missing required environment variables for model configuration');
      }

      console.log('⚙️ Making API call to model configuration endpoint');

      // Use our new model-config API endpoint
      const response = await fetch('/api/model-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': process.env.NEXT_PUBLIC_LIVE_API_KEY || '',
        },
        body: JSON.stringify(config),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      return {
        success: true,
        data: result,
        message: 'Model configured successfully'
      };
    } catch (error) {
      console.error('Model configuration error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to configure model'
      };
    }
  },

  // Configure prompt
  async configurePrompt(config: PromptConfigRequest): Promise<ModelConfigResponse> {
    try {
      console.log('🚀 Starting prompt configuration...');
      const env = getEnvironmentVariables();
      
      // Validate only when making the API call
      if (!env.DIFY_BASE_URL || !env.CHATBOT_API_KEY) {
        throw new Error('Missing required environment variables for prompt configuration');
      }

      console.log('⚙️ Making API call to prompt configuration endpoint');

      // Use our new prompt-config API endpoint
      const response = await fetch('/api/prompt-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': process.env.NEXT_PUBLIC_LIVE_API_KEY || '',
        },
        body: JSON.stringify(config),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      return {
        success: true,
        data: result,
        message: 'Prompt configured successfully'
      };
    } catch (error) {
      console.error('Prompt configuration error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to configure prompt'
      };
    }
  }
};