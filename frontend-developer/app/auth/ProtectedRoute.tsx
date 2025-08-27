// components/ProtectedRoute.tsx
"use client";

import { useAuthInfo } from "@propelauth/react";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { loading, user } = useAuthInfo();
  const pathname = usePathname();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Routes that don't require authentication
  const PUBLIC_ROUTES = ['/login', '/signup'];

  // For development, bypass authentication
  if (isClient) {
    // If on a public route, show children
    if (PUBLIC_ROUTES.some(route => pathname.startsWith(route))) {
      return <>{children}</>;
    }
    
    // For all other routes, show children (bypassing auth)
    return <>{children}</>;
  }

  // Show loading while client-side hydration
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
    </div>
  );
}
