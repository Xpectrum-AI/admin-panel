// components/ProtectedRoute.tsx
"use client";

import { useAuthInfo } from "@propelauth/react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { loading, user } = useAuthInfo();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      //redirectToLoginPage(); // redirects to PropelAuth login page
      router.push("/login");
    }
  }, [loading, user, router]);

  if (loading || !user) {
    return null; // or a spinner if you prefer
  }

  return <>{children}</>;
}
