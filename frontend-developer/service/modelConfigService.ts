// Model Configuration Service for external API integration

const MODEL_API_BASE_URL = process.env.NEXT_PUBLIC_MODEL_API_BASE_URL || 'https://d22yt2oewbcglh.cloudfront.net/v1';
const MODEL_API_KEY = process.env.NEXT_PUBLIC_MODEL_API_KEY || 'REDACTED';

const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${MODEL_API_KEY}`,
};

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

export const modelConfigService = {
  // Get current model configuration
  async getCurrentModelConfig(): Promise<ModelConfigResponse> {
    try {
      console.log('🔍 Fetching current model configuration from:', `${MODEL_API_BASE_URL}/apps/current/model-config`);
      
      const response = await fetch(`${MODEL_API_BASE_URL}/apps/current/model-config`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        if (response.status === 404) {
          console.log('📝 No model configuration found (404)');
          return {
            success: false,
            message: 'No model configuration found',
          };
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ Model configuration fetched successfully');
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      console.error('❌ Get model configuration error:', error);
      // Return a more user-friendly error message
      return {
        success: false,
        message: 'Unable to connect to model configuration service. Please check your network connection.',
      };
    }
  },

  // Get current prompt configuration
  async getCurrentPromptConfig(): Promise<ModelConfigResponse> {
    try {
      console.log('🔍 Fetching current prompt configuration from:', `${MODEL_API_BASE_URL}/apps/current/prompt`);
      
      const response = await fetch(`${MODEL_API_BASE_URL}/apps/current/prompt`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        if (response.status === 404) {
          console.log('📝 No prompt configuration found (404)');
          return {
            success: false,
            message: 'No prompt configuration found',
          };
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ Prompt configuration fetched successfully');
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      console.error('❌ Get prompt configuration error:', error);
      // Return a more user-friendly error message
      return {
        success: false,
        message: 'Unable to connect to prompt configuration service. Please check your network connection.',
      };
    }
  },

  // Configure model provider and model
  async configureModel(config: ModelConfigRequest): Promise<ModelConfigResponse> {
    try {
      const response = await fetch(`${MODEL_API_BASE_URL}/apps/current/model-config`, {
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
      console.error('Model configuration error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to configure model',
      };
    }
  },

  // Configure system prompt
  async configurePrompt(config: PromptConfigRequest): Promise<ModelConfigResponse> {
    try {
      const response = await fetch(`${MODEL_API_BASE_URL}/apps/current/prompt`, {
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
      console.error('Prompt configuration error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to configure prompt',
      };
    }
  },
};
