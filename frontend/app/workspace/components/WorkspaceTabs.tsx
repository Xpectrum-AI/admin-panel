"use client"

import { useState } from 'react';
import ProfileTab from './profile/ProfileTab';
import TeamTab from './team/TeamTab';
import RolesTab from './roles/RolesTab';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

const tabs = [
  'Profile',
  'Team',
  'Roles',
  'Billing',
  'Analytics',
  'Audit Logs',
  'Integrations',
];

interface WorkspaceTabsProps {
  workspace: {
    orgId: string;
    name?: string;
    description?: string;
  };
}

export default function WorkspaceTabs({ workspace }: WorkspaceTabsProps) {
  const [activeTab, setActiveTab] = useState('Profile');
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* Header with back button and title, border bottom only */}
      <div className="flex items-center px-8 py-6 border-b border-gray-200 mb-10">
          <button
            onClick={() => router.back()}
            className="group mr-3"
            aria-label="Back"
          >
            <span className="inline-flex items-center justify-center rounded-lg transition bg-transparent group-hover:bg-gray-100 h-9 w-9">
              <ArrowLeft className="h-5 w-5 text-gray-600 group-hover:text-gray-900" />
            </span>
          </button>
          <h1 className="text-2xl md:text-2xl font-bold text-gray-900">Workspace Settings</h1>
        </div>
      {/* Tabs */}
      <div className="flex bg-gray-100 rounded-xl p-1 mb-8 border border-gray-200 gap-2 w-full max-w-6xl mx-auto">
        {tabs.map(tab => (
          <button
            key={tab}
            className={`flex-1 py-1 rounded-lg font-medium transition text-base focus:outline-none
              ${activeTab === tab
                ? 'bg-white shadow text-gray-900 font-semibold border border-gray-200'
                : 'bg-gray-100 text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>
      {/* Content Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-10 max-w-6xl mx-auto">
        {activeTab === 'Profile' && <ProfileTab workspace={workspace} />}
        {activeTab === 'Team' && <TeamTab workspace={workspace} />}
        {activeTab === 'Roles' && <RolesTab workspace={workspace} />}
        {['Billing', 'Analytics', 'Audit Logs', 'Integrations'].includes(activeTab) && (
          <div className="text-gray-400 text-center py-12">Coming soon...</div>
        )}
      </div>
    </div>
  );
} 