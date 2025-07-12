'use client';

import { useState } from 'react';
import { useRedirectFunctions } from '@propelauth/react';
import { Mail, Eye, EyeOff, User, Lock } from 'lucide-react';
import { createUser } from "../../service/userService";
import { useErrorHandler } from '../../hooks/useErrorHandler';
import { useGoogleAuth } from '../../hooks/useGoogleAuth';
import { SocialLoginProvider } from '@propelauth/frontend-apis'
import { useAuthFrontendApis } from '@propelauth/frontend-apis-react';

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
  const { loginWithSocialProvider } = useAuthFrontendApis()

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
            onClick={() => loginWithSocialProvider(SocialLoginProvider.GOOGLE)}
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-gray-300 border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 w-full mb-4"
          >
            <svg data-lov-id="src/pages/SignIn.tsx:185:14" data-lov-name="svg" data-component-path="src/pages/SignIn.tsx" data-component-line="185" data-component-file="SignIn.tsx" data-component-name="svg" data-component-content="%7B%22className%22%3A%22mr-2%20h-4%20w-4%22%7D" className="mr-2 h-4 w-4" viewBox="0 0 24 24"><path data-lov-id="src/pages/SignIn.tsx:186:16" data-lov-name="path" data-component-path="src/pages/SignIn.tsx" data-component-line="186" data-component-file="SignIn.tsx" data-component-name="path" data-component-content="%7B%7D" fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"></path><path data-lov-id="src/pages/SignIn.tsx:190:16" data-lov-name="path" data-component-path="src/pages/SignIn.tsx" data-component-line="190" data-component-file="SignIn.tsx" data-component-name="path" data-component-content="%7B%7D" fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"></path><path data-lov-id="src/pages/SignIn.tsx:194:16" data-lov-name="path" data-component-path="src/pages/SignIn.tsx" data-component-line="194" data-component-file="SignIn.tsx" data-component-name="path" data-component-content="%7B%7D" fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"></path><path data-lov-id="src/pages/SignIn.tsx:198:16" data-lov-name="path" data-component-path="src/pages/SignIn.tsx" data-component-line="198" data-component-file="SignIn.tsx" data-component-name="path" data-component-content="%7B%7D" fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"></path></svg>
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
                    className="flex h-10 w-full rounded-md border border-gray-300 border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm pl-10"
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
                    className="flex h-10 w-full rounded-md border border-gray-300 border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm pl-10"
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
                  className="flex h-10 w-full rounded-md border border-gray-300 border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm pl-10"
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
                  className="flex h-10 w-full rounded-md border border-gray-300 border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm pl-10"
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
                  className="flex h-10 w-full rounded-md border border-gray-300 border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm pl-10"
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
                  className="flex h-10 w-full rounded-md border border-gray-300 border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm pl-10"
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
              className="w-full py-2.5 rounded-lg bg-gray-900 text-white font-semibold text-base   hover:bg-gray-800 transition-all duration-200 flex items-center justify-center mb-2"
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