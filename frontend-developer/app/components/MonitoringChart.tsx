'use client';

import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { useTheme } from '../contexts/ThemeContext';

interface MonitoringChartProps {
  data: Array<{ date: string; value: number }>;
  title: string;
  subtitle?: string;
  total?: string | number;
  color?: string;
  showArea?: boolean;
}

export default function MonitoringChart({
  data,
  title,
  subtitle = 'LAST 7 DAYS',
  total,
  color = '#3b82f6',
  showArea = true
}: MonitoringChartProps) {
  const { isDarkMode } = useTheme();

  const CustomTooltip = ({ active, payload }: any) => {
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
  };

  return (
    <div className={`rounded-xl p-4 shadow-sm border ${isDarkMode
      ? 'bg-gray-800/50 border-gray-700/50'
      : 'bg-white border-gray-200'
      }`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-1.5">
        <h3 className={`text-xs font-semibold uppercase tracking-wide ${isDarkMode ? 'text-gray-300' : 'text-gray-600'
          }`}>{title}</h3>
        <svg className={`w-3.5 h-3.5 ${isDarkMode ? 'text-gray-400' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <p className={`text-xs mb-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{subtitle}</p>

      {/* Total Value */}
      {total !== undefined && (
        <div className={`text-3xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{total}</div>
      )}

      {/* Chart */}
      <div className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          {showArea ? (
            <AreaChart data={data} margin={{ top: 5, right: 0, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id={`gradient-${title}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#374151' : '#e2e8f0'} vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: isDarkMode ? '#9ca3af' : '#64748b' }}
                tickLine={false}
                axisLine={{ stroke: isDarkMode ? '#374151' : '#e2e8f0' }}
              />
              <YAxis
                tick={{ fontSize: 11, fill: isDarkMode ? '#9ca3af' : '#64748b' }}
                tickLine={false}
                axisLine={{ stroke: isDarkMode ? '#374151' : '#e2e8f0' }}
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
            <LineChart data={data} margin={{ top: 5, right: 0, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#374151' : '#e2e8f0'} vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: isDarkMode ? '#9ca3af' : '#64748b' }}
                tickLine={false}
                axisLine={{ stroke: isDarkMode ? '#374151' : '#e2e8f0' }}
              />
              <YAxis
                tick={{ fontSize: 11, fill: isDarkMode ? '#9ca3af' : '#64748b' }}
                tickLine={false}
                axisLine={{ stroke: isDarkMode ? '#374151' : '#e2e8f0' }}
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
      </div>
    </div>
  );
}

