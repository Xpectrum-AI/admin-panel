// components/ProtectedRoute.tsx
"use client";

import { useAuthInfo } from "@propelauth/react";
import { useEffect } from "react";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { loading, user } = useAuthInfo();
  useEffect(() => {
    if (!loading && !user) {
      window.location.href = "/login";
    }
  }, [loading, user]);

  if (loading || !user) {
    return null; // or a spinner if you prefer
  }

  return <>{children}</>;
}