import { authenticateApiKey, authenticateUser } from '@/lib/middleware/auth';

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
  // Mock NODE_ENV as a writable property
  Object.defineProperty(process.env, 'NODE_ENV', {
    value: 'development',
    writable: true,
  });
});

afterEach(() => {
  process.env = originalEnv;
});

describe('authenticateApiKey', () => {
  it('should return success in development environment', async () => {
    // Mock NODE_ENV for this test
    const originalNodeEnv = process.env.NODE_ENV;
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: 'development',
      writable: true,
    });
    
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

  it('should return error when API key is missing in production', async () => {
    // Mock NODE_ENV for this test
    const originalNodeEnv = process.env.NODE_ENV;
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: 'production',
      writable: true,
    });
    
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

  it('should validate API key from x-api-key header', async () => {
    // Mock environment variables for this test
    const originalNodeEnv = process.env.NODE_ENV;
    const originalApiKey = process.env.NEXT_PUBLIC_LIVE_API_KEY;
    
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: 'production',
      writable: true,
    });
    process.env.NEXT_PUBLIC_LIVE_API_KEY = 'test-api-key';
    
    const request = new MockNextRequest('http://localhost:3000/api/test', {
      headers: {
        'x-api-key': 'test-api-key',
      },
    });

    const result = await authenticateApiKey(request as any);
    
    expect(result).toEqual({ success: true });
    
    // Restore original values
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: originalNodeEnv,
      writable: true,
    });
    process.env.NEXT_PUBLIC_LIVE_API_KEY = originalApiKey;
  });

  it('should validate API key from X-API-Key header', async () => {
    // Mock environment variables for this test
    const originalNodeEnv = process.env.NODE_ENV;
    const originalApiKey = process.env.NEXT_PUBLIC_LIVE_API_KEY;
    
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: 'production',
      writable: true,
    });
    process.env.NEXT_PUBLIC_LIVE_API_KEY = 'test-api-key';
    
    const request = new MockNextRequest('http://localhost:3000/api/test', {
      headers: {
        'X-API-Key': 'test-api-key',
      },
    });

    const result = await authenticateApiKey(request as any);
    
    expect(result).toEqual({ success: true });
    
    // Restore original values
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: originalNodeEnv,
      writable: true,
    });
    process.env.NEXT_PUBLIC_LIVE_API_KEY = originalApiKey;
  });

  it('should validate API key from authorization header', async () => {
    // Mock environment variables for this test
    const originalNodeEnv = process.env.NODE_ENV;
    const originalApiKey = process.env.NEXT_PUBLIC_LIVE_API_KEY;
    
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: 'production',
      writable: true,
    });
    process.env.NEXT_PUBLIC_LIVE_API_KEY = 'test-api-key';
    
    const request = new MockNextRequest('http://localhost:3000/api/test', {
      headers: {
        'authorization': 'Bearer test-api-key',
      },
    });

    const result = await authenticateApiKey(request as any);
    
    expect(result).toEqual({ success: true });
    
    // Restore original values
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: originalNodeEnv,
      writable: true,
    });
    process.env.NEXT_PUBLIC_LIVE_API_KEY = originalApiKey;
  });

  it('should return error for invalid API key', async () => {
    // Mock environment variables for this test
    const originalNodeEnv = process.env.NODE_ENV;
    const originalApiKey = process.env.NEXT_PUBLIC_LIVE_API_KEY;
    
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: 'production',
      writable: true,
    });
    process.env.NEXT_PUBLIC_LIVE_API_KEY = 'valid-key';
    
    const request = new MockNextRequest('http://localhost:3000/api/test', {
      headers: {
        'x-api-key': 'invalid-key',
      },
    });

    const result = await authenticateApiKey(request as any);
    
    expect(result).toEqual({ success: false, error: 'Invalid API key' });
    
    // Restore original values
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: originalNodeEnv,
      writable: true,
    });
    process.env.NEXT_PUBLIC_LIVE_API_KEY = originalApiKey;
  });

  it('should validate hardcoded API key', async () => {
    // Mock NODE_ENV for this test
    const originalNodeEnv = process.env.NODE_ENV;
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: 'production',
      writable: true,
    });
    
    const request = new MockNextRequest('http://localhost:3000/api/test', {
      headers: {
        'x-api-key': 'xpectrum-ai@123',
      },
    });

    const result = await authenticateApiKey(request as any  );
    
    expect(result).toEqual({ success: true });
    
    // Restore original NODE_ENV
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: originalNodeEnv,
      writable: true,
    });
  });

  it('should handle PropelAuth API key', async () => {
    // Mock environment variables for this test
    const originalNodeEnv = process.env.NODE_ENV;
    const originalApiKey = process.env.NEXT_PUBLIC_PROPELAUTH_API_KEY;
    
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: 'production',
      writable: true,
    });
    process.env.NEXT_PUBLIC_PROPELAUTH_API_KEY = 'propel-auth-key';
    
    const request = new MockNextRequest('http://localhost:3000/api/test', {
      headers: {
        'x-api-key': 'propel-auth-key',
      },
    });

    const result = await authenticateApiKey(request as any);
    
    expect(result).toEqual({ success: true });
    
    // Restore original values
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: originalNodeEnv,
      writable: true,
    });
    process.env.NEXT_PUBLIC_PROPELAUTH_API_KEY = originalApiKey;
  });

  it('should handle multiple valid API keys', async () => {
    // Mock environment variables for this test
    const originalNodeEnv = process.env.NODE_ENV;
    const originalLiveKey = process.env.NEXT_PUBLIC_LIVE_API_KEY;
    const originalPropelKey = process.env.NEXT_PUBLIC_PROPELAUTH_API_KEY;
    
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: 'production',
      writable: true,
    });
    process.env.NEXT_PUBLIC_LIVE_API_KEY = 'live-key';
    process.env.NEXT_PUBLIC_PROPELAUTH_API_KEY = 'propel-key';
    
    const request1 = new MockNextRequest('http://localhost:3000/api/test', {
      headers: {
        'x-api-key': 'live-key',
      },
    });

    const request2 = new MockNextRequest('http://localhost:3000/api/test', {
      headers: {
        'x-api-key': 'propel-key',
      },
    });

    const result1 = await authenticateApiKey(request1 as any);
    const result2 = await authenticateApiKey(request2 as any);
    
    expect(result1).toEqual({ success: true });
    expect(result2).toEqual({ success: true });
    
    // Restore original values
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: originalNodeEnv,
      writable: true,
    });
    process.env.NEXT_PUBLIC_LIVE_API_KEY = originalLiveKey;
    process.env.NEXT_PUBLIC_PROPELAUTH_API_KEY = originalPropelKey;
  });

  it('should handle authentication errors gracefully', async () => {
    // Mock NODE_ENV for this test
    const originalNodeEnv = process.env.NODE_ENV;
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: 'production',
      writable: true,
    });
    
    // Mock a request that would cause an error
    const request = new MockNextRequest('http://localhost:3000/api/test', {
      headers: {
        'x-api-key': 'test-key',
      },
    });

    // Mock headers.get to throw an error
    jest.spyOn(request.headers, 'get').mockImplementation(() => {
      throw new Error('Headers error');
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

describe('authenticateUser', () => {
  it('should return success for user authentication', async () => {
    const request = new MockNextRequest('http://localhost:3000/api/test', {
      headers: {},
    });

    const result = await authenticateUser(request as any);
    
    expect(result).toEqual({ success: true });
  });
});
