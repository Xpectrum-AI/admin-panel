import {
  getAllAgentsPhoneNumbers,
  addUpdateAgentPhoneNumber,
  getAvailablePhoneNumbersByOrg,
  unassignPhoneNumber,
  PhoneNumberRequest,
  PhoneNumberResponse,
  AgentPhoneNumber
} from '../../service/phoneNumberService';

// Mock fetch globally
global.fetch = jest.fn();

describe('phoneNumberService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Set required environment variable for tests
    process.env.NEXT_PUBLIC_LIVE_API_URL = 'https://d25b4i9wbz6f8t.cloudfront.net';
  });

  afterEach(() => {
    // Clean up environment variable
    delete process.env.NEXT_PUBLIC_LIVE_API_URL;
  });

  describe('getAllAgentsPhoneNumbers', () => {
    it('should make GET request to correct endpoint', async () => {
      const mockResponse = { 
        success: true, 
        data: [
          { prefix: 'agent1', phone_number: '+1234567890' },
          { prefix: 'agent2', phone_number: '+0987654321' }
        ] 
      };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await getAllAgentsPhoneNumbers();

      expect(global.fetch).toHaveBeenCalledWith(
        'https://d25b4i9wbz6f8t.cloudfront.net/agents/phonenumbers/all',
        expect.objectContaining({
          method: 'GET',
          headers: { 
            'Content-Type': 'application/json',
            'X-API-Key': 'xpectrum-ai@123'
          },
        })
      );
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResponse);
    });

    it('should handle API errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      const result = await getAllAgentsPhoneNumbers();

      expect(result.success).toBe(false);
      expect(result.message).toContain('HTTP error! status: 500');
    });

    it('should handle network errors', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const result = await getAllAgentsPhoneNumbers();

      expect(result.success).toBe(false);
      expect(result.message).toBe('Network error');
    });
  });

  describe('addUpdateAgentPhoneNumber', () => {
    it('should make POST request to correct endpoint', async () => {
      const mockResponse = { success: true, message: 'Phone number assigned successfully' };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await addUpdateAgentPhoneNumber('agent123', '+1234567890');

      expect(global.fetch).toHaveBeenCalledWith(
        'https://d25b4i9wbz6f8t.cloudfront.net/agents/phonenumber/agent123',
        expect.objectContaining({
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'X-API-Key': 'xpectrum-ai@123'
          },
          body: JSON.stringify({ phone_number: '+1234567890' }),
        })
      );
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResponse);
    });

    it('should handle API errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: async () => ({ message: 'Invalid phone number' }),
      });

      const result = await addUpdateAgentPhoneNumber('agent123', '+1234567890');

      expect(result.success).toBe(false);
      expect(result.message).toContain('Failed to assign phone number: HTTP error! status: 400 - Bad Request');
    });

    it('should handle network errors', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const result = await addUpdateAgentPhoneNumber('agent123', '+1234567890');

      expect(result.success).toBe(false);
      expect(result.message).toContain('Failed to assign phone number: Network error');
    });
  });

  describe('unassignPhoneNumber', () => {
    it('should make POST request to correct endpoint', async () => {
      const mockResponse = { success: true, message: 'Phone number unassigned successfully' };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await unassignPhoneNumber('+1234567890');

      expect(global.fetch).toHaveBeenCalledWith(
        'https://d25b4i9wbz6f8t.cloudfront.net/agents/phonenumber/unassign',
        expect.objectContaining({
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'X-API-Key': 'xpectrum-ai@123'
          },
          body: JSON.stringify({ phone_number: '+1234567890' }),
        })
      );
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResponse);
    });

    it('should handle API errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({ message: 'Phone number not found' }),
      });

      const result = await unassignPhoneNumber('+1234567890');

      expect(result.success).toBe(false);
      expect(result.message).toContain('Failed to unassign phone number: HTTP error! status: 404 - Not Found');
    });

    it('should handle network errors', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const result = await unassignPhoneNumber('+1234567890');

      expect(result.success).toBe(false);
      expect(result.message).toContain('Failed to unassign phone number: Network error');
    });
  });

  describe('getAvailablePhoneNumbersByOrg', () => {
    it('should make GET request to correct endpoint', async () => {
      const mockResponse = { 
        success: true, 
        data: [
          { phone_number: '+1234567890' },
          { phone_number: '+0987654321' }
        ] 
      };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await getAvailablePhoneNumbersByOrg('hospital_123');

      expect(global.fetch).toHaveBeenCalledWith(
        'https://d25b4i9wbz6f8t.cloudfront.net/agents/phonenumbers/by-org/hospital_123',
        expect.objectContaining({
          method: 'GET',
          headers: { 
            'Content-Type': 'application/json',
            'X-API-Key': 'xpectrum-ai@123'
          },
        })
      );
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResponse);
    });

    it('should handle API errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      const result = await getAvailablePhoneNumbersByOrg('hospital_123');

      expect(result.success).toBe(false);
      expect(result.message).toContain('HTTP error! status: 404');
    });

    it('should handle network errors', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const result = await getAvailablePhoneNumbersByOrg('hospital_123');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Network error');
    });
  });
});
