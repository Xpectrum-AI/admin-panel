import { SyncLoader } from 'react-spinners';
import { CalendarEvent } from '../common/types';
import { Plus, Clock, MapPin, Users, RefreshCw, Calendar, Edit, Trash2 } from 'lucide-react';
import { eventService } from '@/service/eventService';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { formatTimeInTimezone, getTimezoneLabel } from '@/lib/utils/timezoneUtils';
import { useState } from 'react';

interface CalendarEventsListProps {
  events: CalendarEvent[];
  loading: boolean;
  selectedCalendar?: any;
  selectedDate?: Date | null; // Add selectedDate prop
  onNewEvent?: () => void;
  onEventsRefresh?: () => void;
  onShowAllEvents?: () => void; // Add onShowAllEvents prop
  onEditEvent?: (event: CalendarEvent) => void; // Add onEditEvent prop
}

export default function CalendarEventsList({ events, loading, selectedCalendar, selectedDate, onNewEvent, onEventsRefresh, onShowAllEvents, onEditEvent }: CalendarEventsListProps) {
  const { showError, showSuccess } = useErrorHandler();
  const [isLoading, setIsLoading] = useState(false);
  
  

  const handleSyncGoogleCalendar = async () => {
    if (!selectedCalendar?.calendar_id) {
      showError('No calendar selected');
      return;
    }

    try {
      setIsLoading(true);
      await eventService.syncGoogleCalendarEvents(selectedCalendar.calendar_id);
      showSuccess('Events refreshed successfully!');
      if (onEventsRefresh) {
        onEventsRefresh();
      }
    } catch (error) {
      showError('Failed to refresh events');
      console.error('Error refreshing events:', error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedCalendar?.calendar_id, onEventsRefresh, showError, showSuccess]);

  const handleDeleteEvent = useCallback(async (event: CalendarEvent) => {
    if (!selectedCalendar?.calendar_id) {
      showError('No calendar selected');
      return;
    }

    if (!event.id) {
      showError('Event ID is required for deletion');
      return;
    }

    if (!confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      return;
    }

    try {
      setIsLoading(true);
      await eventService.deleteEvent(selectedCalendar.calendar_id, event.id);
      showSuccess('Event deleted successfully!');
      if (onEventsRefresh) {
        onEventsRefresh();
      }
    } catch (error) {
      showError('Failed to delete event');
      console.error('Error deleting event:', error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedCalendar?.calendar_id, onEventsRefresh, showError, showSuccess]);

  // Memoize formatted date to avoid recalculation
  const formattedSelectedDate = useMemo(() => {
    if (!selectedDate) return null;
    return selectedDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }, [selectedDate]);

  const formatSelectedDate = useCallback((date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }, []);
  
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
          <h3 className="text-2xl font-semibold leading-none tracking-tight">All Events</h3>
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
        <div className="flex flex-col">
          <h3 className="text-2xl font-semibold leading-none tracking-tight">
            {formattedSelectedDate ? `Events for ${formattedSelectedDate}` : 'All Events'}
          </h3>
          {selectedCalendar?.timezone && (
            <p className="text-sm text-muted-foreground mt-1">
              Timezone: {getTimezoneLabel(selectedCalendar.timezone)}
            </p>
          )}
          {selectedDate && (
            <p className="text-sm text-blue-600 mt-1">
              Showing {events.length} event{events.length !== 1 ? 's' : ''} for this date
            </p>
          )}
          <p className="text-xs text-gray-500 mt-1">
            Note: Events created directly in Google Calendar may not appear here. Only events created through this admin panel are displayed.
          </p>
        </div>
        <div className="flex gap-2">
          {selectedDate && (
            <button
              className="justify-center whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-gray-200 bg-background hover:bg-accent hover:text-accent-foreground h-9 rounded-md px-3 flex items-center gap-2"
              onClick={onShowAllEvents}
              title="Show All Events"
            >
              <Calendar className="h-4 w-4" />
              All Events
            </button>
          )}
          <button
            className="justify-center whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-gray-200 bg-background hover:bg-accent hover:text-accent-foreground h-9 rounded-md px-3 flex items-center gap-2"
            onClick={handleSyncGoogleCalendar}
            disabled={isLoading}
            title="Refresh Events from Backend"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Refreshing...' : 'Refresh'}
          </button>
          <button
            className="justify-center whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-foreground text-background hover:bg-foreground/90 h-9 rounded-md px-3 flex items-center gap-2"
            onClick={onNewEvent}
          >
            <Plus className="h-4 w-4" />
            New Event
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 pt-0 space-y-4 flex-1 overflow-y-auto">
    
        {events.length > 0 ? (
          events.slice(0, 5).map((event, index) => {
            
            const eventType = getEventType(event);
            
            
            try {
              const startDate = new Date(event.start.dateTime);
              const endDate = new Date(event.end.dateTime);
              
              
              const startTime = startDate.toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              });
              const endTime = endDate.toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              });
              
              
            } catch (error) {
              console.error('Error parsing dates:', error);
            }
            


            // Display the time exactly as it's stored, without timezone conversion
            const formatTimeAsStored = (dateTimeStr: string): string => {
              try {
                // Extract time from the datetime string (e.g., "2025-08-15T09:00:00" -> "09:00")
                const timePart = dateTimeStr.split('T')[1];
                if (timePart) {
                  return timePart.substring(0, 5); // Get HH:MM part
                }
                return '00:00';
              } catch (error) {
                return '00:00';
              }
            };

            const startTime = formatTimeAsStored(event.start.dateTime);
            const endTime = formatTimeAsStored(event.end.dateTime);
            const timezoneLabel = getTimezoneLabel(selectedCalendar?.timezone || 'UTC');

            return (
              <div key={event.id || `${event.summary}-${event.start.dateTime}`} className="p-4 border border-gray-300 rounded-lg space-y-3">
                {/* Event Header */}
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-lg">{event.summary}</h3>
                  <div className="flex items-center gap-2">
                    <div className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent hover:bg-primary/80 ${eventType.color}`}>
                      {eventType.type}
                    </div>
                    {/* Edit and Delete Buttons */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onEditEvent && onEditEvent(event)}
                        className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors duration-200"
                        title="Edit event"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteEvent(event)}
                        className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors duration-200"
                        title="Delete event"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Event Date */}
                <div className="flex items-center gap-1 text-sm text-gray-600">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  <span>{(() => {
                    try {
                      // Extract date from the datetime string (e.g., "2025-08-15T09:00:00" -> "2025-08-15")
                      const datePart = event.start.dateTime.split('T')[0];
                      const date = new Date(datePart + 'T00:00:00'); // Create date without timezone conversion
                      return date.toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      });
                    } catch (error) {
                      return 'Invalid Date';
                    }
                  })()}</span>
                </div>

                {/* Event Time */}
                <div className="flex items-center gap-1 text-sm text-gray-600">
                  <Clock className="h-4 w-4 text-green-600" />
                  <span>{startTime} - {endTime} ({timezoneLabel})</span>
                </div>

                {/* Event Location */}
                {event.location && (
                  <div className="flex items-start gap-2 text-sm text-gray-600">
                    <MapPin className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                    <span className="break-words">{event.location}</span>
                  </div>
                )}

                {/* Event Attendees */}
                {event.attendees && event.attendees.length > 0 && (
                  <div className="flex items-start gap-2 text-sm text-gray-600">
                    <Users className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                    <div className="flex flex-col gap-1">
                      <span className="font-medium">Attendees ({event.attendees.length}):</span>
                      <div className="flex flex-wrap gap-1">
                        {event.attendees.map((attendee: any, idx: number) => (
                          <span key={idx} className="bg-gray-100 px-2 py-1 rounded text-xs">
                            {attendee.email || attendee}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Event Description */}
                {event.description && (
                  <div className="flex items-start gap-2 text-sm text-gray-600">
                    <div className="w-2 h-2 bg-indigo-500 rounded-full mt-2 flex-shrink-0"></div>
                    <div className="flex flex-col gap-1">
                      <span className="font-medium">Description:</span>
                      <p className="text-gray-700 whitespace-pre-wrap break-words">{event.description}</p>
                    </div>
                  </div>
                )}

                {/* Event Type Badge (if different from default) */}
                {event.eventType && event.eventType !== 'Meeting' && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span className="font-medium">Type: {event.eventType}</span>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No events found</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Export memoized component to prevent unnecessary re-renders
export default React.memo(CalendarEventsList); 