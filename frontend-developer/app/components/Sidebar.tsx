'use client';

import React, { useEffect, useRef, useState } from 'react';
import { 
  Sun, 
  Moon, 
  LogOut, 
  User as UserIcon, 
  ChevronLeft, 
  ChevronRight,
  Phone,
  MessageSquare,
  Mail,
  BookOpen,
  Settings,
  Bot
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuthInfo } from '@propelauth/react';

interface SidebarProps {
  activeTab: string;
  onChange: (tab: string) => void;
  onLogout: () => Promise<void> | void;
  navigationItems?: Array<{ name: string; icon: any; color: string }>;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export default function Sidebar({
  activeTab,
  onChange,
  onLogout,
  navigationItems = [],
  isCollapsed,
  onToggleCollapse
}: SidebarProps) {
  const { user, userClass } = useAuthInfo();
  const { isDarkMode, toggleTheme } = useTheme();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [organizationName, setOrganizationName] = useState<string>('');
  const [isHovered, setIsHovered] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Sidebar is open if manually pinned (!isCollapsed) OR hovered
  const isSidebarOpen = !isCollapsed || isHovered;

  useEffect(() => {
    if (userClass) {
      const orgs = userClass.getOrgs?.() || [];
      if (orgs.length > 0) {
        const org = orgs[0] as any;
        const orgName = org.orgName || org.name || '';
        setOrganizationName(orgName);
      } else {
        setOrganizationName('My Organization');
      }
    } else {
      setOrganizationName('My Organization');
    }
  }, [userClass]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }

    function handleEscapeKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setDropdownOpen(false);
      }
    }

    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscapeKey);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [dropdownOpen]);

  return (
    <div 
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`fixed left-0 top-0 h-full z-50 transition-all duration-500 ease-out shadow-2xl will-change-[width] ${
        isSidebarOpen ? 'w-64' : 'w-20'
      } ${isDarkMode ? 'bg-gray-900 border-r border-gray-700' : 'bg-white border-r border-gray-200'} hidden lg:flex flex-col`}
      style={{ transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)' }}
    >
      {/* Header Section */}
      {/* Added relative positioning to container to help anchor the toggle button */}
      <div className={`relative p-4 h-20 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} flex items-center transition-all duration-500 ease-out ${!isSidebarOpen ? 'justify-center' : 'justify-between'}`}>
        {/* Organization Logo/Name Container */}
        <div className={`flex items-center gap-3 overflow-hidden transition-all duration-500 ease-out will-change-[opacity,width] ${isSidebarOpen ? 'opacity-100 max-w-full' : 'opacity-0 max-w-0 w-0'}`}>
          {isSidebarOpen && (
            <>
              <div className="h-10 w-10 flex-shrink-0 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg">
                  {organizationName.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="whitespace-nowrap">
                <span className="text-lg font-bold bg-gradient-to-r from-green-500 to-emerald-600 bg-clip-text text-transparent">
                  {organizationName || 'Organization'}
                </span>
                <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'} text-xs`}>Dashboard</p>
              </div>
            </>
          )}
        </div>

        {/* Collapsed State Logo */}
        {/* FIX 1: Removed 'absolute'. It now sits in the flow, centered by the parent's justify-center */}
        <div className={`h-10 w-10 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg z-10 transition-all duration-500 ease-out ${
          !isSidebarOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none absolute'
        }`}>
          <span className="text-white font-bold text-lg">
            {organizationName.charAt(0).toUpperCase()}
          </span>
        </div>

        {/* Collapse Toggle Button */}
        <button
          onClick={onToggleCollapse}
          className={`p-1.5 rounded-full transition-all duration-500 ease-out shadow-md z-50 will-change-transform ${
            isDarkMode 
              ? 'hover:bg-gray-700 text-gray-300 hover:text-white bg-gray-800' 
              : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900 bg-white border border-gray-200'
          } ${isSidebarOpen ? 'ml-auto translate-x-0' : 'absolute top-2 -right-3'}`}
          title={isCollapsed ? "Pin Sidebar Open" : "Unpin Sidebar"}
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4 transition-transform duration-500 ease-out" /> : <ChevronLeft className="h-4 w-4 transition-transform duration-500 ease-out" />}
        </button>
      </div>

      {/* Navigation Items */}
      <div className="flex-1 py-4 overflow-y-auto pb-48 overflow-x-hidden">
        <nav className="space-y-1"> 
          {navigationItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = activeTab === item.name;

            return (
              <button
                key={item.name}
                onClick={() => onChange(item.name)}
                className={`w-full flex items-center transition-all duration-500 ease-out group will-change-[padding,background-color] ${
                  isActive
                    ? `bg-green-600 text-white shadow-xl ${!isSidebarOpen ? 'rounded-none' : 'rounded-xl'} border-r-4 border-emerald-400`
                    : isDarkMode
                      ? 'text-gray-300 hover:bg-gray-800 hover:text-white rounded-xl'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 rounded-xl'
                } ${!isSidebarOpen 
                      ? 'justify-center py-4 px-0' // FIX 2: Removed horizontal padding (px-0) to ensure perfect centering
                      : 'gap-3 px-5 py-3' 
                    }`}
                title={!isSidebarOpen ? item.name : undefined}
              >
                <IconComponent className={`h-5 w-5 flex-shrink-0 transition-all duration-500 ease-out ${
                  isActive 
                    ? 'text-white scale-110' 
                    : isDarkMode 
                      ? 'text-gray-400 group-hover:text-white group-hover:scale-110' 
                      : 'text-gray-500 group-hover:text-gray-700 group-hover:scale-110'
                }`} />

                {/* Label */}
                <span className={`text-sm font-medium truncate transition-all duration-500 ease-out will-change-[opacity,width,margin] ${
                  isSidebarOpen ? 'opacity-100 ml-0 max-w-full' : 'opacity-0 max-w-0 w-0 p-0 m-0 overflow-hidden'
                }`}>
                  {item.name}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Section */}
      <div className={`absolute bottom-0 left-0 right-0 p-4 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}>
        {/* Theme Toggle */}
        <div className="mb-4">
          <button
            onClick={toggleTheme}
            className={`w-full flex items-center rounded-xl transition-all duration-500 ease-out will-change-[padding,background-color] ${
              isDarkMode 
                ? 'hover:bg-gray-800 text-gray-300 hover:text-white' 
                : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
            } ${!isSidebarOpen ? 'justify-center py-3 px-0' : 'gap-3 px-3 py-3'}`}
            title={!isSidebarOpen ? (isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode') : undefined}
          >
            {isDarkMode ? <Sun className="h-5 w-5 flex-shrink-0 text-yellow-300 transition-transform duration-500 ease-out hover:rotate-180" /> : <Moon className="h-5 w-5 flex-shrink-0 transition-transform duration-500 ease-out hover:rotate-12" />}
            <span className={`text-sm font-medium transition-all duration-500 ease-out will-change-[opacity,width] ${
               isSidebarOpen ? 'opacity-100 max-w-full' : 'opacity-0 max-w-0 w-0 overflow-hidden'
            }`}>
              {isDarkMode ? 'Light Mode' : 'Dark Mode'}
            </span>
          </button>
        </div>

        {/* Account Settings and Logout */}
        <div className="space-y-1">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (typeof window !== 'undefined' && window.location) {
                window.location.assign('/account');
              }
              setDropdownOpen(false);
            }}
            className={`w-full flex items-center rounded-xl transition-all duration-500 ease-out will-change-[padding,background-color] ${
              isDarkMode 
                ? 'text-gray-300 hover:bg-blue-500/10 hover:text-blue-300' 
                : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700'
            } ${!isSidebarOpen ? 'justify-center py-3 px-0' : 'gap-3 px-3 py-3'}`}
            title={!isSidebarOpen ? 'Account Settings' : undefined}
          >
            <UserIcon className="h-5 w-5 flex-shrink-0 transition-transform duration-500 ease-out hover:scale-110" />
            <span className={`text-sm font-medium transition-all duration-500 ease-out will-change-[opacity,width] ${
               isSidebarOpen ? 'opacity-100 max-w-full' : 'opacity-0 max-w-0 w-0 overflow-hidden'
            }`}>
              Account Settings
            </span>
          </button>

          <button
            onClick={async () => {
              try {
                setIsLoggingOut(true);
                await onLogout();
              } finally {
                setIsLoggingOut(false);
              }
            }}
            className={`w-full flex items-center rounded-xl transition-all duration-500 ease-out will-change-[padding,background-color] ${
              isDarkMode 
                ? 'text-red-400 hover:bg-red-500/10 hover:text-red-300' 
                : 'text-red-600 hover:bg-red-50 hover:text-red-700'
            } ${!isSidebarOpen ? 'justify-center py-3 px-0' : 'gap-3 px-3 py-3'}`}
            title={!isSidebarOpen ? 'Logout' : undefined}
          >
            <LogOut className="h-5 w-5 flex-shrink-0 transition-transform duration-500 ease-out hover:scale-110" />
            <span className={`text-sm font-medium transition-all duration-500 ease-out will-change-[opacity,width] ${
               isSidebarOpen ? 'opacity-100 max-w-full' : 'opacity-0 max-w-0 w-0 overflow-hidden'
            }`}>
              {isLoggingOut ? 'Logging out...' : 'Logout'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
