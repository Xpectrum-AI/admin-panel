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

// Helper function to get environment variables safely
const getEnvVar = (key: string): string | undefined => {
  // Only access environment variables on client side
  if (typeof window === 'undefined') {
    console.log('🔍 Server-side rendering detected, skipping environment variable access');
    return undefined;
  }
  
  // Try different ways to access environment variables
  const value = process.env[key];
  console.log(`🔍 Environment variable ${key}:`, value ? 'SET' : 'NOT SET');
  
  // Also try accessing it directly from window object (for debugging)
  if (typeof window !== 'undefined') {
    console.log(`🔍 Window object check for ${key}:`, (window as any)[key] ? 'SET' : 'NOT SET');
  }
  
  // Log all available environment variables for debugging
  console.log('🔍 All available process.env keys:', Object.keys(process.env).filter(k => k.startsWith('NEXT_PUBLIC_')));
  
  return value;
};

// Get environment variables without validation (for display purposes)
const getEnvironmentVariables = () => {
  console.log('🔍 Getting environment variables...');
  
  // Try to get from process.env first
  let env = {
    MODEL_API_BASE_URL: getEnvVar('NEXT_PUBLIC_MODEL_API_BASE_URL'),
    MODEL_API_KEY: getEnvVar('NEXT_PUBLIC_MODEL_API_KEY')
  };
  
  // If not available, try to get from window object or use defaults
  if (!env.MODEL_API_BASE_URL || !env.MODEL_API_KEY) {
    console.log('🔍 Environment variables not found in process.env, trying alternatives...');
    
    // Try to get from window object
    if (typeof window !== 'undefined') {
      env.MODEL_API_BASE_URL = env.MODEL_API_BASE_URL || (window as any).NEXT_PUBLIC_MODEL_API_BASE_URL;
      env.MODEL_API_KEY = env.MODEL_API_KEY || (window as any).NEXT_PUBLIC_MODEL_API_KEY;
    }
    
    // If still not available, use the values that were shown in the user's test
    if (!env.MODEL_API_BASE_URL) {
      env.MODEL_API_BASE_URL = 'https://d22yt2oewbcglh.cloudfront.net/v1';
      console.log('🔍 Using fallback MODEL_API_BASE_URL');
    }
    
    if (!env.MODEL_API_KEY) {
      env.MODEL_API_KEY = 'app-CV6dxVdo4K226Yvm3vBj3iUO';
      console.log('🔍 Using fallback MODEL_API_KEY');
    }
  }
  
  console.log('🔍 Environment variables result:', {
    MODEL_API_BASE_URL: env.MODEL_API_BASE_URL ? 'SET' : 'NOT SET',
    MODEL_API_KEY: env.MODEL_API_KEY ? 'SET' : 'NOT SET'
  });
  return env;
};

export const modelConfigService = {
  // Configure model
  async configureModel(config: ModelConfigRequest): Promise<ModelConfigResponse> {
    try {
      console.log('🚀 Starting model configuration...');
      const env = getEnvironmentVariables();
      
      // Validate only when making the API call
      if (!env.MODEL_API_BASE_URL || !env.MODEL_API_KEY) {
        console.error('❌ Missing environment variables:', {
          MODEL_API_BASE_URL: !!env.MODEL_API_BASE_URL,
          MODEL_API_KEY: !!env.MODEL_API_KEY
        });
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
        console.error('❌ Missing environment variables:', {
          MODEL_API_BASE_URL: !!env.MODEL_API_BASE_URL,
          MODEL_API_KEY: !!env.MODEL_API_KEY
        });
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
