"use client";

import { withAuthInfo, WithAuthInfoProps } from "@propelauth/react";
import React from "react";

const SUPER_ADMIN_ORG_ID = process.env.NEXT_PUBLIC_SUPER_ADMIN_ORG_ID || "";

const SuperAdminGuard = withAuthInfo((props: WithAuthInfoProps & { children?: React.ReactNode }) => {
  const orgs = props.orgHelper?.getOrgs() || [];
  const isSuperAdmin = orgs.some((org: { orgId: string }) => org.orgId === SUPER_ADMIN_ORG_ID);
  
  // Debug logging
  console.log('SuperAdminGuard Debug:', {
    SUPER_ADMIN_ORG_ID,
    userOrgs: orgs,
    isSuperAdmin,
    user: props.user?.email,
    orgHelper: !!props.orgHelper,
    orgsLength: orgs.length
  });
  
  // Additional detailed logging
  if (orgs.length > 0) {
    console.log('User Organizations:', orgs.map(org => ({ orgId: org.orgId })));
  } else {
    console.log('No organizations found for user');
  }
  
  console.log('Super Admin Org ID from env:', process.env.NEXT_PUBLIC_SUPER_ADMIN_ORG_ID);
  console.log('Super Admin Org ID constant:', SUPER_ADMIN_ORG_ID);

  if (isSuperAdmin) {
    return <>{props.children}</>;
  } else {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="bg-white border border-gray-200 text-gray-800 px-8 py-6 rounded-2xl flex flex-col items-center">
          <svg className="w-12 h-12 mb-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 9l6 6m0-6l-6 6" />
          </svg>
          <h2 className="text-2xl font-bold mb-2">Unauthorized</h2>
          <p className="text-lg text-center text-gray-600">You do not have permission to access the Super Admin Panel.</p>
        </div>
      </div>
    );
  }
});

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  // Force refresh on mount to clear any cached data
  React.useEffect(() => {
    // Clear any cached authentication data
    if (typeof window !== 'undefined') {
      console.log('SuperAdminLayout: Clearing cache and forcing refresh');
      // Force a hard refresh if needed
      if (window.location.search.includes('force-refresh')) {
        window.location.reload();
      }
    }
  }, []);

  return (
    <SuperAdminGuard>
      {children}
    </SuperAdminGuard>
  );
} 