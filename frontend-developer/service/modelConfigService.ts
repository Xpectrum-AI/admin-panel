// Model Configuration Service for external API integration

export interface ModelConfigRequest {
  provider: string;
  model: string;
}

export interface PromptConfigRequest {
  prompt: string;
}

export interface ModelConfigResponse {
  success: boolean;
  message?: string;
  data?: any;
}

// Get environment variables
const getEnvironmentVariables = () => {
  return {
    MODEL_API_BASE_URL: process.env.NEXT_PUBLIC_MODEL_API_BASE_URL || '',
    MODEL_API_KEY: process.env.NEXT_PUBLIC_MODEL_API_KEY || ''
  };
};

export const modelConfigService = {
  // Configure model
  async configureModel(config: ModelConfigRequest): Promise<ModelConfigResponse> {
    try {
      const env = getEnvironmentVariables();
      
      // Validate only when making the API call
      if (!env.MODEL_API_BASE_URL || !env.MODEL_API_KEY) {
        throw new Error('Missing required environment variables for model configuration');
      }

      console.log('�� Making API call to live backend for model configuration');

      // Use Next.js API proxy to avoid CORS issues
      const response = await fetch('/api/model/apps/current/model-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${env.MODEL_API_KEY}`,
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
      if (!env.MODEL_API_BASE_URL || !env.MODEL_API_KEY) {
        throw new Error('Missing required environment variables for prompt configuration');
      }

      console.log('�� Making API call to live backend for prompt configuration');

      // Use Next.js API proxy to avoid CORS issues
      const response = await fetch('/api/model/apps/current/prompt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${env.MODEL_API_KEY}`,
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
