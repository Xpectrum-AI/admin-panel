'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import dynamic from 'next/dynamic';
import {
  Bot,
  Phone,
  BarChart3,
  FileText,
  MessageSquare,
  Clock,
  LogOut,
  User,
  Settings,
  Shield,
  Activity,
  MoreHorizontal,
  Zap,
  Users,
  Database,
  Sun,
  Moon,
  Mail,
  BookOpen
} from 'lucide-react';
import { useAuthInfo, useLogoutFunction } from '@propelauth/react';
import { SyncLoader } from 'react-spinners';
import { useRouter } from 'next/navigation';

import { OrgSetup } from './components';
import Navbar from './components/Navbar';
import ChatSidebar from './components/ChatSidebar';
import MobileNav from './components/MobileNav';
import Sidebar from './components/Sidebar';
import { useTheme } from './contexts/ThemeContext';
import { useTabPersistence } from '../hooks/useTabPersistence';
import { DashboardService, DashboardStats, OrganizationInfo } from '../service/dashboardService';

// Lazy load all tabs with dynamic imports
const AgentsTab = dynamic(() => import('./components/AgentsTab'), {
  ssr: false,
  loading: () => <TabSkeleton />
});

const PhoneNumbersTab = dynamic(() => import('./components/PhoneNumbersTab'), {
  ssr: false,
  loading: () => <TabSkeleton />
});

const SMSTab = dynamic(() => import('./components/SMSTab'), {
  ssr: false,
  loading: () => <TabSkeleton />
});

const WhatsAppTab = dynamic(() => import('./components/WhatsAppTab'), {
  ssr: false,
  loading: () => <TabSkeleton />
});

const GmailTab = dynamic(() => import('./components/GmailTab'), {
  ssr: false,
  loading: () => <TabSkeleton />
});

const KnowledgeBaseTab = dynamic(() => import('./components/knowledge-base/KnowledgeBaseTab'), {
  ssr: false,
  loading: () => <TabSkeleton />
});

const ConversationLogsTab = dynamic(() => import('./components/ConversationLogsTab'), {
  ssr: false,
  loading: () => <TabSkeleton />
});

// Loading skeleton component for tabs
function TabSkeleton() {
  const { isDarkMode } = useTheme();
  return (
    <div className={`max-w-7xl mx-auto ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} min-h-[400px]`}>
      <div className={`rounded-2xl p-8 border ${isDarkMode ? 'bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm border-gray-700/50' : 'bg-white border-gray-200 shadow-lg'}`}>
        <div className="animate-pulse space-y-6">
          <div className="flex items-center gap-4">
            <div className={`h-12 w-12 rounded-xl ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
            <div className="flex-1 space-y-2">
              <div className={`h-6 w-48 rounded ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
              <div className={`h-4 w-32 rounded ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
            </div>
          </div>
          <div className="space-y-3">
            <div className={`h-4 w-full rounded ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
            <div className={`h-4 w-5/6 rounded ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
            <div className={`h-4 w-4/6 rounded ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className={`h-32 rounded-xl ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

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

// Navigation items for top navbar
const navigationItems = [
  { name: 'Agents', icon: Bot, color: 'from-green-500 to-emerald-600' },
  { name: 'Phone Numbers', icon: Phone, color: 'from-green-500 to-emerald-600' },
  { name: 'SMS', icon: MessageSquare, color: 'from-green-500 to-emerald-600' },
  { name: 'WhatsApp', icon: WhatsAppIcon, color: 'from-green-500 to-emerald-600' },
  { name: 'Email', icon: Mail, color: 'from-green-500 to-emerald-600' },
  { name: 'Knowledge Base', icon: BookOpen, color: 'from-green-500 to-emerald-600' },
  { name: 'Conversation Logs', icon: FileText, color: 'from-green-500 to-emerald-600' },
];

export default function DeveloperDashboard() {
  const [activeNavItem, handleNavItemChange] = useTabPersistence<string>('mainNavigation', 'Agents');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);

  const { isDarkMode, toggleTheme } = useTheme();

  // Profile dropdown state
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user, isLoggedIn, userClass, loading } = useAuthInfo();
  const logout = useLogoutFunction();
  const router = useRouter();

  // Organization setup state
  const [showOrgSetup, setShowOrgSetup] = useState(false);
  const [orgs, setOrgs] = useState<any[]>([]);
  const [orgSetupComplete, setOrgSetupComplete] = useState(false);
  const [organizationName, setOrganizationName] = useState<string>('');

  // Dashboard statistics state
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    totalAgents: 0,
    totalPhoneNumbers: 0,
    totalWhatsAppNumbers: 0,
    totalEmails: 0
  });
  const [statsLoading, setStatsLoading] = useState(true);

  // Redirect to login if not authenticated (like main frontend)
  useEffect(() => {
    if (!loading && !isLoggedIn) {
      window.location.href = "/login";
    }
  }, [loading, isLoggedIn]);

  // Don't render anything if not authenticated
  if (!loading && !isLoggedIn) {
    return null;
  }

  // Organization setup logic - only for first-time users
  useEffect(() => {
    if (!loading && userClass) {
      const orgs = userClass.getOrgs?.() || [];
      setOrgs(orgs);

      // Only show organization setup if user has no organizations (first-time user)
      if (orgs.length === 0) {
        setShowOrgSetup(true);
        setOrgSetupComplete(false);
      } else {
        // User already has organization(s), proceed to dashboard
        setShowOrgSetup(false);
        setOrgSetupComplete(true);
      }
    }
  }, [loading, userClass]);

  // Get organization name from user context
  useEffect(() => {
    if (userClass) {
      const orgs = userClass.getOrgs?.() || [];
      if (orgs.length > 0) {
        const org = orgs[0] as any;
        const orgName = org.orgName || org.name || '';
        setOrganizationName(orgName);
      } else {
        setOrganizationName('Organization Name');
      }
    } else {
      setOrganizationName('Organization Name');
    }
  }, [userClass]);

  // Fetch dashboard statistics when organization is available
  useEffect(() => {
    const fetchDashboardStats = async () => {
      if (!loading && userClass && orgSetupComplete) {
        const orgs = userClass.getOrgs?.() || [];
        if (orgs.length > 0) {
          const currentOrg = orgs[0]; // Get the first organization
          const organizationInfo: OrganizationInfo = {
            orgId: currentOrg.orgId,
            orgName: (currentOrg as any).orgName || (currentOrg as any).name
          };

          setStatsLoading(true);
          try {
            // First run debug to see what's happening
            await DashboardService.debugDashboardStats(organizationInfo);

            // Then get the actual stats
            const result = await DashboardService.getDashboardStats(organizationInfo);
            if (result.success && result.data) {
              setDashboardStats(result.data);
            }
          } catch (error) {
          } finally {
            setStatsLoading(false);
          }
        }
      }
    };

    fetchDashboardStats();
  }, [loading, userClass, orgSetupComplete]);

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

  // Handle navigation item click
  const handleNavItemClick = (itemName: string) => {
    handleNavItemChange(itemName);
  };

  // Render content based on active navigation item
  const renderContent = () => {
    switch (activeNavItem) {
      case 'Agents':
        return <AgentsTab />;

      case 'Phone Numbers':
        return <PhoneNumbersTab />;

      case 'SMS':
        return <SMSTab />;

      case 'WhatsApp':
        return <WhatsAppTab />;

      case 'Email':
        return <GmailTab />;

      case 'Knowledge Base':
        return <KnowledgeBaseTab />;

      case 'Conversation Logs':
        // Pass both orgId (UUID) and orgName (name) - agents use orgName
        return <ConversationLogsTab 
          organizationId={orgs.length > 0 ? (orgs[0] as any).orgName || (orgs[0] as any).name || orgs[0].orgId : undefined} 
        />;

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

  // Show loading while checking authentication
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', width: '100vw', background: isDarkMode ? '#111827' : 'white', zIndex: 9999, position: 'fixed', top: 0, left: 0 }}>
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-green-500/20 border-t-green-500 rounded-full animate-spin"></div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-green-400 rounded-full animate-spin" style={{ animationDuration: '1.5s' }}></div>
          </div>
          <p className={`mt-6 font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Loading...</p>
        </div>
      </div>
    );
  }

  // Show organization setup modal only for first-time users
  if (showOrgSetup) {
    return (
      <OrgSetup onOrgCreated={() => {
        setShowOrgSetup(false);
        setOrgSetupComplete(true);
      }} />
    );
  }

  return (
    <>
      <div className={`min-h-screen flex ${isDarkMode ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-black' : 'bg-gray-50'}`}>
        {/* Mobile Navigation */}
        <MobileNav
          activeTab={activeNavItem}
          onChange={(tab) => handleNavItemClick(tab)}
          navigationItems={navigationItems}
          organizationName={organizationName}
          onLogout={async () => {
            try {
              setLoggingOut(true);
              // Clear chat history before logout
              localStorage.removeItem('chatMessages');
              await logout(true);
              // Redirect to login page
              window.location.href = '/login';
            } catch (error) {
              setLoggingOut(false);
              // Force redirect even if logout fails
              window.location.href = '/login';
            }
          }}
        />

        {/* Desktop Sidebar */}
        <Sidebar
          activeTab={activeNavItem}
          onChange={(tab) => handleNavItemClick(tab)}
          navigationItems={navigationItems}
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          onLogout={async () => {
            try {
              setLoggingOut(true);
              // Clear chat history before logout
              localStorage.removeItem('chatMessages');
              await logout(true);
              // Redirect to login page
              window.location.href = '/login';
            } catch (error) {
              setLoggingOut(false);
              // Force redirect even if logout fails
              window.location.href = '/login';
            }
          }}
        />

        {/* Main Content Area */}
        <main className={`flex-1 transition-all duration-300 ${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'} p-3 sm:p-4 lg:p-6`}>
          {orgSetupComplete ? renderContent() : (
            <div className="flex items-center justify-center h-64">
              <div className={`text-center rounded-xl shadow-sm border p-8 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                }`}>
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${isDarkMode ? 'bg-blue-500/20' : 'bg-blue-100'
                  }`}>
                  <Settings className={`w-8 h-8 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                </div>
                <h3 className={`text-lg font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Welcome to Developer Dashboard
                </h3>
                <p className={`mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  As a new user, please create your organization to get started
                </p>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  You'll need to create an organization before accessing the dashboard features.
                </p>
              </div>
            </div>
          )}
        </main>

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