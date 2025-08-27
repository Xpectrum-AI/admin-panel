"use client";

import { useState } from 'react';
import { Mail, Eye, EyeOff, Lock, X, User, Code } from 'lucide-react';
import { useAuthFrontendApis } from '@propelauth/frontend-apis-react';
import { useAuthInfo } from '@propelauth/react';
import React from 'react';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import Link from 'next/link';

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
  const { accessToken } = useAuthInfo();
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');
  const [errors, setErrors] = useState({
    email: '',
    password: '',
  });
  const { showError, showSuccess } = useErrorHandler();

  const handleGoogleLogin = () => {
    const redirectUrl = '/';
    window.location.href = `${process.env.NEXT_PUBLIC_PROPELAUTH_URL}/google/login?scope=openid+email+profile&external_param_access_type=offline&external_param_prompt=consent&redirect_uri=${encodeURIComponent(redirectUrl)}`;
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
          // Redirect to developer dashboard
          window.location.href = '/';
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
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name as keyof typeof errors]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetLoading(true);
    setResetError('');
    setResetSuccess('');

    try {
      await sendForgotPasswordEmail({ email: resetEmail });
      setResetSuccess('Password reset email sent! Please check your inbox.');
      setTimeout(() => {
        setShowResetModal(false);
        setResetEmail('');
      }, 2000);
    } catch (error) {
      setResetError('Failed to send reset email. Please try again.');
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <>
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="flex justify-center">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
              <Code className="h-8 w-8 text-white" />
            </div>
          </div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
            Sign in to Developer Dashboard
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{' '}
            <Link href="/signup" className="font-medium text-blue-600 hover:text-blue-500">
              create a new account
            </Link>
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                     <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
             {/* Google OAuth Button */}
            <div className="mb-6">
              <button
                onClick={handleGoogleLogin}
                className="w-full flex justify-center items-center px-4 py-3 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </button>
            </div>

            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email address
                </label>
                <div className="mt-1 relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                    <Mail className="h-4 w-4" />
                  </span>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className={`appearance-none block w-full px-3 py-2 pl-10 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                      errors.email ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                )}
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="mt-1 relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                    <Lock className="h-4 w-4" />
                  </span>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    className={`appearance-none block w-full px-3 py-2 pl-10 pr-10 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                      errors.password ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleChange}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="text-sm">
                  <button
                    type="button"
                    onClick={() => setShowResetModal(true)}
                    className="font-medium text-blue-600 hover:text-blue-500"
                  >
                    Forgot your password?
                  </button>
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Signing in...' : 'Sign in'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <ResetPasswordModal
        open={showResetModal}
        email={resetEmail}
        loading={resetLoading}
        error={resetError}
        success={resetSuccess}
        onEmailChange={(e) => setResetEmail(e.target.value)}
        onSubmit={handleResetPassword}
        onClose={() => setShowResetModal(false)}
      />
    </>
  );
}
