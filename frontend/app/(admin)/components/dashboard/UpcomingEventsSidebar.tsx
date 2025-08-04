import { CalendarEvent } from '../common/types';

interface UpcomingEventsSidebarProps {
  events: CalendarEvent[];
}

export default function UpcomingEventsSidebar({ events }: UpcomingEventsSidebarProps) {
  return (
    <div className="lg:col-span-1">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Events</h3>
        {events.length > 0 ? (
          <div className="space-y-3">
            {events.slice(0, 3).map((event) => (
              <div key={event.id} className="border-b border-gray-100 pb-3 last:border-b-0">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 text-sm">{event.summary}</h4>
                    <p className="text-xs text-gray-500">
                      {new Date(event.start.dateTime).toLocaleDateString()}
                    </p>
                  </div>
                  <button className="text-xs text-gray-500 hover:text-gray-700">
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">No upcoming events</p>
        )}
      </div>
    </div>
  );
} 