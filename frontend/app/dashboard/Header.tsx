"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Search, Bell, User as UserIcon, Settings, LogOut, Building2, Bot, CreditCard } from 'lucide-react';
import { useAuthInfo, useLogoutFunction } from '@propelauth/react';

export default function Header() {
  const [dropdownOpen, setDropdownOpen] = useState(false);
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
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
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
                <Link
                  href="/agents"
                  className="flex items-center px-4 py-2 text-gray-700 rounded-md hover:bg-gray-100"
                >
                  <Bot className="h-5 w-5 mr-3" />
                  Agent Management
                </Link>
                <Link
                  href="/billing"
                  className="flex items-center px-4 py-2 text-gray-700 rounded-md hover:bg-gray-100"
                >
                  <CreditCard className="h-5 w-5 mr-3" />
                  Billing & Payments
                </Link>
                <Link
                  href="/settings"
                  className="flex items-center px-4 py-2 text-gray-700 rounded-md hover:bg-gray-100"
                >
                  <Settings className="h-5 w-5 mr-3" />
                  Settings
                </Link>
                <button
                  onClick={() => logout(true)}
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