// components/ProtectedRoute.tsx
"use client";

import { useAuthInfo } from "@propelauth/react";
import { useEffect } from "react";
import { useRedirectFunctions } from "@propelauth/react";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { loading, user } = useAuthInfo();
  const { redirectToLoginPage } = useRedirectFunctions();

  useEffect(() => {
    if (!loading && !user) {
      redirectToLoginPage({
        postLoginRedirectUrl: "http://localhost:3000/dashboard"
      });
    }
  }, [loading, user, redirectToLoginPage]);

  if (loading || !user) {
    return null; // or a spinner if you prefer
  }

  return <>{children}</>;
}
