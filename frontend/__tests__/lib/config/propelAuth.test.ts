import { PROPELAUTH_CONFIG } from '@/lib/config/propelAuth';

// Mock environment variables
const originalEnv = process.env;
beforeEach(() => {
  jest.resetModules();
  process.env = { ...originalEnv };
});

afterEach(() => {
  process.env = originalEnv;
});

describe('PROPELAUTH_CONFIG', () => {
  it('should use NEXT_PUBLIC_PROPELAUTH_API_KEY when available', () => {
    process.env.NEXT_PUBLIC_PROPELAUTH_API_KEY = 'test-api-key';
    process.env.PROPELAUTH_API_KEY = 'fallback-api-key';
    
    // Re-import to get fresh config
    jest.resetModules();
    const { PROPELAUTH_CONFIG } = require('@/lib/config/propelAuth');
    
    expect(PROPELAUTH_CONFIG.API_KEY).toBe('test-api-key');
  });

  it('should fallback to PROPELAUTH_API_KEY when NEXT_PUBLIC_PROPELAUTH_API_KEY is not available', () => {
    delete process.env.NEXT_PUBLIC_PROPELAUTH_API_KEY;
    process.env.PROPELAUTH_API_KEY = 'fallback-api-key';
    
    // Re-import to get fresh config
    jest.resetModules();
    const { PROPELAUTH_CONFIG } = require('@/lib/config/propelAuth');
    
    expect(PROPELAUTH_CONFIG.API_KEY).toBe('fallback-api-key');
  });

  it('should use empty string when no API key is available', () => {
    delete process.env.NEXT_PUBLIC_PROPELAUTH_API_KEY;
    delete process.env.PROPELAUTH_API_KEY;
    
    // Re-import to get fresh config
    jest.resetModules();
    const { PROPELAUTH_CONFIG } = require('@/lib/config/propelAuth');
    
    expect(PROPELAUTH_CONFIG.API_KEY).toBe('');
  });

  it('should use NEXT_PUBLIC_PROPELAUTH_URL when available', () => {
    process.env.NEXT_PUBLIC_PROPELAUTH_URL = 'https://test.propelauth.com';
    process.env.NEXT_PUBLIC_AUTH_URL = 'https://fallback.auth.com';
    
    // Re-import to get fresh config
    jest.resetModules();
    const { PROPELAUTH_CONFIG } = require('@/lib/config/propelAuth');
    
    expect(PROPELAUTH_CONFIG.AUTH_URL).toBe('https://test.propelauth.com');
  });

  it('should fallback to NEXT_PUBLIC_AUTH_URL when NEXT_PUBLIC_PROPELAUTH_URL is not available', () => {
    delete process.env.NEXT_PUBLIC_PROPELAUTH_URL;
    process.env.NEXT_PUBLIC_AUTH_URL = 'https://fallback.auth.com';
    
    // Re-import to get fresh config
    jest.resetModules();
    const { PROPELAUTH_CONFIG } = require('@/lib/config/propelAuth');
    
    expect(PROPELAUTH_CONFIG.AUTH_URL).toBe('https://fallback.auth.com');
  });

  it('should use empty string when no auth URL is available', () => {
    delete process.env.NEXT_PUBLIC_PROPELAUTH_URL;
    delete process.env.NEXT_PUBLIC_AUTH_URL;
    
    // Re-import to get fresh config
    jest.resetModules();
    const { PROPELAUTH_CONFIG } = require('@/lib/config/propelAuth');
    
    expect(PROPELAUTH_CONFIG.AUTH_URL).toBe('');
  });
});

describe('getAuth - Basic Functionality', () => {
  it('should be a function', () => {
    // Re-import to get fresh config
    jest.resetModules();
    const { getAuth } = require('@/lib/config/propelAuth');
    
    expect(typeof getAuth).toBe('function');
  });

  it('should handle missing environment variables gracefully', () => {
    delete process.env.NEXT_PUBLIC_PROPELAUTH_API_KEY;
    delete process.env.NEXT_PUBLIC_PROPELAUTH_URL;
    
    // Re-import to get fresh config
    jest.resetModules();
    const { getAuth } = require('@/lib/config/propelAuth');
    
    // Should throw when called with empty config (as expected by the implementation)
    expect(() => getAuth()).toThrow('PropelAuth initialization failed');
  });
});
