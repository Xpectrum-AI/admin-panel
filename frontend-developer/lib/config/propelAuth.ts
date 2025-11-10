// Lazy initialization - only create auth when needed
let auth: any = null;

export function getAuth() {
  if (!auth) {
    // Get environment variables at runtime
    const authUrl =
      process.env.NEXT_PUBLIC_DEVELOPMENT_PROPELAUTH_URL ||
      process.env.NEXT_PUBLIC_AUTH_URL ||
      "";
    const apiKey =
      process.env.NEXT_PUBLIC_DEVELOPMENT_PROPELAUTH_API_KEY ||
      process.env.PROPELAUTH_API_KEY ||
      "";

    // Validate before initializing
    if (!authUrl || !apiKey) {
      throw new Error(
        "NEXT_PUBLIC_DEVELOPMENT_PROPELAUTH_URL or NEXT_PUBLIC_DEVELOPMENT_PROPELAUTH_API_KEY is not configured"
      );
    }

    try {
      const { initBaseAuth } = require("@propelauth/node");
      auth = initBaseAuth({
        authUrl,
        apiKey,
      });
    } catch (error) {
      console.error("PropelAuth initialization error:", error);
      throw new Error("PropelAuth initialization failed");
    }
  }
  return auth;
}
