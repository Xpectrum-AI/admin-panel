'use client';

import React, { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useTheme } from '../contexts/ThemeContext';

// Lazy load recharts components
const RechartsChart = dynamic(
  () => import('./MonitoringChartInternal'),
  { 
    ssr: false,
    loading: () => <ChartSkeleton />
  }
);

interface MonitoringChartProps {
  data: Array<{ date: string; value: number }>;
  title: string;
  subtitle?: string;
  total?: string | number;
  color?: string;
  showArea?: boolean;
}

// Chart skeleton component
function ChartSkeleton() {
  const { isDarkMode } = useTheme();
  return (
    <div className={`h-40 flex items-center justify-center ${isDarkMode ? 'bg-gray-800/30' : 'bg-gray-50'}`}>
      <div className="animate-pulse space-y-2">
        <div className={`h-2 w-32 rounded ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
        <div className={`h-2 w-24 rounded ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
      </div>
    </div>
  );
}

function MonitoringChart(props: MonitoringChartProps) {
  const { isDarkMode } = useTheme();

  // Memoize subtitle to avoid recalculation
  const subtitle = React.useMemo(() => props.subtitle || 'LAST 7 DAYS', [props.subtitle]);

  return (
    <div className={`rounded-xl p-4 shadow-sm border ${isDarkMode
      ? 'bg-gray-800/50 border-gray-700/50'
      : 'bg-white border-gray-200'
      }`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-1.5">
        <h3 className={`text-xs font-semibold uppercase tracking-wide ${isDarkMode ? 'text-gray-300' : 'text-gray-600'
          }`}>{props.title}</h3>
        <svg className={`w-3.5 h-3.5 ${isDarkMode ? 'text-gray-400' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <p className={`text-xs mb-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{subtitle}</p>

      {/* Total Value */}
      {props.total !== undefined && (
        <div className={`text-3xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{props.total}</div>
      )}

      {/* Chart */}
      <div className="h-40">
        <Suspense fallback={<ChartSkeleton />}>
          <RechartsChart {...props} />
        </Suspense>
      </div>
    </div>
  );
}

// Export memoized component to prevent unnecessary re-renders
export default React.memo(MonitoringChart);

