'use client';

import React, { useState } from 'react';
import { Phone, PhoneCall } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import InboundPhoneNumbers from './InboundPhoneNumbers';
import OutboundScheduler from './OutboundScheduler';

interface PhoneNumbersTabProps {
  // No props needed for this component
}

export default function PhoneNumbersTab({}: PhoneNumbersTabProps) {
  // Use theme with fallback to prevent errors
  let isDarkMode = false;
  try {
    const theme = useTheme();
    isDarkMode = theme?.isDarkMode || false;
  } catch {
    isDarkMode = false;
  }
  
  // Tab state
  const [activeTab, setActiveTab] = useState<'inbound' | 'outbound'>('inbound');

  return (
    <div className="w-full h-full max-w-full mx-auto p-2 sm:p-4 lg:p-6 min-h-0 overflow-hidden">
      <div className={`rounded-xl sm:rounded-2xl border shadow-xl backdrop-blur-sm h-full flex flex-col max-h-full ${isDarkMode ? 'bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800 border-gray-700/50' : 'bg-gradient-to-br from-white via-gray-50 to-white border-gray-200/50'}`}>
        
        {/* Header */}
        <div className={`p-3 sm:p-4 lg:p-6 xl:p-8 border-b rounded-t-xl sm:rounded-t-2xl flex-shrink-0 ${isDarkMode ? 'border-gray-700/50 bg-gradient-to-r from-blue-900/20 to-indigo-900/20' : 'border-gray-200/50 bg-gradient-to-r from-blue-50 to-indigo-50'}`}>
          <div className="flex flex-col gap-3 sm:gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
              <div className="space-y-1 sm:space-y-2 min-w-0 flex-1">
              <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-1.5 sm:p-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg sm:rounded-xl flex-shrink-0">
                  <Phone className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-white" />
                </div>
                  <h2 className={`text-xl sm:text-2xl lg:text-3xl font-bold bg-clip-text text-transparent truncate ${isDarkMode ? 'bg-gradient-to-r from-white to-gray-300' : 'bg-gradient-to-r from-gray-900 to-gray-700'}`}>
                  Phone Numbers Management
                </h2>
              </div>
                <p className={`text-sm sm:text-base lg:text-lg truncate ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                {activeTab === 'inbound' ? 'View and manage phone number assignments to agents' : 'Schedule outbound calls with agents'}
              </p>
            </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className={`border-b ${isDarkMode ? 'border-gray-700/50' : 'border-gray-200/50'}`}>
          <div className="flex">
            <button
              onClick={() => setActiveTab('inbound')}
              className={`flex-1 px-4 sm:px-6 py-3 sm:py-4 text-sm sm:text-base font-semibold transition-all duration-300 ${
                activeTab === 'inbound'
                  ? isDarkMode
                    ? 'bg-gradient-to-r from-blue-600/20 to-indigo-600/20 text-blue-400 border-b-2 border-blue-500'
                    : 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-600 border-b-2 border-blue-500'
                  : isDarkMode
                    ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-800/50'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Phone className="h-4 w-4" />
                <span>Inbound</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('outbound')}
              className={`flex-1 px-4 sm:px-6 py-3 sm:py-4 text-sm sm:text-base font-semibold transition-all duration-300 ${
                activeTab === 'outbound'
                  ? isDarkMode
                    ? 'bg-gradient-to-r from-green-600/20 to-emerald-600/20 text-green-400 border-b-2 border-green-500'
                    : 'bg-gradient-to-r from-green-50 to-emerald-50 text-green-600 border-b-2 border-green-500'
                  : isDarkMode
                    ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-800/50'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <PhoneCall className="h-4 w-4" />
                <span>Outbound</span>
              </div>
            </button>
          </div>
        </div>
        
        {/* Tab Content */}
        <div className={`flex-1 min-h-0 overflow-hidden ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
          {activeTab === 'inbound' ? (
            <InboundPhoneNumbers />
          ) : (
            <OutboundScheduler />
                                  )}
                                </div>
                            </div>
                            </div>
  );
}
