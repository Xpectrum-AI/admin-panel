'use client';

import React, { useState } from 'react';

interface User {
  displayName: string;
  email: string;
  googleGivenName: string;
  googleFamilyName: string;
  verified: boolean;
  id: string;
  calendarAccess: boolean;
  profilePic: string;
}

const CalendarServicePage = () => {
  // Step state: 1 = name form, 2 = Google OAuth, 3 = profile, 4 = details
  const [step, setStep] = useState(1);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  // User state with correct type
  const [user, setUser] = useState<User | null>(null);
  // Placeholder for timezone
  const [timezone, setTimezone] = useState('Auto-detected (Asia/Calcutta)');

  // Placeholder handlers (to be replaced with real logic)
  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(2);
  };
  const handleGoogleSignIn = () => {
    // TODO: Integrate Google OAuth
    setUser({
      displayName: `${firstName} ${lastName} (Custom)`,
      email: 'user@email.com',
      googleGivenName: `${firstName[0]} ${lastName[0]}`,
      googleFamilyName: lastName,
      verified: true,
      id: '1234567890',
      calendarAccess: false,
      profilePic: '',
    });
    setStep(3);
  };
  const handleBuyCalendar = () => setStep(4);
  const handleSignOut = () => {
    setUser(null);
    setStep(1);
  };

  // UI for each step
  if (step === 1) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-indigo-400">
        <div className="bg-white rounded-2xl shadow-xl p-10 w-full max-w-lg flex flex-col items-center">
          <div className="text-5xl mb-4">🔒</div>
          <form className="w-full" onSubmit={handleNameSubmit}>
            <label className="block mb-2 font-semibold">First Name <span className="text-red-500">*</span></label>
            <input className="w-full mb-4 px-4 py-2 rounded bg-gray-800 text-white" value={firstName} onChange={e => setFirstName(e.target.value)} required />
            <label className="block mb-2 font-semibold">Last Name <span className="text-red-500">*</span></label>
            <input className="w-full mb-6 px-4 py-2 rounded bg-gray-800 text-white" value={lastName} onChange={e => setLastName(e.target.value)} required />
            <button type="submit" className="w-full py-3 bg-blue-500 text-white rounded-lg font-bold text-lg">Continue</button>
          </form>
          <ul className="mt-8 space-y-2 text-green-700 text-left w-full">
            <li>✔️ Secure OAuth 2.0 flow</li>
            <li>✔️ Access user profile</li>
            <li>✔️ Session management</li>
          </ul>
        </div>
      </div>
    );
  }
  if (step === 2) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-indigo-400">
        <div className="bg-white rounded-2xl shadow-xl p-10 w-full max-w-lg flex flex-col items-center">
          <div className="text-5xl mb-4">🔒</div>
          <div className="mb-6 text-lg font-semibold">Sign in with Google to continue</div>
          <button onClick={handleGoogleSignIn} className="w-full py-3 bg-blue-500 text-white rounded-lg font-bold text-lg flex items-center justify-center gap-2">
            <span className="bg-white rounded-full p-1"><svg width="24" height="24" viewBox="0 0 24 24"><g><path fill="#4285F4" d="M21.805 10.023h-9.765v3.977h5.617c-.242 1.242-1.469 3.648-5.617 3.648-3.375 0-6.125-2.789-6.125-6.25s2.75-6.25 6.125-6.25c1.922 0 3.211.82 3.953 1.523l2.703-2.633c-1.703-1.57-3.906-2.539-6.656-2.539-5.523 0-10 4.477-10 10s4.477 10 10 10c5.75 0 9.547-4.031 9.547-9.719 0-.656-.07-1.156-.164-1.656z"/><path fill="#34A853" d="M3.545 7.548l3.289 2.414c.891-1.781 2.578-2.914 4.466-2.914 1.094 0 2.125.391 2.922 1.031l2.703-2.633c-1.703-1.57-3.906-2.539-6.656-2.539-2.703 0-5.078 1.07-6.844 2.789z"/><path fill="#FBBC05" d="M12 22c2.672 0 4.922-.883 6.563-2.406l-3.047-2.492c-.844.57-1.922.914-3.516.914-2.844 0-5.25-1.914-6.109-4.477l-3.289 2.547c1.75 3.477 5.406 5.914 9.398 5.914z"/><path fill="#EA4335" d="M21.805 10.023h-9.765v3.977h5.617c-.242 1.242-1.469 3.648-5.617 3.648-3.375 0-6.125-2.789-6.125-6.25s2.75-6.25 6.125-6.25c1.922 0 3.211.82 3.953 1.523l2.703-2.633c-1.703-1.57-3.906-2.539-6.656-2.539-5.523 0-10 4.477-10 10s4.477 10 10 10c5.75 0 9.547-4.031 9.547-9.719 0-.656-.07-1.156-.164-1.656z" opacity=".1"/></g></svg></span>
            Sign in with Google
          </button>
        </div>
      </div>
    );
  }
  if (step === 3 && user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-indigo-400">
        <div className="bg-white rounded-2xl shadow-xl p-10 w-full max-w-lg flex flex-col items-center">
          <div className="text-5xl mb-4">👋</div>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center text-3xl">
              {/* Profile pic placeholder */}
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-800">{user.displayName}</div>
              <div className="text-gray-500">{user.email}</div>
            </div>
          </div>
          <div className="w-full mb-4">
            <label className="block font-semibold mb-2">Select Your Timezone:</label>
            <select className="w-full px-4 py-2 rounded border" value={timezone} onChange={e => setTimezone(e.target.value)}>
              <option>Auto-detected (Asia/Calcutta)</option>
              <option>America/New_York</option>
              <option>Europe/London</option>
              <option>Asia/Tokyo</option>
            </select>
            <div className="text-xs text-gray-500 mt-1">Current: Auto-detected</div>
          </div>
          <div className="w-full mb-4">
            <div className="bg-green-100 text-green-800 px-4 py-2 rounded-lg text-center font-semibold">Successfully authenticated with Google OAuth 2.0!</div>
          </div>
          <div className="flex gap-4 w-full">
            <button onClick={handleSignOut} className="flex-1 py-3 bg-gray-700 text-white rounded-lg font-bold">Sign Out</button>
            <button onClick={handleBuyCalendar} className="flex-1 py-3 bg-red-400 text-white rounded-lg font-bold">Buy Calendar Service</button>
          </div>
        </div>
      </div>
    );
  }
  if (step === 4 && user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-indigo-400">
        <div className="bg-white rounded-2xl shadow-xl p-10 w-full max-w-xl flex flex-col items-center">
          <div className="w-full">
            <table className="w-full text-left mb-6">
              <tbody>
                <tr><td className="font-bold">ID:</td><td>{user.id}</td></tr>
                <tr><td className="font-bold">Display Name:</td><td>{user.displayName}</td></tr>
                <tr><td className="font-bold">First Name:</td><td>{firstName}</td></tr>
                <tr><td className="font-bold">Last Name:</td><td>{lastName}</td></tr>
                <tr><td className="font-bold">Email:</td><td>{user.email}</td></tr>
                <tr><td className="font-bold">Google Given Name:</td><td>{user.googleGivenName}</td></tr>
                <tr><td className="font-bold">Google Family Name:</td><td>{user.googleFamilyName}</td></tr>
                <tr><td className="font-bold">Verified Email:</td><td><span className="text-green-600">✔ Yes</span></td></tr>
                <tr><td className="font-bold">Selected Timezone:</td><td>{timezone}</td></tr>
                <tr><td className="font-bold">Calendar Access:</td><td><span className="text-red-600">✗ No</span></td></tr>
              </tbody>
            </table>
            <button onClick={() => setStep(3)} className="py-2 px-6 bg-blue-500 text-white rounded-lg font-bold">Back</button>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export default CalendarServicePage; 