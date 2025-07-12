'use client';

import React from 'react';
import { CalendarAuthProvider, useCalendarAuth } from './CalendarAuthProvider';
import Home from './Home';
import Profile from './Profile';

const CalendarPageContent = () => {
  const { isAuthenticated } = useCalendarAuth();
  return isAuthenticated ? <Profile /> : <Home />;
};

const CalendarPage = () => (
  <CalendarAuthProvider>
    <CalendarPageContent />
  </CalendarAuthProvider>
);

export default CalendarPage; 