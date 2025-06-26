import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  percentage: string;
  Icon: LucideIcon;
  trend: 'up' | 'down';
}

export default function StatCard({ title, value, percentage, Icon, trend }: StatCardProps) {
  const trendColor = trend === 'up' ? 'text-green-500' : 'text-red-500';

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col">
      <div className="flex justify-between items-start">
        <span className="text-gray-600 font-medium">{title}</span>
        <Icon className="h-6 w-6 text-gray-400" />
      </div>
      <div className="mt-2">
        <p className="text-3xl font-bold text-gray-900">{value}</p>
        <p className={`mt-1 text-sm font-medium ${trendColor}`}>
          {percentage}
        </p>
      </div>
    </div>
  );
} 