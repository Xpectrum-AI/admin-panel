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
  MessageCircle,
  Sparkles,
  Zap,
  TrendingUp,
  Users,
  Globe,
  Code,
  Database,
  Sun,
  Moon,
  User as UserIcon
} from 'lucide-react';
import { useAuthInfo, useLogoutFunction } from '@propelauth/react';
import { SyncLoader } from 'react-spinners';
import { useRouter } from 'next/navigation';
import { AgentsTab, PhoneNumbersTab, SMSTab, WhatsAppTab, OverviewTab, Navbar } from './components';

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
      { name: 'SMS', icon: MessageCircle, color: 'from-orange-500 to-red-600' },
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
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Profile dropdown state
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user, isLoggedIn } = useAuthInfo();
  const logout = useLogoutFunction();
  const router = useRouter();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
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
        return <OverviewTab isDarkMode={isDarkMode} />;

      case 'Agents':
        return <AgentsTab isDarkMode={isDarkMode} />;



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


        {/* Main Content */}
        <div className="flex-1  flex flex-col overflow-hidden">

          {/* Main Content Area */}
          <main className="flex-1 overflow-y-auto px-4 sm:px-6 py-4">
            <Navbar
              isDarkMode={isDarkMode}
              activeTab={activeNavItem === 'Agents' ? 'Agents' : 'Overview'}
              onChange={(tab) => setActiveNavItem(tab)}
              activeTitle={activeNavItem}
              sidebarOpen={sidebarOpen}
              onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
              onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
              onLogout={async () => {
                try {
                  setLoggingOut(true);
                  await logout(true);
                  window.location.href = '/login';
                } catch (error) {
                  setLoggingOut(false);
                  window.location.href = '/login';
                }
              }}
            />
            <div className="mt-4 rounded-2xl">
              {renderContent()}
            </div>
          </main>
        </div>
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
