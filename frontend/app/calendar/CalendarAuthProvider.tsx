'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import axios from 'axios'

interface User {
  id: string
  name: string
  email: string
  picture?: string
  first_name?: string
  last_name?: string
  given_name?: string
  family_name?: string
  has_custom_name?: boolean
  verified_email?: boolean
  [key: string]: any
}

interface CalendarAuthContextType {
  user: User | null
  token: string | null
  loading: boolean
  login: () => void
  logout: () => void
  isAuthenticated: boolean
  selectedTimezone: string | null
  updateTimezone: (tz: string) => void
  timezoneOptions: { label: string; value: string }[]
  hasCalendarAccess: boolean
}

const CalendarAuthContext = createContext<CalendarAuthContextType | null>(null)

export const useCalendarAuth = () => {
  const context = useContext(CalendarAuthContext)
  if (!context) {
    throw new Error('useCalendarAuth must be used within a CalendarAuthProvider')
  }
  return context
}

export const CalendarAuthProvider = ({ children }: { children: ReactNode }) => {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Helper function to detect browser timezone
  const detectBrowserTimezone = (): string => {
    try {
      const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone
      return detectedTimezone
    } catch (error) {
      return process.env.NEXT_PUBLIC_DEFAULT_TIMEZONE || 'America/New_York'
    }
  }

  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [token, setToken] = useState<string | null>(null)
  const [selectedTimezone, setSelectedTimezone] = useState<string | null>(null)
  const [hasCalendarAccess, setHasCalendarAccess] = useState<boolean>(false)

  const API_BASE_URL = process.env.NEXT_PUBLIC_CALENDAR_API_URL || 'http://localhost:8001/api/v1'
  const AUTH_TOKEN_KEY = process.env.NEXT_PUBLIC_AUTH_TOKEN_KEY || 'auth_token'
  const PENDING_FIRST_NAME_KEY = process.env.NEXT_PUBLIC_PENDING_FIRST_NAME_KEY || 'pending_first_name'
  const PENDING_LAST_NAME_KEY = process.env.NEXT_PUBLIC_PENDING_LAST_NAME_KEY || 'pending_last_name'

  // Initialize client-side only state
  useEffect(() => {
    // Initialize token from localStorage
    const storedToken = localStorage.getItem(AUTH_TOKEN_KEY)
    if (storedToken) {
      setToken(storedToken)
      axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`
    }
    
    // Initialize timezone
    setSelectedTimezone(detectBrowserTimezone())
    
    // Clean up any existing timezone localStorage data
    const oldTimezoneKey = 'selected_timezone'
    if (localStorage.getItem(oldTimezoneKey)) {
      localStorage.removeItem(oldTimezoneKey)
      console.log('🧹 Cleaned up old timezone preference, now using auto-detected timezone')
    }
  }, [])

  // Parse timezone options from environment and add detected timezone if not present
  const getTimezoneOptions = (): { label: string; value: string }[] => {
    const baseTimezoneOptions = (process.env.NEXT_PUBLIC_TIMEZONE_OPTIONS || 'IST:Asia/Kolkata,EST:America/New_York,PST:America/Los_Angeles')
      .split(',')
      .map(option => {
        const [label, value] = option.split(':')
        return { label, value }
      })

    // Add detected timezone to options if not already present
    const detectedTimezone = detectBrowserTimezone()
    const timezoneOptions = baseTimezoneOptions.some(option => option.value === detectedTimezone)
      ? baseTimezoneOptions
      : [
          { label: 'Auto-detected', value: detectedTimezone },
          ...baseTimezoneOptions
        ]
    
    return timezoneOptions
  }

  // Handle URL parameters on mount
  useEffect(() => {
    if (!searchParams) return
    
    const urlToken = searchParams.get('token')
    const error = searchParams.get('error')
    const service = searchParams.get('service')

    if (error) {
      router.replace(window.location.pathname)
      if (error.includes('calendar')) {
        alert('Calendar service setup failed. Please try again.')
      } else {
        alert('Authentication failed. Please try again.')
      }
    } else if (urlToken) {
      setToken(urlToken)
      localStorage.setItem(AUTH_TOKEN_KEY, urlToken)
      axios.defaults.headers.common['Authorization'] = `Bearer ${urlToken}`
      const pendingFirstName = localStorage.getItem(PENDING_FIRST_NAME_KEY)
      const pendingLastName = localStorage.getItem(PENDING_LAST_NAME_KEY)
      if (pendingFirstName && pendingLastName) {
        updateUserNames(urlToken, pendingFirstName, pendingLastName)
        localStorage.removeItem(PENDING_FIRST_NAME_KEY)
        localStorage.removeItem(PENDING_LAST_NAME_KEY)
      }
      const currentTimezone = selectedTimezone || detectBrowserTimezone()
      if (currentTimezone) {
        updateUserTimezone(urlToken, currentTimezone)
      }
      router.replace(window.location.pathname)
      if (service === 'calendar') {
        setTimeout(() => {
          alert('🎉 Calendar service activated successfully! You can now manage your Google Calendar.')
        }, 500)
      }
      checkAuthStatus()
    }
  }, [searchParams, router, selectedTimezone])

  // Check auth status on token change
  useEffect(() => {
    if (token) {
      checkAuthStatus()
    } else {
      setLoading(false)
    }
  }, [token])

  const updateUserNames = async (sessionToken: string, firstName: string, lastName: string) => {
    try {
      await axios.post(`${API_BASE_URL}/update-user-names`, 
        { 
          first_name: firstName,
          last_name: lastName 
        },
        {
          headers: {
            Authorization: `Bearer ${sessionToken}`
          }
        }
      )
    } catch (error) {
      console.error('Failed to update user names:', error)
    }
  }

  const updateUserTimezone = async (sessionToken: string, timezone: string) => {
    try {
      await axios.post(`${API_BASE_URL}/update-user-timezone`, 
        { 
          timezone: timezone
        },
        {
          headers: {
            Authorization: `Bearer ${sessionToken}`
          }
        }
      )
    } catch (error) {
      console.error('Failed to update user timezone:', error)
    }
  }

  const updateTimezone = (timezone: string) => {
    // Prevent timezone changes if user has calendar access
    if (hasCalendarAccess) {
      alert('⚠️ Timezone cannot be changed after calendar access is granted to prevent scheduling conflicts.')
      return
    }
    
    setSelectedTimezone(timezone)
    
    // If user is authenticated, update timezone on backend
    if (token) {
      updateUserTimezone(token, timezone)
      console.log('✅ Updated timezone on backend:', timezone)
    }
  }

  const checkAuthStatus = async () => {
    const storedToken = localStorage.getItem(AUTH_TOKEN_KEY)
    if (!storedToken) {
      setLoading(false)
      return
    }

    try {
      // Get user info
      const response = await axios.get(`${API_BASE_URL}/auth/user`, {
        headers: {
          Authorization: `Bearer ${storedToken}`
        }
      })
      setUser(response.data.user)
      setToken(storedToken)
      // Get calendar access status from new endpoint
      const accessRes = await axios.get(`${API_BASE_URL}/calendar/access`, {
        headers: {
          Authorization: `Bearer ${storedToken}`
        }
      })
      setHasCalendarAccess(accessRes.data.has_calendar_access || false)
    } catch (error) {
      console.error('Auth check failed:', error)
      localStorage.removeItem(AUTH_TOKEN_KEY)
      delete axios.defaults.headers.common['Authorization']
      setToken(null)
      setUser(null)
      setHasCalendarAccess(false)
    } finally {
      setLoading(false)
    }
  }

  const login = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/auth/google`)
      window.location.href = response.data.auth_url
    } catch (error) {
      console.error('Failed to get auth URL:', error)
    }
  }

  const logout = async () => {
    try {
      if (token) {
        await axios.post(`${API_BASE_URL}/auth/logout`, {}, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })
      }
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      // Clear local state regardless of API call success
      localStorage.removeItem(AUTH_TOKEN_KEY)
      localStorage.removeItem(PENDING_FIRST_NAME_KEY)
      localStorage.removeItem(PENDING_LAST_NAME_KEY)
      delete axios.defaults.headers.common['Authorization']
      setToken(null)
      setUser(null)
      setHasCalendarAccess(false)
    }
  }

  const value: CalendarAuthContextType = {
    user,
    token,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
    selectedTimezone,
    updateTimezone,
    timezoneOptions: getTimezoneOptions(),
    hasCalendarAccess
  }

  return (
    <CalendarAuthContext.Provider value={value}>
      {children}
    </CalendarAuthContext.Provider>
  )
}