'use client';

import { useEffect, useState, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { SyncLoader } from 'react-spinners';
import { Calendar, Globe, CalendarPlus, Clock, Lock } from 'lucide-react';
import React from 'react';
import { calendarServiceAPI } from '@/service/calendarService';
import { useErrorHandler } from '@/hooks/useErrorHandler';

type TimezoneOption = { value: string; label: string };

function detectBrowserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return process.env.NEXT_PUBLIC_DEFAULT_TIMEZONE || 'America/New_York';
  }
}

function getTimezoneOptions(): { label: string; value: string }[] {
  const baseTimezoneOptions = (process.env.NEXT_PUBLIC_TIMEZONE_OPTIONS || 'IST:Asia/Kolkata,EST:America/New_York,PST:America/Los_Angeles')
    .split(',')
    .map(option => {
      const [label, value] = option.split(':');
      return { label, value };
    });
  const detectedTimezone = detectBrowserTimezone();
  const timezoneOptions = baseTimezoneOptions.some(option => option.value === detectedTimezone)
    ? baseTimezoneOptions
    : [
        { label: 'Auto-detected', value: detectedTimezone },
        ...baseTimezoneOptions
      ];
  return timezoneOptions;
}

const Profile = ({ token }: { token: string }) => {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [calendarServices, setCalendarServices] = useState<any[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<any[]>([]); // <-- Add this line
  const [loadingCalendar, setLoadingCalendar] = useState<boolean>(false);
  const [showCalendar, setShowCalendar] = useState<boolean>(false);
  const [selectedTimezone, setSelectedTimezone] = useState<string | null>(null);
  const [hasCalendarAccess, setHasCalendarAccess] = useState<boolean>(false);
  const [showDetails, setShowDetails] = useState(false);
  const timezoneOptions = getTimezoneOptions();
  const { showError, showSuccess, showWarning } = useErrorHandler();

  // Fetch user info
  const fetchUser = async () => {
    try {
      const result = await calendarServiceAPI.getUser(token);
      setUser(result.user);
      setSelectedTimezone(result.timezone || detectBrowserTimezone());
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setUser(null);
      return;
    }
    fetchUser();
  }, [token]);

  // Fetch calendar access
  useEffect(() => {
    if (!token) return;
    const fetchAccess = async () => {
      try {
        const result = await calendarServiceAPI.getCalendarAccess(token);
        setHasCalendarAccess(result.has_calendar_access || false);
      } catch {
        setHasCalendarAccess(false);
      }
    };
    fetchAccess();
  }, [token]);

  // Buy service
  const buyService = async (): Promise<void> => {
    try {
      const result = await calendarServiceAPI.buyService(token);
      window.location.href = result.redirect_url;
      showSuccess('Redirecting to purchase calendar service...');
    } catch (error) {
      showError('Failed to initiate calendar service purchase');
    }
  };

  const loadCalendarEvents = async (): Promise<void> => {
    if (!hasCalendarAccess) return;
    setLoadingCalendar(true);
    try {
      const result = await calendarServiceAPI.getServices(token);
      setCalendarServices(result.calendars || []);
      setCalendarEvents(result.events || []); // <-- Add this line
      setShowCalendar(true);
      showSuccess('Calendar services loaded successfully!');
    } catch (error) {
      showError('Failed to load calendar services');
    } finally {
      setLoadingCalendar(false);
    }
  };

  const createSampleEvent = async (): Promise<void> => {
    if (!hasCalendarAccess) return;
    // Set start time to 1 hour from now, end time to 1 hour 5 minutes from now
    const now = new Date();
    const start = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now
    const end = new Date(now.getTime() + 65 * 60 * 1000); // 1 hour 5 min from now
    const pad = (n: number) => n.toString().padStart(2, '0');
    const formatDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:00`;
    const eventData = {
      summary: 'Test event setup',
      description: 'Test Event',
      location: 'none',
      start: {
        dateTime: formatDate(start)
      },
      end: {
        dateTime: formatDate(end)
      }
    };
    try {
      const result = await calendarServiceAPI.createService(token, eventData);
      if (result.success) {
        showSuccess('Event created successfully!');
      } else {
        showError(result.error || 'Failed to create event');
      }
    } catch (error) {
      showError('Failed to create event');
    }
  };

  // Update timezone
  const handleTimezoneChange = async (e: ChangeEvent<HTMLSelectElement>): Promise<void> => {
    const newTimezone = e.target.value;
    setSelectedTimezone(newTimezone);
    if (hasCalendarAccess) {
      showWarning('⚠️ Timezone cannot be changed after calendar access is granted to prevent scheduling conflicts.');
      return;
    }
    try {
      await calendarServiceAPI.updateUserTimezone(token, newTimezone);
      showSuccess('Timezone updated successfully!');
    } catch {
      showError('Failed to update timezone');
    }
  };

  // Logout
  const handleLogout = async (): Promise<void> => {
    try {
      await calendarServiceAPI.logout(token);
      showSuccess('Logged out successfully!');
    } catch {
      showError('Failed to log out');
    }
    setUser(null);
    router.push('/calendar');
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <SyncLoader size={15} color="#000000" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container">
        <div className="card">
          <h2>Not authenticated</h2>
          <p>Please log in to view your profile.</p>
          <button onClick={() => router.push('/calendar')} className="button">
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  const displayTimezone = user?.timezone || selectedTimezone || '';
  const getTimezoneLabel = (timezone: string | null): string => {
    const option = timezoneOptions.find((opt: TimezoneOption) => opt.value === timezone);
    return option ? option.label : (timezone || '');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Only show profile summary if calendar modal is not open */}
      {!showCalendar && (
        <div
          className="max-w-xxl bg-white rounded-2xl shadow-lg p-8 flex flex-col items-center cursor-pointer hover:shadow-xl transition relative mt-24 ml-8"
          style={{ position: 'absolute', top: 0, left: 0 }}
          onClick={() => setShowDetails(true)}
          tabIndex={0}
          role="button"
          aria-label="Show profile details"
        >
          {user.picture && (
            <img
              src={user.picture}
              alt={user.name}
              className="w-20 h-20 rounded-full border-4 border-blue-500 object-cover mb-2"
            />
          )}
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl font-semibold text-gray-900">{user.displayName || user.name}</span>
          </div>
          <div className="text-gray-600 text-sm mb-2">{user.email}</div>
          <div className="flex items-center gap-2 mb-2">
            <Globe />
            <label className="font-medium text-gray-700">Timezone:</label>
            <select
              className="ml-2 px-3 py-1 rounded border border-gray-300 bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={displayTimezone}
              onChange={handleTimezoneChange}
              disabled={hasCalendarAccess}
              onClick={e => e.stopPropagation()}
            >
              {timezoneOptions.map((option: TimezoneOption) => (
                <option key={option.value} value={option.value}>{option.label} ({option.value})</option>
              ))}
            </select>
          </div>
          {hasCalendarAccess && (
            <div className="text-xs text-red-500 font-semibold mb-2 flex items-center gap-1">
              <Lock /> Timezone locked after calendar access is granted
            </div>
          )}
          {/* Action Buttons Grid */}
          <div className="w-full flex flex-col gap-3 mt-4">
            <div className="flex flex-row gap-4">
              <button
                onClick={e => { e.stopPropagation(); handleLogout(); }}
                className="flex-1 px-5 py-3 rounded-xl bg-gray-200 text-gray-800 font-semibold hover:bg-gray-300 transition text-md whitespace-nowrap"
              >
                Sign Out
              </button>
              {hasCalendarAccess && (
                <button
                  onClick={async e => {
                    e.stopPropagation();
                    setShowCalendar(true);
                    setLoadingCalendar(true);
                    await loadCalendarEvents();
                    setLoadingCalendar(false);
                  }}
                  className="flex-1 px-5 py-3 rounded-xl bg-green-100 text-green-800 font-semibold hover:bg-green-200 transition text-md flex items-center justify-center gap-2 whitespace-nowrap"
                >
                  <Calendar /> View Calendar
                </button>
              )}
              {!hasCalendarAccess && (
                <button
                  onClick={e => { e.stopPropagation(); buyService(); }}
                  className="flex-1 px-5 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition text-md flex items-center justify-center gap-2 whitespace-nowrap"
                >
                  <Calendar /> Buy Calendar Service
                </button>
              )}
            </div>
            {hasCalendarAccess && (
              <div className="flex justify-center">
                <button
                  onClick={e => { e.stopPropagation(); createSampleEvent(); }}
                  className="px-8 py-3 rounded-xl bg-yellow-400 text-white font-semibold hover:bg-yellow-500 transition text-md flex items-center justify-center gap-2 whitespace-nowrap"
                >
                  <CalendarPlus /> Create Sample Event
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      {/* Calendar Events Modal */}
      {showCalendar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 bg-opacity-40">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-2xl relative animate-fade-in max-h-[90vh] flex flex-col">
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-red-500 text-2xl font-bold focus:outline-none"
              onClick={() => setShowCalendar(false)}
              aria-label="Close calendar events"
            >
              ×
            </button>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Calendar /> Your Calendar Services
              </h2>
            </div>
            <div className="flex-1 overflow-y-auto">
              {loadingCalendar ? (
                <div className="flex justify-center items-center h-32 text-lg text-gray-500">Loading events...</div>
              ) : calendarServices.length > 0 ? (
                <div className="grid gap-4">
                    {calendarEvents.map((event, idx) => (
                      <div key={idx} className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-gray-900">{event.summary}</span>
                          <span className="text-xs text-gray-500">{event.status}</span>
                        </div>
                        <div className="text-gray-700 text-sm mb-1">{event.description}</div>
                        <div className="flex flex-wrap gap-4 text-xs text-gray-600">
                          <span>Start: {event.start?.dateTime || event.start?.date}</span>
                          <span>End: {event.end?.dateTime || event.end?.date}</span>
                          <span>Type: {event.eventType}</span>
                        </div>
                        <a href={event.htmlLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline text-xs mt-2 inline-block">View in Google Calendar</a>
                      </div>
                    ))}
                  </div>
              ) : (
                <div className="flex justify-center items-center h-32 text-lg text-gray-500">No events found.</div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Modal Popup for Details */}
      {showDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-2xl relative animate-fade-in">
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-red-500 text-2xl font-bold focus:outline-none"
              onClick={() => setShowDetails(false)}
              aria-label="Close details"
            >
              ×
            </button>
            <div className="w-full mb-4 p-3 rounded bg-green-100 text-green-900 font-semibold flex items-center gap-2">
              <span>✅</span> Successfully authenticated with Google OAuth 2.0!
            </div>
            {/* User Info Table */}
            <div className="w-full mt-4">
              <h2 className="text-lg font-bold text-gray-900 mb-2">User Information</h2>
              <table className="w-full text-left border border-gray-200 rounded-lg overflow-hidden">
                <tbody>
                  <tr className="border-b border-gray-100"><td className="py-2 px-3 font-medium text-gray-700">ID:</td><td className="py-2 px-3 text-gray-900">{user.id}</td></tr>
                  <tr className="border-b border-gray-100"><td className="py-2 px-3 font-medium text-gray-700">Email:</td><td className="py-2 px-3 text-gray-900">{user.email}</td></tr>
                  <tr className="border-b border-gray-100"><td className="py-2 px-3 font-medium text-gray-700">Google Given Name:</td><td className="py-2 px-3 text-gray-900">{user.given_name}</td></tr>
                  <tr className="border-b border-gray-100"><td className="py-2 px-3 font-medium text-gray-700">Google Family Name:</td><td className="py-2 px-3 text-gray-900">{user.family_name}</td></tr>
                  <tr className="border-b border-gray-100"><td className="py-2 px-3 font-medium text-gray-700">Verified Email:</td><td className="py-2 px-3 text-gray-900">{user.verified_email ? <span className="text-green-600 font-bold">Yes</span> : <span className="text-red-600 font-bold">No</span>}</td></tr>
                  <tr className="border-b border-gray-100"><td className="py-2 px-3 font-medium text-gray-700">Selected Timezone:</td><td className="py-2 px-3 text-gray-900">{getTimezoneLabel(selectedTimezone) || 'Auto-detected'}</td></tr>
                  <tr><td className="py-2 px-3 font-medium text-gray-700">Calendar Access:</td><td className="py-2 px-3 text-gray-900">{hasCalendarAccess ? <span className="text-green-600 font-bold">Yes</span> : <span className="text-red-600 font-bold">❌ No</span>}</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;