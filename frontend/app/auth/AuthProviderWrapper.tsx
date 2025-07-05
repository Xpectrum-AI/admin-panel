// components/AuthProviderWrapper.tsx
"use client";

import { AuthProvider } from "@propelauth/react";

export function AuthProviderWrapper({ children }: { children: React.ReactNode }) {

  return (
    <AuthProvider authUrl="http://auth.admin-test.xpectrum-ai.com">
      {children}
    </AuthProvider>
  );
}
