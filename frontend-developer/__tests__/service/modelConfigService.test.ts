import { modelConfigService } from '@/service/modelConfigService';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('modelConfigService', () => {
  const mockModelConfig = {
    provider: 'langgenius/openai/openai',
    model: 'gpt-4o'
  };

  const mockPromptConfig = {
    prompt: 'You are an expert calendar management assistant.'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Environment variables are already set from .env file
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('configureModel', () => {
    it('should successfully configure model', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({
          data: {
            provider: 'langgenius/openai/openai',
            model: 'gpt-4o',
            updated: true
          }
        })
      };

      mockFetch.mockResolvedValueOnce(mockResponse);

      const result = await modelConfigService.configureModel(mockModelConfig);

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/model/apps/current/model-config',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer REDACTED'
          },
          body: JSON.stringify(mockModelConfig)
        }
      );

      expect(result).toEqual({
        success: true,
        message: 'Model configured successfully',
        data: {
          data: {
            provider: 'langgenius/openai/openai',
            model: 'gpt-4o',
            updated: true
          }
        }
      });
    });

    it('should handle API error response', async () => {
      const mockErrorResponse = {
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: async () => ({
          error: 'Invalid provider configuration'
        })
      };

      mockFetch.mockResolvedValueOnce(mockErrorResponse);

      const result = await modelConfigService.configureModel(mockModelConfig);

      expect(result).toEqual({
        success: false,
        message: 'Invalid provider configuration'
      });
    });

    it('should handle network error', async () => {
      const networkError = new Error('Network error');
      mockFetch.mockRejectedValueOnce(networkError);

      const result = await modelConfigService.configureModel(mockModelConfig);

      expect(result).toEqual({
        success: false,
        message: 'Network error'
      });
    });

    it('should handle response without error field', async () => {
      const mockErrorResponse = {
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({
          message: 'Server error'
        })
      };

      mockFetch.mockResolvedValueOnce(mockErrorResponse);

      const result = await modelConfigService.configureModel(mockModelConfig);

      expect(result).toEqual({
        success: false,
        message: 'Server error'
      });
    });

    it('should handle JSON parsing error', async () => {
      const mockErrorResponse = {
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => {
          throw new Error('Invalid JSON');
        }
      };

      mockFetch.mockResolvedValueOnce(mockErrorResponse);

      const result = await modelConfigService.configureModel(mockModelConfig);

      expect(result).toEqual({
        success: false,
        message: 'HTTP 500: Internal Server Error'
      });
    });
  });

  describe('configurePrompt', () => {
    it('should successfully configure prompt', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({
          data: {
            prompt: 'You are an expert calendar management assistant.',
            updated: true
          }
        })
      };

      mockFetch.mockResolvedValueOnce(mockResponse);

      const result = await modelConfigService.configurePrompt(mockPromptConfig);

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/model/apps/current/prompt',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer REDACTED'
          },
          body: JSON.stringify(mockPromptConfig)
        }
      );

      expect(result).toEqual({
        success: true,
        message: 'Prompt configured successfully',
        data: {
          data: {
            prompt: 'You are an expert calendar management assistant.',
            updated: true
          }
        }
      });
    });

    it('should handle API error response for prompt', async () => {
      const mockErrorResponse = {
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: async () => ({
          error: 'Invalid prompt format'
        })
      };

      mockFetch.mockResolvedValueOnce(mockErrorResponse);

      const result = await modelConfigService.configurePrompt(mockPromptConfig);

      expect(result).toEqual({
        success: false,
        message: 'Invalid prompt format'
      });
    });

    it('should handle network error for prompt', async () => {
      const networkError = new Error('Network error');
      mockFetch.mockRejectedValueOnce(networkError);

      const result = await modelConfigService.configurePrompt(mockPromptConfig);

      expect(result).toEqual({
        success: false,
        message: 'Network error'
      });
    });

    it('should handle response without error field for prompt', async () => {
      const mockErrorResponse = {
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({
          message: 'Server error'
        })
      };

      mockFetch.mockResolvedValueOnce(mockErrorResponse);

      const result = await modelConfigService.configurePrompt(mockPromptConfig);

      expect(result).toEqual({
        success: false,
        message: 'Server error'
      });
    });

    it('should handle JSON parsing error for prompt', async () => {
      const mockErrorResponse = {
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => {
          throw new Error('Invalid JSON');
        }
      };

      mockFetch.mockResolvedValueOnce(mockErrorResponse);

      const result = await modelConfigService.configurePrompt(mockPromptConfig);

      expect(result).toEqual({
        success: false,
        message: 'HTTP 500: Internal Server Error'
      });
    });
  });

  describe('API configuration', () => {
    it('should use correct API base URL and headers from environment', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({ data: { updated: true } })
      };

      mockFetch.mockResolvedValueOnce(mockResponse);

      await modelConfigService.configureModel({
        provider: 'langgenius/openai/openai',
        model: 'gpt-4o'
      });

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/model/apps/current/model-config',
        expect.objectContaining({
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer REDACTED'
          }
        })
      );
    });

    it('should throw error when environment variables are not set', async () => {
      // Temporarily clear environment variables
      const originalBaseUrl = process.env.NEXT_PUBLIC_MODEL_API_BASE_URL;
      const originalApiKey = process.env.NEXT_PUBLIC_MODEL_API_KEY;
      delete process.env.NEXT_PUBLIC_MODEL_API_BASE_URL;
      delete process.env.NEXT_PUBLIC_MODEL_API_KEY;

      const result = await modelConfigService.configureModel({
        provider: 'langgenius/openai/openai',
        model: 'gpt-4o'
      });

      expect(result).toEqual({
        success: false,
        message: 'Missing required environment variables for model configuration'
      });

      // Restore environment variables
      process.env.NEXT_PUBLIC_MODEL_API_BASE_URL = originalBaseUrl;
      process.env.NEXT_PUBLIC_MODEL_API_KEY = originalApiKey;
    });
  });
});
