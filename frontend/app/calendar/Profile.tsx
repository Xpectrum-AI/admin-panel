'use client';

import { useEffect, useState, ChangeEvent } from 'react'
import { useRouter } from 'next/navigation'
import { useCalendarAuth } from './CalendarAuthProvider'
import axios from 'axios'

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
    <div className="container">
      <div className="card">
        <h1>👋 Welcome!</h1>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '2rem' }}>
          {user.picture && (
            <img 
              src={user.picture} 
              alt={user.name}
              style={{ 
                width: '80px', 
                height: '80px', 
                borderRadius: '50%', 
                marginRight: '1rem',
                border: '3px solid #4285f4'
              }}
            />
          )}
          <div style={{ textAlign: 'left' }}>
            <div style={{ marginBottom: '0.5rem' }}>
              {editingName ? (
                <div>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                    <div>
                      <input
                        type="text"
                        value={newFirstName}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => setNewFirstName(e.target.value)}
                        placeholder="First Name"
                        style={{
                          fontSize: '1rem',
                          fontWeight: 'bold',
                          color: '#333',
                          border: `2px solid ${nameErrors.firstName ? '#e74c3c' : '#4285f4'}`,
                          borderRadius: '4px',
                          padding: '6px 8px',
                          width: '120px'
                        }}
                      />
                      {nameErrors.firstName && (
                        <div style={{ color: '#e74c3c', fontSize: '0.75rem', marginTop: '2px' }}>
                          {nameErrors.firstName}
                        </div>
                      )}
                    </div>
                    <div>
                      <input
                        type="text"
                        value={newLastName}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => setNewLastName(e.target.value)}
                        placeholder="Last Name"
                        style={{
                          fontSize: '1rem',
                          fontWeight: 'bold',
                          color: '#333',
                          border: `2px solid ${nameErrors.lastName ? '#e74c3c' : '#4285f4'}`,
                          borderRadius: '4px',
                          padding: '6px 8px',
                          width: '120px'
                        }}
                      />
                      {nameErrors.lastName && (
                        <div style={{ color: '#e74c3c', fontSize: '0.75rem', marginTop: '2px' }}>
                          {nameErrors.lastName}
                        </div>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button 
                      onClick={updateUserNames}
                      style={{ 
                        background: '#4CAF50', 
                        color: 'white', 
                        border: 'none', 
                        padding: '4px 8px', 
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '0.875rem'
                      }}
                    >
                      ✓ Save
                    </button>
                    <button 
                      onClick={cancelEdit}
                      style={{ 
                        background: '#f44336', 
                        color: 'white', 
                        border: 'none', 
                        padding: '4px 8px', 
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '0.875rem'
                      }}
                    >
                      ✕ Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <h2 style={{ margin: 0, color: '#333' }}>
                    {user.name}
                    {user.has_custom_name && (
                      <span style={{ fontSize: '0.8rem', color: '#4285f4', marginLeft: '8px' }}>
                        (Custom)
                      </span>
                    )}
                  </h2>
                  <button 
                    onClick={() => setEditingName(true)}
                    style={{ 
                      background: 'transparent', 
                      border: 'none', 
                      marginLeft: '8px',
                      cursor: 'pointer',
                      fontSize: '1rem'
                    }}
                    title="Edit name"
                  >
                    ✏️
                  </button>
                </div>
              )}
            </div>
            <p style={{ margin: 0, color: '#666' }}>{user.email}</p>
          </div>
        </div>

        {/* Timezone Selector */}
        <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#333' }}>
            🌍 Select Your Timezone:
          </label>
          <select
            value={selectedTimezone || ''}
            onChange={handleTimezoneChange}
            disabled={hasCalendarAccess}
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              border: `2px solid ${hasCalendarAccess ? '#ccc' : '#4285f4'}`,
              background: hasCalendarAccess ? '#f5f5f5' : 'white',
              color: hasCalendarAccess ? '#999' : '#333',
              fontSize: '1rem',
              cursor: hasCalendarAccess ? 'not-allowed' : 'pointer',
              minWidth: '200px',
              opacity: hasCalendarAccess ? 0.6 : 1
            }}
          >
            {timezoneOptions.map((option: TimezoneOption) => (
              <option key={option.value} value={option.value}>
                {option.label} ({option.value})
              </option>
            ))}
          </select>
          <div style={{ fontSize: '0.875rem', color: '#666', marginTop: '4px' }}>
            {hasCalendarAccess ? (
              <span style={{ color: '#ff6b6b' }}>
                🔒 Timezone locked after calendar access is granted
              </span>
            ) : (
              <>Current: {getTimezoneLabel(selectedTimezone)}</>
            )}
          </div>
        </div>
        
        <div className="success">
          ✅ Successfully authenticated with Google OAuth 2.0!
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <button onClick={handleLogout} className="button secondary" style={{ marginRight: '1rem' }}>
            Sign Out
          </button>
          
          {!hasCalendarAccess ? (
            <button onClick={buyService} className="button" style={{ background: '#FF6B6B' }}>
              🗓️ Buy Calendar Service
            </button>
          ) : (
            <div>
              <button onClick={loadCalendarEvents} className="button" style={{ marginRight: '0.5rem', background: '#4CAF50' }}>
                📅 View Calendar
              </button>
              <button onClick={createSampleEvent} className="button" style={{ background: '#FF9800' }}>
                ➕ Create Sample Event
              </button>
            </div>
          )}
        </div>

        {hasCalendarAccess && (
          <div className="success" style={{ background: '#e8f5e8', color: '#2e7d32' }}>
            🎉 Calendar Access Granted! You can now manage your Google Calendar.
          </div>
        )}
      </div>

      <div className="card">
        <h2>User Information</h2>
        <div style={{ textAlign: 'left' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              <tr style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '12px 0', fontWeight: '500', color: '#333' }}>ID:</td>
                <td style={{ padding: '12px 0', color: '#666' }}>{user.id}</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '12px 0', fontWeight: '500', color: '#333' }}>Display Name:</td>
                <td style={{ padding: '12px 0', color: '#666' }}>
                  {user.name}
                  {user.has_custom_name && (
                    <span style={{ color: '#4285f4', fontSize: '0.9rem' }}> (Custom)</span>
                  )}
                </td>
              </tr>
              {user.first_name && (
                <tr style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '12px 0', fontWeight: '500', color: '#333' }}>First Name:</td>
                  <td style={{ padding: '12px 0', color: '#666' }}>{user.first_name}</td>
                </tr>
              )}
              {user.last_name && (
                <tr style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '12px 0', fontWeight: '500', color: '#333' }}>Last Name:</td>
                  <td style={{ padding: '12px 0', color: '#666' }}>{user.last_name}</td>
                </tr>
              )}
              <tr style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '12px 0', fontWeight: '500', color: '#333' }}>Email:</td>
                <td style={{ padding: '12px 0', color: '#666' }}>{user.email}</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '12px 0', fontWeight: '500', color: '#333' }}>Google Given Name:</td>
                <td style={{ padding: '12px 0', color: '#666' }}>{user.given_name}</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '12px 0', fontWeight: '500', color: '#333' }}>Google Family Name:</td>
                <td style={{ padding: '12px 0', color: '#666' }}>{user.family_name}</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '12px 0', fontWeight: '500', color: '#333' }}>Verified Email:</td>
                <td style={{ padding: '12px 0', color: '#666' }}>{user.verified_email ? '✅ Yes' : '❌ No'}</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '12px 0', fontWeight: '500', color: '#333' }}>Selected Timezone:</td>
                <td style={{ padding: '12px 0', color: '#666' }}>{getTimezoneLabel(selectedTimezone)}</td>
              </tr>
              <tr>
                <td style={{ padding: '12px 0', fontWeight: '500', color: '#333' }}>Calendar Access:</td>
                <td style={{ padding: '12px 0', color: '#666' }}>{hasCalendarAccess ? '✅ Yes' : '❌ No'}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {showCalendar && hasCalendarAccess && (
        <div className="card">
          <h2>📅 Your Calendar Events ({getTimezoneLabel(selectedTimezone)})</h2>
          {loadingCalendar ? (
            <div style={{ textAlign: 'center' }}>
              <div className="loading"></div>
              <p>Loading calendar events...</p>
            </div>
          ) : (
            <div>
              {calendarEvents.length === 0 ? (
                <p style={{ color: '#666', textAlign: 'center' }}>No upcoming events found.</p>
              ) : (
                <div style={{ textAlign: 'left' }}>
                  {calendarEvents.map((event, index) => (
                    <div key={index} style={{ 
                      border: '1px solid #ddd', 
                      borderRadius: '8px', 
                      padding: '1rem', 
                      marginBottom: '1rem',
                      background: '#f9f9f9'
                    }}>
                      <h3 style={{ margin: 0, marginBottom: '0.5rem', color: '#333' }}>
                        {event.summary || 'Untitled Event'}
                      </h3>
                      {event.description && (
                        <p style={{ margin: 0, marginBottom: '0.5rem', color: '#666' }}>
                          {event.description}
                        </p>
                      )}
                      <p style={{ margin: 0, color: '#888', fontSize: '0.9rem' }}>
                        📅 {event.start?.dateTime ? 
                          new Date(event.start.dateTime).toLocaleString('en-US', { timeZone: selectedTimezone || undefined }) : 
                          event.start?.date || 'No date specified'
                        }
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default Profile