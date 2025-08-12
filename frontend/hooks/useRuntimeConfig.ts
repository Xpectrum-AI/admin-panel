import { useState, useEffect } from 'react';

interface RuntimeConfig {
  PROPELAUTH_URL: string;
  PROPELAUTH_API_KEY: string;
  LIVE_API_KEY: string;
  SUPER_ADMIN_ORG_ID: string;
  LIVE_API_URL: string;
  NODE_ENV: string;
  PORT: string;
}

export function useRuntimeConfig() {
  const [config, setConfig] = useState<RuntimeConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await fetch('/api/runtime-config');
        if (!response.ok) {
          throw new Error('Failed to fetch runtime config');
        }
        const runtimeConfig = await response.json();
        setConfig(runtimeConfig);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        console.error('Failed to fetch runtime config:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchConfig();
  }, []);

  return { config, loading, error };
}
