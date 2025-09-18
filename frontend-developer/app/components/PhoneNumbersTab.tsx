'use client';

import React, { useState } from 'react';
import { Phone, PhoneCall, RefreshCw } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import InboundPhoneNumbersTable from './InboundPhoneNumbersTable';
import OutboundScheduler from './OutboundScheduler';
import { syncPhoneNumbersFromTwilio } from '../../service/phoneNumberService';

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
  
  // Sync state
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  // Refresh function to trigger data reload in child components
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Handle Twilio sync
  const handleTwilioSync = async () => {
    setIsSyncing(true);
    setSyncMessage(null);
    
    try {
      const result = await syncPhoneNumbersFromTwilio();
      
      if (result.success) {
        setSyncMessage('Phone numbers synced successfully from Twilio!');
        // Trigger refresh of phone numbers data
        setRefreshTrigger(prev => prev + 1);
        // Clear message after 3 seconds
        setTimeout(() => setSyncMessage(null), 3000);
      } else {
        setSyncMessage(result.message || 'Failed to sync phone numbers');
        // Clear error message after 5 seconds
        setTimeout(() => setSyncMessage(null), 5000);
      }
    } catch (error) {
      setSyncMessage('An unexpected error occurred during sync');
      setTimeout(() => setSyncMessage(null), 5000);
    } finally {
      setIsSyncing(false);
    }
  };

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
              
              {/* Twilio Sync Button */}
              <div className="flex flex-col items-end gap-2">
                <button
                  onClick={handleTwilioSync}
                  disabled={isSyncing}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                    isSyncing
                      ? isDarkMode
                        ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                        : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      : isDarkMode
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl'
                        : 'bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white shadow-lg hover:shadow-xl'
                  }`}
                >
                  <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span className="text-sm sm:text-base">
                    {isSyncing ? 'Syncing...' : 'Sync Phone Numbers'}
                  </span>
                </button>
                
                {/* Sync Message */}
                {syncMessage && (
                  <div className={`text-xs px-2 py-1 rounded ${
                    syncMessage.includes('successfully') 
                      ? isDarkMode 
                        ? 'bg-green-900/50 text-green-300 border border-green-700/50' 
                        : 'bg-green-50 text-green-700 border border-green-200'
                      : isDarkMode 
                        ? 'bg-red-900/50 text-red-300 border border-red-700/50' 
                        : 'bg-red-50 text-red-700 border border-red-200'
                  }`}>
                    {syncMessage}
                  </div>
                )}
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
            <InboundPhoneNumbersTable refreshTrigger={refreshTrigger} />
          ) : (
            <OutboundScheduler />
          )}
        </div>
                            </div>
                            </div>
  );
}
