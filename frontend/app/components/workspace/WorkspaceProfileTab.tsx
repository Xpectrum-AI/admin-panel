import { Building2 } from 'lucide-react';

export default function WorkspaceProfileTab({ workspace }: { workspace: any }) {
  return (
    <div>
      <div className="flex items-center mb-6">
        <Building2 className="h-8 w-8 text-white bg-gray-900 rounded-lg p-1 mr-4" />
        <h2 className="text-xl font-semibold text-gray-900">Workspace Profile</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <label className="block text-gray-600 text-sm mb-1">Workspace Name</label>
          <input className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 mb-4" value={workspace?.name || 'Default Workspace'} disabled />
          <label className="block text-gray-600 text-sm mb-1">Description</label>
          <textarea className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2" value={workspace?.description || 'Your default workspace'} disabled />
        </div>
        <div>
          <label className="block text-gray-600 text-sm mb-1">Branding Color</label>
          <div className="w-full h-8 rounded-lg bg-indigo-200 mb-4" />
          <label className="block text-gray-600 text-sm mb-1">Default Timezone</label>
          <input className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 mb-4" value="UTC-8 (Pacific Time)" disabled />
          <label className="block text-gray-600 text-sm mb-1">Default Language</label>
          <input className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2" value="English (US)" disabled />
        </div>
      </div>
      <div>
        <h3 className="font-semibold text-gray-800 mb-2">Security Settings</h3>
        <div className="flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-gray-700">SSO/SAML Authentication</div>
              <div className="text-gray-500 text-sm">Enable single sign-on for your workspace</div>
            </div>
            <input type="checkbox" className="toggle toggle-md" disabled />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-gray-700">Require Two-Factor Authentication</div>
              <div className="text-gray-500 text-sm">Mandate 2FA for all workspace members</div>
            </div>
            <input type="checkbox" className="toggle toggle-md" checked disabled />
          </div>
        </div>
      </div>
    </div>
  );
} 