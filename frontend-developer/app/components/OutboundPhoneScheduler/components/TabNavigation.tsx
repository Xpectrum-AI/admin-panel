'use client';

import React from 'react';
import { OutboundTab } from '../types';
import { useTheme } from '../../../contexts/ThemeContext';

interface TabNavigationProps {
  activeTab: OutboundTab;
  onTabChange: (tab: OutboundTab) => void;
}

export default function TabNavigation({ activeTab, onTabChange }: TabNavigationProps) {
  const { isDarkMode } = useTheme();

  const tabs: { id: OutboundTab; label: string }[] = [
    { id: 'trunk', label: 'Trunk' },
    { id: 'scheduler', label: 'Scheduler' },
    { id: 'call', label: 'Call' },
  ];

  return (
    <div className="flex items-center gap-1 mb-4">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
            activeTab === tab.id
              ? isDarkMode
                ? 'bg-green-600 text-white'
                : 'bg-green-500 text-white'
              : isDarkMode
                ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

