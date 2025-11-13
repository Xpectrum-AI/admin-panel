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
  Globe,
  Mail,
  BookOpen,
  Settings,
  Bot,
  Building2
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
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Get organization name from user context
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
    <div className={`fixed left-0 top-0 h-full z-50 transition-all duration-300 shadow-2xl ${
      isCollapsed ? 'w-20' : 'w-64'
    } ${isDarkMode ? 'bg-gray-900 border-r border-gray-700' : 'bg-white border-r border-gray-200'} hidden lg:flex flex-col`}>
      
      {/* Header Section */}
      <div className={`p-4 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
        
        {/* Organization Logo/Name */}
        {!isCollapsed && (
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-lg">
                {organizationName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <span className="text-lg font-bold bg-gradient-to-r from-green-500 to-emerald-600 bg-clip-text text-transparent">
                {organizationName || 'Organization Name'}
              </span>
              <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'} text-xs`}>Dashboard</p>
            </div>
          </div>
        )}
        
        {isCollapsed && (
          <div className="h-10 w-10 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-lg">
              {organizationName.charAt(0).toUpperCase()}
            </span>
          </div>
        )}

        {/* Collapse Toggle Button */}
        <button
          onClick={onToggleCollapse}
          className={`p-1.5 rounded-full transition-all duration-300 shadow-md ${
            isDarkMode 
              ? 'hover:bg-gray-700 text-gray-300 hover:text-white bg-gray-800' 
              : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900 bg-white border border-gray-200'
          } ${!isCollapsed ? 'ml-auto' : 'absolute top-4 -right-3' }`}
          aria-label={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Navigation Items (WIDER BACKGROUND FIX HERE) */}
      <div className="flex-1 py-4 overflow-y-auto pb-48">
        {/* Removed px-3 from nav to allow buttons to span full width */}
        <nav className="space-y-1"> 
          {navigationItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = activeTab === item.name;
            
            return (
              <button
                key={item.name}
                onClick={() => onChange(item.name)}
                className={`w-full flex items-center transition-all duration-300 group ${
                  // Conditional styling for active state (wider background)
                  isActive
                    ? `bg-green-600 text-white shadow-xl ${isCollapsed ? 'rounded-l-none' : 'rounded-xl'} border-r-4 border-emerald-400` // Border for extra visual pop
                    : isDarkMode
                      ? 'text-gray-300 hover:bg-gray-800 hover:text-white rounded-xl'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 rounded-xl'
                } ${isCollapsed 
                      ? 'justify-center py-4 px-3' // Centered icon in collapsed state
                      : 'gap-3 px-5 py-3' // Proper padding and gap for expanded state
                    }`}
                title={isCollapsed ? item.name : undefined}
              >
                <IconComponent className={`h-5 w-5 flex-shrink-0 ${
                  isActive 
                    ? 'text-white' 
                    : isDarkMode 
                      ? 'text-gray-400 group-hover:text-white' 
                      : 'text-gray-500 group-hover:text-gray-700'
                }`} />
                {!isCollapsed && (
                  <span className="text-sm font-medium truncate">{item.name}</span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Section - Absolute positioned at bottom */}
      <div className={`absolute bottom-0 left-0 right-0 p-4 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}>
        
        {/* Theme Toggle */}
        <div className="mb-4">
          <button
            onClick={toggleTheme}
            className={`w-full flex items-center rounded-xl transition-all duration-300 ${
              isDarkMode 
                ? 'hover:bg-gray-800 text-gray-300 hover:text-white' 
                : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
            } ${isCollapsed ? 'justify-center py-3' : 'gap-3 px-3 py-3'}`}
            title={isCollapsed ? (isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode') : undefined}
          >
            {isDarkMode ? <Sun className="h-5 w-5 flex-shrink-0 text-yellow-300" /> : <Moon className="h-5 w-5 flex-shrink-0" />}
            {!isCollapsed && (
              <span className="text-sm font-medium">
                {isDarkMode ? 'Light Mode' : 'Dark Mode'}
              </span>
            )}
          </button>
        </div>

        {/* Account Settings and Logout */}
        <div className="space-y-1">
          {/* Account Settings Button */}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (typeof window !== 'undefined' && window.location) {
                window.location.assign('/account');
              }
              setDropdownOpen(false);
            }}
            className={`w-full flex items-center rounded-xl transition-all duration-300 ${
              isDarkMode 
                ? 'text-gray-300 hover:bg-blue-500/10 hover:text-blue-300' 
                : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700'
            } ${isCollapsed ? 'justify-center py-3' : 'gap-3 px-3 py-3'}`}
            title={isCollapsed ? 'Account Settings' : undefined}
          >
            <UserIcon className="h-5 w-5 flex-shrink-0" />
            {!isCollapsed && <span className="text-sm font-medium">Account Settings</span>}
          </button>

          {/* Logout Button */}
          <button
            onClick={async () => {
              try {
                setIsLoggingOut(true);
                await onLogout();
              } finally {
                setIsLoggingOut(false);
              }
            }}
            className={`w-full flex items-center rounded-xl transition-all duration-300 ${
              isDarkMode 
                ? 'text-red-400 hover:bg-red-500/10 hover:text-red-300' 
                : 'text-red-600 hover:bg-red-50 hover:text-red-700'
            } ${isCollapsed ? 'justify-center py-3' : 'gap-3 px-3 py-3'}`}
            title={isCollapsed ? 'Logout' : undefined}
          >
            <LogOut className="h-5 w-5 flex-shrink-0" />
            {!isCollapsed && (
              <span className="text-sm font-medium">
                {isLoggingOut ? 'Logging out...' : 'Logout'}
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
