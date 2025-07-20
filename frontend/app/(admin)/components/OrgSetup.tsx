'use client';

import { useState } from 'react';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { createOrg, updateOrg, addUserToOrg } from '@/service/orgService';
import { useAuthInfo } from '@propelauth/react';

export default function OrgCreationModal({ onOrgCreated }: { onOrgCreated: () => void }) {
  const [orgName, setOrgName] = useState('');
  const [orgDesc, setOrgDesc] = useState('');
  const [loading, setLoading] = useState(false);
  const { showError, showSuccess } = useErrorHandler();
  const { user } = useAuthInfo();

  const handleCreate = async () => {
    if (!orgName.trim()) {
      showError('Organization name is required');
      return;
    }
    setLoading(true);
    try {
      // Create the org
      const org = await createOrg(orgName);
      
      if (!org || !org.orgId) throw new Error('Failed to create organization');
      // Add user as owner
      if (!user?.userId) throw new Error('User not found');

        await addUserToOrg(org.orgId, user.userId, 'Owner');
      
      
      let updated = false;
      if (orgDesc.trim()) {
        // Update org with description field
        await updateOrg(org.orgId, { description: orgDesc });
        updated = true;
      }
      showSuccess('Organization created');
      onOrgCreated();
    } catch (err: any) {
      if (err && err.message) {
        try {
          const parsed = JSON.parse(err.message);
          if (parsed.name && Array.isArray(parsed.name)) {
            showError(parsed.name[0]);
            return;
          }
        } catch {}
        showError(err.message);
      } else {
        showError('Failed to create organization');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 bg-opacity-40">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-lg relative animate-fade-in max-h-[90vh] flex flex-col border border-gray-200">
        <h2 className="text-2xl font-bold mb-4">Create Your Workspace</h2>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Workspace Name</label>
          <input
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-gray-50"
            value={orgName}
            onChange={e => setOrgName(e.target.value)}
            placeholder="e.g. Acme Corp"
            disabled={loading}
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Description (optional)</label>
          <textarea
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-gray-50"
            value={orgDesc}
            onChange={e => setOrgDesc(e.target.value)}
            placeholder="What does your workspace do?"
            disabled={loading}
          />
        </div>
        <div className="flex justify-end gap-2 mt-2">
          <button
            className="px-4 py-2 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700 transition min-w-[160px]"
            onClick={handleCreate}
            disabled={loading}
          >
            {loading ? 'Creating...' : 'Create Workspace'}
          </button>
        </div>
        <div className="text-sm text-gray-500 mt-4">You can only be part of one workspace. Create a new one to get started.</div>
      </div>
    </div>
  );
}