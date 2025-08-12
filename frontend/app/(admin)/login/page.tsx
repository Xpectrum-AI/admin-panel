"use client";

import { useState } from 'react';
import { Mail, Eye, EyeOff, Lock, X } from 'lucide-react';
import { useAuthFrontendApis } from '@propelauth/frontend-apis-react';
import React from 'react';
import { useErrorHandler } from '@/hooks/useErrorHandler';


interface ResetPasswordModalProps {
  open: boolean;
  email: string;
  loading: boolean;
  error: string;
  success: string;
  onEmailChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

function ResetPasswordModal({ open, email, loading, error, success, onEmailChange, onSubmit, onClose }: ResetPasswordModalProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/80 transition-opacity duration-300"
        onClick={onClose}
      />
      {/* Modal Card */}
      <div
        className="relative bg-white rounded-2xl shadow-xl w-full max-w-md mx-auto p-8 z-10 transition-all duration-300 transform scale-95 opacity-0 animate-modal-in"
        onClick={e => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-900 focus:outline-none"
          onClick={onClose}
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>
        <h2 className="text-xl font-bold text-gray-900 mb-1">Reset your password</h2>
        <p className="text-gray-500 mb-6 text-sm">Enter your email address and we&apos;ll send you a link to reset your password.</p>
        <form onSubmit={onSubmit}>
          <label htmlFor="reset-email" className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
          <div className="relative mb-6">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
              <Mail className="h-4 w-4" />
            </span>
            <input
              id="reset-email"
              name="reset-email"
              type="email"
              required
              className="flex h-10 w-full rounded-md border border-gray-300 border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm pl-10"
              placeholder="Enter your email"
              value={email}
              onChange={onEmailChange}
              autoComplete="email"
            />
          </div>
          {error && (
            <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-2 rounded mb-2 text-sm text-center">{error}</div>
          )}
          {success && (
            <div className="bg-green-50 border border-green-400 text-green-700 px-4 py-2 rounded mb-2 text-sm text-center">{success}</div>
          )}
          <div className="flex justify-end gap-2 mt-2">
            <button
              type="button"
              className="px-5 py-2 rounded-lg border border-gray-300 text-gray-700 font-semibold hover:bg-gray-100"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-lg bg-gray-900 text-white font-semibold hover:bg-gray-800 shadow disabled:opacity-60"
            >
              {loading ? 'Sending...' : 'Send reset link'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { emailPasswordLogin, sendForgotPasswordEmail, resendEmailConfirmation, loginWithSocialProvider } = useAuthFrontendApis();
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [errors, setErrors] = useState({
    email: '',
    password: '',
  });
  const { showError, showSuccess } = useErrorHandler();
  

  // useEffect(() => {
  //   if (user) {
  //     window.location.href = "/dashboard";
  //   }
  // }, [user]);

  // Get the current URL for redirect
  

  // const handleGoogleLogin = async (): Promise<void> => {
  //   try {
  //     const result = await calendarServiceAPI.login();
  //     window.location.href = result.auth_url;
  //     showSuccess('Redirecting to OAuth login');
  //   } catch (error) {
  //     showError('Failed to initiate OAuth login');
  //   }
  // };

  const handleGoogleLogin = () => {
    window.location.href = `${process.env.PROPELAUTH_URL}/google/login?scope=openid+email+profile&external_param_access_type=offline&external_param_prompt=consent`
    showSuccess('Redirecting to OAuth login');
  }

  const validateForm = () => {
    const newErrors = {
      email: '',
      password: '',
    };

    // Email validation
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.values(newErrors).every(error => error === '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      showError('Please fix the errors below');
      return;
    }
    
    setLoading(true);
    try {
      const response = await emailPasswordLogin({
        email: formData.email,
        password: formData.password
      });
      await response.handle({
        async success(data) {
          if (data && data.login_state === 'ConfirmEmailRequired') {
            try {
              await resendEmailConfirmation();
              showError('Email confirmation required. We have sent the confirmation email to your inbox.');
            } catch {
              showError('Email confirmation required, but failed to send confirmation email.');
            }
            setLoading(false);
            return;
          }
          showSuccess('Login successful! You will be redirected to dashboard.');
          window.location.href = "/dashboard";
        },
        passwordLoginDisabled() {
          showError('Password login is disabled.');
        },
        userAccountDisabled() {
          showError('User account is disabled.');
        },
        userAccountLocked() {
          showError('User account is locked.');
        },
        invalidCredentials() {
          showError('Invalid email or password.');
        },
        badRequest() {
          showError('Bad request. Please check your input.');
        },
        unexpectedOrUnhandled() {
          showError('An unexpected error occurred. Please try again.');
        },
      });
    } catch {
      showError('Failed to log in. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    
    // Clear error for this field when user starts typing
    if (errors[name as keyof typeof errors]) {
      setErrors({
        ...errors,
        [name]: '',
      });
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate reset email
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!resetEmail.trim()) {
      showError('Email is required');
      return;
    } else if (!emailRegex.test(resetEmail)) {
      showError('Please enter a valid email address');
      return;
    }
    
    setResetLoading(true);
    try {
      const response = await sendForgotPasswordEmail({ email: resetEmail });
      await response.handle({
        success() {
          showSuccess('Reset link sent! Check your email.');
        },
        badRequest() {
          showError('Invalid email address.');
        },
        unexpectedOrUnhandled() {
          showError('An error occurred. Please try again.');
        },
      });
    } catch {
      showError('Failed to send reset link.');
    } finally {
      setResetLoading(false);
    }
  };

  const closeResetModal = () => {
    setShowResetModal(false);
    setResetEmail('');
    setResetLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] px-2">
      <div className="flex flex-col items-center w-full">
        {/* Logo and Title */}
        <div className="flex flex-col items-center mb-8 mt-8">
          <div className="h-12 w-12 rounded-lg bg-gray-900 flex items-center justify-center mb-3">
            <span className="text-white text-2xl font-bold">D</span>
          </div>
          <div className="flex items-center">
            <span className="text-2xl font-bold text-gray-900 ml-2">Dashboard</span>
          </div>
        </div>
        {/* Card */}
        <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 flex flex-col items-center">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-1">Welcome back</h2>
          <p className="text-gray-500 text-center mb-6 text-base">Sign in to your account to continue</p>
          {/* Google Sign-In Button */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-gray-300 border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 w-full mb-4"
          >
            <svg data-lov-id="src/pages/SignIn.tsx:185:14" data-lov-name="svg" data-component-path="src/pages/SignIn.tsx" data-component-line="185" data-component-file="SignIn.tsx" data-component-name="svg" data-component-content="%7B%22className%22%3A%22mr-2%20h-4%20w-4%22%7D" className="mr-2 h-4 w-4" viewBox="0 0 24 24"><path data-lov-id="src/pages/SignIn.tsx:186:16" data-lov-name="path" data-component-path="src/pages/SignIn.tsx" data-component-line="186" data-component-file="SignIn.tsx" data-component-name="path" data-component-content="%7B%7D" fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"></path><path data-lov-id="src/pages/SignIn.tsx:190:16" data-lov-name="path" data-component-path="src/pages/SignIn.tsx" data-component-line="190" data-component-file="SignIn.tsx" data-component-name="path" data-component-content="%7B%7D" fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"></path><path data-lov-id="src/pages/SignIn.tsx:194:16" data-lov-name="path" data-component-path="src/pages/SignIn.tsx" data-component-line="194" data-component-file="SignIn.tsx" data-component-name="path" data-component-content="%7B%7D" fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"></path><path data-lov-id="src/pages/SignIn.tsx:198:16" data-lov-name="path" data-component-path="src/pages/SignIn.tsx" data-component-line="198" data-component-file="SignIn.tsx" data-component-name="path" data-component-content="%7B%7D" fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"></path></svg>
            Continue with Google
          </button>

          <div className="w-full flex items-center my-4">
            <div className="flex-1 border-t border-gray-200"></div>
            <span className="px-4 text-sm text-gray-500">or</span>
            <div className="flex-1 border-t border-gray-200"></div>
          </div>



          {/* Email/Password Form */}
          <form className="w-full" onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                  <Mail className="h-4 w-4" />
                </span>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className={`flex h-10 w-full rounded-md border bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm pl-10 ${errors.email ? 'border-red-500 focus-visible:ring-red-500' : 'border-gray-300 border-input'}`}
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleChange}
                  autoComplete="email"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>
            <div className="mb-2 relative">
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-1">Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                  <Lock className="h-4 w-4" />
                </span>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  className={`flex h-10 w-full rounded-md border bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm pl-10 ${errors.password ? 'border-red-500 focus-visible:ring-red-500' : 'border-gray-300 border-input'}`}
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  className="absolute inset-y-0 right-0 flex items-center justify-center w-10 h-full text-gray-400 hover:text-gray-900 focus:outline-none transition group"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  style={{ top: 0, bottom: 0 }}
                >
                  <span className="flex items-center justify-center w-8 h-8 rounded-lg group-hover:bg-gray-100 transition">
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </span>
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
              )}
            </div>
            <div className="flex justify-between items-center mb-6">
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" className="rounded border-gray-300 focus:ring-2 focus:ring-gray-900" />
                Remember me
              </label>
              <button
                type="button"
                className="text-gray-500 font-medium text-sm hover:underline focus:outline-none"
                onClick={() => setShowResetModal(true)}
              >
                Forgot password?
              </button>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-gray-900 text-white font-semibold text-base   hover:bg-gray-800 transition-all duration-200 flex items-center justify-center mb-2"
            >
              {loading ? (
                <svg className="animate-spin h-5 w-5 text-white mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                </svg>
              ) : null}
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>
        <div className="text-center text-gray-500 text-base mt-6">
          Don&apos;t have an account?{' '}
          <button
            type="button"
            className="text-gray-900 font-semibold hover:underline bg-transparent border-none p-0 m-0 cursor-pointer"
            onClick={() => {
              window.location.href = "/signup";
            }}
          >
            Sign up
          </button>
        </div>
      </div>
      <ResetPasswordModal
        open={showResetModal}
        email={resetEmail}
        loading={resetLoading}
        error={''}
        success={''}
        onEmailChange={e => setResetEmail(e.target.value)}
        onSubmit={handleResetSubmit}
        onClose={closeResetModal}
      />
      <style jsx global>{`
        @keyframes modal-in {
          0% { opacity: 0; transform: scale(0.95); }
          100% { opacity: 1; transform: scale(1); }
        }
        .animate-modal-in {
          animation: modal-in 0.3s cubic-bezier(0.4,0,0.2,1) forwards;
        }
      `}</style>
    </div>
  );
}