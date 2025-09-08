import { agentConfigService } from '@/service/agentConfigService';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('agentConfigService', () => {
  const mockAgentConfig = {
    name: 'Test Agent',
    description: 'Test Description',
    organization_id: 'test-org',
    initial_message: 'Hello, how can I help you?',
    nudge_text: 'Are you still there?',
    nudge_interval: 30,
    max_nudges: 3,
    typing_volume: 0.8,
    max_call_duration: 3600,
    model: 'gpt-4o',
    voice: 'Elliot',
    transcriber: 'OpenAI',
    tools: ['calendar', 'email'],
    tts_config: {
      provider: 'OpenAI',
      voice: 'Elliot',
      language: 'English',
      speed: -0.5
    },
    stt_config: {
      provider: 'OpenAI',
      language: 'En',
      model: 'Nova 2',
      punctuate: true,
      smart_format: true,
      interim_result: false
    }
  };

  const mockVoiceConfig = {
    provider: 'OpenAI',
    voice: 'Elliot',
    language: 'English',
    speed: -0.5
  };

  const mockTranscriberConfig = {
    provider: 'OpenAI',
    language: 'En',
    model: 'Nova 2',
    punctuate: true,
    smart_format: true,
    interim_result: false
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Set default environment variables for testing
    process.env.NEXT_PUBLIC_AGENT_API_BASE_URL = 'https://api.example.com';
    process.env.NEXT_PUBLIC_AGENT_API_KEY = 'test-api-key';
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('configureAgent', () => {
    it('should successfully configure agent', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({
          data: {
            agent: mockAgentConfig,
            updated: true
          }
        })
      };

      mockFetch.mockResolvedValueOnce(mockResponse);

      const result = await agentConfigService.configureAgent('test-agent', mockAgentConfig);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://d22yt2oewbcglh.cloudfront.net/v1/agents/test-agent',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer REDACTED'
          },
          body: JSON.stringify(mockAgentConfig)
        }
      );

      expect(result).toEqual({
        success: true,
        data: {
          data: {
            agent: mockAgentConfig,
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
          error: 'Invalid agent configuration'
        })
      };

      mockFetch.mockResolvedValueOnce(mockErrorResponse);

      const result = await agentConfigService.configureAgent('test-agent', mockAgentConfig);

      expect(result).toEqual({
        success: false,
        message: 'Invalid agent configuration'
      });
    });

    it('should handle network error', async () => {
      const networkError = new Error('Network error');
      mockFetch.mockRejectedValueOnce(networkError);

      const result = await agentConfigService.configureAgent('test-agent', mockAgentConfig);

      expect(result).toEqual({
        success: false,
        message: 'Network error'
      });
    });
  });

  describe('getAgentConfig', () => {
    it('should successfully get agent configuration', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({
          data: {
            agent: mockAgentConfig
          }
        })
      };

      mockFetch.mockResolvedValueOnce(mockResponse);

      const result = await agentConfigService.getCurrentAgentConfig('test-agent');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://d22yt2oewbcglh.cloudfront.net/v1/agents/test-agent',
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer REDACTED'
          }
        }
      );

      expect(result).toEqual({
        success: true,
        data: {
          data: {
            agent: mockAgentConfig
          }
        }
      });
    });

    it('should handle API error when getting agent config', async () => {
      const mockErrorResponse = {
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({
          error: 'Agent not found'
        })
      };

      mockFetch.mockResolvedValueOnce(mockErrorResponse);

      const result = await agentConfigService.getCurrentAgentConfig('test-agent');

      expect(result).toEqual({
        success: false,
        message: 'No agent configuration found'
      });
    });
  });

  describe('getAgentsByOrg', () => {
    it('should successfully get agents by organization', async () => {
      const mockAgents = [
        { id: '1', name: 'Agent 1', prefix: 'agent1' },
        { id: '2', name: 'Agent 2', prefix: 'agent2' }
      ];

      const mockResponse = {
        ok: true,
        json: async () => ({
          data: mockAgents
        })
      };

      mockFetch.mockResolvedValueOnce(mockResponse);

      const result = await agentConfigService.getAgentsByOrg('test-org');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://d22yt2oewbcglh.cloudfront.net/v1/agents/by-org/test-org',
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer REDACTED'
          }
        }
      );

      expect(result).toEqual({
        success: true,
        message: 'Agents retrieved successfully',
        data: mockAgents
      });
    });
  });

  describe('configureVoice', () => {
    it('should successfully configure voice', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({
          data: {
            voice: mockVoiceConfig,
            updated: true
          }
        })
      };

      mockFetch.mockResolvedValueOnce(mockResponse);

      const result = await agentConfigService.configureVoice('test-agent', mockVoiceConfig);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://d22yt2oewbcglh.cloudfront.net/v1/agents/test-agent/voice',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer REDACTED'
          },
          body: JSON.stringify(mockVoiceConfig)
        }
      );

      expect(result).toEqual({
        success: true,
        data: {
          data: {
            voice: mockVoiceConfig,
            updated: true
          }
        }
      });
    });
  });

  describe('getCurrentVoiceConfig', () => {
    it('should successfully get current voice configuration', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({
          data: mockVoiceConfig
        })
      };

      mockFetch.mockResolvedValueOnce(mockResponse);

      const result = await agentConfigService.getCurrentVoiceConfig('test-agent');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://d22yt2oewbcglh.cloudfront.net/v1/agents/test-agent/voice',
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer REDACTED'
          }
        }
      );

      expect(result).toEqual({
        success: true,
        data: {
          data: mockVoiceConfig
        }
      });
    });
  });

  describe('configureTranscriber', () => {
    it('should successfully configure transcriber', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({
          data: {
            transcriber: mockTranscriberConfig,
            updated: true
          }
        })
      };

      mockFetch.mockResolvedValueOnce(mockResponse);

      const result = await agentConfigService.configureTranscriber('test-agent', mockTranscriberConfig);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://d22yt2oewbcglh.cloudfront.net/v1/agents/test-agent/transcriber',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer REDACTED'
          },
          body: JSON.stringify(mockTranscriberConfig)
        }
      );

      expect(result).toEqual({
        success: true,
        data: {
          data: {
            transcriber: mockTranscriberConfig,
            updated: true
          }
        }
      });
    });
  });

  describe('getCurrentTranscriberConfig', () => {
    it('should successfully get current transcriber configuration', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({
          data: mockTranscriberConfig
        })
      };

      mockFetch.mockResolvedValueOnce(mockResponse);

      const result = await agentConfigService.getCurrentTranscriberConfig('test-agent');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://d22yt2oewbcglh.cloudfront.net/v1/agents/test-agent/transcriber',
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer REDACTED'
          }
        }
      );

      expect(result).toEqual({
        success: true,
        data: {
          data: mockTranscriberConfig
        }
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

      await agentConfigService.configureAgent('test-agent', mockAgentConfig);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://d22yt2oewbcglh.cloudfront.net/v1/agents/test-agent',
        expect.objectContaining({
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer REDACTED'
          }
        })
      );
    });

    it('should use fallback values when environment variables are not set', async () => {
      // Temporarily clear environment variables
      const originalBaseUrl = process.env.NEXT_PUBLIC_AGENT_API_BASE_URL;
      const originalApiKey = process.env.NEXT_PUBLIC_AGENT_API_KEY;
      delete process.env.NEXT_PUBLIC_AGENT_API_BASE_URL;
      delete process.env.NEXT_PUBLIC_AGENT_API_KEY;

      const mockResponse = {
        ok: true,
        json: async () => ({ data: { updated: true } })
      };

      mockFetch.mockResolvedValueOnce(mockResponse);

      await agentConfigService.configureAgent('test-agent', mockAgentConfig);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://d22yt2oewbcglh.cloudfront.net/v1/agents/test-agent',
        expect.objectContaining({
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer REDACTED'
          }
        })
      );

      // Restore environment variables
      process.env.NEXT_PUBLIC_AGENT_API_BASE_URL = originalBaseUrl;
      process.env.NEXT_PUBLIC_AGENT_API_KEY = originalApiKey;
    });
  });
});
