import { 
  getAllAgentsPhoneNumbers,
  addUpdateAgentPhoneNumber,
  getAvailablePhoneNumbersByOrg,
  unassignPhoneNumber
} from '@/service/phoneNumberService';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('phoneNumberService', () => {
  const mockPhoneNumber = {
    prefix: 'agent1',
    phone_number: '+1234567890',
    organization_id: 'test-org',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Set default environment variables for testing
    process.env.NEXT_PUBLIC_LIVE_API_URL = 'https://d25b4i9wbz6f8t.cloudfront.net';
    process.env.NEXT_PUBLIC_PHONE_API_KEY = 'xpectrum-ai@123';
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('getAllAgentsPhoneNumbers', () => {
    it('should successfully get all agents phone numbers', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({
          success: true,
          data: {
            phonenumbers: {
              'agent1': mockPhoneNumber
            }
          }
        })
      };

      mockFetch.mockResolvedValueOnce(mockResponse);

      const result = await getAllAgentsPhoneNumbers();

      expect(mockFetch).toHaveBeenCalledWith(
        'https://d25b4i9wbz6f8t.cloudfront.net/agents/phonenumbers/all',
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': 'xpectrum-ai@123'
          }
        }
      );

      expect(result).toEqual({
        success: true,
        data: {
          data: {
            phonenumbers: {
              'agent1': mockPhoneNumber
            }
          },
          success: true
        }
      });
    });

    it('should handle API error response', async () => {
      const mockErrorResponse = {
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({
          error: 'Failed to fetch phone numbers'
        })
      };

      mockFetch.mockResolvedValueOnce(mockErrorResponse);

      const result = await getAllAgentsPhoneNumbers();

      expect(result).toEqual({
        success: false,
        message: 'HTTP error! status: 500 - Internal Server Error'
      });
    });

    it('should handle network error', async () => {
      const networkError = new Error('Network error');
      mockFetch.mockRejectedValueOnce(networkError);

      const result = await getAllAgentsPhoneNumbers();

      expect(result).toEqual({
        success: false,
        message: 'Network error'
      });
    });
  });

  describe('addUpdateAgentPhoneNumber', () => {
    it('should successfully add/update agent phone number', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({
          success: true,
          data: {
            agent: 'agent1',
            phone_number: '+1234567890',
            updated: true
          }
        })
      };

      mockFetch.mockResolvedValueOnce(mockResponse);

      const result = await addUpdateAgentPhoneNumber('agent1', '+1234567890');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://d25b4i9wbz6f8t.cloudfront.net/agents/phonenumber/agent1',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': 'xpectrum-ai@123'
          },
          body: JSON.stringify({
            phone_number: '+1234567890'
          })
        }
      );

      expect(result).toEqual({
        success: true,
        data: {
          data: {
            agent: 'agent1',
            phone_number: '+1234567890',
            updated: true
          },
          success: true
        }
      });
    });

    it('should handle API error response', async () => {
      const mockErrorResponse = {
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: async () => ({
          error: 'Invalid phone number assignment'
        })
      };

      mockFetch.mockResolvedValueOnce(mockErrorResponse);

      const result = await addUpdateAgentPhoneNumber('agent1', '+1234567890');

      expect(result).toEqual({
        success: false,
        message: 'Failed to assign phone number: HTTP error! status: 400 - Bad Request'
      });
    });
  });

  describe('getAvailablePhoneNumbersByOrg', () => {
    it('should successfully get available phone numbers by organization', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({
          success: true,
          data: {
            phonenumbers: {
              'available1': {
                prefix: 'available1',
                phone_number: '+1987654321',
                organization_id: 'test-org'
              }
            }
          }
        })
      };

      mockFetch.mockResolvedValueOnce(mockResponse);

      const result = await getAvailablePhoneNumbersByOrg('test-org');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://d25b4i9wbz6f8t.cloudfront.net/agents/phonenumbers/by-org/test-org',
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': 'xpectrum-ai@123'
          }
        }
      );

      expect(result).toEqual({
        success: true,
        data: {
          data: {
            phonenumbers: {
              'available1': {
                prefix: 'available1',
                phone_number: '+1987654321',
                organization_id: 'test-org'
              }
            }
          },
          success: true
        }
      });
    });

    it('should handle API error response', async () => {
      const mockErrorResponse = {
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({
          error: 'No available phone numbers found'
        })
      };

      mockFetch.mockResolvedValueOnce(mockErrorResponse);

      const result = await getAvailablePhoneNumbersByOrg('test-org');

      expect(result).toEqual({
        success: false,
        message: 'HTTP error! status: 404 - Not Found'
      });
    });
  });

  describe('unassignPhoneNumber', () => {
    it('should successfully unassign phone number', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({
          success: true,
          data: {
            phone_number: '+1234567890',
            unassigned: true
          }
        })
      };

      mockFetch.mockResolvedValueOnce(mockResponse);

      const result = await unassignPhoneNumber('+1234567890');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://d25b4i9wbz6f8t.cloudfront.net/agents/phonenumber/unassign',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': 'xpectrum-ai@123'
          },
          body: JSON.stringify({
            phone_number: '+1234567890'
          })
        }
      );

      expect(result).toEqual({
        success: true,
        data: {
          data: {
            phone_number: '+1234567890',
            unassigned: true
          },
          success: true
        }
      });
    });

    it('should handle API error response', async () => {
      const mockErrorResponse = {
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: async () => ({
          error: 'Failed to unassign phone number'
        })
      };

      mockFetch.mockResolvedValueOnce(mockErrorResponse);

      const result = await unassignPhoneNumber('+1234567890');

      expect(result).toEqual({
        success: false,
        message: 'Failed to unassign phone number: HTTP error! status: 400 - Bad Request'
      });
    });
  });

  describe('API configuration', () => {
    it('should use correct API base URL and headers from environment', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({ success: true, data: {} })
      };

      mockFetch.mockResolvedValueOnce(mockResponse);

      await getAllAgentsPhoneNumbers();

      expect(mockFetch).toHaveBeenCalledWith(
        'https://d25b4i9wbz6f8t.cloudfront.net/agents/phonenumbers/all',
        expect.objectContaining({
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': 'xpectrum-ai@123'
          }
        })
      );
    });

    it('should use fallback values when environment variables are not set', async () => {
      // Temporarily clear environment variables
      const originalBaseUrl = process.env.NEXT_PUBLIC_PHONE_API_BASE_URL;
      const originalApiKey = process.env.NEXT_PUBLIC_PHONE_API_KEY;
      delete process.env.NEXT_PUBLIC_PHONE_API_BASE_URL;
      delete process.env.NEXT_PUBLIC_PHONE_API_KEY;

      const mockResponse = {
        ok: true,
        json: async () => ({ success: true, data: {} })
      };

      mockFetch.mockResolvedValueOnce(mockResponse);

      await getAllAgentsPhoneNumbers();

      expect(mockFetch).toHaveBeenCalledWith(
        'https://d25b4i9wbz6f8t.cloudfront.net/agents/phonenumbers/all',
        expect.objectContaining({
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': 'xpectrum-ai@123'
          }
        })
      );

      // Restore environment variables
      process.env.NEXT_PUBLIC_PHONE_API_BASE_URL = originalBaseUrl;
      process.env.NEXT_PUBLIC_PHONE_API_KEY = originalApiKey;
    });
  });
});
