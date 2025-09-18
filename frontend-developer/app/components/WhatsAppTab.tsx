'use client';

import React, { useState } from 'react';
import { Activity, RefreshCw, MessageSquare, PhoneCall } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import InboundWhatsappNumbers from './InboundWhatsappNumbers';
import OutboundWhatsappScheduler from './OutboundWhatsappScheduler';

// Custom WhatsApp icon component
const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="currentColor"
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488" />
  </svg>
);

interface WhatsAppTabProps { }

export default function WhatsAppTab({ }: WhatsAppTabProps) {
    const { isDarkMode } = useTheme();

    // Tab state
    const [activeTab, setActiveTab] = useState<'inbound' | 'outbound'>('inbound');
    
    // Refresh function to trigger data reload in child components
    const [refreshTrigger, setRefreshTrigger] = useState(0);

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
                                        <WhatsAppIcon className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-white" />
                                    </div>
                                    <h2 className={`text-xl sm:text-2xl lg:text-3xl font-bold bg-clip-text text-transparent truncate ${isDarkMode ? 'bg-gradient-to-r from-white to-gray-300' : 'bg-gradient-to-r from-gray-900 to-gray-700'}`}>
                                        WhatsApp-Enabled Phone Numbers
                                    </h2>
                                </div>
                                <p className={`text-sm sm:text-base lg:text-lg truncate ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                    {activeTab === 'inbound' ? 'View and manage WhatsApp-enabled phone number assignments to agents' : 'Schedule outbound WhatsApp messages with agents'}
                                </p>
                            </div>
                            
                            {/* Action Buttons */}
                            <div className="flex flex-col items-end gap-2">
                                <div className="flex gap-2 sm:gap-3">
                                    <button className="group relative px-3 sm:px-4 lg:px-6 py-2 sm:py-2.5 lg:py-3 bg-gray-500 text-white rounded-lg sm:rounded-xl hover:bg-gray-600 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center gap-2 sm:gap-3">
                                        <span className="text-sm sm:text-base font-semibold">Xpectrum</span>
                                    </button>
                                    <button
                                        onClick={handleRefresh}
                                        className="group relative px-3 sm:px-4 lg:px-6 py-2 sm:py-2.5 lg:py-3 bg-green-600 text-white rounded-lg sm:rounded-xl hover:bg-green-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center gap-2 sm:gap-3"
                                    >
                                        <RefreshCw className="h-4 w-4 sm:h-4 sm:w-4 lg:h-5 lg:w-5" />
                                        <span className="text-sm sm:text-base font-semibold">Refresh</span>
                                    </button>
                                </div>
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
                        <InboundWhatsappNumbers refreshTrigger={refreshTrigger} />
                    ) : (
                        <OutboundWhatsappScheduler refreshTrigger={refreshTrigger} />
                    )}
                </div>
            </div>
        </div>
    );
}