'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import axios from 'axios'
import { useAuthInfo } from "@propelauth/react";
import { useErrorHandler } from '../../../hooks/useErrorHandler';

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

interface AuthContextType {
  user: User | null
  loading: boolean
  isAuthenticated: boolean
  login: () => void
  logout: () => void
  selectedTimezone: string | null
  updateTimezone: (tz: string) => void
  timezoneOptions: { label: string; value: string }[]
  hasCalendarAccess: boolean
  token: string | null
}

const AuthContext = createContext<AuthContextType | null>(null)

export const useDashboardAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useDashboardAuth must be used within an AuthContextProvider')
  }
  return context
}

export const AuthContextProvider = ({ children }: { children: ReactNode }) => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user: authUser, loading: authLoading, accessToken } = useAuthInfo();
  const { showError, showSuccess, showWarning } = useErrorHandler();

  const detectBrowserTimezone = (): string => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone
    } catch (error) {
      return process.env.NEXT_PUBLIC_DEFAULT_TIMEZONE || 'America/New_York'
    }
  }

  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [selectedTimezone, setSelectedTimezone] = useState<string | null>(null)
  const [hasCalendarAccess, setHasCalendarAccess] = useState<boolean>(false)
  const [token, setToken] = useState<string | null>(null);
  const [isGoogleAuthenticated, setIsGoogleAuthenticated] = useState(false);

  const API_BASE_URL = process.env.NEXT_PUBLIC_CALENDAR_API_URL || 'http://127.0.0.1:8001/api/v1'

  // Set user info from PropelAuth
  useEffect(() => {
    if (authUser) {
      setUser({
        id: authUser.userId,
        name: authUser.firstName && authUser.lastName ? `${authUser.firstName} ${authUser.lastName}` : authUser.email,
        picture: authUser.pictureUrl,
        first_name: authUser.firstName,
        last_name: authUser.lastName,
        given_name: authUser.firstName,
        family_name: authUser.lastName,
        verified_email: authUser.emailConfirmed,
        ...authUser
      });
    } else {
      setUser(null);
    }
  }, [authUser]);

  useEffect(() => {
    setToken(accessToken || null);
  }, [accessToken]);

  // Parse timezone options from environment and add detected timezone if not present
  const getTimezoneOptions = (): { label: string; value: string }[] => {
    const baseTimezoneOptions = (process.env.NEXT_PUBLIC_TIMEZONE_OPTIONS || 'IST:Asia/Kolkata,EST:America/New_York,PST:America/Los_Angeles')
      .split(',')
      .map(option => {
        const [label, value] = option.split(':')
        return { label, value }
      })
    const detectedTimezone = detectBrowserTimezone()
    const timezoneOptions = baseTimezoneOptions.some(option => option.value === detectedTimezone)
      ? baseTimezoneOptions
      : [
          { label: 'Auto-detected', value: detectedTimezone },
          ...baseTimezoneOptions
        ]
    return timezoneOptions
  }

  // Handle URL parameters on mount (optional, keep if needed for calendar)
  useEffect(() => {
    if (!searchParams) return
    const error = searchParams.get('error')
    const service = searchParams.get('service')
    if (error) {
      router.replace(window.location.pathname)
      if (error.includes('calendar')) {
        showError('Calendar service setup failed. Please try again.');
      }
    } else if (service === 'calendar') {
      setTimeout(() => {
        showSuccess('Calendar service activated successfully!');
      }, 500)
    }
  }, [searchParams, router, selectedTimezone])

  const updateUserTimezone = async (timezone: string) => {
    try {
      await axios.post(`${API_BASE_URL}/update-user-timezone`, 
        { timezone },
        { headers: { Authorization: `Bearer ${token || ''}` } }
      )
    } catch (error) {
      showError('Failed to update user timezone.');
    }
  }

  const updateTimezone = (timezone: string) => {
    if (hasCalendarAccess) {
      showWarning('⚠️ Timezone cannot be changed after calendar access is granted to prevent scheduling conflicts.');
      return
    }
    setSelectedTimezone(timezone)
    if (user) {
      updateUserTimezone(timezone)
    }
  }

  // Optionally, fetch calendar access status if needed for all users
  useEffect(() => {
    const fetchCalendarAccess = async () => {
      if (!token) return;
      try {
        const res = await axios.get(`${API_BASE_URL}/calendar/access`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log(res);
        
        setHasCalendarAccess(res.data.has_calendar_access || false);
      } catch {
        setHasCalendarAccess(false);
      }
    };
    fetchCalendarAccess();
  }, [token]);

  useEffect(() => {
    const checkGoogleAuth = async () => {
      if (!token) {
        setLoading(false)
        return;
      }
      try {
        const res = await fetch(`${API_BASE_URL}/auth/callback`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ access_token: token })
        });
        const data = await res.json();
        if (data.success && data.user_id) {
          setIsGoogleAuthenticated(true);
          setUser(prev => prev ? { ...prev, id: data.user_id } : { id: data.user_id, name: '', email: '' });
        } else {
          setIsGoogleAuthenticated(false);
        }
      } catch {
        setIsGoogleAuthenticated(false);
      }finally{
        setLoading(false)
      }
    };
    checkGoogleAuth();
  }, [token]);

  const login = () => {
    // Implement login logic (e.g., redirect to login page or show modal)
  }
  const logout = () => {
    // Implement logout logic (e.g., clear session, call backend, etc.)
    setUser(null);
  }

  const value: AuthContextType = {
    user,
    token,
    loading: loading || authLoading,
    isAuthenticated: !!user && isGoogleAuthenticated,
    login,
    logout,
    selectedTimezone,
    updateTimezone,
    timezoneOptions: getTimezoneOptions(),
    hasCalendarAccess
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
} 