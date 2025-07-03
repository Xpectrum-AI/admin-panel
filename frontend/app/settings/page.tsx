"use client";

import { useState } from 'react';
import { useRedirectFunctions } from '@propelauth/react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { ProtectedRoute } from '../auth/ProtectedRoute';

const tabs = [
  { label: 'Account', icon: '👤' },
  { label: 'Notifications', icon: '🔔' },
  { label: 'Appearance', icon: '🎨' },
  { label: 'Security', icon: '🛡️' },
];

// ToggleSwitch component
function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: (val: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none ${
        checked ? 'bg-gray-900' : 'bg-gray-200'
      }`}
    >
      <span
        className={`inline-block h-6 w-6 transform rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-5' : 'translate-x-1'
        }`}
      />
    </button>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(0);

  // Account State
  const [account, setAccount] = useState({
    username: 'johndoe',
    displayName: 'John Doe',
    email: 'john.doe@example.com',
    timezone: 'UTC-8 (Pacific Time)',
    language: 'English (US)',
  });

  // Notification State
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    marketing: false,
    weekly: true,
  });

  // Appearance State
  const [appearance, setAppearance] = useState({
    darkMode: false,
    compact: false,
    animations: true,
    fontSize: 'Medium',
  });

  // Security State
  const [security, setSecurity] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    twoFactor: false,
    loginAlerts: true,
  });

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
        <div className="max-w-4xl mx-auto">
          <button onClick={() => router.push('/dashboard')} className="flex items-center text-gray-600 hover:text-gray-900 mb-6">
            <ArrowLeft className="h-5 w-5 mr-2" />
            <span className="font-semibold">Settings</span>
          </button>
          <div className="mb-6">
            <div className="flex rounded-lg overflow-hidden border border-gray-200 bg-white">
              {tabs.map((tab, idx) => (
                <button
                  key={tab.label}
                  onClick={() => setActiveTab(idx)}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 font-semibold text-gray-700 transition-all ${activeTab === idx ? 'bg-gray-100' : ''}`}
                >
                  <span>{tab.icon}</span> {tab.label}
                </button>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            {activeTab === 0 && (
              <form className="space-y-6">
                <h2 className="text-2xl font-bold mb-6">Account Settings</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                    <input type="text" className="w-full px-4 py-2 rounded-lg border border-gray-300" value={account.username} onChange={e => setAccount(a => ({ ...a, username: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
                    <input type="text" className="w-full px-4 py-2 rounded-lg border border-gray-300" value={account.displayName} onChange={e => setAccount(a => ({ ...a, displayName: e.target.value }))} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                  <input type="email" className="w-full px-4 py-2 rounded-lg border border-gray-300" value={account.email} onChange={e => setAccount(a => ({ ...a, email: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
                  <input type="text" className="w-full px-4 py-2 rounded-lg border border-gray-300" value={account.timezone} onChange={e => setAccount(a => ({ ...a, timezone: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
                  <input type="text" className="w-full px-4 py-2 rounded-lg border border-gray-300" value={account.language} onChange={e => setAccount(a => ({ ...a, language: e.target.value }))} />
                </div>
                <div className="flex justify-end">
                  <button type="button" className="flex items-center gap-2 px-6 py-2 rounded-lg bg-gray-900 text-white font-semibold hover:bg-gray-800">
                    <span className="material-icons">Save Changes</span>
                  </button>
                </div>
              </form>
            )}
            {activeTab === 1 && (
              <form className="space-y-6">
                <h2 className="text-2xl font-bold mb-6">Notification Preferences</h2>
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold">Email Notifications</div>
                      <div className="text-sm text-gray-500">Receive notifications via email</div>
                    </div>
                    <ToggleSwitch checked={notifications.email} onChange={(val: boolean) => setNotifications(n => ({ ...n, email: val }))} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold">Push Notifications</div>
                      <div className="text-sm text-gray-500">Receive push notifications in your browser</div>
                    </div>
                    <ToggleSwitch checked={notifications.push} onChange={(val: boolean) => setNotifications(n => ({ ...n, push: val }))} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold">Marketing Emails</div>
                      <div className="text-sm text-gray-500">Receive emails about new features and updates</div>
                    </div>
                    <ToggleSwitch checked={notifications.marketing} onChange={(val: boolean) => setNotifications(n => ({ ...n, marketing: val }))} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold">Weekly Digest</div>
                      <div className="text-sm text-gray-500">Get a weekly summary of your activity</div>
                    </div>
                    <ToggleSwitch checked={notifications.weekly} onChange={(val: boolean) => setNotifications(n => ({ ...n, weekly: val }))} />
                  </div>
                </div>
                <div className="flex justify-end">
                  <button type="button" className="flex items-center gap-2 px-6 py-2 rounded-lg bg-gray-900 text-white font-semibold hover:bg-gray-800">
                    <span className="material-icons">save</span> Save Preferences
                  </button>
                </div>
              </form>
            )}
            {activeTab === 2 && (
              <form className="space-y-6">
                <h2 className="text-2xl font-bold mb-6">Appearance Settings</h2>
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold">Dark Mode</div>
                      <div className="text-sm text-gray-500">Switch between light and dark theme</div>
                    </div>
                    <ToggleSwitch checked={appearance.darkMode} onChange={(val: boolean) => setAppearance(a => ({ ...a, darkMode: val }))} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold">Compact View</div>
                      <div className="text-sm text-gray-500">Reduce spacing and padding for a denser layout</div>
                    </div>
                    <ToggleSwitch checked={appearance.compact} onChange={(val: boolean) => setAppearance(a => ({ ...a, compact: val }))} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold">Animations</div>
                      <div className="text-sm text-gray-500">Enable smooth transitions and animations</div>
                    </div>
                    <ToggleSwitch checked={appearance.animations} onChange={(val: boolean) => setAppearance(a => ({ ...a, animations: val }))} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Font Size</label>
                    <input type="text" className="w-full px-4 py-2 rounded-lg border border-gray-300" value={appearance.fontSize} onChange={e => setAppearance(a => ({ ...a, fontSize: e.target.value }))} />
                  </div>
                </div>
                <div className="flex justify-end">
                  <button type="button" className="flex items-center gap-2 px-6 py-2 rounded-lg bg-gray-900 text-white font-semibold hover:bg-gray-800">
                    <span className="material-icons">save</span> Save Appearance
                  </button>
                </div>
              </form>
            )}
            {activeTab === 3 && (
              <form className="space-y-6">
                <h2 className="text-2xl font-bold mb-6">Security Settings</h2>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                  <input type="password" className="w-full px-4 py-2 rounded-lg border border-gray-300" value={security.currentPassword} onChange={e => setSecurity(s => ({ ...s, currentPassword: e.target.value }))} />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                  <input type="password" className="w-full px-4 py-2 rounded-lg border border-gray-300" value={security.newPassword} onChange={e => setSecurity(s => ({ ...s, newPassword: e.target.value }))} />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                  <input type="password" className="w-full px-4 py-2 rounded-lg border border-gray-300" value={security.confirmPassword} onChange={e => setSecurity(s => ({ ...s, confirmPassword: e.target.value }))} />
                </div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="font-semibold">Two-Factor Authentication</div>
                    <div className="text-sm text-gray-500">Add an extra layer of security to your account</div>
                  </div>
                  <ToggleSwitch checked={security.twoFactor} onChange={(val: boolean) => setSecurity(s => ({ ...s, twoFactor: val }))} />
                </div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="font-semibold">Login Alerts</div>
                    <div className="text-sm text-gray-500">Get notified when someone logs into your account</div>
                  </div>
                  <ToggleSwitch checked={security.loginAlerts} onChange={(val: boolean) => setSecurity(s => ({ ...s, loginAlerts: val }))} />
                </div>
                <div className="mb-4">
                  <div className="font-semibold mb-2">Active Sessions</div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between bg-gray-100 rounded-lg px-4 py-2">
                      <div>
                        <div>Current Session</div>
                        <div className="text-xs text-gray-500">Chrome on Windows • Active now</div>
                      </div>
                      <span className="text-xs font-semibold text-gray-500">Current</span>
                    </div>
                    <div className="flex items-center justify-between bg-gray-100 rounded-lg px-4 py-2">
                      <div>
                        <div>Mobile App</div>
                        <div className="text-xs text-gray-500">iPhone • Last active 2 hours ago</div>
                      </div>
                      <button className="text-xs font-semibold text-red-500 hover:underline">Revoke</button>
                    </div>
                  </div>
                </div>
                <div className="flex justify-between">
                  <button type="button" className="px-6 py-2 rounded-lg border border-gray-300 text-gray-700 font-semibold hover:bg-gray-100">
                    Reset All Sessions
                  </button>
                  <button type="button" className="flex items-center gap-2 px-6 py-2 rounded-lg bg-gray-900 text-white font-semibold hover:bg-gray-800">
                    <span className="material-icons">save</span> Update Security
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
} 