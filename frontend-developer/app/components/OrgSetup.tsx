'use client';

import { useState } from 'react';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { createOrg, addUserToOrg } from '@/service/orgService';
import { useAuthInfo } from '@propelauth/react';
import { useTheme } from '../contexts/ThemeContext';

export default function OrgCreationModal({ onOrgCreated }: { onOrgCreated: () => void }) {
  const [orgName, setOrgName] = useState('');
  const [loading, setLoading] = useState(false);
  const { showError, showSuccess } = useErrorHandler();
  const { user } = useAuthInfo();
  const { isDarkMode } = useTheme();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgName.trim()) {
      showError('Organization name is required');
      return;
    }
    
    // Validate organization name format (PropelAuth requirements)
    const sanitizedName = orgName.trim();
    const nameRegex = /^[a-zA-Z0-9_\s]+$/;
    if (!nameRegex.test(sanitizedName)) {
      showError('Organization name can only contain letters, numbers, underscores, and spaces');
      return;
    }
    
    setLoading(true);
    try {
      // Create the org with sanitized name
      const org = await createOrg(sanitizedName);
      if (!org || !org.orgId) throw new Error('Failed to create organization');
      // Add user as owner
      if (!user?.userId) throw new Error('User not found');
      await addUserToOrg(org.orgId, user.userId, 'Owner');
      showSuccess('Organization created successfully!');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)', backdropFilter: 'blur(8px)' }}>
      <div className={`grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border border-border bg-background p-6 shadow-lg duration-200 sm:rounded-lg sm:max-w-md left-1/2 top-1/2 fixed ${
        isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`} role="dialog" aria-modal="true" style={{ left: '50%', top: '50%' }}>
        <button
          type="button"
          className={`absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${
            isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-gray-900'
          }`}
          aria-label="Close"
          onClick={onOrgCreated}
          disabled={loading}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x h-4 w-4"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg>
          <span className="sr-only">Close</span>
        </button>
        <div className="flex flex-col space-y-1.5 text-center sm:text-left">
          <h2 className={`tracking-tight text-xl font-semibold text-center ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>Welcome! Create Your Organization</h2>
          <p className={`text-sm ${
            isDarkMode ? 'text-gray-300' : 'text-gray-600'
          }`}>
            As a new user, you need to create an organization to start using the Developer Dashboard
          </p>
        </div>
        <form className="space-y-6" onSubmit={handleCreate}>
          <div className="space-y-2">
            <label htmlFor="org-name" className={`text-sm font-medium ${
              isDarkMode ? 'text-gray-200' : 'text-gray-700'
            }`}>Organization Name</label>
            <input
              id="org-name"
              className={`flex h-10 rounded-md border px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm w-full ${
                isDarkMode 
                  ? 'border-gray-600 bg-gray-700 text-white placeholder-gray-400 focus-visible:ring-blue-500' 
                  : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500 focus-visible:ring-blue-500'
              }`}
              placeholder="e.g. My Development Company (letters, numbers, spaces, underscores only)"
              value={orgName}
              onChange={e => setOrgName(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-10 px-4 py-2 w-full bg-blue-600 text-white hover:bg-blue-700"
            disabled={loading}
          >
            {loading ? 'Creating...' : 'Create Organization'}
          </button>
        </form>
      </div>
    </div>
  );
}
