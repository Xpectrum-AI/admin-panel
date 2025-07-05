// components/AuthProviderWrapper.tsx
"use client";

import { AuthProvider, useAuthInfo } from "@propelauth/react";
import { SyncLoader } from "react-spinners";

function AuthLoader({ children }: { children: React.ReactNode }) {
  const { loading } = useAuthInfo();
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <SyncLoader size={15} color="#000000" />
      </div>
    );
  }
  return <>{children}</>;
}

export function AuthProviderWrapper({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider authUrl="https://181249979.propelauthtest.com">
      <AuthLoader>{children}</AuthLoader>
    </AuthProvider>
  );
}
