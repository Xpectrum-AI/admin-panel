"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Bell, User as UserIcon, LogOut, Building2, Bot, CalendarDays, User, Stethoscope } from 'lucide-react';
import { useAuthInfo, useLogoutFunction } from '@propelauth/react';
import { SyncLoader } from 'react-spinners';

interface HeaderProps {
  activeTab?: 'calendar' | 'agents' | 'doctors';
  onTabChange?: (tab: 'calendar' | 'agents' | 'doctors') => void;
}

export default function Header({ activeTab = 'calendar', onTabChange }: HeaderProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user } = useAuthInfo();
  const logout = useLogoutFunction();

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

  if (loggingOut) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', width: '100vw', background: 'white', zIndex: 9999, position: 'fixed', top: 0, left: 0 }}>
        <SyncLoader size={15} color="#000000" />
      </div>
    );
  }

  return (
    <header className="flex items-center justify-between bg-white/95 backdrop-blur-sm p-6 border-b border-gray-200/50 shadow-sm sticky top-0 z-40">
      <div className="flex items-center">
        <Link href="/dashboard" className="flex items-center space-x-3 group">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center text-white font-bold text-lg shadow-lg group-hover:shadow-xl transition-all duration-200">
            D
          </div>
          <span className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors duration-200">Dashboard</span>
        </Link>
      </div>
      <div className="flex-1 flex justify-center px-8">
        <div className="flex items-center space-x-1 bg-gray-100/80 backdrop-blur-sm border border-gray-200/50 rounded-xl p-1.5 shadow-sm">
          <button
            onClick={() => onTabChange?.('doctors')}
            className={`justify-center whitespace-nowrap text-sm font-semibold ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 h-10 rounded-lg flex items-center gap-2 px-4 py-2 ${
              activeTab === 'doctors' ? 'bg-white text-blue-600 shadow-md border border-gray-200' : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
            }`}
          >
            <Stethoscope className="h-4 w-4" />
            Doctors
          </button>
          <button
            onClick={() => onTabChange?.('calendar')}
            className={`justify-center whitespace-nowrap text-sm font-semibold ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 h-10 rounded-lg flex items-center gap-2 px-4 py-2 ${
              activeTab === 'calendar' ? 'bg-white text-blue-600 shadow-md border border-gray-200' : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
            }`}
          >
            <CalendarDays className="h-4 w-4" />
            Calendar
          </button>
          <button
            onClick={() => onTabChange?.('agents')}
            className={`justify-center whitespace-nowrap text-sm font-semibold ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 h-10 rounded-lg flex items-center gap-2 px-4 py-2 ${
              activeTab === 'agents' ? 'bg-white text-blue-600 shadow-md border border-gray-200' : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
            }`}
          >
            <Bot className="h-4 w-4" />
            Agents
          </button>
         
        </div>
      </div>
      <div className="flex items-center space-x-4">
        <button className="text-gray-500 hover:text-gray-800 p-2 rounded-lg hover:bg-gray-100 transition-all duration-200">
          <Bell className="h-5 w-5" />
        </button>
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="text-gray-500 hover:text-gray-800 transition-colors duration-200"
          >
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-200">
              <span className="text-white text-lg font-bold">
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </span>
            </div>
          </button>
          {dropdownOpen && (
            <div className="absolute right-0 mt-3 w-72 bg-white/95 backdrop-blur-sm rounded-xl shadow-xl border border-gray-200/50 z-10 animate-fade-in-down">
              <div className="p-4 border-b border-gray-200/50">
                <p className="font-bold text-gray-900">{user?.firstName} {user?.lastName}</p>
                <p className="text-sm text-gray-500 mt-1">{user?.email}</p>
              </div>
              <nav className="p-2">
                <Link
                  href="/account"
                  className="flex items-center px-4 py-3 text-gray-700 rounded-lg hover:bg-blue-50 hover:text-blue-700 transition-all duration-200 group"
                >
                  <UserIcon className="h-5 w-5 mr-3 text-gray-400 group-hover:text-blue-600 transition-colors duration-200" />
                  Account
                </Link>
                <Link
                  href="/workspace"
                  className="flex items-center px-4 py-3 text-gray-700 rounded-lg hover:bg-blue-50 hover:text-blue-700 transition-all duration-200 group"
                >
                  <Building2 className="h-5 w-5 mr-3 text-gray-400 group-hover:text-blue-600 transition-colors duration-200" />
                  Workspace
                </Link>

                {/* <Link
                  href="/settings"
                  className="flex items-center px-4 py-2 text-gray-700 rounded-md hover:bg-gray-100"
                >
                  <Settings className="h-5 w-5 mr-3" />
                  Settings
                </Link> */}
                <button
                  onClick={() => {
                    setLoggingOut(true);
                    logout(true);
                  }}
                  className="w-full flex items-center px-4 py-3 text-red-600 rounded-lg hover:bg-red-50 hover:text-red-700 transition-all duration-200 group mt-2"
                >
                  <LogOut className="h-5 w-5 mr-3 text-red-400 group-hover:text-red-600 transition-colors duration-200" />
                  Log out
                </button>
              </nav>
            </div>
          )}
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
    </header>
  );
} 