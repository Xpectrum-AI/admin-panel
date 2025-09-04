'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Building2, 
  Bot, 
  Phone, 
  BarChart3, 
  FileText, 
  MessageSquare, 
  Clock, 
  LogOut, 
  ArrowLeft,
  User,
  Settings,
  Shield,
  Activity,
  MoreHorizontal,
  Sparkles,
  Zap,
  TrendingUp,
  Users,
  Globe,
  Code,
  Database,
  Sun,
  Moon
} from 'lucide-react';
import { useAuthInfo, useLogoutFunction } from '@propelauth/react';
import { SyncLoader } from 'react-spinners';
import { useRouter } from 'next/navigation';
import { AgentsTab, PhoneNumbersTab, SMSTab, WhatsAppTab } from './components';
import ChatSidebar from './components/ChatSidebar';
import { useTheme } from './contexts/ThemeContext';

// Custom WhatsApp icon component
const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg 
    className={className} 
    viewBox="0 0 24 24" 
    fill="currentColor"
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
  </svg>
);

// Simple Chat icon component
const ChatIcon = ({ className }: { className?: string }) => (
  <svg 
    className={className} 
    viewBox="0 0 24 24" 
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

// Navigation items for developer sidebar
const navigationItems = [
  {
    category: 'MANAGE',
    items: [
      { name: 'Overview', icon: Building2, active: true, color: 'from-blue-500 to-purple-600' },
    ]
  },
  {
    category: 'BUILD',
    items: [
      { name: 'Agents', icon: Bot, color: 'from-green-500 to-emerald-600' },
      { name: 'Phone Numbers', icon: Phone, color: 'from-blue-500 to-indigo-600' },
      { name: 'SMS', icon: MessageSquare, color: 'from-orange-500 to-red-600' },
      { name: 'WhatsApp', icon: WhatsAppIcon, color: 'from-green-500 to-emerald-600' },
    ]
  },
  {
    category: 'OBSERVE',
    items: [
      { name: 'Metrics', icon: BarChart3, color: 'from-indigo-500 to-purple-600' },
      { name: 'Call Logs', icon: FileText, color: 'from-gray-600 to-gray-800' },
      { name: 'Chat Logs', icon: MessageSquare, color: 'from-cyan-500 to-blue-600' },
      { name: 'Session Logs', icon: Clock, color: 'from-yellow-500 to-orange-600' },
    ]
  }
];

export default function DeveloperDashboard() {
  const [activeNavItem, setActiveNavItem] = useState('Overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  // Chat state
  const [chatOpen, setChatOpen] = useState(false);
  const [hasNewMessages, setHasNewMessages] = useState(false);
  const { isDarkMode, toggleTheme } = useTheme();
  
  // Profile dropdown state
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user, isLoggedIn } = useAuthInfo();
  const logout = useLogoutFunction();
  const router = useRouter();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Check for new messages and update notification state
  useEffect(() => {
    const checkNewMessages = () => {
      try {
        const savedMessages = localStorage.getItem('chatMessages');
        if (savedMessages) {
          const parsed = JSON.parse(savedMessages);
          // Consider it has new messages if more than just the welcome message
          setHasNewMessages(parsed.length > 1);
        } else {
          setHasNewMessages(false);
        }
      } catch (error) {
        console.error('Error checking new messages:', error);
        setHasNewMessages(false);
      }
    };

    // Check initially
    checkNewMessages();

    // Set up interval to check for new messages
    const interval = setInterval(checkNewMessages, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl/Cmd + K to toggle chat
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault();
        setChatOpen(prev => !prev);
      }
      // Escape to close chat
      if (event.key === 'Escape' && chatOpen) {
        setChatOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [chatOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef]);

  // Handle navigation item click
  const handleNavItemClick = (itemName: string) => {
    setActiveNavItem(itemName);
  };



  // Render content based on active navigation item
  const renderContent = () => {
    switch (activeNavItem) {
      case 'Overview':
        return (
          <div className="max-w-7xl mx-auto space-y-8">
            {/* Welcome Section */}
            <div className={`${isDarkMode ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white' : 'bg-white text-gray-900'} rounded-3xl p-8 relative overflow-hidden border ${isDarkMode ? 'border-gray-700/50' : 'border-gray-200'} shadow-xl`}>
              <div className={`absolute inset-0 ${isDarkMode ? 'bg-gradient-to-r from-green-500/10 to-blue-500/10' : 'bg-gradient-to-r from-green-50 to-blue-50'}`}></div>
              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl">
                    <Code className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-green-500 to-emerald-600 bg-clip-text text-transparent">
                      Developer Dashboard
                    </h1>
                    <p className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      Welcome back, {user?.firstName || localStorage.getItem('pendingFirstName')}!
                    </p>
                  </div>
                </div>
                <p className={`text-lg max-w-2xl ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Your central hub for managing AI assistants, communication channels, and monitoring system performance. 
                  Build, deploy, and observe your intelligent solutions.
                </p>
              </div>
              <div className="absolute top-4 right-4">
                <div className={`flex items-center gap-2 rounded-full px-4 py-2 border ${isDarkMode ? 'bg-green-500/20 backdrop-blur-sm border-green-500/30' : 'bg-green-50 border-green-200'}`}>
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className={`text-sm font-medium ${isDarkMode ? 'text-green-400' : 'text-green-700'}`}>System Online</span>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className={`group rounded-2xl p-6 border transition-all duration-300 hover:scale-105 ${isDarkMode ? 'bg-gradient-to-br from-blue-500/10 to-purple-600/10 backdrop-blur-sm border-blue-500/20 hover:border-blue-400/40' : 'bg-white border-blue-200 hover:border-blue-300 shadow-lg hover:shadow-xl'}`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl">
                    <Bot className="h-6 w-6 text-white" />
                  </div>
                  <TrendingUp className={`h-5 w-5 transition-colors ${isDarkMode ? 'text-blue-400 group-hover:text-blue-300' : 'text-blue-600 group-hover:text-blue-700'}`} />
                </div>
                <div>
                  <p className={`text-2xl font-bold mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>12</p>
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
                  <p className={`text-2xl font-bold mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>8</p>
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
                  <p className={`text-2xl font-bold mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>3</p>
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
                  <p className={`text-2xl font-bold mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>1,247</p>
                  <p className={`text-sm ${isDarkMode ? 'text-orange-300' : 'text-orange-600'}`}>Total Sessions</p>
                </div>
                <div className={`mt-4 w-full rounded-full h-2 ${isDarkMode ? 'bg-orange-500/20' : 'bg-orange-100'}`}>
                  <div className="bg-gradient-to-r from-orange-500 to-red-600 h-2 rounded-full" style={{ width: '85%' }}></div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className={`rounded-2xl p-6 border ${isDarkMode ? 'bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm border-gray-700/50' : 'bg-white border-gray-200 shadow-lg'}`}>
                <h3 className={`text-xl font-semibold mb-4 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  <Zap className="h-5 w-5 text-yellow-500" />
                  Quick Actions
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <button className={`p-4 rounded-xl border transition-all duration-300 group ${isDarkMode ? 'bg-gradient-to-r from-green-500/20 to-emerald-600/20 border-green-500/30 hover:border-green-400/50' : 'bg-green-50 border-green-200 hover:border-green-300 hover:bg-green-100'}`}>
                    <Bot className={`h-6 w-6 mb-2 ${isDarkMode ? 'text-green-400 group-hover:text-green-300' : 'text-green-600 group-hover:text-green-700'}`} />
                    <p className={`text-sm font-medium ${isDarkMode ? 'text-green-300' : 'text-green-700'}`}>Create Agent</p>
                  </button>
                  <button className={`p-4 rounded-xl border transition-all duration-300 group ${isDarkMode ? 'bg-gradient-to-r from-blue-500/20 to-indigo-600/20 border-blue-500/30 hover:border-blue-400/50' : 'bg-blue-50 border-blue-200 hover:border-blue-300 hover:bg-blue-100'}`}>
                    <Phone className={`h-6 w-6 mb-2 ${isDarkMode ? 'text-blue-400 group-hover:text-blue-300' : 'text-blue-600 group-hover:text-blue-700'}`} />
                    <p className={`text-sm font-medium ${isDarkMode ? 'text-blue-300' : 'text-blue-700'}`}>Add Phone</p>
                  </button>
                  <button className={`p-4 rounded-xl border transition-all duration-300 group ${isDarkMode ? 'bg-gradient-to-r from-purple-500/20 to-pink-600/20 border-purple-500/30 hover:border-purple-400/50' : 'bg-purple-50 border-purple-200 hover:border-purple-300 hover:bg-purple-100'}`}>
                    <BarChart3 className={`h-6 w-6 mb-2 ${isDarkMode ? 'text-purple-400 group-hover:text-purple-300' : 'text-purple-600 group-hover:text-purple-700'}`} />
                    <p className={`text-sm font-medium ${isDarkMode ? 'text-purple-300' : 'text-purple-700'}`}>View Metrics</p>
                  </button>
                  <button className={`p-4 rounded-xl border transition-all duration-300 group ${isDarkMode ? 'bg-gradient-to-r from-orange-500/20 to-red-600/20 border-orange-500/30 hover:border-orange-400/50' : 'bg-orange-50 border-orange-200 hover:border-orange-300 hover:bg-orange-100'}`}>
                    <Database className={`h-6 w-6 mb-2 ${isDarkMode ? 'text-orange-400 group-hover:text-orange-300' : 'text-orange-600 group-hover:text-orange-700'}`} />
                    <p className={`text-sm font-medium ${isDarkMode ? 'text-orange-300' : 'text-orange-700'}`}>System Logs</p>
                  </button>
                </div>
              </div>

              <div className={`rounded-2xl p-6 border ${isDarkMode ? 'bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm border-gray-700/50' : 'bg-white border-gray-200 shadow-lg'}`}>
                <h3 className={`text-xl font-semibold mb-4 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  <Activity className="h-5 w-5 text-blue-500" />
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
      
      case 'Agents':
        return <AgentsTab />;
      
      case 'Phone Numbers':
        return <PhoneNumbersTab />;
      
      case 'SMS':
        return <SMSTab />;
      
      case 'WhatsApp':
        return <WhatsAppTab />;
      
      default:
        return (
          <div className="max-w-7xl mx-auto">
            <div className={`rounded-2xl p-8 border ${isDarkMode ? 'bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm border-gray-700/50 text-white' : 'bg-white border-gray-200 text-gray-900 shadow-lg'}`}>
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-gradient-to-r from-gray-600 to-gray-800 rounded-xl">
                  <Settings className="h-6 w-6 text-gray-300" />
                </div>
                <h2 className={`text-2xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{activeNavItem}</h2>
              </div>
              <p className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>This section is under development and will be available soon.</p>
            </div>
          </div>
        );
    }
  };

  if (loggingOut) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', width: '100vw', background: isDarkMode ? '#111827' : 'white', zIndex: 9999, position: 'fixed', top: 0, left: 0 }}>
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-green-500/20 border-t-green-500 rounded-full animate-spin"></div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-green-400 rounded-full animate-spin" style={{ animationDuration: '1.5s' }}></div>
          </div>
          <p className={`mt-6 font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Logging out...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={`flex h-screen ${isDarkMode ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-black' : 'bg-gray-50'}`}>
        {/* Sidebar */}
        <div className={`${sidebarOpen ? 'w-72' : 'w-20'} ${isDarkMode ? 'bg-gray-900/80 backdrop-blur-xl text-white border-r border-gray-700/50' : 'bg-white text-gray-900 border-r border-gray-200'} transition-all duration-300 ease-in-out flex flex-col`}>
          {/* Logo */}
          <div className={`p-6 ${isDarkMode ? 'border-b border-gray-700/50' : 'border-b border-gray-200'}`}>
            <div className="flex items-center">
              <div className="h-10 w-10 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg">D</span>
              </div>
              {sidebarOpen && (
                <div className="ml-4">
                  <span className="text-xl font-bold bg-gradient-to-r from-green-500 to-emerald-600 bg-clip-text text-transparent">Developer</span>
                  <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Control Center</p>
                </div>
              )}
            </div>
          </div>

          {/* User Info */}
          {sidebarOpen && (
            <div className={`p-4 ${isDarkMode ? 'border-b border-gray-700/50' : 'border-b border-gray-200'}`}>
              <div className="flex items-center">
                <div className="h-10 w-10 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-sm">
                    {(user?.firstName || localStorage.getItem('pendingFirstName'))?.[0]}{(user?.lastName || localStorage.getItem('pendingLastName'))?.[0]}
                  </span>
                </div>
                <div className="ml-3">
                  <p className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {user?.firstName || localStorage.getItem('pendingFirstName')} {user?.lastName || localStorage.getItem('pendingLastName')}
                  </p>

                  <p className="text-xs text-green-600 font-medium">Developer</p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex-1 overflow-y-auto py-4">
            {navigationItems.map((category, categoryIndex) => (
              <div key={categoryIndex} className="mb-6">
                {sidebarOpen && (
                  <h3 className={`px-4 text-xs font-semibold uppercase tracking-wider mb-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {category.category}
                  </h3>
                )}
                {category.items.map((item, itemIndex) => {
                  const Icon = item.icon;
                  const isActive = activeNavItem === item.name;
                  return (
                    <button
                      key={itemIndex}
                      onClick={() => handleNavItemClick(item.name)}
                      className={`w-full flex items-center px-4 py-3 text-sm font-medium transition-all duration-300 ${
                        isActive
                          ? `bg-gradient-to-r ${item.color} text-white shadow-lg`
                          : isDarkMode 
                            ? 'text-gray-300 hover:bg-gray-800/50 hover:text-white'
                            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                      }`}
                    >
                      <Icon className="h-5 w-5 flex-shrink-0" />
                      {sidebarOpen && (
                        <span className="ml-3">{item.name}</span>
                      )}
                      {isActive && sidebarOpen && (
                        <div className="ml-auto w-2 h-2 bg-white rounded-full"></div>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Bottom Section */}
          {sidebarOpen && (
            <div className={`p-4 ${isDarkMode ? 'border-t border-gray-700/50' : 'border-t border-gray-200'}`}>
              <div className="flex items-center justify-between mb-3">
                <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>System Status</span>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-xs text-green-600 font-medium">Online</span>
                </div>
              </div>
              <button 
                onClick={async () => {
                  try {
                    setLoggingOut(true);
                    // Clear chat history before logout
                    localStorage.removeItem('chatMessages');
                    await logout(true);
                    // Redirect to login page
                    window.location.href = '/login';
                  } catch (error) {
                    console.error('Logout error:', error);
                    setLoggingOut(false);
                    // Force redirect even if logout fails
                    window.location.href = '/login';
                  }
                }}
                className={`w-full text-sm py-3 rounded-xl transition-all duration-300 flex items-center justify-center border ${isDarkMode ? 'bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30 hover:border-red-400/50' : 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100 hover:border-red-300'}`}
              >
                <LogOut className="h-4 w-4 mr-2" />
                {loggingOut ? 'Logging out...' : 'Logout'}
              </button>
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top Header */}
          <header className={`${isDarkMode ? 'bg-gray-900/80 backdrop-blur-xl border-b border-gray-700/50' : 'bg-white border-b border-gray-200'} px-6 py-4`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className={`p-2 rounded-xl transition-all duration-300 ${isDarkMode ? 'hover:bg-gray-800/50 text-gray-300 hover:text-white' : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'}`}
                >
                  <ArrowLeft className={`h-5 w-5 transition-transform duration-300 ${sidebarOpen ? 'rotate-0' : 'rotate-180'}`} />
                </button>
                <h1 className={`ml-4 text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{activeNavItem}</h1>
              </div>
              <div className="flex items-center space-x-4">
                                 {/* Chat Icon */}
                 <button
                   onClick={() => {
                     setChatOpen(!chatOpen);
                     // Clear new message notification when opening chat
                     if (!chatOpen) {
                       setHasNewMessages(false);
                     }
                   }}
                                       className={`relative p-3 rounded-xl transition-all duration-300 group ${isDarkMode ? 'hover:bg-gradient-to-r hover:from-green-500/20 hover:to-blue-500/20 text-green-400 hover:text-green-300' : 'hover:bg-gradient-to-r hover:from-green-100 hover:to-blue-100 text-green-600 hover:text-green-700'}`}
                                       title="Chat with Sales Agent (Ctrl+K)"
                 >
                                       <div className={`absolute inset-0 rounded-xl bg-gradient-to-r from-green-500/10 to-blue-500/10 opacity-100 transition-opacity duration-300 ${isDarkMode ? 'from-green-500/20 to-blue-500/20' : 'from-green-100 to-blue-100'}`} />
                                       <ChatIcon className="h-5 w-5 relative z-10 text-current" />
                    
                    {/* Message count indicator */}
                   {(() => {
                     try {
                       const savedMessages = localStorage.getItem('chatMessages');
                       if (savedMessages) {
                         const parsed = JSON.parse(savedMessages);
                         const messageCount = parsed.length;
                         // Only show count if there are messages and more than just the welcome message
                         if (messageCount > 1) {
                           return (
                             <div className={`absolute -bottom-1 -right-1 min-w-[20px] h-5 px-1 rounded-full text-xs font-medium flex items-center justify-center ${isDarkMode ? 'bg-blue-500 text-white' : 'bg-blue-600 text-white'}`}>
                               {messageCount}
                             </div>
                           );
                         }
                       }
                     } catch (error) {
                       console.error('Error getting message count:', error);
                     }
                     return null;
                   })()}
                 </button>
                
                {/* Theme Toggle */}
                <button
                  onClick={toggleTheme}
                  className={`p-2 rounded-xl transition-all duration-300 ${isDarkMode ? 'hover:bg-gray-800/50 text-gray-300 hover:text-white' : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'}`}
                >
                  {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                </button>
                
                <div className={`px-4 py-2 rounded-xl border ${isDarkMode ? 'bg-gradient-to-r from-green-500/20 to-emerald-600/20 backdrop-blur-sm border-green-500/30' : 'bg-green-50 border-green-200'}`}>
                  <span className={`text-sm font-medium ${isDarkMode ? 'text-green-400' : 'text-green-700'}`}>Developer Access</span>
                </div>
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className={`transition-colors duration-300 ${isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
                  >
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                      <span className="text-white text-lg font-bold">
                        {(user?.firstName || localStorage.getItem('pendingFirstName'))?.[0]}{(user?.lastName || localStorage.getItem('pendingLastName'))?.[0]}
                      </span>
                    </div>
                  </button>
                  {dropdownOpen && (
                    <>
                      {/* Backdrop overlay */}
                      <div 
                        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
                        onClick={() => setDropdownOpen(false)}
                      />
                      {/* Dropdown */}
                      <div className={`fixed top-20 right-6 w-80 max-w-[calc(100vw-3rem)] rounded-2xl shadow-2xl z-50 animate-fade-in-down ${isDarkMode ? 'bg-gray-800/95 backdrop-blur-xl border border-gray-700/50' : 'bg-white border border-gray-200'}`} style={{ right: '1.5rem', maxWidth: 'calc(100vw - 3rem)' }}>
                        <div className={`p-6 ${isDarkMode ? 'border-b border-gray-700/50' : 'border-b border-gray-200'}`}>
                          <p className={`font-bold text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {user?.firstName || localStorage.getItem('pendingFirstName')} {user?.lastName || localStorage.getItem('pendingLastName')}
                          </p>

                          <p className={`mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{user?.email}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            <p className={`text-sm font-medium ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>Developer</p>
                          </div>
                        </div>
                        <nav className="p-4">
                          <button
                            onClick={async () => {
                              try {
                                setLoggingOut(true);
                                // Clear chat history before logout
                                localStorage.removeItem('chatMessages');
                                await logout(true);
                                // Redirect to login page
                                window.location.href = '/login';
                              } catch (error) {
                                console.error('Logout error:', error);
                                setLoggingOut(false);
                                // Force redirect even if logout fails
                                window.location.href = '/login';
                              }
                            }}
                            className={`w-full flex items-center px-4 py-3 rounded-xl transition-all duration-300 group ${isDarkMode ? 'text-red-400 hover:bg-red-500/10 hover:text-red-300' : 'text-red-600 hover:bg-red-50 hover:text-red-700'}`}
                          >
                            <LogOut className="h-5 w-5 mr-3" />
                            {loggingOut ? 'Logging out...' : 'Log out'}
                          </button>
                        </nav>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </header>

          {/* Main Content Area */}
          <main className="flex-1 overflow-y-auto p-6">
            {renderContent()}
          </main>
        </div>
        
        {/* Chat Sidebar */}
        {chatOpen && (
          <>
            {/* Backdrop overlay */}
            <div 
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
              onClick={() => setChatOpen(false)}
            />
            {/* Chat Sidebar */}
            <div className={`fixed top-0 right-0 h-full w-96 max-w-[90vw] ${isDarkMode ? 'bg-gray-800/95 backdrop-blur-xl border-l border-gray-700/50' : 'bg-white border-l border-gray-200'} shadow-2xl z-50 transform transition-transform duration-300 ${chatOpen ? 'translate-x-0' : 'translate-x-full'}`}>
              <ChatSidebar onClose={() => setChatOpen(false)} />
            </div>
          </>
        )}
      </div>
      <style jsx global>{`
        @keyframes fade-in-down {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-down {
          animation: fade-in-down 0.2s ease-out;
        }
      `}</style>
    </>
  );
}
