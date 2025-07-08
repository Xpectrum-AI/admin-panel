// components/AuthProviderWrapper.tsx
"use client";

import { AuthProvider } from "@propelauth/react";

export function AuthProviderWrapper({ children }: { children: React.ReactNode }) {

  return (
    <AuthProvider authUrl="https://181249979.propelauthtest.com">
      {children}
    </AuthProvider>
  );
}