'use client';

import { useState } from 'react';
import { useRedirectFunctions } from '@propelauth/react';
import { Mail, Eye, EyeOff, User, Lock } from 'lucide-react';
import { createUser } from "../services/userService";
import { useErrorHandler } from '../hooks/useErrorHandler';
import { useGoogleAuth } from '../hook/useGoogleAuth';

export default function SignUp() {
  const { redirectToLoginPage } = useRedirectFunctions();
  const { handleGoogleLogin, isInitialized } = useGoogleAuth();
  const [formData, setFormData] = useState({
    username: '',
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agree, setAgree] = useState(false);
  const { showError, showSuccess } = useErrorHandler();

  const handleGoogleSignUp = () => {
    if (isInitialized) {
      handleGoogleLogin();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.username.trim()) {
      showError('Username is required');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      showError('Passwords do not match');
      return;
    }
    if (!agree) {
      showError('You must agree to the Terms of Service and Privacy Policy');
      return;
    }
    setLoading(true);
    try {
      const response = await createUser({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
      });
      if (response.success) {
        setLoading(false);
        showSuccess('Signup successful! You will be redirected to login.');
        redirectToLoginPage({
          postLoginRedirectUrl: 'http://localhost:3000/dashboard'
        });
      } else {
        setLoading(false);
        showError(response.error || 'Failed to sign up. Please try again.');
      }
    } catch (error: unknown) {
      setLoading(false);
      showError(error instanceof Error ? error.message : 'Failed to sign up. Please try again.');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
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
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-1">Create an account</h2>
          <p className="text-gray-500 text-center mb-6 text-base">Sign up to get started with your dashboard</p>
          
          {/* Google Sign-Up Button */}
          <button
            type="button"
            onClick={handleGoogleSignUp}
            disabled={!isInitialized}
            className="w-full py-2.5 rounded-lg bg-blue-600 text-white font-semibold text-base shadow-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center mb-4"
          >
            <svg className="mr-2" width="20" height="20" viewBox="0 0 24 24">
              <g>
                <path fill="#4285F4" d="M21.805 10.023h-9.765v3.977h5.617c-.242 1.242-1.469 3.648-5.617 3.648-3.375 0-6.125-2.789-6.125-6.25s2.75-6.25 6.125-6.25c1.922 0 3.211.82 3.953 1.523l2.703-2.633c-1.703-1.57-3.906-2.539-6.656-2.539-5.523 0-10 4.477-10 10s4.477 10 10 10c5.75 0 9.547-4.031 9.547-9.719 0-.656-.07-1.156-.164-1.656z"/>
                <path fill="#34A853" d="M3.545 7.548l3.289 2.414c.891-1.781 2.578-2.914 4.466-2.914 1.094 0 2.125.391 2.922 1.031l2.703-2.633c-1.703-1.57-3.906-2.539-6.656-2.539-2.703 0-5.078 1.07-6.844 2.789z"/>
                <path fill="#FBBC05" d="M12 22c2.672 0 4.922-.883 6.563-2.406l-3.047-2.492c-.844.57-1.922.914-3.516.914-2.844 0-5.25-1.914-6.109-4.477l-3.289 2.547c1.75 3.477 5.406 5.914 9.398 5.914z"/>
                <path fill="#EA4335" d="M21.805 10.023h-9.765v3.977h5.617c-.242 1.242-1.469 3.648-5.617 3.648-3.375 0-6.125-2.789-6.125-6.25s2.75-6.25 6.125-6.25c1.922 0 3.211.82 3.953 1.523l2.703-2.633c-1.703-1.57-3.906-2.539-6.656-2.539-5.523 0-10 4.477-10 10s4.477 10 10 10c5.75 0 9.547-4.031 9.547-9.719 0-.656-.07-1.156-.164-1.656z" opacity=".1"/>
              </g>
            </svg>
            Continue with Google
          </button>

          {/* Divider */}
          <div className="w-full flex items-center my-4">
            <div className="flex-1 border-t border-gray-200"></div>
            <span className="px-4 text-sm text-gray-500">or</span>
            <div className="flex-1 border-t border-gray-200"></div>
          </div>

          {/* Signup Form */}
          <form className="w-full" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-semibold text-gray-700 mb-1">First Name</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                    <User className="h-4 w-4" />
                  </span>
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    required
                    className="block w-full rounded-lg border border-gray-200 pl-10 pr-4 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition text-base bg-gray-50"
                    placeholder="John"
                    value={formData.firstName}
                    onChange={handleChange}
                    autoComplete="given-name"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-semibold text-gray-700 mb-1">Last Name</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                    <User className="h-4 w-4" />
                  </span>
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    required
                    className="block w-full rounded-lg border border-gray-200 pl-10 pr-4 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition text-base bg-gray-50"
                    placeholder="Doe"
                    value={formData.lastName}
                    onChange={handleChange}
                    autoComplete="family-name"
                  />
                </div>
              </div>
            </div>
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
                  className="block w-full rounded-lg border border-gray-200 pl-10 pr-4 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition text-base bg-gray-50"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleChange}
                  autoComplete="email"
                />
              </div>
            </div>
            <div className="mb-4">
              <label htmlFor="username" className="block text-sm font-semibold text-gray-700 mb-1">Username</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                  <User className="h-4 w-4" />
                </span>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  className="block w-full rounded-lg border border-gray-200 pl-10 pr-4 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition text-base bg-gray-50"
                  placeholder="Enter your username"
                  value={formData.username}
                  onChange={handleChange}
                  autoComplete="username"
                />
              </div>
            </div>
            <div className="mb-4 relative">
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
                  className="block w-full rounded-lg border border-gray-200 pl-10 pr-12 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition text-base bg-gray-50"
                  placeholder="Create a password"
                  value={formData.password}
                  onChange={handleChange}
                  autoComplete="new-password"
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
            </div>
            <div className="mb-4 relative">
              <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 mb-1">Confirm Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                  <Lock className="h-4 w-4" />
                </span>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  className="block w-full rounded-lg border border-gray-200 pl-10 pr-12 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition text-base bg-gray-50"
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  className="absolute inset-y-0 right-0 flex items-center justify-center w-10 h-full text-gray-400 hover:text-gray-900 focus:outline-none transition group"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  style={{ top: 0, bottom: 0 }}
                >
                  <span className="flex items-center justify-center w-8 h-8 rounded-lg group-hover:bg-gray-100 transition">
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </span>
                </button>
              </div>
            </div>
            <div className="mb-4 flex items-center">
              <input
                id="agree"
                name="agree"
                type="checkbox"
                checked={agree}
                onChange={e => setAgree(e.target.checked)}
                className="rounded border-gray-300 focus:ring-2 focus:ring-gray-900 mr-2"
              />
              <label htmlFor="agree" className="text-sm text-gray-700 select-none">
                I agree to the <span className="font-semibold">Terms of Service</span> and <span className="font-semibold">Privacy Policy</span>
              </label>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-gray-900 text-white font-semibold text-base shadow-sm hover:bg-gray-800 transition-all duration-200 flex items-center justify-center mb-2"
            >
              {loading ? (
                <svg className="animate-spin h-5 w-5 text-white mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                </svg>
              ) : null}
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>
        </div>
        <div className="text-center text-gray-500 text-base mt-6">
          Already have an account?{' '}
          <button
            type="button"
            className="text-gray-900 font-semibold hover:underline bg-transparent border-none p-0 m-0 cursor-pointer"
            onClick={() => {
              redirectToLoginPage({
                postLoginRedirectUrl: 'http://localhost:3000/dashboard'
              });
            }}
          >
            Sign in
          </button>
        </div>
      </div>
    </div>
  );
}