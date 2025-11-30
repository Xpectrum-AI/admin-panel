'use client';

import React, { Suspense } from 'react';
import dynamic from 'next/dynamic';

// Lazy load react-markdown with remark-gfm plugin
const ReactMarkdownBase = dynamic(
  () => import('react-markdown').then(async (mod) => {
    // Load remark-gfm plugin
    const remarkGfm = await import('remark-gfm');
    // Return a component that uses react-markdown with the plugin
    return {
      default: (props: any) => {
        const ReactMarkdown = mod.default;
        // Get the plugin - handle both default and named exports
        const gfmPlugin = remarkGfm.default || remarkGfm;
        return (
          <ReactMarkdown 
            {...props}
            remarkPlugins={[gfmPlugin]}
          />
        );
      }
    };
  }),
  { 
    ssr: false,
    loading: () => <MarkdownSkeleton />
  }
);

interface MarkdownRendererProps {
  children: string;
  className?: string;
}

// Skeleton component for markdown loading
function MarkdownSkeleton() {
  return (
    <div className="animate-pulse space-y-2">
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/6"></div>
    </div>
  );
}

export default function MarkdownRenderer({ children, className = '' }: MarkdownRendererProps) {
  // Safety check: ensure children is a string
  const content = typeof children === 'string' ? children : String(children || '');

  return (
    <div className={className}>
      <Suspense fallback={<MarkdownSkeleton />}>
        <ReactMarkdownBase>
          {content}
        </ReactMarkdownBase>
      </Suspense>
    </div>
  );
}

