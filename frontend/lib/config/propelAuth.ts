// PropelAuth configuration
export const PROPELAUTH_CONFIG = {
  API_KEY: process.env.NEXT_PUBLIC_PROPELAUTH_API_KEY || process.env.PROPELAUTH_API_KEY || "",
  AUTH_URL: process.env.NEXT_PUBLIC_PROPELAUTH_URL || process.env.NEXT_PUBLIC_AUTH_URL || "",
};

// Lazy initialization - only create auth when needed
let auth: any = null;

export function getAuth() {
  if (!auth) {
    try {
      const { initAuth } = require('@propelauth/express');
      auth = initAuth({
        authUrl: PROPELAUTH_CONFIG.AUTH_URL,
        apiKey: PROPELAUTH_CONFIG.API_KEY,
      });
    } catch (error) {
      throw new Error('PropelAuth initialization failed');
    }
  }
  return auth;
} 