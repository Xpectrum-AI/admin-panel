export const PROPELAUTH_CONFIG = {
  API_KEY:
    process.env.NEXT_PUBLIC_DEVELOPMENT_PROPELAUTH_API_KEY ||
    process.env.PROPELAUTH_API_KEY ||
    "",
  AUTH_URL:
    process.env.NEXT_PUBLIC_DEVELOPMENT_PROPELAUTH_URL ||
    process.env.NEXT_PUBLIC_AUTH_URL ||
    "",
};

// Lazy initialization - only create auth when needed
let auth: any = null;

export function getAuth() {
  if (!auth) {
    try {
      const { initBaseAuth } = require("@propelauth/node");
      auth = initBaseAuth({
        authUrl: PROPELAUTH_CONFIG.AUTH_URL,
        apiKey: PROPELAUTH_CONFIG.API_KEY,
      });
    } catch (error) {
      console.error("PropelAuth initialization error:", error);
      throw new Error("PropelAuth initialization failed");
    }
  }
  return auth;
}
