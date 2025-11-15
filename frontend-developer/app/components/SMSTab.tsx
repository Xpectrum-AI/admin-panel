'use client';

import React, { useState, useEffect } from 'react';
import { Activity, RefreshCw, MessageSquare, PhoneCall } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuthInfo } from '@propelauth/react';
import { useTabPersistence } from '../../hooks/useTabPersistence';
import InboundSMSNumbers from './InboundSMSNumbers';
import OutboundSMSScheduler from './OutboundSMSScheduler';

interface SMSTabProps { }

export default function SMSTab({ }: SMSTabProps) {
    const { isDarkMode } = useTheme();
    const { userClass } = useAuthInfo();

    // Tab state
    const [activeTab, handleTabChange] = useTabPersistence<'inbound' | 'outbound'>('smsTab', 'inbound');

    // Refresh function to trigger data reload in child components
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    // Organization name state
    const [organizationName, setOrganizationName] = useState<string>('');

    // Get organization name from user context
    useEffect(() => {
        if (userClass) {
            const orgs = userClass.getOrgs?.() || [];
            if (orgs.length > 0) {
                const org = orgs[0] as any;
                const orgName = org.orgName || org.name || '';
                setOrganizationName(orgName);
            } else {
            }
        } else {
        }
    }, [userClass]);

    // Handle refresh trigger
    const handleRefresh = () => {
        setRefreshTrigger(prev => prev + 1);
    };

    return (
        <div className="w-full h-full max-w-full mx-auto p-2 sm:p-4 lg:p-6 min-h-0 overflow-hidden">
            <div className={`rounded-xl sm:rounded-2xl border shadow-xl backdrop-blur-sm h-full flex flex-col max-h-full ${isDarkMode ? 'bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800 border-gray-700/50' : 'bg-gradient-to-br from-white via-gray-50 to-white border-gray-200/50'}`}>

                {/* Header */}
                <div className={`p-3 sm:p-4 lg:p-6 xl:p-8 border-b rounded-t-xl sm:rounded-t-2xl flex-shrink-0 ${isDarkMode ? 'border-gray-700/50 bg-gradient-to-r from-green-900/20 to-emerald-900/20' : 'border-gray-200/50 bg-gradient-to-r from-green-50 to-emerald-50'}`}>
                    <div className="flex flex-col gap-3 sm:gap-4">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                            <div className="space-y-1 sm:space-y-2 min-w-0 flex-1">
                                <div className="flex items-center gap-2 sm:gap-3">
                                    <div className="p-1.5 sm:p-2 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg sm:rounded-xl flex-shrink-0">
                                        <Activity className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-white" />
                                    </div>
                                    <h2 className={`text-xl sm:text-2xl lg:text-3xl font-bold bg-clip-text text-transparent truncate ${isDarkMode ? 'bg-gradient-to-r from-white to-gray-300' : 'bg-gradient-to-r from-gray-900 to-gray-700'}`}>
                                        SMS-Enabled Phone Numbers
                                    </h2>
                                </div>
                                <p className={`text-sm sm:text-base lg:text-lg truncate ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                    {activeTab === 'inbound' ? 'View and manage SMS-enabled phone number assignments to agents' : 'Schedule outbound SMS messages with agents'}
                                </p>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-col items-end gap-2">
                                <div className="flex gap-2 sm:gap-3">
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className={`border-b ${isDarkMode ? 'border-gray-700/50' : 'border-gray-200/50'}`}>
                    <div className="flex">
                        <button
                            onClick={() => handleTabChange('inbound')}
                            className={`flex-1 px-4 sm:px-6 py-3 sm:py-4 text-sm sm:text-base font-semibold transition-all duration-300 ${activeTab === 'inbound'
                                ? isDarkMode
                                    ? 'bg-gradient-to-r from-green-600/20 to-emerald-600/20 text-green-400 border-b-2 border-green-500'
                                    : 'bg-gradient-to-r from-green-50 to-emerald-50 text-green-600 border-b-2 border-green-500'
                                : isDarkMode
                                    ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-800/50'
                                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                                }`}
                        >
                            <div className="flex items-center justify-center gap-2">
                                <MessageSquare className="h-4 w-4" />
                                <span>Inbound</span>
                            </div>
                        </button>
                        <button
                            onClick={() => handleTabChange('outbound')}
                            className={`flex-1 px-4 sm:px-6 py-3 sm:py-4 text-sm sm:text-base font-semibold transition-all duration-300 ${activeTab === 'outbound'
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
                        <InboundSMSNumbers refreshTrigger={refreshTrigger} />
                    ) : (
                        <OutboundSMSScheduler refreshTrigger={refreshTrigger} />
                    )}
                </div>
            </div>
        </div>
    );
}
