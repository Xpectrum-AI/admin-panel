// components/ProtectedRoute.tsx
"use client";

import { useAuthInfo } from "@propelauth/react";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {

  const { loading, user, isLoggedIn } = useAuthInfo();

  const pathname = usePathname();
  const router = useRouter();
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
    
    // Check if user is authenticated
    if (!loading && !isLoggedIn) {
      // Redirect to login page if not authenticated (like main frontend)
      window.location.href = "/login";
      return null;
    }
    
    // Show loading while checking authentication
    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900">
          <div className="text-center">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-green-500/20 border-t-green-500 rounded-full animate-spin"></div>
              <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-green-400 rounded-full animate-spin" style={{ animationDuration: '1.5s' }}></div>
            </div>
            <p className="mt-6 font-medium text-gray-300">Loading...</p>
          </div>
        </div>
      );
    }
    
    // If authenticated, show children
    return <>{children}</>;
  }

  // Show loading while client-side hydration
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="text-center">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-green-500/20 border-t-green-500 rounded-full animate-spin"></div>
          <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-green-400 rounded-full animate-spin" style={{ animationDuration: '1.5s' }}></div>
        </div>
        <p className="mt-6 font-medium text-gray-300">Initializing...</p>
      </div>
    </div>
  );
}
