import React from 'react';
import { Users, Building2, HeartPulse, AlertTriangle } from 'lucide-react';

interface StatCardProps {
  stats: Array<{
    title: string;
    value: string;
    percentage: string;
    Icon?: any;
    trend: string;
    subtitle?: string;
    iconColor?: string;
    valueColor?: string;
    percentageColor?: string;
  }>;
}

const iconMap: Record<string, any> = {
  'Total Organizations': Building2,
  'Total Users': Users,
  'System Health': HeartPulse,
  'Critical Issues': AlertTriangle,
};

export default function StatCards({ stats }: StatCardProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      {stats.map((stat, i) => {
        const Icon = stat.Icon || iconMap[stat.title];
        let valueClass = 'text-3xl font-bold';
        let percentClass = 'text-sm';
        let valueColor = stat.valueColor || (stat.title === 'Critical Issues' ? 'text-red-600' : 'text-gray-900');
        let percentColor = stat.percentageColor || (stat.trend === 'up' ? 'text-green-600' : stat.trend === 'down' ? 'text-red-600' : 'text-gray-500');
        if (stat.title === 'System Health') valueColor = 'text-gray-900';
        if (stat.title === 'Critical Issues') valueClass += ' text-red-600';
        return (
          <div
            key={i}
            className="relative bg-white rounded-xl border border-gray-200   p-6 flex flex-col min-h-[120px] justify-between"
          >
            {/* Icon top right */}
            {Icon && (
              <span className="absolute top-4 right-4 text-gray-300">
                <Icon className="h-5 w-5" />
              </span>
            )}
            <div className="mb-2">
              <div className="text-base font-medium text-gray-700 flex items-center gap-2">{stat.title}</div>
              <div className={`${valueClass} ${valueColor}`}>{stat.value}</div>
              {stat.subtitle ? (
                <div className="text-sm text-gray-400 mt-1">{stat.subtitle}</div>
              ) : stat.percentage ? (
                <div className={`${percentClass} ${percentColor} mt-1`}>{stat.percentage}</div>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
} 