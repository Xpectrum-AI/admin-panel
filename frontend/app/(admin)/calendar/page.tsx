'use client';

import React from 'react';
import { OAuthAuthProvider, useDashboardAuth } from '../dashboard/DashboardAuthProvider';
import Home from './Home';
import Profile from './Profile';

const CalendarPageContent = () => {
  const { isAuthenticated } = useDashboardAuth();
  return isAuthenticated ? <Profile /> : <Home />;
};

const CalendarPage = () => (
  <OAuthAuthProvider>
    <CalendarPageContent />
  </OAuthAuthProvider>
);

export default CalendarPage; 