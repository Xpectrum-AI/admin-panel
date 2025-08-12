"use client";

import { Clock, Calendar, Info } from 'lucide-react';

interface DoctorCalendar {
  doctorName: string;
  timezone: string;
  createdDate: string;
  calendar_id?: string; 
  doctor_id?: string;
  doctor_first_name?: string;
  doctor_last_name?: string;
  created_at?: string;
  shared_with?: string[];
}

interface DoctorCalendarCardProps {
  calendar: DoctorCalendar;
  isSelected?: boolean;
  onClick?: () => void;
  onInfoClick?: () => void;
}

export default function DoctorCalendarCard({
  calendar,
  isSelected = false,
  onClick,
  onInfoClick
}: DoctorCalendarCardProps) {
  const handleInfoClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onInfoClick?.();
  };

  return (
    <div 
      className={`rounded-lg border transition-all cursor-pointer ${
        isSelected 
          ? 'border-blue-500 bg-blue-50 shadow-lg' 
          : 'border-gray-200 bg-card text-card-foreground hover:shadow-lg'
      }`}
      onClick={onClick}
    >
      {/* Card Header */}
      <div className="flex flex-col space-y-1.5 p-6 pb-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold tracking-tight text-lg">
            Dr. {calendar.doctor_first_name} {calendar.doctor_last_name}
          </h3>
          <button
            onClick={handleInfoClick}
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:bg-accent hover:text-accent-foreground h-9 rounded-md px-3"
          >
            <Info className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-6 pt-0 space-y-3">
        {/* Timezone */}
        <div className="flex items-center text-sm text-gray-500">
          <Clock className="h-3 w-3 mr-2 text-gray-500" />
          {calendar.timezone}
        </div>

        {/* Doctor Info */}
        <div className="flex items-center gap-2">
          <div>
            <p className="text-sm font-medium">Shared with</p>
            <p className="text-xs text-gray-500">{calendar.shared_with?.[0] || 'No one'}</p>
          </div>
        </div>

        {/* Created Date */}
        <div className="flex items-center text-xs text-gray-500 pt-2 border-t">
          <Calendar className="h-3 w-3 mr-2 text-gray-500" />
          Created {calendar.created_at ? new Date(calendar.created_at).toLocaleDateString('en-GB') : '03/08/2025'}
        </div>
      </div>
    </div>
  );
} 