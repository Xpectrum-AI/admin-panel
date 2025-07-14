// components/ProtectedRoute.tsx
"use client";

import { useAuthInfo } from "@propelauth/react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {useRedirectFunctions} from "@propelauth/react"

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { loading, user } = useAuthInfo();
  const {redirectToLoginPage} = useRedirectFunctions();
  const router = useRouter();
  useEffect(() => {
    if (!loading && !user) {
      window.location.href = "https://181249979.propelauthtest.com/propelauth/oauth/authorize?redirect_uri=http://localhost:8001/api/v1/oauth2callback&client_id=29d33276022f9b66722356fb92930464&response_type=code&state=fckchjcsdjcsdjcsfdhjcsfd";
      
    }
  }, [loading, user]);

  if (loading || !user) {
    return null; // or a spinner if you prefer
  }

  return <>{children}</>;
}
