"use client";

import { useState } from 'react';
import { User, Clock, Calendar, Info, Plus } from 'lucide-react';
import DoctorCalendarCard from './DoctorCalendarCard';

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
  user_name?: string;
  name?: string;
  id?: string;
}

interface DoctorCalendarsProps {
  calendars?: any[];
  loading?: boolean;
  selectedCalendar?: DoctorCalendar | null;
  onCalendarClick?: (calendar: DoctorCalendar) => void;
  onCalendarSelect?: (calendar: DoctorCalendar) => void;
  onInfoClick?: (calendar: DoctorCalendar) => void;
  onNewCalendar?: () => void;
}

export default function DoctorCalendars({
  calendars = [],
  loading = false,
  selectedCalendar = null,
  onCalendarClick,
  onCalendarSelect,
  onInfoClick,
  onNewCalendar
}: DoctorCalendarsProps) {
  // Transform calendar data to match DoctorCalendar interface
  const transformedCalendars: DoctorCalendar[] = calendars.map(cal => ({
    doctorName: cal.user_name || cal.name || 'Unknown Doctor',
    timezone: cal.timezone || 'UTC',
    createdDate: cal.created_at || new Date().toISOString(),
    calendar_id: cal.calendar_id || cal.id,
    doctor_id: cal.doctor_id,
    doctor_first_name: cal.doctor_first_name || cal.user_name?.split(' ')[0] || 'Dr.',
    doctor_last_name: cal.doctor_last_name || cal.user_name?.split(' ').slice(1).join(' ') || '',
    created_at: cal.created_at,
    shared_with: cal.shared_with || [],
    user_name: cal.user_name,
    name: cal.name,
    id: cal.id
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-card text-card-foreground">
      {/* Header */}
      <div className="space-y-1.5 p-6 flex flex-row items-center justify-between">
        <h3 className="text-2xl font-semibold leading-none tracking-tight flex items-center gap-2">
          <User className="h-5 w-5" />
          Doctor Calendars
        </h3>
        {/* <button
          className="justify-center whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-foreground text-background hover:bg-foreground/90 h-9 rounded-md px-3 flex items-center gap-2"
          onClick={onNewCalendar}
        >
          <Plus className="h-4 w-4" />
          New Calendar
        </button> */}
      </div>

      {/* Content */}
      <div className="p-6 pt-0">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {transformedCalendars.length > 0 ? (
            transformedCalendars.map((calendar) => (
              <DoctorCalendarCard
                key={calendar.calendar_id || calendar.doctor_id || calendar.doctorName}
                calendar={calendar}
                isSelected={selectedCalendar?.calendar_id === calendar.calendar_id}
                onClick={() => onCalendarSelect?.(calendar)}
                onInfoClick={() => onInfoClick?.(calendar)}
              />
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <Calendar className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No calendars found</h3>
              <p className="mt-1 text-sm text-gray-500">
                No doctor calendars have been created yet.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 