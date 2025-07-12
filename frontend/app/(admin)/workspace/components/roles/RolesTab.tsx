import {Shield, SquarePen, Trash2, Plus } from 'lucide-react';

const roles = [
  {
    name: 'Owner',
    description: 'Full access to all features',
    permissions: ['Create Bots', 'View Analytics', 'Billing Access', 'Manage Team', 'Manage Roles'],
  },
  {
    name: 'Admin',
    description: 'Can create and manage bots',
    permissions: ['Create Bots', 'View Analytics'],
  },
  {
    name: 'Member',
    description: 'Read-only access',
    permissions: ['View Analytics'],
  },
];

export default function RolesTab({ workspace }: { workspace: any }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center">
          <div className="h-12 w-12 flex items-center justify-center rounded-xl bg-gray-900 mr-4">
            <Shield className="h-7 w-7 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Roles & Permissions</h2>
          </div>
        </div>
        <button className="bg-gray-900 hover:bg-gray-800 text-white font-medium px-4 py-2 rounded-lg flex items-center space-x-2">
          <Plus className='h-4 w-4' />
          <span>Create Role</span>
        </button>
      </div>
      <div className="space-y-4">
        {roles.map((role, i) => (
          <div key={i} className="bg-white rounded-lg border border-gray-100 p-4 flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center mb-1">
                <span className="text-lg font-semibold text-gray-800 mr-2">{role.name}</span>
              </div>
              <div className="text-gray-500 text-sm mb-2">{role.description}</div>
              <div className="flex flex-wrap gap-2">
                {role.permissions.map((perm, j) => (
                  <span key={j} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-medium">{perm}</span>
                ))}
              </div>
            </div>
            <div className="flex space-x-2 mt-4 md:mt-0">
              <button className="px-3 py-1 rounded bg-gray-50 border border-gray-200 text-gray-700 hover:bg-gray-100">
                <SquarePen className="h-4 w-4" />
              </button>
              <button className="px-3 py-1 rounded bg-gray-50 border border-gray-200 text-red-500 hover:bg-red-50">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 