'use client';

import React, { useState } from 'react';
import { Menu, X, Building2, Bot, Phone, MessageSquare, Globe, Mail, BookOpen, Sun, Moon, User, LogOut } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface MobileNavProps {
  activeTab: string;
  onChange: (tab: string) => void;
  onLogout: () => Promise<void> | void;
  navigationItems: Array<{ name: string; icon: any; color: string }>;
  organizationName: string;
}

export default function MobileNav({
  activeTab,
  onChange,
  onLogout,
  navigationItems,
  organizationName
}: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { isDarkMode, toggleTheme } = useTheme();

  const handleNavClick = (tab: string) => {
    onChange(tab);
    setIsOpen(false);
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`p-3 rounded-xl transition-all duration-300 ${
            isDarkMode 
              ? 'bg-gray-800 text-white hover:bg-gray-700' 
              : 'bg-white text-gray-900 hover:bg-gray-100'
          } shadow-lg border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}
        >
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div 
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={() => setIsOpen(false)}
          />
          <div className={`absolute left-0 top-0 h-full w-80 max-w-[85vw] ${
            isDarkMode ? 'bg-gray-900' : 'bg-white'
          } shadow-xl`}>
            {/* Header */}
            <div className={`p-4 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
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
                  <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'} text-xs`}>Organization</p>
                </div>
              </div>
            </div>

            {/* Navigation Items */}
            <div className="p-4">
              <nav className="space-y-2">
                {navigationItems.map((item) => {
                  const IconComponent = item.icon;
                  const isActive = activeTab === item.name;
                  
                  return (
                    <button
                      key={item.name}
                      onClick={() => handleNavClick(item.name)}
                      className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-300 ${
                        isActive
                          ? 'bg-green-600 text-white shadow-lg'
                          : isDarkMode
                            ? 'text-gray-300 hover:bg-gray-800 hover:text-white'
                            : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                      }`}
                    >
                      <IconComponent className="h-5 w-5 flex-shrink-0" />
                      <span className="text-sm font-medium">{item.name}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Bottom Section */}
            <div className={`absolute bottom-0 left-0 right-0 p-4 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-300 mb-2 ${
                  isDarkMode 
                    ? 'hover:bg-gray-800 text-gray-300 hover:text-white' 
                    : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
                }`}
              >
                {isDarkMode ? <Sun className="h-5 w-5 flex-shrink-0" /> : <Moon className="h-5 w-5 flex-shrink-0" />}
                <span className="text-sm font-medium">
                  {isDarkMode ? 'Light Mode' : 'Dark Mode'}
                </span>
              </button>

              {/* Account Settings and Logout */}
              <div className="space-y-1">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (typeof window !== 'undefined' && window.location) {
                      window.location.assign('/account');
                    }
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-300 ${
                    isDarkMode 
                      ? 'text-gray-300 hover:bg-blue-500/10 hover:text-blue-300' 
                      : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700'
                  }`}
                >
                  <User className="h-5 w-5 flex-shrink-0" />
                  <span className="text-sm font-medium">Account Settings</span>
                </button>

                <button
                  onClick={async () => {
                    try {
                      await onLogout();
                    } finally {
                      setIsOpen(false);
                    }
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-300 ${
                    isDarkMode 
                      ? 'text-red-400 hover:bg-red-500/10 hover:text-red-300' 
                      : 'text-red-600 hover:bg-red-50 hover:text-red-700'
                  }`}
                >
                  <LogOut className="h-5 w-5 flex-shrink-0" />
                  <span className="text-sm font-medium">Logout</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
