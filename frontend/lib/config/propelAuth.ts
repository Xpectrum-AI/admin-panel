// PropelAuth configuration
export const PROPELAUTH_CONFIG = {
  API_KEY: "888ea8af8e1d78888fcb15304e2633446516519573b7f6219943b306a4626df95d477061f77b939b8cdadd7a50559a6c",
  AUTH_URL: "https://181249979.propelauthtest.com"
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