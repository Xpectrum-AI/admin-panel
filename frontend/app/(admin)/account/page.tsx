"use client";

import { useEffect, useState } from 'react';
import { ArrowLeft, Mail, Eye, EyeOff, Phone, MapPin, User2, Save } from 'lucide-react';
import { useAuthInfo } from '@propelauth/react';
import { ProtectedRoute } from '../auth/ProtectedRoute';
import { useAuthFrontendApis } from '@propelauth/frontend-apis-react';
import { useErrorHandler } from '../../../hooks/useErrorHandler';
import { useRouter } from 'next/navigation';

export default function AccountSettings() {
  const { user } = useAuthInfo();
  const { showError, showSuccess } = useErrorHandler();
  const router = useRouter();

  // Mock data for phone and location
  const phone = '+1 (555) 123-4567';
  const location = 'San Francisco, CA';
  const role = 'Account Member';

  const [formData, setFormData] = useState({
    firstName: user?.firstName || 'John',
    lastName: user?.lastName || 'Doe',
    email: user?.email || 'john.doe@example.com',
    phone: phone,
    location: location,
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const { updateUserMetadata, updatePassword } = useAuthFrontendApis();
  const [editing, setEditing] = useState(false);
  const [passwordEditing, setPasswordEditing] = useState(false);
  const [savedData, setSavedData] = useState({
    firstName: user?.firstName || 'John',
    lastName: user?.lastName || 'Doe',
    email: user?.email || 'john.doe@example.com',
    phone: phone,
    location: location,
  });

  useEffect(() => {
    if (user) {
      const newData = {
        firstName: user.firstName || 'John',
        lastName: user.lastName || 'Doe',
        email: user.email || 'john.doe@example.com',
        phone: phone,
        location: location,
      };
      setFormData(newData);
      setSavedData(newData);
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleEdit = () => {
    setFormData(savedData);
    setEditing(true);
  };

  const handleCancel = () => {
    setFormData(savedData);
    setEditing(false);
  };

  const handlePasswordEdit = () => {
    setPasswordEditing(true);
  };

  const handlePasswordCancel = () => {
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setShowCurrent(false);
    setShowNew(false);
    setShowConfirm(false);
    setPasswordEditing(false);
  };

  const hasChanges = () => {
    return (
      formData.firstName !== savedData.firstName ||
      formData.lastName !== savedData.lastName ||
      formData.phone !== savedData.phone ||
      formData.location !== savedData.location
    );
  };

  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasChanges()) {
      showError('No changes detected. Please make changes before saving.');
      return;
    }
    try {
      const response = await updateUserMetadata({
        first_name: formData.firstName,
        last_name: formData.lastName,
      });
      await response.handle({
        success: () => {
          showSuccess('Account information updated successfully!');
          setSavedData(formData);
          setEditing(false);
        },
        badRequest: () => {
          showError('Error updating account information.');
        },
        unexpectedOrUnhandled: () => {
          showError('An unexpected error occurred. Please try again.');
        },
      });
    } catch {
      showError('Failed to update account information. Please try again.');
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showError('New password and confirm password do not match');
      return;
    }
    if (passwordData.newPassword.length < 8) {
      showError('New password must be at least 8 characters long');
      return;
    }
    if (passwordData.newPassword === passwordData.currentPassword) {
      showError('New password cannot be the same as the current password');
      return;
    }
    try {
      const response = await updatePassword({
        current_password: passwordData.currentPassword,
        password: passwordData.newPassword,
      });
      await response.handle({
        success: () => {
          showSuccess('Password updated successfully!');
          setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
          setShowCurrent(false);
          setShowNew(false);
          setShowConfirm(false);
          setPasswordEditing(false);
        },
        badRequest: () => {
          showError('Error updating password.');
        },
        unexpectedOrUnhandled: () => {
          showError('An unexpected error occurred. Please try again.');
        },
      });
    } catch {
      showError('Failed to update password. Please try again.');
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#f8fafc]">
        {/* Header */}
        <div className="flex items-center px-8 py-6 border-b border-gray-200 mb-10">
          <button
            onClick={() => router.push("/dashboard")}
            className="group mr-3"
            aria-label="Back"
          >
            <span className="inline-flex items-center justify-center rounded-lg transition bg-transparent group-hover:bg-gray-100 h-9 w-9">
              <ArrowLeft className="h-5 w-5 text-gray-600 group-hover:text-gray-900" />
            </span>
          </button>
          <h1 className="text-2xl md:text-2xl font-bold text-gray-900">Account Settings</h1>
        </div>
        {/* Main Content */}
        <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Profile Card */}
          <div className="col-span-1 bg-white rounded-2xl   border border-gray-200 p-8 flex flex-col items-center mb-6">
            <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <div className="w-24 h-24 rounded-full bg-gray-900 flex items-center justify-center">
                <span className="text-white text-4xl font-bold">
                  {savedData.firstName?.[0]}{savedData.lastName?.[0]}
                </span>
              </div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-gray-900">{savedData.firstName} {savedData.lastName}</div>
              <div className="text-gray-500 text-sm mb-2">{savedData.email}</div>
            </div>
            <div className="w-full space-y-2 text-gray-700 text-sm">
            <div className="flex items-center gap-2"><User2 className="h-4 w-4" />{role}</div>
              <div className="flex items-center gap-2"><Mail className="h-4 w-4" />{savedData.email}</div>
              <div className="flex items-center gap-2"><Phone className="h-4 w-4" />{savedData.phone}</div>
              <div className="flex items-center gap-2"><MapPin className="h-4 w-4" />{savedData.location}</div>
            </div>
          </div>
          {/* Account Info and Password Cards */}
          <div className="col-span-2 flex flex-col gap-8">
            {/* Account Info Card */}
            <div className="bg-white rounded-2xl   border border-gray-200 p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">Account Information</h2>
                {!editing && (
                  <button
                    type="button"
                    onClick={handleEdit}
                    className="px-4 py-2 rounded-lg bg-gray-900 text-white font-semibold hover:bg-gray-800"
                  >
                    Edit
                  </button>
                )}
              </div>
              <form onSubmit={handleSaveChanges} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900"
                      readOnly={!editing}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900"
                      readOnly={!editing}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900"
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900"
                    readOnly={!editing}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900"
                    readOnly={!editing}
                  />
                </div>
                {editing && (
                  <div className="flex justify-end mt-4 gap-2">
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="flex items-center gap-2 px-6 py-2 rounded-lg border border-gray-300 text-gray-700 font-semibold hover:bg-gray-100 shadow"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex items-center gap-2 px-6 py-2 rounded-lg bg-gray-900 text-white font-semibold hover:bg-gray-800 shadow"
                    >
                      <Save className="h-5 w-5" />
                      Save
                    </button>
                  </div>
                )}
              </form>
            </div>
            {/* Change Password Card */}
            <div className="bg-white rounded-2xl   border border-gray-200 p-8 mb-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">Change Password</h2>
                {!passwordEditing && (
                  <button
                    type="button"
                    onClick={handlePasswordEdit}
                    className="px-4 py-2 rounded-lg bg-gray-900 text-white font-semibold hover:bg-gray-800"
                  >
                    Change Password
                  </button>
                )}
              </div>
              {passwordEditing && (
                <form onSubmit={handlePasswordSubmit} className="space-y-4 mt-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                    <div className="relative">
                      <input
                        type={showCurrent ? 'text' : 'password'}
                        name="currentPassword"
                        value={passwordData.currentPassword}
                        onChange={handlePasswordChange}
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900 pr-12"
                      />
                      <button
                        type="button"
                        tabIndex={-1}
                        className="absolute inset-y-0 right-0 flex items-center justify-center w-10 h-full text-gray-400 hover:text-gray-900 focus:outline-none transition group"
                        onClick={() => setShowCurrent((v) => !v)}
                        aria-label={showCurrent ? 'Hide password' : 'Show password'}
                        style={{ top: 0, bottom: 0 }}
                      >
                        <span className="flex items-center justify-center w-8 h-8 rounded-lg group-hover:bg-gray-100 transition">
                          {showCurrent ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </span>
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                    <div className="relative">
                      <input
                        type={showNew ? 'text' : 'password'}
                        name="newPassword"
                        value={passwordData.newPassword}
                        onChange={handlePasswordChange}
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900 pr-12"
                      />
                      <button
                        type="button"
                        tabIndex={-1}
                        className="absolute inset-y-0 right-0 flex items-center justify-center w-10 h-full text-gray-400 hover:text-gray-900 focus:outline-none transition group"
                        onClick={() => setShowNew((v) => !v)}
                        aria-label={showNew ? 'Hide password' : 'Show password'}
                        style={{ top: 0, bottom: 0 }}
                      >
                        <span className="flex items-center justify-center w-8 h-8 rounded-lg group-hover:bg-gray-100 transition">
                          {showNew ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </span>
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                    <div className="relative">
                      <input
                        type={showConfirm ? 'text' : 'password'}
                        name="confirmPassword"
                        value={passwordData.confirmPassword}
                        onChange={handlePasswordChange}
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900 pr-12"
                      />
                      <button
                        type="button"
                        tabIndex={-1}
                        className="absolute inset-y-0 right-0 flex items-center justify-center w-10 h-full text-gray-400 hover:text-gray-900 focus:outline-none transition group"
                        onClick={() => setShowConfirm((v) => !v)}
                        aria-label={showConfirm ? 'Hide password' : 'Show password'}
                        style={{ top: 0, bottom: 0 }}
                      >
                        <span className="flex items-center justify-center w-8 h-8 rounded-lg group-hover:bg-gray-100 transition">
                          {showConfirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </span>
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-end mt-4 gap-2">
                    <button
                      type="button"
                      onClick={handlePasswordCancel}
                      className="flex items-center gap-2 px-6 py-2 rounded-lg border border-gray-300 text-gray-700 font-semibold hover:bg-gray-100 shadow"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex items-center gap-2 px-6 py-2 rounded-lg bg-gray-900 text-white font-semibold hover:bg-gray-800 shadow"
                    >
                      <Save className="h-5 w-5" />
                      Save
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
} 