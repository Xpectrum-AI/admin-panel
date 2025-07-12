'use client'

import { useEffect, useState, ChangeEvent, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useCalendarAuth } from './CalendarAuthProvider'

const Home = () => {
  const { login, isAuthenticated, loading } = useCalendarAuth()
  const router = useRouter()
  const [firstName, setFirstName] = useState<string>('')
  const [lastName, setLastName] = useState<string>('')
  const [errors, setErrors] = useState<{ firstName?: string; lastName?: string }>({})
  const [showHowItWorks, setShowHowItWorks] = useState(false)
  const howItWorksRef = useRef<HTMLDivElement>(null)

  // Close popover when clicking outside
  useEffect(() => {
    if (!showHowItWorks) return
    function handleClick(e: MouseEvent) {
      if (howItWorksRef.current && !howItWorksRef.current.contains(e.target as Node)) {
        setShowHowItWorks(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [showHowItWorks])

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/calendar/profile')
    }
  }, [isAuthenticated, router])

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

  const validateForm = (): boolean => {
    const newErrors: { firstName?: string; lastName?: string } = {}
    
    if (!firstName.trim()) {
      newErrors.firstName = 'First name is required'
    }
    
    if (!lastName.trim()) {
      newErrors.lastName = 'Last name is required'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleLogin = (): void => {
    if (!validateForm()) {
      return
    }

    // Store the user names in localStorage before OAuth
    localStorage.setItem('pending_first_name', firstName.trim())
    localStorage.setItem('pending_last_name', lastName.trim())
    login()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-lg p-8 flex flex-col items-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">🔒 OAuth Demo</h1>
        <p className="text-gray-700 mb-6">Secure authentication with Google OAuth 2.0</p>
        <form className="w-full mb-6">
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-1">First Name <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Enter your first name"
              className={`block w-full rounded-lg border ${errors.firstName ? 'border-red-400' : 'border-gray-200'} px-4 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-base bg-gray-50`}
            />
            {errors.firstName && (
              <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>
            )}
          </div>
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-1">Last Name <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Enter your last name"
              className={`block w-full rounded-lg border ${errors.lastName ? 'border-red-400' : 'border-gray-200'} px-4 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-base bg-gray-50`}
            />
            {errors.lastName && (
              <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>
            )}
          </div>
        </form>
        <button
          onClick={handleLogin}
          className="w-full py-2.5 rounded-lg bg-blue-600 text-white font-semibold text-base   hover:bg-blue-700 transition-all duration-200 flex items-center justify-center mb-6"
        >
          <span className="bg-white rounded-full p-1 mr-2"><svg width="24" height="24" viewBox="0 0 24 24"><g><path fill="#4285F4" d="M21.805 10.023h-9.765v3.977h5.617c-.242 1.242-1.469 3.648-5.617 3.648-3.375 0-6.125-2.789-6.125-6.25s2.75-6.25 6.125-6.25c1.922 0 3.211.82 3.953 1.523l2.703-2.633c-1.703-1.57-3.906-2.539-6.656-2.539-5.523 0-10 4.477-10 10s4.477 10 10 10c5.75 0 9.547-4.031 9.547-9.719 0-.656-.07-1.156-.164-1.656z"/><path fill="#34A853" d="M3.545 7.548l3.289 2.414c.891-1.781 2.578-2.914 4.466-2.914 1.094 0 2.125.391 2.922 1.031l2.703-2.633c-1.703-1.57-3.906-2.539-6.656-2.539-2.703 0-5.078 1.07-6.844 2.789z"/><path fill="#FBBC05" d="M12 22c2.672 0 4.922-.883 6.563-2.406l-3.047-2.492c-.844.57-1.922.914-3.516.914-2.844 0-5.25-1.914-6.109-4.477l-3.289 2.547c1.75 3.477 5.406 5.914 9.398 5.914z"/><path fill="#EA4335" d="M21.805 10.023h-9.765v3.977h5.617c-.242 1.242-1.469 3.648-5.617 3.648-3.375 0-6.125-2.789-6.125-6.25s2.75-6.25 6.125-6.25c1.922 0 3.211.82 3.953 1.523l2.703-2.633c-1.703-1.57-3.906-2.539-6.656-2.539-5.523 0-10 4.477-10 10s4.477 10 10 10c5.75 0 9.547-4.031 9.547-9.719 0-.656-.07-1.156-.164-1.656z" opacity=".1"/></g></svg></span>
          Sign in with Google
        </button>
        <div className="w-full mt-4">
          <div className="flex items-center gap-2 mb-2 text-green-700">
            <span className="text-xl">✅</span>
            <span className="font-semibold">Secure OAuth 2.0 flow</span>
          </div>
          <div className="flex items-center gap-2 mb-2 text-green-700">
            <span className="text-xl">✅</span>
            <span className="font-semibold">Access user profile</span>
          </div>
          <div className="flex items-center gap-2 mb-4 text-green-700">
            <span className="text-xl">✅</span>
            <span className="font-semibold">Session management</span>
          </div>
          <div className="flex items-center gap-2 mb-2 relative">
            <h2 className="text-lg font-bold text-gray-900">How it works</h2>
            <button
              onClick={() => setShowHowItWorks((v) => !v)}
              className="text-blue-600 hover:text-blue-800 focus:outline-none w-6 h-6 flex items-center justify-center border border-blue-200 rounded-full bg-white shadow"
              title="Show how it works"
              aria-label="Show how it works"
              type="button"
            >
              <span className="text-lg font-bold">?</span>
            </button>
            {showHowItWorks && (
              <div ref={howItWorksRef} className="absolute left-full top-1/2 -translate-y-1/2 ml-4 z-20 w-80 bg-white border border-blue-200 rounded-lg shadow-lg p-4 text-blue-900 text-sm animate-fade-in flex items-center">
                <div className="absolute left-[-10px] top-1/2 -translate-y-1/2 w-4 h-4 overflow-hidden">
                  <div className="w-4 h-4 bg-white border-t border-l border-blue-200 rotate-45"></div>
                </div>
                <ol className="list-decimal list-inside space-y-1">
                  <li><span className="font-semibold">Enter your first and last name</span> (required)</li>
                  <li>Click "Sign in with Google" to start OAuth flow</li>
                  <li>You'll be redirected to Google's authorization server</li>
                  <li>After authorization, Google redirects back with a code</li>
                  <li>Backend exchanges the code for access tokens</li>
                  <li>Your profile information is fetched and displayed</li>
                </ol>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Home