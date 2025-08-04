import { SyncLoader } from 'react-spinners';
import { CalendarEvent } from '../common/types';
import { Plus, Clock, MapPin, Users } from 'lucide-react';

interface CalendarEventsListProps {
  events: CalendarEvent[];
  loading: boolean;
  selectedCalendar?: any;
  onNewEvent?: () => void;
}

export default function CalendarEventsList({ events, loading, selectedCalendar, onNewEvent }: CalendarEventsListProps) {
  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <SyncLoader size={10} color="#3B82F6" />
      </div>
    );
  }

  // Show message if no calendar is selected
  if (!selectedCalendar) {
    return (
      <div className="rounded-lg border bg-card text-card-foreground border-gray-300 flex flex-col h-full">
        {/* Header */}
        <div className="space-y-1.5 p-6 flex flex-row items-center justify-between">
          <h3 className="text-2xl font-semibold leading-none tracking-tight">Today's Events</h3>
        </div>

        {/* Content */}
        <div className="p-6 pt-0 flex-1 flex items-center justify-center">
          <div className="text-center py-8">
            <p className="text-muted-foreground text-lg">Select a calendar to view events</p>
            <p className="text-sm text-gray-500 mt-2">Choose a doctor calendar from the list above to see their scheduled events</p>
          </div>
        </div>
      </div>
    );
  }

  const getEventType = (event: CalendarEvent) => {
    const summary = event.summary?.toLowerCase() || '';
    if (summary.includes('meeting')) return { type: 'meeting', color: 'bg-blue-100 text-blue-800' };
    if (summary.includes('call')) return { type: 'call', color: 'bg-green-100 text-green-800' };
    if (summary.includes('review')) return { type: 'review', color: 'bg-purple-100 text-purple-800' };
    return { type: 'event', color: 'bg-gray-100 text-gray-800' };
  };

  return (
    <div className="rounded-lg border bg-card text-card-foreground border-gray-300 flex flex-col h-full">
      {/* Header */}
      <div className="space-y-1.5 p-6 flex flex-row items-center justify-between">
        <h3 className="text-2xl font-semibold leading-none tracking-tight">Today's Events</h3>
        <button
          className="justify-center whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-foreground text-background hover:bg-foreground/90 h-9 rounded-md px-3 flex items-center gap-2"
          onClick={onNewEvent}
        >
          <Plus className="h-4 w-4" />
          New Event
        </button>
      </div>

      {/* Content */}
      <div className="p-6 pt-0 space-y-4 flex-1 overflow-y-auto">
        {events.length > 0 ? (
          events.slice(0, 5).map((event) => {
            const eventType = getEventType(event);
            const startTime = new Date(event.start.dateTime).toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            });
            const endTime = new Date(event.end.dateTime).toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            });

            return (
              <div key={event.id || `${event.summary}-${event.start.dateTime}`} className="p-4 border border-gray-300 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">{event.summary}</h3>
                  <div className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent hover:bg-primary/80 ${eventType.color}`}>
                    {eventType.type}
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {startTime} - {endTime}
                  </div>
                  {event.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {event.location}
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {event.attendees?.length || 0}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No events scheduled for today</p>
          </div>
        )}
      </div>
    </div>
  );
} 