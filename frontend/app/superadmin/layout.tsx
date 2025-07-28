"use client";

import { withAuthInfo, WithAuthInfoProps } from "@propelauth/react";
import React from "react";

//const SUPER_ADMIN_TEST_ORG_ID = "c53e8731-2ce7-4484-919c-0aba50c2f46a"; // TODO: Replace with your actual Super Admin Org ID
const SUPER_ADMIN_ORG_ID = "7f4f4566-0435-42d0-ab5f-80c6018f625b";

const SuperAdminGuard = withAuthInfo((props: WithAuthInfoProps & { children?: React.ReactNode }) => {
  const orgs = props.orgHelper?.getOrgs() || [];
  const isSuperAdmin = orgs.some((org: { orgId: string }) => org.orgId === SUPER_ADMIN_ORG_ID);

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
  return (
    <SuperAdminGuard>
      {children}
    </SuperAdminGuard>
  );
} 