import CalendarAccessPrompt from './CalendarAccessPrompt';
import CalendarEventsList from './CalendarEventsList';
import UpcomingEventsSidebar from './UpcomingEventsSidebar';
import { CalendarEvent } from '../common/types';

interface CalendarSectionProps {
  hasCalendarAccess: boolean;
  calendarEvents: CalendarEvent[];
  loadingCalendar: boolean;
  onRequestAccess: () => void;
}

export default function CalendarSection({ 
  hasCalendarAccess, 
  calendarEvents, 
  loadingCalendar, 
  onRequestAccess 
}: CalendarSectionProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Calendar Section */}
      <div className="lg:col-span-3">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Calendar</h2>
            {hasCalendarAccess && (
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
                + New Event
              </button>
            )}
          </div>
          
          {!hasCalendarAccess ? (
            <CalendarAccessPrompt onRequestAccess={onRequestAccess} />
          ) : (
            <CalendarEventsList events={calendarEvents} loading={loadingCalendar} />
          )}
        </div>
      </div>

      {/* Upcoming Events Sidebar - Only show when calendar access is available */}
      {hasCalendarAccess && (
        <UpcomingEventsSidebar events={calendarEvents} />
      )}
    </div>
  );
} 