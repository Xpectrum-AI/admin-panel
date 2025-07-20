import { useEffect, useState } from 'react';
import { useAuthInfo } from '@propelauth/react';

export function useGoogleAuth() {
  const [isInitialized, setIsInitialized] = useState(false);
  const { isLoggedIn, loading } = useAuthInfo();

  useEffect(() => {
    if (!loading) {
      setIsInitialized(true);
    }
  }, [loading]);

  const handleGoogleLogin = () => {
    // Clear any existing auth state first
    if (typeof window !== 'undefined') {
      try {
        // Clear localStorage
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.includes('propelauth') || key.includes('auth') || key.includes('token'))) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));

        // Clear sessionStorage
        const sessionKeysToRemove = [];
        for (let i = 0; i < sessionStorage.length; i++) {
          const key = sessionStorage.key(i);
          if (key && (key.includes('propelauth') || key.includes('auth') || key.includes('token'))) {
            sessionKeysToRemove.push(key);
          }
        }
        sessionKeysToRemove.forEach(key => sessionStorage.removeItem(key));

        // Clear auth cookies
        document.cookie.split(";").forEach(cookie => {
          const eqPos = cookie.indexOf("=");
          const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
          if (name.includes('propelauth') || name.includes('auth') || name.includes('token')) {
            document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
            document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=.${window.location.hostname}`;
          }
        });
      } catch (error) {
        console.warn('Error clearing auth tokens:', error);
      }
    }

    // Wait a bit for cleanup to complete, then redirect
    setTimeout(() => {
      const redirectUrl = encodeURIComponent('https://admin-test.xpectrum-ai.com/dashboard');
      const authUrl = `https://181249979.propelauthtest.com/login?provider=google&redirect_url=${redirectUrl}`;
      
      // Use window.location.replace to avoid back button issues
      window.location.replace(authUrl);
    }, 100);
  };

  return {
    handleGoogleLogin,
    isInitialized,
    isLoggedIn,
    loading
  };
}