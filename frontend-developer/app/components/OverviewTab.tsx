'use client';

import React from 'react';
import { Code, Bot, TrendingUp, Phone, Activity, Zap, Clock, Sparkles, BarChart3, Database } from 'lucide-react';
import { useAuthInfo } from '@propelauth/react';

interface OverviewTabProps {
    isDarkMode?: boolean;
}

export default function OverviewTab({ isDarkMode = false }: OverviewTabProps) {
    const { user } = useAuthInfo();

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            {/* Welcome Section */}
            <div className={`${isDarkMode ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white' : 'bg-white text-gray-900'} rounded-3xl p-4 sm:p-6 lg:p-8 relative overflow-hidden border ${isDarkMode ? 'border-gray-700/50' : 'border-gray-200'} shadow-xl`}>
                <div className={`absolute inset-0 ${isDarkMode ? 'bg-gradient-to-r from-green-500/10 to-blue-500/10' : 'bg-gradient-to-r from-green-50 to-blue-50'}`}></div>
                <div className="relative z-10">
                    <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                        <div className="p-2 sm:p-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl">
                            <Code className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-green-500 to-emerald-600 bg-clip-text text-transparent">
                                Developer Dashboard
                            </h1>
                            <p className={`text-base sm:text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                Welcome back, {user?.firstName || (typeof window !== 'undefined' ? localStorage.getItem('pendingFirstName') : '')}!
                            </p>
                        </div>
                    </div>
                    <p className={`text-base sm:text-lg max-w-2xl ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        Your central hub for managing AI assistants, communication channels, and monitoring system performance.
                        Build, deploy, and observe your intelligent solutions.
                    </p>
                </div>
                {/* <div className="absolute top-4 right-4">
                    <div className={`flex items-center gap-2 rounded-full px-4 py-2 border ${isDarkMode ? 'bg-green-500/20 backdrop-blur-sm border-green-500/30' : 'bg-green-50 border-green-200'}`}>
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className={`text-sm font-medium ${isDarkMode ? 'text-green-400' : 'text-green-700'}`}>System Online</span>
                    </div>
                </div> */}
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <div className={`group rounded-2xl p-6 border transition-all duration-300 hover:scale-105 ${isDarkMode ? 'bg-gradient-to-br from-blue-500/10 to-purple-600/10 backdrop-blur-sm border-blue-500/20 hover:border-blue-400/40' : 'bg-white border-blue-200 hover:border-blue-300 shadow-lg hover:shadow-xl'}`}>
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl">
                            <Bot className="h-6 w-6 text-white" />
                        </div>
                        <TrendingUp className={`h-5 w-5 transition-colors ${isDarkMode ? 'text-blue-400 group-hover:text-blue-300' : 'text-blue-600 group-hover:text-blue-700'}`} />
                    </div>
                    <div>
                        <p className={`text-xl sm:text-2xl font-bold mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>12</p>
                        <p className={`text-sm ${isDarkMode ? 'text-blue-300' : 'text-blue-600'}`}>Active Assistants</p>
                    </div>
                    <div className={`mt-4 w-full rounded-full h-2 ${isDarkMode ? 'bg-blue-500/20' : 'bg-blue-100'}`}>
                        <div className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full" style={{ width: '75%' }}></div>
                    </div>
                </div>

                <div className={`group rounded-2xl p-6 border transition-all duration-300 hover:scale-105 ${isDarkMode ? 'bg-gradient-to-br from-green-500/10 to-emerald-600/10 backdrop-blur-sm border-green-500/20 hover:border-green-400/40' : 'bg-white border-green-200 hover:border-green-300 shadow-lg hover:shadow-xl'}`}>
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl">
                            <Phone className="h-6 w-6 text-white" />
                        </div>
                        <Activity className={`h-5 w-5 transition-colors ${isDarkMode ? 'text-green-400 group-hover:text-green-300' : 'text-green-600 group-hover:text-green-700'}`} />
                    </div>
                    <div>
                        <p className={`text-xl sm:text-2xl font-bold mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>8</p>
                        <p className={`text-sm ${isDarkMode ? 'text-green-300' : 'text-green-600'}`}>Phone Numbers</p>
                    </div>
                    <div className={`mt-4 w-full rounded-full h-2 ${isDarkMode ? 'bg-green-500/20' : 'bg-green-100'}`}>
                        <div className="bg-gradient-to-r from-green-500 to-emerald-600 h-2 rounded-full" style={{ width: '60%' }}></div>
                    </div>
                </div>

                <div className={`group rounded-2xl p-6 border transition-all duration-300 hover:scale-105 ${isDarkMode ? 'bg-gradient-to-br from-purple-500/10 to-pink-600/10 backdrop-blur-sm border-purple-500/20 hover:border-purple-400/40' : 'bg-white border-purple-200 hover:border-purple-300 shadow-lg hover:shadow-xl'}`}>
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl">
                            <Activity className="h-6 w-6 text-white" />
                        </div>
                        <Zap className={`h-5 w-5 transition-colors ${isDarkMode ? 'text-purple-400 group-hover:text-purple-300' : 'text-purple-600 group-hover:text-purple-700'}`} />
                    </div>
                    <div>
                        <p className={`text-xl sm:text-2xl font-bold mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>3</p>
                        <p className={`text-sm ${isDarkMode ? 'text-purple-300' : 'text-purple-600'}`}>Active Calls</p>
                    </div>
                    <div className={`mt-4 w-full rounded-full h-2 ${isDarkMode ? 'bg-purple-500/20' : 'bg-purple-100'}`}>
                        <div className="bg-gradient-to-r from-purple-500 to-pink-600 h-2 rounded-full" style={{ width: '45%' }}></div>
                    </div>
                </div>

                <div className={`group rounded-2xl p-6 border transition-all duration-300 hover:scale-105 ${isDarkMode ? 'bg-gradient-to-br from-orange-500/10 to-red-600/10 backdrop-blur-sm border-orange-500/20 hover:border-orange-400/40' : 'bg-white border-orange-200 hover:border-orange-300 shadow-lg hover:shadow-xl'}`}>
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-gradient-to-r from-orange-500 to-red-600 rounded-xl">
                            <Clock className="h-6 w-6 text-white" />
                        </div>
                        <Sparkles className={`h-5 w-5 transition-colors ${isDarkMode ? 'text-orange-400 group-hover:text-orange-300' : 'text-orange-600 group-hover:text-orange-700'}`} />
                    </div>
                    <div>
                        <p className={`text-xl sm:text-2xl font-bold mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>1,247</p>
                        <p className={`text-sm ${isDarkMode ? 'text-orange-300' : 'text-orange-600'}`}>Total Sessions</p>
                    </div>
                    <div className={`mt-4 w-full rounded-full h-2 ${isDarkMode ? 'bg-orange-500/20' : 'bg-orange-100'}`}>
                        <div className="bg-gradient-to-r from-orange-500 to-red-600 h-2 rounded-full" style={{ width: '85%' }}></div>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
                <div className={`rounded-2xl p-6 border ${isDarkMode ? 'bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm border-gray-700/50' : 'bg-white border-gray-200 shadow-lg'}`}>
                    <h3 className={`text-lg sm:text-xl font-semibold mb-4 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500" />
                        Quick Actions
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                        <button className={`p-4 rounded-xl border transition-all duration-300 group ${isDarkMode ? 'bg-gradient-to-r from-green-500/20 to-emerald-600/20 border-green-500/30 hover:border-green-400/50' : 'bg-green-50 border-green-200 hover:border-green-300 hover:bg-green-100'}`}>
                            <Bot className={`h-5 w-5 sm:h-6 sm:w-6 mb-2 ${isDarkMode ? 'text-green-400 group-hover:text-green-300' : 'text-green-600 group-hover:text-green-700'}`} />
                            <p className={`text-sm font-medium ${isDarkMode ? 'text-green-300' : 'text-green-700'}`}>Create Agent</p>
                        </button>
                        <button className={`p-4 rounded-xl border transition-all duration-300 group ${isDarkMode ? 'bg-gradient-to-r from-blue-500/20 to-indigo-600/20 border-blue-500/30 hover:border-blue-400/50' : 'bg-blue-50 border-blue-200 hover:border-blue-300 hover:bg-blue-100'}`}>
                            <Phone className={`h-5 w-5 sm:h-6 sm:w-6 mb-2 ${isDarkMode ? 'text-blue-400 group-hover:text-blue-300' : 'text-blue-600 group-hover:text-blue-700'}`} />
                            <p className={`text-sm font-medium ${isDarkMode ? 'text-blue-300' : 'text-blue-700'}`}>Add Phone</p>
                        </button>
                        <button className={`p-4 rounded-xl border transition-all duration-300 group ${isDarkMode ? 'bg-gradient-to-r from-purple-500/20 to-pink-600/20 border-purple-500/30 hover:border-purple-400/50' : 'bg-purple-50 border-purple-200 hover:border-purple-300 hover:bg-purple-100'}`}>
                            <BarChart3 className={`h-5 w-5 sm:h-6 sm:w-6 mb-2 ${isDarkMode ? 'text-purple-400 group-hover:text-purple-300' : 'text-purple-600 group-hover:text-purple-700'}`} />
                            <p className={`text-sm font-medium ${isDarkMode ? 'text-purple-300' : 'text-purple-700'}`}>View Metrics</p>
                        </button>
                        <button className={`p-4 rounded-xl border transition-all duration-300 group ${isDarkMode ? 'bg-gradient-to-r from-orange-500/20 to-red-600/20 border-orange-500/30 hover:border-orange-400/50' : 'bg-orange-50 border-orange-200 hover:border-orange-300 hover:bg-orange-100'}`}>
                            <Database className={`h-5 w-5 sm:h-6 sm:w-6 mb-2 ${isDarkMode ? 'text-orange-400 group-hover:text-orange-300' : 'text-orange-600 group-hover:text-orange-700'}`} />
                            <p className={`text-sm font-medium ${isDarkMode ? 'text-orange-300' : 'text-orange-700'}`}>System Logs</p>
                        </button>
                    </div>
                </div>

                <div className={`rounded-2xl p-6 border ${isDarkMode ? 'bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm border-gray-700/50' : 'bg-white border-gray-200 shadow-lg'}`}>
                    <h3 className={`text-lg sm:text-xl font-semibold mb-4 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
                        System Status
                    </h3>
                    <div className="space-y-4">
                        <div className={`flex items-center justify-between p-3 rounded-xl border ${isDarkMode ? 'bg-green-500/10 border-green-500/20' : 'bg-green-50 border-green-200'}`}>
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                <span className={isDarkMode ? 'text-green-300' : 'text-green-700'}>AI Services</span>
                            </div>
                            <span className={`text-sm ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>Operational</span>
                        </div>
                        <div className={`flex items-center justify-between p-3 rounded-xl border ${isDarkMode ? 'bg-blue-500/10 border-blue-500/20' : 'bg-blue-50 border-blue-200'}`}>
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                                <span className={isDarkMode ? 'text-blue-300' : 'text-blue-700'}>Communication</span>
                            </div>
                            <span className={`text-sm ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>Active</span>
                        </div>
                        <div className={`flex items-center justify-between p-3 rounded-xl border ${isDarkMode ? 'bg-purple-500/10 border-purple-500/20' : 'bg-purple-50 border-purple-200'}`}>
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                                <span className={isDarkMode ? 'text-purple-300' : 'text-purple-700'}>Database</span>
                            </div>
                            <span className={`text-sm ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`}>Connected</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}


