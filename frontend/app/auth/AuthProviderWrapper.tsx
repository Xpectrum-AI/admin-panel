// components/AuthProviderWrapper.tsx
"use client";
import { AuthProvider } from "@propelauth/react";
import { useEffect } from "react";

export function AuthProviderWrapper({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Clear any existing auth tokens on mount to prevent refresh token errors
    const clearAuthTokens = () => {
      if (typeof window !== 'undefined') {
        try {
          // Clear localStorage items that might contain stale tokens
          const keysToRemove = [];
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && (key.includes('propelauth') || key.includes('auth') || key.includes('token'))) {
              keysToRemove.push(key);
            }
          }
          keysToRemove.forEach(key => localStorage.removeItem(key));
          
          // Also clear sessionStorage
          const sessionKeysToRemove = [];
          for (let i = 0; i < sessionStorage.length; i++) {
            const key = sessionStorage.key(i);
            if (key && (key.includes('propelauth') || key.includes('auth') || key.includes('token'))) {
              sessionKeysToRemove.push(key);
            }
          }
          sessionKeysToRemove.forEach(key => sessionStorage.removeItem(key));
          
          // Clear any cookies that might contain auth tokens
          document.cookie.split(";").forEach(cookie => {
            const eqPos = cookie.indexOf("=");
            const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
            if (name.includes('propelauth') || name.includes('auth') || name.includes('token')) {
              document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
            }
          });
        } catch (error) {
          console.warn('Error clearing auth tokens:', error);
        }
      }
    };

    // Check for refresh token errors in the URL or network requests
    const hasRefreshTokenError = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const hasError = urlParams.get('error');
      const errorDescription = urlParams.get('error_description');
      
      return hasError || 
             errorDescription?.includes('refresh_token') || 
             window.location.href.includes('refresh_token') ||
             window.location.href.includes('401');
    };

    // Clear tokens if we detect refresh token issues
    if (hasRefreshTokenError()) {
      clearAuthTokens();
      
      // Redirect to a clean login page after clearing tokens
      const cleanUrl = window.location.origin + window.location.pathname;
      if (window.location.search.includes('error') || window.location.search.includes('refresh_token')) {
        window.history.replaceState({}, document.title, cleanUrl);
      }
    }

    // Add a global error handler for 401 responses
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const response = await originalFetch(...args);
      
      if (response.status === 401 && response.url.includes('refresh_token')) {
        clearAuthTokens();
        // Optionally redirect to login
        // window.location.href = '/login';
      }
      
      return response;
    };

    // Cleanup function
    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  return (
    <AuthProvider authUrl="https://181249979.propelauthtest.com">
      {children}
    </AuthProvider>
  );
}