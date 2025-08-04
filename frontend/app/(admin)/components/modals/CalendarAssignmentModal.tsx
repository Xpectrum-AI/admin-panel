"use client";

import { useState } from 'react';
import { X, Calendar, Plus, ChevronDown } from 'lucide-react';
import CreateCalendarModal from './CreateCalendarModal';

interface Doctor {
  _id: string;
  doctor_id: string;
  first_name: string;
  last_name: string;
  organization_id: string;
  created_at: string;
  updated_at: string;
  doctor_data: {
    gender: string;
    age: string;
    experience: string;
    phone: string;
    registration_number: string;
    registration_year: string;
    registration_state: string;
    registration_country: string;
    registration_board: string;
    qualifications: Array<{
      degree: string;
      university: string;
      year: string;
      place: string;
    }>;
    specializations: Array<{
      specialization: string;
      level: string;
    }>;
    aliases: string[];
    facilities: Array<{
      name: string;
      type: string;
      area: string;
      city: string;
      state: string;
      pincode: string;
      address: string;
    }>;
  };
  calendarId?: string;
}

interface CalendarOption {
  id: string;
  name: string;
  timezone: string;
}

interface CalendarAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  doctor: Doctor | null;
  calendars?: any[];
  onAssignCalendar?: (doctorId: string, calendarId: string) => void;
  onCreateCalendar?: (doctorId: string, calendarData: any) => void;
}

export default function CalendarAssignmentModal({
  isOpen,
  onClose,
  doctor,
  calendars = [],
  onAssignCalendar,
  onCreateCalendar
}: CalendarAssignmentModalProps) {
  const [showCreateCalendar, setShowCreateCalendar] = useState(false);
  const [selectedCalendarId, setSelectedCalendarId] = useState<string>('');
  const [showCalendarDropdown, setShowCalendarDropdown] = useState(false);

  if (!isOpen || !doctor) return null;

  const doctorName = `${doctor.first_name} ${doctor.last_name}`;
  const hasCalendar = !!doctor.calendarId;

  // Use real calendar data instead of mock data
  const calendarOptions: CalendarOption[] = calendars.map(cal => ({
    id: cal.calendar_id || cal.id,
    name: cal.user_name || cal.name,
    timezone: cal.timezone
  }));

  const selectedCalendar = calendarOptions.find(cal => cal.id === selectedCalendarId);

  const handleCreateCalendar = () => {
    setShowCreateCalendar(true);
  };

  const handleCreateCalendarComplete = (calendarData: any) => {
    onCreateCalendar?.(doctor._id, calendarData);
    setShowCreateCalendar(false);
    onClose();
  };

  const handleCreateCalendarCancel = () => {
    setShowCreateCalendar(false);
  };

  const handleAssignCalendar = () => {
    if (selectedCalendarId) {
      onAssignCalendar?.(doctor._id, selectedCalendarId);
      onClose();
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div 
          className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg"
          tabIndex={-1}
          style={{ pointerEvents: 'auto' }}
        >
          {/* Dialog Header */}
          <div className="flex flex-col space-y-1.5 text-center sm:text-left">
            <h2 className="text-lg font-semibold leading-none tracking-tight flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Assign Calendar to Dr. {doctorName}
            </h2>
          </div>

          {/* Dialog Content */}
          <div className="space-y-4">
            {/* Calendar Selection */}
            <div>
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Select Calendar
              </label>
              <div className="relative">
                <button
                  type="button"
                  role="combobox"
                  aria-expanded={showCalendarDropdown}
                  className="flex h-10 w-full items-center justify-between rounded-md border border-gray-300 border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1"
                  onClick={() => setShowCalendarDropdown(!showCalendarDropdown)}
                >
                  <span style={{ pointerEvents: 'none' }}>
                    {selectedCalendar ? `${selectedCalendar.name} (${selectedCalendar.timezone})` : 'Choose a calendar'}
                  </span>
                  <ChevronDown className="h-4 w-4 opacity-50" aria-hidden="true" />
                </button>
                
                {showCalendarDropdown && (
                  <div className="absolute z-50 w-full mt-1 bg-background border border-gray-300 border-input rounded-md shadow-lg">
                    {calendarOptions.map((calendar) => (
                      <button
                        key={calendar.id}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
                        onClick={() => {
                          setSelectedCalendarId(calendar.id);
                          setShowCalendarDropdown(false);
                        }}
                      >
                        {calendar.name} ({calendar.timezone})
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Create New Calendar Button */}
            <button
              onClick={handleCreateCalendar}
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-gray-300 border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create New Calendar
            </button>

            {/* Action Buttons */}
            <div className="flex justify-end gap-2 pt-4">
              <button
                onClick={onClose}
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
              >
                Cancel
              </button>
              <button
                onClick={handleAssignCalendar}
                disabled={!selectedCalendarId}
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-black text-primary-foreground hover:bg-gray-200 h-10 px-4 py-2"
              >
                Assign Calendar
              </button>
            </div>
          </div>

          {/* Close Button */}
          <button
            type="button"
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </button>
        </div>
      </div>

      {/* Create Calendar Modal */}
      {showCreateCalendar && (
        <CreateCalendarModal
          isOpen={showCreateCalendar}
          onClose={handleCreateCalendarCancel}
          onSubmit={handleCreateCalendarComplete}
        />
      )}
    </>
  );
} 