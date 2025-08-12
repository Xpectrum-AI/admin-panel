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
    <header className="flex items-center justify-between bg-white p-4 border-b border-gray-200">
      <div className="flex items-center">
        <Link href="/dashboard" className="flex items-center space-x-2">
          <div className="h-8 w-8 rounded-lg bg-gray-900 flex items-center justify-center text-white font-bold text-lg">
            D
          </div>
          <span className="text-xl font-semibold text-gray-800">Dashboard</span>
        </Link>
      </div>
      <div className="flex-1 flex justify-center px-8">
        <div className="flex items-center space-x-1 border border-gray-300 rounded-lg p-1">
          <button
            onClick={() => onTabChange?.('doctors')}
            className={`justify-center whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 h-9 rounded-md flex items-center gap-2 px-3 py-2 ${
              activeTab === 'doctors' ? 'bg-gray-200 text-gray-900 hover:bg-gray-300 shadow-sm' : 'hover:bg-accent hover:text-accent-foreground'
            }`}
          >
            <Stethoscope className="h-4 w-4" />
            Doctors
          </button>
          <button
            onClick={() => onTabChange?.('calendar')}
            className={`justify-center whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:bg-accent hover:text-accent-foreground h-9 rounded-md flex items-center gap-2 px-3 py-2 ${
              activeTab === 'calendar' ? 'bg-gray-200 text-gray-900 hover:bg-gray-300 shadow-sm' : ''
            }`}
          >
            <CalendarDays className="h-4 w-4" />
            Calendar
          </button>
          <button
            onClick={() => onTabChange?.('agents')}
            className={`justify-center whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 h-9 rounded-md flex items-center gap-2 px-3 py-2 ${
              activeTab === 'agents' ? 'bg-gray-200 text-gray-900 hover:bg-gray-300 shadow-sm' : 'hover:bg-accent hover:text-accent-foreground'
            }`}
          >
            <Bot className="h-4 w-4" />
            Agents
          </button>
         
        </div>
      </div>
      <div className="flex items-center space-x-4">
        <button className="text-gray-500 hover:text-gray-800">
          <Bell className="h-6 w-6" />
        </button>
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="text-gray-500 hover:text-gray-800"
          >
            <div className="h-8 w-8 rounded-full bg-gray-900 flex items-center justify-center">
              <span className="text-white text-lg font-bold">
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </span>
            </div>
          </button>
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-100 z-10 animate-fade-in-down">
              <div className="p-4 border-b border-gray-200">
                <p className="font-bold text-gray-800">{user?.firstName} {user?.lastName}</p>
                <p className="text-sm text-gray-500">{user?.email}</p>
              </div>
              <nav className="p-2">
                <Link
                  href="/account"
                  className="flex items-center px-4 py-2 text-gray-700 rounded-md hover:bg-gray-100"
                >
                  <UserIcon className="h-5 w-5 mr-3" />
                  Account
                </Link>
                <Link
                  href="/workspace"
                  className="flex items-center px-4 py-2 text-gray-700 rounded-md hover:bg-gray-100"
                >
                  <Building2 className="h-5 w-5 mr-3" />
                  Workspace
                </Link>
                {/* <Link
                  href="/billing"
                  className="flex items-center px-4 py-2 text-gray-700 rounded-md hover:bg-gray-100"
                >
                  <CreditCard className="h-5 w-5 mr-3" />
                  Billing & Payments
                </Link> */}
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
                  className="w-full flex items-center px-4 py-2 text-red-500 rounded-md hover:bg-red-50"
                >
                  <LogOut className="h-5 w-5 mr-3" />
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