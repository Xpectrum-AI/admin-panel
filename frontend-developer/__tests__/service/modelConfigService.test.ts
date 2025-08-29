import { modelConfigService } from '../../service/modelConfigService';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock environment variables
const originalEnv = process.env;

describe('modelConfigService', () => {
  beforeEach(() => {
    mockFetch.mockClear();
    // Set up environment variables for testing
    process.env.NEXT_PUBLIC_MODEL_API_BASE_URL = process.env.NEXT_PUBLIC_MODEL_API_BASE_URL || 'https://d22yt2oewbcglh.cloudfront.net/v1';
    process.env.NEXT_PUBLIC_MODEL_API_KEY = process.env.NEXT_PUBLIC_MODEL_API_KEY || 'test-api-key';
  });

  afterEach(() => {
    jest.clearAllMocks();
    process.env = originalEnv;
  });

  describe('configureModel', () => {
    const mockModelConfig = {
      provider: 'langgenius/openai/openai',
      model: 'gpt-4o'
    };

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
        `${process.env.NEXT_PUBLIC_MODEL_API_BASE_URL}/apps/current/model-config`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_MODEL_API_KEY}`
          },
          body: JSON.stringify(mockModelConfig)
        }
      );

      expect(result).toEqual({
        success: true,
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
        message: 'HTTP 500: Internal Server Error'
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
        message: 'Invalid JSON'
      });
    });
  });

  describe('configurePrompt', () => {
    const mockPromptConfig = {
      prompt: 'You are an expert calendar management assistant.'
    };

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
        `${process.env.NEXT_PUBLIC_MODEL_API_BASE_URL}/apps/current/prompt`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_MODEL_API_KEY}`
          },
          body: JSON.stringify(mockPromptConfig)
        }
      );

      expect(result).toEqual({
        success: true,
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
        message: 'HTTP 500: Internal Server Error'
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
        message: 'Invalid JSON'
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
        expect.stringContaining(process.env.NEXT_PUBLIC_MODEL_API_BASE_URL || ''),
        expect.objectContaining({
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_MODEL_API_KEY || ''}`
          }
        })
      );
    });

    it('should use fallback values when environment variables are not set', async () => {
      // Temporarily clear environment variables
      const originalBaseUrl = process.env.NEXT_PUBLIC_MODEL_API_BASE_URL;
      const originalApiKey = process.env.NEXT_PUBLIC_MODEL_API_KEY;
      delete process.env.NEXT_PUBLIC_MODEL_API_BASE_URL;
      delete process.env.NEXT_PUBLIC_MODEL_API_KEY;

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
        expect.stringContaining('https://d22yt2oewbcglh.cloudfront.net/v1'),
        expect.objectContaining({
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer REDACTED'
          }
        })
      );

      // Restore environment variables
      process.env.NEXT_PUBLIC_MODEL_API_BASE_URL = originalBaseUrl;
      process.env.NEXT_PUBLIC_MODEL_API_KEY = originalApiKey;
    });
  });
});
