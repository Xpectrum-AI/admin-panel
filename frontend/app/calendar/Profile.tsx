'use client';

import { useEffect, useState, ChangeEvent } from 'react'
import { useRouter } from 'next/navigation'
import { useCalendarAuth } from './CalendarAuthProvider'
import axios from 'axios'
import React from 'react'

type TimezoneOption = { value: string; label: string }

const Profile = () => {
  const { user, logout, isAuthenticated, loading, token, selectedTimezone, updateTimezone, timezoneOptions, hasCalendarAccess } = useCalendarAuth()
  const router = useRouter()
  const [calendarEvents, setCalendarEvents] = useState<any[]>([])
  const [loadingCalendar, setLoadingCalendar] = useState<boolean>(false)
  const [showCalendar, setShowCalendar] = useState<boolean>(false)
  const [editingName, setEditingName] = useState<boolean>(false)
  const [newFirstName, setNewFirstName] = useState<string>('')
  const [newLastName, setNewLastName] = useState<string>('')
  const [nameErrors, setNameErrors] = useState<{ firstName?: string; lastName?: string }>({})
  const [showDetails, setShowDetails] = useState(false)

  // Environment variables - Next.js uses NEXT_PUBLIC_ prefix for client-side variables
  const API_BASE_URL = process.env.NEXT_PUBLIC_CALENDAR_API_URL || 'http://localhost:8001/api/v1'

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/calendar')
    }
  }, [isAuthenticated, loading, router])

  useEffect(() => {
    if (user && token) {
      // Set the current names for editing
      setNewFirstName(user.first_name || user.given_name || '')
      setNewLastName(user.last_name || user.family_name || '')
    }
  }, [user, token])

  const validateNames = (): boolean => {
    const errors: { firstName?: string; lastName?: string } = {}
    
    if (!newFirstName.trim()) {
      errors.firstName = 'First name is required'
    }
    
    if (!newLastName.trim()) {
      errors.lastName = 'Last name is required'
    }
    
    setNameErrors(errors)
    return Object.keys(errors).length === 0
  }

  const updateUserNames = async (): Promise<void> => {
    if (!validateNames()) {
      return
    }

    try {
      await axios.post(`${API_BASE_URL}/update-user-names`, 
        { 
          first_name: newFirstName.trim(),
          last_name: newLastName.trim()
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )
      setEditingName(false)
      setNameErrors({})
      // Refresh user data - in Next.js, you might want to use router.refresh() or update state
      router.refresh()
    } catch (error) {
      console.error('Failed to update names:', error)
      alert('Failed to update names')
    }
  }

  const cancelEdit = (): void => {
    setEditingName(false)
    setNameErrors({})
    // Reset to current values
    setNewFirstName(user?.first_name || user?.given_name || '')
    setNewLastName(user?.last_name || user?.family_name || '')
  }

  const buyService = async (): Promise<void> => {
    try {
      const response = await axios.post(`${API_BASE_URL}/buy-service`)
      // Redirect to Google OAuth for calendar access
      window.location.href = response.data.redirect_url
    } catch (error) {
      console.error('Failed to initiate calendar service purchase:', error)
    }
  }

  const loadCalendarEvents = async (): Promise<void> => {
    if (!hasCalendarAccess) return
    
    setLoadingCalendar(true)
    try {
      const response = await axios.get(`${API_BASE_URL}/calendar/events`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'X-Timezone': selectedTimezone || ''
        }
      })
      setCalendarEvents(response.data.events || [])
      setShowCalendar(true)
    } catch (error) {
      console.error('Failed to load calendar events:', error)
      alert('Failed to load calendar events')
    } finally {
      setLoadingCalendar(false)
    }
  }

  const createSampleEvent = async (): Promise<void> => {
    if (!hasCalendarAccess) return

    const eventData = {
      summary: 'Sample Event Created by OAuth App',
      description: 'This event was created through the Google Calendar API',
      start: {
        dateTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
        timeZone: selectedTimezone || ''
      },
      end: {
        dateTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(), // Tomorrow + 1 hour
        timeZone: selectedTimezone || ''
      }
    }

    try {
      await axios.post(`${API_BASE_URL}/calendar/events`, eventData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'X-Timezone': selectedTimezone || ''
        }
      })
      alert('Event created successfully!')
      loadCalendarEvents() // Refresh events
    } catch (error) {
      console.error('Failed to create event:', error)
      alert('Failed to create event')
    }
  }

  const handleTimezoneChange = (e: ChangeEvent<HTMLSelectElement>): void => {
    const newTimezone = e.target.value
    updateTimezone(newTimezone)
  }

  const getTimezoneLabel = (timezone: string | null): string => {
    const option = timezoneOptions.find((opt: TimezoneOption) => opt.value === timezone)
    return option ? option.label : (timezone || '')
  }

  if (loading) {
    return (
      <div className="container">
        <div className="card">
          <div className="loading"></div>
          <p>Loading...</p>
        </div>
      </div>
    )
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
    )
  }

  const handleLogout = async (): Promise<void> => {
    await logout()
    router.push('/calendar')
  }

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
            <span className="text-blue-500 text-lg">🌐</span>
            <label className="font-medium text-gray-700">Timezone:</label>
            <select
              className="ml-2 px-3 py-1 rounded border border-gray-300 bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={selectedTimezone || ''}
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
              <span>🔒</span> Timezone locked after calendar access is granted
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
                  <span className="text-xl">📅</span> View Calendar
                </button>
              )}
              {!hasCalendarAccess && (
                <button
                  onClick={e => { e.stopPropagation(); buyService(); }}
                  className="flex-1 px-5 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition text-md flex items-center justify-center gap-2 whitespace-nowrap"
                >
                  <span className="text-xl">📅</span> Buy Calendar Service
                </button>
              )}
            </div>
            {hasCalendarAccess && (
              <div className="flex justify-center">
                <button
                  onClick={e => { e.stopPropagation(); createSampleEvent(); }}
                  className="px-8 py-3 rounded-xl bg-yellow-400 text-white font-semibold hover:bg-yellow-500 transition text-md flex items-center justify-center gap-2 whitespace-nowrap"
                >
                  <span className="text-xl">➕</span> Create Sample Event
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      {/* Calendar Events Modal */}
      {showCalendar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
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
                <span>📅</span> Your Calendar Events
              </h2>
            </div>
            <div className="flex-1 overflow-y-auto">
              {loadingCalendar ? (
                <div className="flex justify-center items-center h-32 text-lg text-gray-500">Loading events...</div>
              ) : calendarEvents.length > 0 ? (
                <div className="grid gap-4">
                  {calendarEvents.map((event, idx) => {
                    const startDate = event.start?.dateTime ? new Date(event.start.dateTime) : new Date(event.start?.date);
                    const endDate = event.end?.dateTime ? new Date(event.end.dateTime) : new Date(event.end?.date);
                    const isAllDay = !event.start?.dateTime;
                    const formatDate = (date: Date) => date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
                    const formatTime = (date: Date) => date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
                    return (
                      <div key={idx} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-3">
                          <h3 className="text-lg font-semibold text-gray-900">{event.summary}</h3>
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {isAllDay ? 'All Day' : 'Timed'}
                          </span>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-gray-600">
                            <span className="text-blue-500">📅</span>
                            <span className="font-medium">Date:</span>
                            <span>{formatDate(startDate)}</span>
                          </div>
                          {!isAllDay && (
                            <>
                              <div className="flex items-center gap-2 text-gray-600">
                                <span className="text-green-500">🕐</span>
                                <span className="font-medium">Start:</span>
                                <span>{formatTime(startDate)}</span>
                              </div>
                              <div className="flex items-center gap-2 text-gray-600">
                                <span className="text-red-500">🕐</span>
                                <span className="font-medium">End:</span>
                                <span>{formatTime(endDate)}</span>
                              </div>
                            </>
                          )}
                          {isAllDay && (
                            <div className="flex items-center gap-2 text-gray-600">
                              <span className="text-purple-500">📅</span>
                              <span className="font-medium">Duration:</span>
                              <span>{formatDate(startDate)} - {formatDate(endDate)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
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
  )
}

export default Profile