// components/AuthProviderWrapper.tsx
"use client";

import { AuthProvider } from "@propelauth/react";
import { useEffect, useState } from "react";

export function AuthProviderWrapper({ children }: { children: React.ReactNode }) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Get the PropelAuth URL from environment variables
  const getAuthUrl = () => {
    // Check for production environment
    if (process.env.NODE_ENV === 'production') {
      return process.env.NEXT_PUBLIC_PROPELAUTH_URL || "https://auth.admin-test.xpectrum-ai.com";
    }
    
    // Check for test environment
    if (process.env.NEXT_PUBLIC_ENV === 'test') {
      return "https://181249979.propelauthtest.com";
    }
    
    // Default to test environment for development
    return "https://181249979.propelauthtest.com";
  };

  // Prevent hydration mismatch by not rendering until client-side
  if (!isClient) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <AuthProvider authUrl={getAuthUrl()}>
      {children}
    </AuthProvider>
  );
}