'use client';

import React, { useMemo, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { useTheme } from '../contexts/ThemeContext';

interface MonitoringChartInternalProps {
  data: Array<{ date: string; value: number }>;
  title: string;
  subtitle?: string;
  total?: string | number;
  color?: string;
  showArea?: boolean;
}

function MonitoringChartInternal({
  data,
  title,
  color = '#3b82f6',
  showArea = true
}: MonitoringChartInternalProps) {
  const { isDarkMode } = useTheme();

  // Memoize CustomTooltip component
  const CustomTooltip = useCallback(({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className={`px-3 py-2 rounded-lg shadow-lg border ${isDarkMode
          ? 'bg-gray-800 border-gray-700'
          : 'bg-white border-gray-200'
          }`}>
          <p className={`text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{payload[0].payload.date}</p>
          <p className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{payload[0].value}</p>
        </div>
      );
    }
    return null;
  }, [isDarkMode]);

  // Memoize chart margin to avoid recreation
  const chartMargin = useMemo(() => ({ top: 5, right: 0, left: 0, bottom: 5 }), []);

  // Memoize grid stroke color
  const gridStroke = useMemo(() => isDarkMode ? '#374151' : '#e2e8f0', [isDarkMode]);

  // Memoize axis tick colors
  const tickFill = useMemo(() => isDarkMode ? '#9ca3af' : '#64748b', [isDarkMode]);
  const axisLineStroke = useMemo(() => isDarkMode ? '#374151' : '#e2e8f0', [isDarkMode]);

  return (
    <ResponsiveContainer width="100%" height="100%">
      {showArea ? (
        <AreaChart data={data} margin={chartMargin}>
          <defs>
            <linearGradient id={`gradient-${title}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: tickFill }}
            tickLine={false}
            axisLine={{ stroke: axisLineStroke }}
          />
          <YAxis
            tick={{ fontSize: 11, fill: tickFill }}
            tickLine={false}
            axisLine={{ stroke: axisLineStroke }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            fill={`url(#gradient-${title})`}
          />
        </AreaChart>
      ) : (
        <LineChart data={data} margin={chartMargin}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: tickFill }}
            tickLine={false}
            axisLine={{ stroke: axisLineStroke }}
          />
          <YAxis
            tick={{ fontSize: 11, fill: tickFill }}
            tickLine={false}
            axisLine={{ stroke: axisLineStroke }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            dot={{ fill: color, r: 3 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      )}
    </ResponsiveContainer>
  );
}

// Export memoized component
export default React.memo(MonitoringChartInternal);

