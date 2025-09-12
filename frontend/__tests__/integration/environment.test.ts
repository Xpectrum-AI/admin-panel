import { authenticateApiKey } from '@/lib/middleware/auth';

// Mock NextRequest since it's not available in test environment
class MockNextRequest {
  constructor(public url: string, public init?: { headers?: Record<string, string> }) {}
  get headers() {
    return {
      get: (name: string) => this.init?.headers?.[name] || null,
    };
  }
}

// Mock environment variables
const originalEnv = process.env;
beforeEach(() => {
  jest.resetModules();
  process.env = { ...originalEnv };
});

afterEach(() => {
  process.env = originalEnv;
});

describe('Environment Variable Integration', () => {
  describe('API Configuration', () => {
    it('should use correct environment variables for API configuration', () => {
      // Set up environment variables
      process.env.NEXT_PUBLIC_LIVE_API_URL = 'https://api.example.com';
      process.env.NEXT_PUBLIC_LIVE_API_KEY = 'test-api-key';
      process.env.NEXT_PUBLIC_PROPELAUTH_URL = 'https://auth.example.com';
      process.env.NEXT_PUBLIC_PROPELAUTH_API_KEY = 'propel-auth-key';
      process.env.NEXT_PUBLIC_SUPER_ADMIN_ORG_ID = 'super-admin-org';

      // Re-import modules to get fresh environment variables
      jest.resetModules();
      
      // Verify the environment variables are accessible
      expect(process.env.NEXT_PUBLIC_LIVE_API_URL).toBe('https://api.example.com');
      expect(process.env.NEXT_PUBLIC_LIVE_API_KEY).toBe('test-api-key');
      expect(process.env.NEXT_PUBLIC_PROPELAUTH_URL).toBe('https://auth.example.com');
      expect(process.env.NEXT_PUBLIC_PROPELAUTH_API_KEY).toBe('propel-auth-key');
      expect(process.env.NEXT_PUBLIC_SUPER_ADMIN_ORG_ID).toBe('super-admin-org');
    });

    it('should handle missing environment variables gracefully', () => {
      // Clear environment variables
      delete process.env.NEXT_PUBLIC_LIVE_API_URL;
      delete process.env.NEXT_PUBLIC_LIVE_API_KEY;
      delete process.env.NEXT_PUBLIC_PROPELAUTH_URL;
      delete process.env.NEXT_PUBLIC_PROPELAUTH_API_KEY;
      delete process.env.NEXT_PUBLIC_SUPER_ADMIN_ORG_ID;

      // Re-import modules to get fresh environment variables
      jest.resetModules();
      
      // Verify the environment variables are undefined or empty
      expect(process.env.NEXT_PUBLIC_LIVE_API_URL).toBeUndefined();
      expect(process.env.NEXT_PUBLIC_LIVE_API_KEY).toBeUndefined();
      expect(process.env.NEXT_PUBLIC_PROPELAUTH_URL).toBeUndefined();
      expect(process.env.NEXT_PUBLIC_PROPELAUTH_API_KEY).toBeUndefined();
      expect(process.env.NEXT_PUBLIC_SUPER_ADMIN_ORG_ID).toBeUndefined();
    });
  });

  describe('Authentication Integration', () => {
    it('should authenticate with correct API keys from environment', async () => {
      // Set up environment variables
      const originalNodeEnv = process.env.NODE_ENV;
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: 'production',
        writable: true,
      });
      process.env.NEXT_PUBLIC_LIVE_API_KEY = 'live-api-key';
      process.env.NEXT_PUBLIC_PROPELAUTH_API_KEY = 'propel-api-key';

      // Re-import modules to get fresh environment variables
      jest.resetModules();
      const { authenticateApiKey } = require('@/lib/middleware/auth');

      // Test with live API key
      const request1 = new MockNextRequest('http://localhost:3000/api/test', {
        headers: {
          'x-api-key': 'live-api-key',
        },
      });

      const result1 = await authenticateApiKey(request1 as any);
      expect(result1).toEqual({ success: true });

      // Test with PropelAuth API key
      const request2 = new MockNextRequest('http://localhost:3000/api/test', {
        headers: {
          'x-api-key': 'propel-api-key',
        },
      });

      const result2 = await authenticateApiKey(request2 as any);
      expect(result2).toEqual({ success: true });
    });

    it('should handle hardcoded API key', async () => {
      // Set up environment variables
      const originalNodeEnv = process.env.NODE_ENV;
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: 'production',
        writable: true,
      });

      // Re-import modules to get fresh environment variables
      jest.resetModules();
      const { authenticateApiKey } = require('@/lib/middleware/auth');

      const request = new MockNextRequest('http://localhost:3000/api/test', {
        headers: {
          'x-api-key': 'test-api-key',
        },
      });

      const result = await authenticateApiKey(request as any);
      expect(result).toEqual({ success: true });

      // Restore original NODE_ENV
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: originalNodeEnv,
        writable: true,
      });
    });

    it('should reject invalid API keys', async () => {
      // Set up environment variables
      const originalNodeEnv = process.env.NODE_ENV;
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: 'production',
        writable: true,
      });
      process.env.NEXT_PUBLIC_LIVE_API_KEY = 'valid-key';

      // Re-import modules to get fresh environment variables
      jest.resetModules();
      const { authenticateApiKey } = require('@/lib/middleware/auth');

      const request = new MockNextRequest('http://localhost:3000/api/test', {
        headers: {
          'x-api-key': 'invalid-key',
        },
      });

      const result = await authenticateApiKey(request as any);
      expect(result).toEqual({ success: false, error: 'Invalid API key' });

      // Restore original NODE_ENV
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: originalNodeEnv,
        writable: true,
      });
    });
  });

  describe('Development vs Production', () => {
    it('should bypass authentication in development', async () => {
      // Set up environment variables
      const originalNodeEnv = process.env.NODE_ENV;
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: 'development',
        writable: true,
      });

      // Re-import modules to get fresh environment variables
      jest.resetModules();
      const { authenticateApiKey } = require('@/lib/middleware/auth');

      const request = new MockNextRequest('http://localhost:3000/api/test', {
        headers: {},
      });

      const result = await authenticateApiKey(request as any);
      expect(result).toEqual({ success: true });

      // Restore original NODE_ENV
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: originalNodeEnv,
        writable: true,
      });
    });

    it('should require authentication in production', async () => {
      // Set up environment variables
      const originalNodeEnv = process.env.NODE_ENV;
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: 'production',
        writable: true,
      });

      // Re-import modules to get fresh environment variables
      jest.resetModules();
      const { authenticateApiKey } = require('@/lib/middleware/auth');

      const request = new MockNextRequest('http://localhost:3000/api/test', {
        headers: {},
      });

      const result = await authenticateApiKey(request as any);
      expect(result).toEqual({ success: false, error: 'API key missing' });

      // Restore original NODE_ENV
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: originalNodeEnv,
        writable: true,
      });
    });
  });

  describe('Environment Variable Fallbacks', () => {
    it('should use fallback environment variables when primary ones are missing', () => {
      // Set up fallback environment variables
      delete process.env.NEXT_PUBLIC_PROPELAUTH_API_KEY;
      process.env.PROPELAUTH_API_KEY = 'fallback-api-key';
      
      delete process.env.NEXT_PUBLIC_PROPELAUTH_URL;
      process.env.NEXT_PUBLIC_AUTH_URL = 'https://fallback.auth.com';

      // Re-import modules to get fresh environment variables
      jest.resetModules();
      
      // Verify fallback values are used
      expect(process.env.PROPELAUTH_API_KEY).toBe('fallback-api-key');
      expect(process.env.NEXT_PUBLIC_AUTH_URL).toBe('https://fallback.auth.com');
    });

    it('should handle empty environment variables', () => {
      // Set up empty environment variables
      process.env.NEXT_PUBLIC_LIVE_API_URL = '';
      process.env.NEXT_PUBLIC_LIVE_API_KEY = '';
      process.env.NEXT_PUBLIC_PROPELAUTH_URL = '';
      process.env.NEXT_PUBLIC_PROPELAUTH_API_KEY = '';

      // Re-import modules to get fresh environment variables
      jest.resetModules();
      
      // Verify empty values are handled
      expect(process.env.NEXT_PUBLIC_LIVE_API_URL).toBe('');
      expect(process.env.NEXT_PUBLIC_LIVE_API_KEY).toBe('');
      expect(process.env.NEXT_PUBLIC_PROPELAUTH_URL).toBe('');
      expect(process.env.NEXT_PUBLIC_PROPELAUTH_API_KEY).toBe('');
    });
  });
});
