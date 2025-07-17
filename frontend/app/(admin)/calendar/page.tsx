'use client';

import React, { useEffect, useState } from 'react';
import { useAuthInfo } from '@propelauth/react';
import { Lock } from "lucide-react";
import Profile from './Profile';
import { SyncLoader } from 'react-spinners';

const CalendarPage = () => {
  const { accessToken, loading, user } = useAuthInfo();
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    setToken(accessToken || null);
  }, [accessToken]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <SyncLoader size={15} color="#000000" />
      </div>
    );
  }

  if (!user || !token) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="bg-white rounded-xl shadow-md p-8 flex flex-col items-center">
          <Lock/>
          <h2 className="text-xl font-semibold mb-2">You need to log in via Google to access this service.</h2>
          <p className="text-gray-600 mb-4">Please sign in with your Google account to continue.</p>
        </div>
      </div>
    );
  }

  return <Profile token={token} />;
};

export default CalendarPage; 