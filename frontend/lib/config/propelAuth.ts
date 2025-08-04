export const PROPELAUTH_CONFIG = {
  API_KEY: process.env.NEXT_PUBLIC_PROPELAUTH_API_KEY || process.env.PROPELAUTH_API_KEY || "",
  AUTH_URL: process.env.NEXT_PUBLIC_PROPELAUTH_URL || process.env.NEXT_PUBLIC_AUTH_URL || ""
  // API_KEY: "41f5b65faf738abef77864b5753afd5d7f12231eb4556a14667b6cc3a8e0e103830a9789e8ee5a54773d9f512f11d17a",
  // AUTH_URL: "https://auth.admin.xpectrum-ai.com"
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