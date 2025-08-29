// Model Configuration Service for external API integration

const MODEL_API_BASE_URL = process.env.NEXT_PUBLIC_MODEL_API_BASE_URL || 'https://d22yt2oewbcglh.cloudfront.net/v1';
const MODEL_API_KEY = process.env.NEXT_PUBLIC_MODEL_API_KEY || 'app-CV6dxVdo4K226Yvm3vBj3iUO';

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
