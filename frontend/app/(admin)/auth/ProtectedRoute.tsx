// components/ProtectedRoute.tsx
"use client";

import { useAuthInfo } from "@propelauth/react";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { loading, user } = useAuthInfo();
  const pathname = usePathname();

  // Routes that don't require authentication
  const PUBLIC_ROUTES = ['/login', '/signup'];

  useEffect(() => {
    if (!loading && !user) {
      // Only redirect if user is not authenticated AND not on a public route
      if (!PUBLIC_ROUTES.some(route => pathname.startsWith(route))) {
        window.location.href = "/login";
      }
    }
  }, [loading, user, pathname]);

  // If still loading, show nothing
  if (loading) {
    return null;
  }

  // If user is not authenticated and on a public route, show children
  if (!user && PUBLIC_ROUTES.some(route => pathname.startsWith(route))) {
    return <>{children}</>;
  }

  // If user is not authenticated and not on a public route, show nothing (will redirect)
  if (!user) {
    return null;
  }

  // User is authenticated, show children
  return <>{children}</>;
}