'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Sun, Moon, LogOut, User as UserIcon } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuthInfo } from '@propelauth/react';

interface NavbarProps {
    activeTab: string;
    onChange: (tab: string) => void;
    activeTitle: string;
    sidebarOpen: boolean;
    onToggleSidebar: () => void;
    onLogout: () => Promise<void> | void;
    navigationItems?: Array<{ name: string; icon: any; color: string }>;
}

export default function Navbar({
    activeTab,
    onChange,
    onLogout,
    navigationItems = []
}: NavbarProps) {
    // Convert navigationItems to tabs format for the navbar
    const tabs = navigationItems.map(item => ({
        id: item.name,
        label: item.name
    }));

    const { user, userClass } = useAuthInfo();
    const { isDarkMode, toggleTheme } = useTheme();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [organizationName, setOrganizationName] = useState<string>('');
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Get organization name from user context
    useEffect(() => {
        console.log('🔍 Navbar: Fetching organization name...');
        if (userClass) {
            const orgs = userClass.getOrgs?.() || [];
            console.log('🔍 Navbar: Organizations found:', orgs);
            if (orgs.length > 0) {
                const org = orgs[0] as any;
                const orgName = org.orgName || org.name || '';
                console.log('🔍 Navbar: Setting organization name to:', orgName);
                setOrganizationName(orgName);
            } else {
                console.log('⚠️ Navbar: No organizations found, using fallback');
                setOrganizationName('My Organization');
            }
        } else {
            console.log('⚠️ Navbar: userClass not available, using fallback');
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
        <nav className={`w-full sticky top-0 z-[100] ${isDarkMode ? 'bg-gray-900/80 backdrop-blur-xl border-b border-gray-700/50' : 'bg-white border-b border-gray-200'}`}>
            <div className="px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center flex-wrap gap-3 sm:gap-4">
                        <div className="h-10 w-10 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                            <span className="text-white font-bold text-lg">
                                {organizationName.charAt(0).toUpperCase()}
                            </span>
                        </div>
                        <div className="ml-3 sm:ml-4">
                            <span className="text-xl font-bold bg-gradient-to-r from-green-500 to-emerald-600 bg-clip-text text-transparent">
                                {organizationName || 'Organization Name'}
                            </span>
                            <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'} text-xs`}>Organization</p>
                        </div>
                        <div className="ml-0 sm:ml-6 mt-1 sm:mt-0 flex items-center gap-1 overflow-x-auto w-full sm:w-auto">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => onChange(tab.id)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 whitespace-nowrap ${activeTab === tab.id
                                        ? 'bg-green-600 text-white shadow'
                                        : isDarkMode
                                            ? 'text-gray-300 hover:bg-gray-800 hover:text-white'
                                            : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                                        }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center gap-3 sm:gap-4 z-50 w-full sm:w-auto justify-between sm:justify-end">
                        <button
                            onClick={toggleTheme}
                            className={`p-2 rounded-xl transition-all duration-300 ${isDarkMode ? 'hover:bg-gray-800/50 text-gray-300 hover:text-white' : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'}`}
                        >
                            {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                        </button>
                        <div className="relative" ref={dropdownRef}>
                            <button
                                onClick={() => setDropdownOpen(!dropdownOpen)}
                                className={`transition-colors duration-300 ${isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
                            >
                                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                                    <span className="text-white text-lg font-bold">
                                        {(user?.firstName || '')?.[0]}{(user?.lastName || '')?.[0]}
                                    </span>
                                </div>
                            </button>
                            {dropdownOpen && (
                                <div className={`absolute right-0 mt-3 w-[90vw] sm:w-80 max-w-[calc(100vw-2rem)] rounded-2xl shadow-2xl z-[9999] animate-fade-in-down ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`} style={{ zIndex: 9999 }}>
                                    <div className={`p-4 sm:p-6 ${isDarkMode ? 'border-b border-gray-700/50' : 'border-b border-gray-200'}`}>
                                        <p className={`font-bold text-base sm:text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                            {user?.firstName} {user?.lastName}
                                        </p>
                                        <p className={`mt-1 text-sm sm:text-base ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{user?.email}</p>
                                        <div className="flex items-center gap-2 mt-2">
                                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                            <p className={`text-xs sm:text-sm font-medium ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>Developer</p>
                                        </div>
                                        {organizationName && (
                                            <div className="flex items-center gap-2 mt-2">
                                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                                <p className={`text-xs sm:text-sm font-medium ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>{organizationName}</p>
                                            </div>
                                        )}
                                    </div>
                                    <nav className="p-3 sm:p-4">
                                        <button
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                // Use proper navigation without triggering JSDOM warnings
                                                if (typeof window !== 'undefined' && window.location) {
                                                    window.location.assign('/account');
                                                }
                                                setDropdownOpen(false);
                                            }}
                                            className={`w-full flex items-center px-3 sm:px-4 py-2 sm:py-3 rounded-xl transition-all duration-300 group ${isDarkMode ? 'text-gray-300 hover:bg-blue-500/10 hover:text-blue-300' : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700'}`}
                                        >
                                            <UserIcon className={`h-4 w-4 sm:h-5 sm:w-5 mr-2 sm:mr-3 ${isDarkMode ? 'text-gray-400 group-hover:text-blue-400' : 'text-gray-400 group-hover:text-blue-600'} transition-colors duration-300`} />
                                            Account
                                        </button>
                                        <div className={`${isDarkMode ? 'border-gray-700/50' : 'border-gray-200'} my-2 border-t`}></div>
                                        <button
                                            onClick={async () => {
                                                try {
                                                    setIsLoggingOut(true);
                                                    await onLogout();
                                                } finally {
                                                    setIsLoggingOut(false);
                                                }
                                            }}
                                            className={`w-full flex items-center px-3 sm:px-4 py-2 sm:py-3 rounded-xl transition-all duration-300 group ${isDarkMode ? 'text-red-400 hover:bg-red-500/10 hover:text-red-300' : 'text-red-600 hover:bg-red-50 hover:text-red-700'}`}
                                        >
                                            <LogOut className="h-4 w-4 sm:h-5 sm:w-5 mr-2 sm:mr-3" />
                                            {isLoggingOut ? 'Logging out...' : 'Log out'}
                                        </button>
                                    </nav>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
}

