"use client";

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthFrontendApis } from '@propelauth/frontend-apis-react'
import { useAuthInfo } from "@propelauth/react";

export default function Login() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { emailPasswordLogin, fetchLoginState } = useAuthFrontendApis();
  const { user } = useAuthInfo();
  const [loginSuccess, setLoginSuccess] = useState(false);

  // useEffect(() => {
  //   const checkLoginState = async () => {
  //     const response = await fetchLoginState();
  //     await response.handle({
  //       success: (data) => {
  //         if (user  && data.login_state == "LoginRequired"){
  //           router.push("/login")
  //         }else if (!user ){

  //         }
  //         else{
  //           router.push("/dashboard")
  //         }
  //       },
  //       unexpectedOrUnhandled() {
  //         console.log('An unexpected error occurred.');
  //       },
  //     });
  //   };
  //   checkLoginState();
  // }, [router]);

  useEffect(() => {
    if (loginSuccess) {
      router.push("/dashboard");
    }
  }, [loginSuccess]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      
      const response = await emailPasswordLogin({
        email: formData.email,
        password: formData.password
    })
    await response.handle({
        success(data) {
            setLoginSuccess(true);
        },
        passwordLoginDisabled(error) {
            console.error('Password login disabled', error)
        },
        userAccountDisabled(error) {
            console.error('User account disabled', error)
        },
        userAccountLocked(error) {
            console.error('User account locked', error)
        },
        invalidCredentials(error) {
            console.error('Invalid credentials', error)
        },
        badRequest(error) {
            for (const [field, fieldErrorMessage] of Object.entries(error.user_facing_errors)) {
                console.log('Error: "' + fieldErrorMessage + '" for field: "' + field + '"')
            }
        },
        unexpectedOrUnhandled(error) {
            console.error('Unexpected or unhandled', error.user_facing_error)
        },
    })
      
    } catch (error) {
      setLoading(false);
      setError('Failed to log in. Please check your credentials.');
    } finally {
      setLoading(false); // always stop loading
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#e0d7ff] via-[#f3e8ff] to-[#c7d2fe] py-8 px-2">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 sm:p-10 flex flex-col items-center animate-fade-in">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <div className="h-14 w-14 rounded-full bg-gradient-to-tr from-indigo-500 via-purple-500 to-blue-400 flex items-center justify-center shadow-lg">
            <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center">
              <div className="h-4 w-4 rounded-full bg-gradient-to-tr from-indigo-500 via-purple-500 to-blue-400" />
            </div>
          </div>
        </div>
        <h2 className="text-3xl font-extrabold text-gray-900 text-center mb-1">Welcome Back</h2>
        <p className="text-gray-500 text-center mb-6 text-lg font-medium">Sign in to your account to continue</p>
        <form className="w-full" onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="block w-full rounded-xl border border-gray-200 px-4 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all text-base bg-gray-50"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleChange}
              autoComplete="email"
            />
          </div>
          <div className="mb-2 relative">
            <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-1">Password</label>
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              required
              className="block w-full rounded-xl border border-gray-200 px-4 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all text-base bg-gray-50 pr-10"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
              autoComplete="current-password"
            />
            <button
              type="button"
              tabIndex={-1}
              className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-indigo-600 focus:outline-none"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4.477-10-10 0-1.657.403-3.22 1.125-4.575M15 12a3 3 0 11-6 0 3 3 0 016 0zm6.364-2.364A9.956 9.956 0 0022 9c0 5.523-4.477 10-10 10a9.956 9.956 0 01-4.636-1.364M9.88 9.88l4.24 4.24" /></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0zm2.21 2.21a9.956 9.956 0 002.364-2.364M6.343 6.343A9.956 9.956 0 002 9c0 5.523 4.477 10 10 10 1.657 0 3.22-.403 4.575-1.125M9.88 9.88l4.24 4.24" /></svg>
              )}
            </button>
          </div>
          <div className="flex justify-between items-center mb-6">
            <div></div>
            <Link href="#" className="text-indigo-500 font-medium text-sm hover:underline">Forgot password?</Link>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-blue-400 text-white font-semibold text-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center mb-4"
          >
            {loading ? (
              <svg className="animate-spin h-5 w-5 text-white mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
              </svg>
            ) : null}
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
          {error && (
            <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded relative animate-fade-in mb-2 text-center text-sm" role="alert">
              <span className="block sm:inline">{error}</span>
            </div>
          )}
        </form>
        {/* Divider */}
        <div className="flex items-center w-full my-6">
          <div className="flex-grow border-t border-gray-200"></div>
          <span className="mx-3 text-gray-400 bg-white px-2 text-base font-medium">Or continue with</span>
          <div className="flex-grow border-t border-gray-200"></div>
        </div>
        {/* Social Buttons */}
        <div className="flex gap-3 w-full mb-6">
          <button className="flex-1 flex items-center justify-center gap-2 border border-gray-200 rounded-xl py-2.5 bg-white hover:bg-gray-50 transition-all font-medium text-gray-700 text-base shadow-sm">
            <svg className="h-5 w-5" viewBox="0 0 48 48"><g><path fill="#4285F4" d="M24 9.5c3.54 0 6.7 1.22 9.19 3.22l6.85-6.85C35.64 2.36 30.18 0 24 0 14.82 0 6.71 5.82 2.69 14.09l7.98 6.19C12.13 13.16 17.56 9.5 24 9.5z"/><path fill="#34A853" d="M46.1 24.55c0-1.64-.15-3.22-.42-4.74H24v9.01h12.42c-.54 2.9-2.18 5.36-4.66 7.01l7.19 5.6C43.98 37.09 46.1 31.3 46.1 24.55z"/><path fill="#FBBC05" d="M10.67 28.28a14.5 14.5 0 010-8.56l-7.98-6.19A23.94 23.94 0 000 24c0 3.77.9 7.34 2.69 10.47l7.98-6.19z"/><path fill="#EA4335" d="M24 46c6.18 0 11.64-2.04 15.53-5.54l-7.19-5.6c-2.01 1.35-4.6 2.15-8.34 2.15-6.44 0-11.87-3.66-14.33-8.98l-7.98 6.19C6.71 42.18 14.82 48 24 48z"/><path fill="none" d="M0 0h48v48H0z"/></g></svg>
            Google
          </button>
          <button className="flex-1 flex items-center justify-center gap-2 border border-gray-200 rounded-xl py-2.5 bg-white hover:bg-gray-50 transition-all font-medium text-gray-700 text-base shadow-sm">
            <svg className="h-5 w-5" viewBox="0 0 24 24"><g><path d="M16.365 1.43c0 .47-.38.85-.85.85-.47 0-.85-.38-.85-.85 0-.47.38-.85.85-.85.47 0 .85.38.85.85zm2.52 1.7c-.11.16-.32.21-.48.1-.16-.11-.21-.32-.1-.48.11-.16.32-.21.48-.1.16.11.21.32.1.48zm2.13 2.13c-.16.11-.37.06-.48-.1-.11-.16-.06-.37.1-.48.16-.11.37-.06.48.1.11.16.06.37-.1.48zM12 5.84c-3.4 0-6.16 2.76-6.16 6.16 0 3.4 2.76 6.16 6.16 6.16 3.4 0 6.16-2.76 6.16-6.16 0-3.4-2.76-6.16-6.16-6.16zm0 11.32c-2.85 0-5.16-2.31-5.16-5.16 0-2.85 2.31-5.16 5.16-5.16 2.85 0 5.16 2.31 5.16 5.16 0 2.85-2.31 5.16-5.16 5.16zm8.5-5.16c0-.47.38-.85.85-.85.47 0 .85.38.85.85 0 .47-.38.85-.85.85-.47 0-.85-.38-.85-.85zm-1.7 2.52c.16-.11.37-.06.48.1.11.16.06.37-.1.48-.16.11-.37.06-.48-.1-.11-.16-.06-.37.1-.48zm-2.13 2.13c.11-.16.32-.21.48-.1.16.11.21.32.1.48-.11.16-.32.21-.48.1-.16-.11-.21-.32-.1-.48zm-2.52 1.7c0-.47.38-.85.85-.85.47 0 .85.38.85.85 0 .47-.38.85-.85.85-.47 0-.85-.38-.85-.85z"/></g></svg>
            Apple
          </button>
        </div>
        <div className="text-center text-gray-500 text-base mb-2">
          Don't have an account?{' '}
          <Link href="/signup" className="text-indigo-600 font-semibold hover:underline">Sign up</Link>
        </div>
        <div className="text-xs text-gray-400 text-center">
          By signing in, you agree to our{' '}
          <Link href="#" className="underline hover:text-indigo-500">Terms of Service</Link> and{' '}
          <Link href="#" className="underline hover:text-indigo-500">Privacy Policy</Link>
        </div>
      </div>
      <style jsx global>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: none; }
        }
        .animate-fade-in {
          animation: fade-in 0.7s cubic-bezier(0.4,0,0.2,1);
        }
      `}</style>
    </div>
  );
} 