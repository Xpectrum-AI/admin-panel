'use client'

import { useEffect, useState, ChangeEvent } from 'react'
import { useRouter } from 'next/navigation'
import { useCalendarAuth } from './CalendarAuthProvider'

const Home = () => {
  const { login, isAuthenticated, loading } = useCalendarAuth()
  const router = useRouter()
  const [firstName, setFirstName] = useState<string>('')
  const [lastName, setLastName] = useState<string>('')
  const [errors, setErrors] = useState<{ firstName?: string; lastName?: string }>({})

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
    <div className="container">
      <div className="card">
        <h1>🔐 OAuth Demo</h1>
        <p>Secure authentication with Google OAuth 2.0</p>
        
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '0.5rem', 
              fontWeight: '500', 
              color: '#333',
              textAlign: 'left'
            }}>
              First Name <span style={{ color: '#e74c3c' }}>*</span>:
            </label>
            <input
              type="text"
              value={firstName}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setFirstName(e.target.value)}
              placeholder="Enter your first name"
              style={{
                width: '100%',
                padding: '12px',
                border: `2px solid ${errors.firstName ? '#e74c3c' : '#ddd'}`,
                borderRadius: '8px',
                fontSize: '1rem',
                outline: 'none',
                transition: 'border-color 0.3s ease'
              }}
              onFocus={(e) => e.target.style.borderColor = errors.firstName ? '#e74c3c' : '#4285f4'}
              onBlur={(e) => e.target.style.borderColor = errors.firstName ? '#e74c3c' : '#ddd'}
            />
            {errors.firstName && (
              <p style={{ color: '#e74c3c', fontSize: '0.875rem', margin: '0.25rem 0 0 0' }}>
                {errors.firstName}
              </p>
            )}
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '0.5rem', 
              fontWeight: '500', 
              color: '#333',
              textAlign: 'left'
            }}>
              Last Name <span style={{ color: '#e74c3c' }}>*</span>:
            </label>
            <input
              type="text"
              value={lastName}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setLastName(e.target.value)}
              placeholder="Enter your last name"
              style={{
                width: '100%',
                padding: '12px',
                border: `2px solid ${errors.lastName ? '#e74c3c' : '#ddd'}`,
                borderRadius: '8px',
                fontSize: '1rem',
                outline: 'none',
                transition: 'border-color 0.3s ease'
              }}
              onFocus={(e) => e.target.style.borderColor = errors.lastName ? '#e74c3c' : '#4285f4'}
              onBlur={(e) => e.target.style.borderColor = errors.lastName ? '#e74c3c' : '#ddd'}
            />
            {errors.lastName && (
              <p style={{ color: '#e74c3c', fontSize: '0.875rem', margin: '0.25rem 0 0 0' }}>
                {errors.lastName}
              </p>
            )}
          </div>
        </div>
        
        <button onClick={handleLogin} className="google-btn">
          <div className="google-icon">G</div>
          Sign in with Google
        </button>
        
        <div style={{ marginTop: '2rem', textAlign: 'left' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem', color: '#555' }}>
            <div style={{ 
              width: '20px', 
              height: '20px', 
              background: '#4CAF50', 
              borderRadius: '50%', 
              marginRight: '10px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              color: 'white', 
              fontSize: '12px' 
            }}>✓</div>
            <span>Secure OAuth 2.0 flow</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem', color: '#555' }}>
            <div style={{ 
              width: '20px', 
              height: '20px', 
              background: '#4CAF50', 
              borderRadius: '50%', 
              marginRight: '10px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              color: 'white', 
              fontSize: '12px' 
            }}>✓</div>
            <span>Access user profile</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem', color: '#555' }}>
            <div style={{ 
              width: '20px', 
              height: '20px', 
              background: '#4CAF50', 
              borderRadius: '50%', 
              marginRight: '10px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              color: 'white', 
              fontSize: '12px' 
            }}>✓</div>
            <span>Session management</span>
          </div>
        </div>
      </div>

      <div className="card">
        <h2>How it works</h2>
        <ol style={{ textAlign: 'left', paddingLeft: '1.5rem' }}>
          <li><strong>Enter your first and last name</strong> (required)</li>
          <li>Click "Sign in with Google" to start OAuth flow</li>
          <li>You'll be redirected to Google's authorization server</li>
          <li>After authorization, Google redirects back with a code</li>
          <li>Backend exchanges the code for access tokens</li>
          <li>Your profile information is fetched and displayed</li>
        </ol>
      </div>
    </div>
  )
}

export default Home