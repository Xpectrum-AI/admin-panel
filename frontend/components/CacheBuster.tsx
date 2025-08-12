'use client';

import { useEffect } from 'react';

interface CacheBusterProps {
  children: React.ReactNode;
}

export default function CacheBuster({ children }: CacheBusterProps) {
  useEffect(() => {
    // Force cache refresh on component mount
    const timestamp = Date.now();
    const cacheBust = `?cb=${timestamp}`;
    
    // Add cache busting to all internal links
    const links = document.querySelectorAll('a[href^="/"]');
    links.forEach(link => {
      const href = link.getAttribute('href');
      if (href && !href.includes('?cb=')) {
        link.setAttribute('href', `${href}${cacheBust}`);
      }
    });

    // Force reload if we detect stale cache
    const lastBuildTime = process.env.NEXT_PUBLIC_BUILD_TIMESTAMP || '0';
    const currentTime = Date.now();
    const timeDiff = currentTime - parseInt(lastBuildTime);
    
    // If build is older than 5 minutes, suggest refresh
    if (timeDiff > 300000) {
      console.log('Cache may be stale, consider refreshing');
    }
  }, []);

  return <>{children}</>;
}
