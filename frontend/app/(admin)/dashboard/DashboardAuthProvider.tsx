'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import axios from 'axios'
import { useAuthInfo } from "@propelauth/react";

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

interface OAuthboardAuthContextType {
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

const OAuthboardAuthContext = createContext<OAuthboardAuthContextType | null>(null)

export const useDashboardAuth = () => {
  const context = useContext(OAuthboardAuthContext)
  if (!context) {
    throw new Error('useDashboardAuth must be used within a OAuthAuthProvider')
  }
  return context
}

export const OAuthAuthProvider = ({ children }: { children: ReactNode }) => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { accessToken, user: authUser, loading: authLoading } = useAuthInfo();
  
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

  const API_BASE_URL = process.env.NEXT_PUBLIC_CALENDAR_API_URL || 'http://127.0.0.1:8001/api/v1'
  const AUTH_TOKEN_KEY = process.env.NEXT_PUBLIC_DASHBOARD_AUTH_TOKEN_KEY || 'dashboard_auth_token'
  const PENDING_FIRST_NAME_KEY = process.env.NEXT_PUBLIC_PENDING_FIRST_NAME_KEY || 'pending_first_name'
  const PENDING_LAST_NAME_KEY = process.env.NEXT_PUBLIC_PENDING_LAST_NAME_KEY || 'pending_last_name'
  
  // Always sync PropelAuth accessToken to axios when it changes
  useEffect(() => {
    if (accessToken) {
      setToken(accessToken);
      axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
      console.log('✅ PropelAuth accessToken loaded and axios headers set');
      if (!hasCalendarAccess) {
        const currentTimezone = selectedTimezone || detectBrowserTimezone();
        if (currentTimezone) {
          try {
            updateUserTimezone(accessToken, currentTimezone);
          } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
          }
        }
      }
    } else {
      setToken(null);
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [accessToken, hasCalendarAccess, selectedTimezone]);

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
      console.log('🔑 Token received from URL:', urlToken)
      setToken(urlToken)
      localStorage.setItem(AUTH_TOKEN_KEY, urlToken)
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
    const storedToken = accessToken;
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
      
      // Handle the new user data structure
      const userData = response.data.user
      const processedUser: User = {
        id: userData.user_id || userData.id, // Handle both old and new structure
        name: userData.name || `${userData.first_name || ''} ${userData.last_name || ''}`.trim(),
        email: userData.email,
        picture: userData.picture,
        first_name: userData.first_name,
        last_name: userData.last_name,
        given_name: userData.given_name,
        family_name: userData.family_name,
        has_custom_name: userData.has_custom_name,
        verified_email: userData.verified_email,
        ...userData // Include any additional properties
      }
      
      setUser(processedUser)
      setToken(storedToken)
      
      // Check for Google OAuth tokens from PropelAuth
      await checkGoogleTokensFromPropelAuth(storedToken)
      
      // Get calendar access status from new endpoint
      const accessRes = await axios.get(`${API_BASE_URL}/calendar/access`, {
        headers: {
          Authorization: `Bearer ${storedToken}`
        }
      })
      setHasCalendarAccess(accessRes.data.has_calendar_access)

      console.log(hasCalendarAccess);
      
      
      console.log('✅ Auth check successful, user data:', processedUser)
      console.log('✅ Token stored in localStorage:', storedToken)
      
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

  const checkGoogleTokensFromPropelAuth = async (sessionToken: string) => {
    try {
      console.log('🔍 Checking Google OAuth tokens from PropelAuth...')
      const response = await axios.post(`${API_BASE_URL}/auth/check-google-tokens`, {}, {
        headers: {
          Authorization: `Bearer ${sessionToken}`
        }
      })
      
      const result = response.data
      console.log('📋 PropelAuth token check result:', result)
      
      if (result.has_google_tokens) {
        console.log('✅ Google OAuth tokens found and stored')
        if (result.has_calendar_access) {
          console.log('📅 Calendar access detected from PropelAuth scopes')
        } else {
          console.log('⚠️ No calendar access in PropelAuth scopes')
        }
      } else {
        console.log('ℹ️ No Google OAuth tokens found in PropelAuth')
      }
      
    } catch (error) {
      console.error('❌ Error checking PropelAuth tokens:', error)
      // Don't throw error - this is optional functionality
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

  const value: OAuthboardAuthContextType = {
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
    <OAuthboardAuthContext.Provider value={value}>
      {children}
    </OAuthboardAuthContext.Provider>
  )
} 