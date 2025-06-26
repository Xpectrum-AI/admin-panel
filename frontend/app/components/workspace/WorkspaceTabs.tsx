"use client"

import { useState } from 'react';
import WorkspaceProfileTab from './WorkspaceProfileTab';
import WorkspaceTeamTab from './WorkspaceTeamTab';
import WorkspaceRolesTab from './WorkspaceRolesTab';

const tabs = [
  'Profile',
  'Team',
  'Roles',
  'Billing',
  'Analytics',
  'Audit Logs',
  'Integrations',
];

export default function WorkspaceTabs({ workspace }: { workspace: any }) {
  const [activeTab, setActiveTab] = useState('Profile');

  return (
    <div className="max-w-4xl mx-auto mt-8">
      <h1 className="text-2xl font-semibold mb-6 text-gray-800">Workspace Management</h1>
      <div className="flex space-x-2 mb-6">
        {tabs.map(tab => (
          <button
            key={tab}
            className={`px-4 py-2 rounded-t-lg font-medium focus:outline-none transition border-b-2 ${
              activeTab === tab
                ? 'bg-white border-indigo-500 text-gray-900'
                : 'bg-gray-50 border-transparent text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>
      <div className="bg-white rounded-b-lg shadow-sm border border-t-0 border-gray-100 p-6">
        {activeTab === 'Profile' && <WorkspaceProfileTab workspace={workspace} />}
        {activeTab === 'Team' && <WorkspaceTeamTab />}
        {activeTab === 'Roles' && <WorkspaceRolesTab />}
        {['Billing', 'Analytics', 'Audit Logs', 'Integrations'].includes(activeTab) && (
          <div className="text-gray-400 text-center py-12">Coming soon...</div>
        )}
      </div>
    </div>
  );
} 