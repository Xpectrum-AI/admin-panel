import { Building2, SquarePen } from 'lucide-react';

export default function WorkspaceProfileTab({ workspace }: { workspace: any }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center">
          <div className="h-12 w-12 flex items-center justify-center rounded-xl bg-gray-900 mr-4">
            <Building2 className="h-7 w-7 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Workspace Profile</h2>
          </div>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 font-semibold hover:bg-gray-100">
          <SquarePen className='h-4 w-4' />
          Edit Profile
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div>
          <label className="block text-gray-700 text-sm mb-1">Workspace Name</label>
          <input className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 mb-4" value={workspace?.name || 'Acme Corporation'} disabled />
          <label className="block text-gray-700 text-sm mb-1">Description</label>
          <textarea className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2" value={workspace?.description || 'Leading innovation in technology solutions'} disabled />
        </div>
        <div>
          <label className="block text-gray-700 text-sm mb-1">Branding Color</label>
          <div className="w-full h-4 rounded-lg bg-indigo-200 mb-6 border border-gray-200" />
          <label className="block text-gray-700 text-sm mb-1">Default Timezone</label>
          <input className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 mb-4" value="UTC-8 (Pacific Time)" disabled />
          <label className="block text-gray-700 text-sm mb-1">Default Language</label>
          <input className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2" value="English (US)" disabled />
        </div>
      </div>
      <div>
        <h3 className="font-semibold text-gray-900 mb-3">Security Settings</h3>
        <div className="flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-gray-800">SSO/SAML Authentication</div>
              <div className="text-gray-500 text-sm">Enable single sign-on for your organization</div>
            </div>
            <input type="checkbox" className="toggle toggle-md" disabled />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-gray-800">Require Two-Factor Authentication</div>
              <div className="text-gray-500 text-sm">Mandate 2FA for all organization members</div>
            </div>
            <input type="checkbox" className="toggle toggle-md" checked disabled />
          </div>
        </div>
      </div>
    </div>
  );
} 