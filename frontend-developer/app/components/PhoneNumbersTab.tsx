'use client';

import React, { useState } from 'react';
import { Phone, Plus, Search, Sparkles, Activity, Zap, Menu, X } from 'lucide-react';

interface PhoneNumber {
  id: string;
  number: string;
  status: 'active' | 'inactive' | 'pending';
  type: 'inbound' | 'outbound' | 'both';
  assignedAgent?: string;
  description?: string;
}

const samplePhoneNumbers: PhoneNumber[] = [
  {
    id: '1',
    number: '+1 (555) 123-4567',
    status: 'active',
    type: 'both',
    assignedAgent: 'Riley',
    description: 'Main customer support line'
  },
  {
    id: '2',
    number: '+1 (555) 987-6543',
    status: 'inactive',
    type: 'inbound',
    assignedAgent: 'Elliot',
    description: 'Appointment scheduling line'
  }
];

interface PhoneNumbersTabProps {
  isDarkMode?: boolean;
}

export default function PhoneNumbersTab({ isDarkMode = false }: PhoneNumbersTabProps) {
  const [activeTab, setActiveTab] = useState<'inbound' | 'outbound'>('inbound');
  const [selectedNumber, setSelectedNumber] = useState<PhoneNumber | null>(samplePhoneNumbers[0]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleNumberSelect = (phoneNumber: PhoneNumber) => {
    setSelectedNumber(phoneNumber);
    setIsSidebarOpen(false); // Close sidebar when a number is selected
  };

  return (
    <div className=" w-full space-y-4 sm:space-y-6">
      <div className={` border shadow-xl backdrop-blur-sm ${isDarkMode ? 'bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800 border-gray-700/50' : 'bg-gradient-to-br from-white via-gray-50 to-white border-gray-200/50'}`}>
        {/* Header */}
        <div className={`p-4 sm:p-6 lg:p-8 border-b   ${isDarkMode ? 'border-gray-700/50 bg-gradient-to-r from-blue-900/20 to-indigo-900/20' : 'border-gray-200/50 bg-gradient-to-r from-blue-50 to-indigo-50'}`}>
          <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4">
            <div className="space-y-2 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-3">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg sm:rounded-xl">
                  <Phone className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
                <h2 className={`text-xl sm:text-2xl lg:text-3xl font-bold bg-clip-text text-transparent ${isDarkMode ? 'bg-gradient-to-r from-white to-gray-300' : 'bg-gradient-to-r from-gray-900 to-gray-700'}`}>
                  Phone Numbers
                </h2>
              </div>
              <p className={`text-sm sm:text-base lg:text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Manage your communication channels</p>
            </div>
            <button className="group relative px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg sm:rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-center">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-lg sm:rounded-xl opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
              <Sparkles className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="font-semibold text-sm sm:text-base">Add Phone Number</span>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className={`border-b ${isDarkMode ? 'border-gray-700/50 bg-gray-900' : 'border-gray-200/50 bg-white'} `}>
          <nav className="flex space-x-1 px-4 sm:px-8 py-2 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveTab('inbound')}
              className={`group relative px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-medium text-xs sm:text-sm transition-all duration-300 flex items-center gap-2 whitespace-nowrap ${activeTab === 'inbound'
                ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg'
                : isDarkMode
                  ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
            >
              <div className="w-2 h-2 rounded-full bg-current"></div>
              Inbound
              {activeTab === 'inbound' && (
                <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-white rounded-full"></div>
              )}
            </button>
            <button
              onClick={() => setActiveTab('outbound')}
              className={`group relative px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-medium text-xs sm:text-sm transition-all duration-300 flex items-center gap-2 whitespace-nowrap ${activeTab === 'outbound'
                ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-lg'
                : isDarkMode
                  ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
            >
              <div className="w-2 h-2 rounded-full bg-current"></div>
              Outbound
              {activeTab === 'outbound' && (
                <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-white rounded-full"></div>
              )}
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className={`p-4 sm:p-6 lg:p-8 ${isDarkMode ? 'bg-gray-900' : ''} rounded-b-2xl`}>
          {/* Sidebar Toggle - All Screens */}
          <div className="mb-4">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 flex items-center gap-2 ${isDarkMode
                ? 'bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-600'
                : 'bg-white hover:bg-gray-50 text-gray-900 border border-gray-200'
                } shadow-sm hover:shadow-md`}
            >
              <Menu className="h-4 w-4" />
              <span className="text-sm font-medium">
                {isSidebarOpen ? 'Hide Phone Numbers' : 'Show Phone Numbers'}
              </span>
              {selectedNumber && !isSidebarOpen && (
                <span className={`text-xs px-2 py-1 rounded-full ${isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600'
                  }`}>
                  {selectedNumber.number}
                </span>
              )}
            </button>
          </div>

          {/* Backdrop for all screens */}
          {isSidebarOpen && (
            <div
              className="fixed inset-0 bg-black/50 z-40"
              onClick={() => setIsSidebarOpen(false)}
            />
          )}

          {/* Sliding Sidebar - All Screens */}
          <div className={`fixed top-0 bottom-0 left-0 z-50 w-64 sm:w-72 lg:w-80 xl:w-96 transform transition-all duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0'
            } ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-r shadow-xl overflow-hidden`}>
            {/* Sidebar Header */}
            <div className={`flex items-center justify-between p-3 sm:p-4 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <h3 className={`font-semibold text-sm sm:text-base ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Phone Numbers
              </h3>
              <button
                onClick={() => setIsSidebarOpen(false)}
                className={`p-1 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
                  }`}
              >
                <X className="h-3 w-3 sm:h-4 sm:w-4" />
              </button>
            </div>

            {/* Sidebar Content */}
            <div className="p-2 sm:p-4 h-full overflow-y-auto pb-20">

              <div className="mb-3 sm:mb-4">
                <div className="relative group">
                  <Search className={`absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 transition-colors ${isDarkMode ? 'text-gray-500 group-focus-within:text-blue-400' : 'text-gray-400 group-focus-within:text-blue-500'}`} />
                  <input
                    type="text"
                    placeholder="Search phone numbers..."
                    className={`w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-1.5 sm:py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 backdrop-blur-sm transition-all duration-300 text-xs sm:text-sm ${isDarkMode ? 'border-gray-600 bg-gray-800/80 text-gray-200 placeholder-gray-500' : 'border-gray-200 bg-white/80 text-gray-900 placeholder-gray-400'}`}
                  />
                </div>
              </div>

              <div className="space-y-2 sm:space-y-3">
                {samplePhoneNumbers.map((phoneNumber) => (
                  <button
                    key={phoneNumber.id}
                    onClick={() => handleNumberSelect(phoneNumber)}
                    className={`w-full p-2 sm:p-3 rounded-lg text-left transition-all duration-300 transform hover:scale-[1.02] ${selectedNumber?.id === phoneNumber.id
                      ? isDarkMode
                        ? 'bg-gradient-to-r from-blue-900/30 to-indigo-900/30 border-2 border-blue-700/50 shadow-lg'
                        : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 shadow-lg'
                      : isDarkMode
                        ? 'hover:bg-gray-800/80 border-2 border-transparent hover:border-gray-600 shadow-sm'
                        : 'hover:bg-white/80 border-2 border-transparent hover:border-gray-200 shadow-sm'
                      }`}
                  >
                    <div className="flex items-start gap-2 sm:gap-3">
                      <div className={`text-sm sm:text-xl p-1 sm:p-1.5 rounded-lg flex-shrink-0 ${phoneNumber.status === 'active'
                        ? isDarkMode ? 'bg-blue-900/50' : 'bg-blue-100'
                        : phoneNumber.status === 'inactive'
                          ? isDarkMode ? 'bg-red-900/50' : 'bg-red-100'
                          : isDarkMode ? 'bg-yellow-900/50' : 'bg-yellow-100'
                        }`}>
                        📞
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-0.5 sm:mb-1 gap-1 sm:gap-2">
                          <h3 className={`font-semibold truncate text-xs sm:text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{phoneNumber.number}</h3>
                          <div className={`px-1.5 sm:px-2 py-0.5 rounded-full text-xs font-medium self-start sm:self-auto ${phoneNumber.status === 'active'
                            ? isDarkMode ? 'bg-green-900/50 text-green-300' : 'bg-green-100 text-green-800'
                            : phoneNumber.status === 'inactive'
                              ? isDarkMode ? 'bg-red-900/50 text-red-300' : 'bg-red-100 text-red-800'
                              : isDarkMode ? 'bg-yellow-900/50 text-yellow-300' : 'bg-yellow-100 text-yellow-800'
                            }`}>
                            {phoneNumber.status}
                          </div>
                        </div>
                        <p className={`text-xs mb-0.5 sm:mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{phoneNumber.description}</p>
                        <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          {phoneNumber.assignedAgent && `Assigned to ${phoneNumber.assignedAgent}`}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1">
            <div className="flex flex-col h-full">
              {selectedNumber ? (
                <div className={`rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 border ${isDarkMode ? 'bg-gradient-to-br from-gray-800/30 to-gray-900 border-gray-700/50' : 'bg-gradient-to-br from-gray-50/30 to-white border-gray-200/50'}`}>
                  <div className="mb-4 sm:mb-6 lg:mb-8">
                    <div className="flex flex-col items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                      <div className={`text-2xl sm:text-3xl p-2 sm:p-3 rounded-lg sm:rounded-xl ${isDarkMode ? 'bg-gradient-to-r from-blue-900/50 to-indigo-900/50' : 'bg-gradient-to-r from-blue-100 to-indigo-100'}`}>
                        📞
                      </div>
                      <div className="text-center">
                        <h3 className={`text-lg sm:text-xl lg:text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {activeTab === 'inbound' ? 'Inbound' : 'Outbound'} Configuration
                        </h3>
                        <p className={`text-sm sm:text-base ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{selectedNumber.number}</p>
                        <p className={`text-xs sm:text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{selectedNumber.description}</p>
                      </div>
                    </div>

                    {/* Status Indicator */}
                    <div className="flex items-center justify-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${selectedNumber.status === 'active' ? 'bg-green-500 animate-pulse' :
                        selectedNumber.status === 'inactive' ? 'bg-red-500' :
                          'bg-yellow-500'
                        }`}></div>
                      <span className={`text-xs sm:text-sm font-medium capitalize ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{selectedNumber.status}</span>
                      {selectedNumber.status === 'active' && (
                        <Activity className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 animate-pulse" />
                      )}
                    </div>
                  </div>

                  {activeTab === 'inbound' ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                      <div className="space-y-3 sm:space-y-4">
                        <div>
                          <label className={`block text-xs sm:text-sm font-semibold mb-1 sm:mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Assigned Agent</label>
                          <select className={`w-full px-3 sm:px-4 py-2 sm:py-3 text-sm border rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 backdrop-blur-sm transition-all duration-300 ${isDarkMode ? 'border-gray-600 bg-gray-800/80 text-gray-200' : 'border-gray-200 bg-white/80 text-gray-900'}`}>
                            <option>Riley</option>
                            <option>Elliot</option>
                            <option>None</option>
                          </select>
                        </div>

                        <div>
                          <label className={`block text-xs sm:text-sm font-semibold mb-1 sm:mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Greeting Message</label>
                          <textarea
                            rows={3}
                            className={`w-full px-3 sm:px-4 py-2 sm:py-3 text-sm border h-32 sm:h-40 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 backdrop-blur-sm transition-all duration-300 resize-none ${isDarkMode ? 'border-gray-600 bg-gray-800/80 text-gray-200 placeholder-gray-500' : 'border-gray-200 bg-white/80 text-gray-900 placeholder-gray-400'}`}
                            placeholder="Enter greeting message..."
                            defaultValue="Thank you for calling. Please wait while we connect you to an agent."
                          />
                        </div>

                        <div>
                          <label className={`block text-xs sm:text-sm font-semibold mb-1 sm:mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Call Routing</label>
                          <select className={`w-full px-3 sm:px-4 py-2 sm:py-3 text-sm border rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 backdrop-blur-sm transition-all duration-300 ${isDarkMode ? 'border-gray-600 bg-gray-800/80 text-gray-200' : 'border-gray-200 bg-white/80 text-gray-900'}`}>
                            <option>Direct to Agent</option>
                            <option>Queue System</option>
                            <option>IVR Menu</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-3 sm:space-y-4">
                        <div>
                          <label className={`block text-xs sm:text-sm font-semibold mb-1 sm:mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Business Hours</label>
                          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                            <div>
                              <label className={`block text-xs mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Start Time</label>
                              <input
                                type="time"
                                className={`w-full px-3 sm:px-4 py-2 sm:py-3 text-sm border rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 backdrop-blur-sm transition-all duration-300 ${isDarkMode ? 'border-gray-600 bg-gray-800/80 text-gray-200' : 'border-gray-200 bg-white/80 text-gray-900'}`}
                                defaultValue="09:00"
                              />
                            </div>
                            <div>
                              <label className={`block text-xs mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>End Time</label>
                              <input
                                type="time"
                                className={`w-full px-3 sm:px-4 py-2 sm:py-3 text-sm border rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 backdrop-blur-sm transition-all duration-300 ${isDarkMode ? 'border-gray-600 bg-gray-800/80 text-gray-200' : 'border-gray-200 bg-white/80 text-gray-900'}`}
                                defaultValue="17:00"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="pt-2 sm:pt-4">
                          <div className="flex items-center gap-2 mb-2 sm:mb-3">
                            <Zap className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500" />
                            <span className={`text-xs sm:text-sm font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Quick Actions</span>
                          </div>
                          <div className="flex flex-col sm:flex-row gap-2">
                            <button className={`px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg transition-colors text-xs sm:text-sm font-medium ${isDarkMode ? 'bg-blue-900/50 text-blue-300 hover:bg-blue-800/50' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'}`}>
                              Test Call
                            </button>
                            <button className={`px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg transition-colors text-xs sm:text-sm font-medium ${isDarkMode ? 'bg-green-900/50 text-green-300 hover:bg-green-800/50' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}>
                              Activate
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                      <div className="space-y-3 sm:space-y-4">
                        <div>
                          <label className={`block text-xs sm:text-sm font-semibold mb-1 sm:mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Outbound Agent</label>
                          <select className={`w-full px-3 sm:px-4 py-2 sm:py-3 text-sm border rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 backdrop-blur-sm transition-all duration-300 ${isDarkMode ? 'border-gray-600 bg-gray-800/80 text-gray-200' : 'border-gray-200 bg-white/80 text-gray-900'}`}>
                            <option>Riley</option>
                            <option>Elliot</option>
                            <option>None</option>
                          </select>
                        </div>

                        <div>
                          <label className={`block text-xs sm:text-sm font-semibold mb-1 sm:mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Caller ID</label>
                          <input
                            type="text"
                            className={`w-full px-3 sm:px-4 py-2 sm:py-3 text-sm border rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 backdrop-blur-sm transition-all duration-300 ${isDarkMode ? 'border-gray-600 bg-gray-800/80 text-gray-200 placeholder-gray-500' : 'border-gray-200 bg-white/80 text-gray-900 placeholder-gray-400'}`}
                            placeholder="Enter caller ID..."
                            defaultValue="Wellness Partners"
                          />
                        </div>

                        <div>
                          <label className={`block text-xs sm:text-sm font-semibold mb-1 sm:mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Dialing Strategy</label>
                          <select className={`w-full px-3 sm:px-4 py-2 sm:py-3 text-sm border rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 backdrop-blur-sm transition-all duration-300 ${isDarkMode ? 'border-gray-600 bg-gray-800/80 text-gray-200' : 'border-gray-200 bg-white/80 text-gray-900'}`}>
                            <option>Sequential</option>
                            <option>Random</option>
                            <option>Priority-based</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-3 sm:space-y-4">
                        <div>
                          <label className={`block text-xs sm:text-sm font-semibold mb-1 sm:mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Retry Settings</label>
                          <div className="grid grid-cols-2 gap-2 sm:gap-4">
                            <div>
                              <label className={`block text-xs mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Max Retries</label>
                              <input
                                type="number"
                                className={`w-full px-2 sm:px-4 py-2 sm:py-3 text-sm border rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 backdrop-blur-sm transition-all duration-300 ${isDarkMode ? 'border-gray-600 bg-gray-800/80 text-gray-200' : 'border-gray-200 bg-white/80 text-gray-900'}`}
                                defaultValue="3"
                              />
                            </div>
                            <div>
                              <label className={`block text-xs mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Retry Delay (min)</label>
                              <input
                                type="number"
                                className={`w-full px-2 sm:px-4 py-2 sm:py-3 text-sm border rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 backdrop-blur-sm transition-all duration-300 ${isDarkMode ? 'border-gray-600 bg-gray-800/80 text-gray-200' : 'border-gray-200 bg-white/80 text-gray-900'}`}
                                defaultValue="5"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="pt-2 sm:pt-4">
                          <div className="flex items-center gap-2 mb-2 sm:mb-3">
                            <Zap className="h-3 w-3 sm:h-4 sm:w-4 text-purple-500" />
                            <span className={`text-xs sm:text-sm font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Quick Actions</span>
                          </div>
                          <div className="flex flex-col sm:flex-row gap-2">
                            <button className={`px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg transition-colors text-xs sm:text-sm font-medium ${isDarkMode ? 'bg-purple-900/50 text-purple-300 hover:bg-purple-800/50' : 'bg-purple-100 text-purple-700 hover:bg-purple-200'}`}>
                              Test Dial
                            </button>
                            <button className={`px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg transition-colors text-xs sm:text-sm font-medium ${isDarkMode ? 'bg-green-900/50 text-green-300 hover:bg-green-800/50' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}>
                              Start Campaign
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 sm:py-12">
                  <div className={`p-4 sm:p-6 rounded-xl sm:rounded-2xl inline-block mb-4 sm:mb-6 ${isDarkMode ? 'bg-gradient-to-r from-blue-900/50 to-indigo-900/50' : 'bg-gradient-to-r from-blue-100 to-indigo-100'}`}>
                    <Phone className={`h-8 w-8 sm:h-12 sm:w-12 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                  </div>
                  <h3 className={`text-lg sm:text-xl font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Select a Phone Number</h3>
                  <p className={`text-sm sm:text-base ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Choose a phone number from the sidebar to configure its settings</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
