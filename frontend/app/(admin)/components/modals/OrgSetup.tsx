'use client';

import { useState } from 'react';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { createOrg, addUserToOrg } from '@/service/orgService';
import { useAuthInfo } from '@propelauth/react';

export default function OrgCreationModal({ onOrgCreated }: { onOrgCreated: () => void }) {
  const [orgName, setOrgName] = useState('');
  const [loading, setLoading] = useState(false);
  const { showError, showSuccess } = useErrorHandler();
  const { user } = useAuthInfo();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
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
      showSuccess('Organization created');
      onOrgCreated();
      window.location.reload();
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border border-border bg-background p-6 shadow-lg duration-200 sm:rounded-lg sm:max-w-md bg-white left-1/2 top-1/2 fixed" role="dialog" aria-modal="true" style={{ left: '50%', top: '50%' }}>
        <div className="flex flex-col space-y-1.5 text-center sm:text-left">
          <h2 className="tracking-tight text-xl font-semibold text-foreground text-center">Create Your Organization</h2>
        </div>
        <form className="space-y-6" onSubmit={handleCreate}>
          <div className="space-y-2">
            <label htmlFor="org-name" className="text-sm font-medium text-foreground">Organization Name</label>
            <input
              id="org-name"
              className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm w-full"
              placeholder="e.g. Acme Corp"
              value={orgName}
              onChange={e => setOrgName(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-10 px-4 py-2 w-full bg-foreground text-background hover:bg-foreground/90"
            disabled={loading}
          >
            {loading ? 'Creating...' : 'Create Organization'}
          </button>
        </form>
      </div>
    </div>
  );
}