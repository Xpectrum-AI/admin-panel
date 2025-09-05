'use client';

import React, { useState } from 'react';
import { AgentsTab, OverviewTab, Navbar } from './components';
import { useTheme } from './contexts/ThemeContext';


export default function DeveloperDashboard() {
  const [activeNavItem, setActiveNavItem] = useState('Overview');
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <div className={`flex h-screen ${isDarkMode ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-black' : 'bg-gray-50'}`}>
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-6 py-4">
          <Navbar
            activeTab={activeNavItem === 'Agents' ? 'Agents' : 'Overview'}
            onChange={(tab) => setActiveNavItem(tab)}
            activeTitle={activeNavItem}
            sidebarOpen={true}
            onToggleSidebar={() => { }}
            onToggleDarkMode={toggleTheme}
            onLogout={async () => {
              // Logout handled by Navbar
            }}
          />
          <div className="mt-4 rounded-2xl">
            {activeNavItem === 'Overview' && <OverviewTab />}
            {activeNavItem === 'Agents' && <AgentsTab />}
          </div>
        </main>
      </div>
    </div>
  );
}
