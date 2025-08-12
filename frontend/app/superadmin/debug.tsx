"use client";

import { useAuthInfo } from "@propelauth/react";
import { useState } from "react";

const SUPER_ADMIN_ORG_ID = process.env.SUPER_ADMIN_ORG_ID || "";

export default function SuperAdminDebug() {
  const { user, loading, orgHelper } = useAuthInfo();
  const [showDebug, setShowDebug] = useState(false);

  const orgs = orgHelper?.getOrgs() || [];
  const isSuperAdmin = orgs.some((org: { orgId: string }) => org.orgId === SUPER_ADMIN_ORG_ID);

  const toggleDebug = () => setShowDebug(!showDebug);

  if (!showDebug) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={toggleDebug}
          className="bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-red-700"
        >
          Debug Super Admin
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-6 max-w-2xl max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Super Admin Debug Information</h2>
          <button
            onClick={toggleDebug}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="font-semibold">Environment Variables</h3>
            <pre className="bg-gray-100 p-2 rounded text-sm">
              NEXT_PUBLIC_SUPER_ADMIN_ORG_ID: {SUPER_ADMIN_ORG_ID || "NOT SET"}
            </pre>
          </div>

          <div>
            <h3 className="font-semibold">Authentication State</h3>
            <pre className="bg-gray-100 p-2 rounded text-sm">
              Loading: {loading.toString()}
              User: {user ? user.email : "Not logged in"}
              OrgHelper: {orgHelper ? "Available" : "Not available"}
            </pre>
          </div>

          <div>
            <h3 className="font-semibold">User Organizations</h3>
            <pre className="bg-gray-100 p-2 rounded text-sm">
              {orgs.length > 0 
                ? orgs.map((org: any, index: number) => 
                    `${index + 1}. ${org.orgId}${org.orgId === SUPER_ADMIN_ORG_ID ? ' (SUPER ADMIN)' : ''}`
                  ).join('\n')
                : "No organizations found"
              }
            </pre>
          </div>

          <div>
            <h3 className="font-semibold">Super Admin Check</h3>
            <pre className="bg-gray-100 p-2 rounded text-sm">
              Is Super Admin: {isSuperAdmin.toString()}
              Expected Org ID: {SUPER_ADMIN_ORG_ID}
              User has matching org: {orgs.some((org: any) => org.orgId === SUPER_ADMIN_ORG_ID).toString()}
            </pre>
          </div>

          <div>
            <h3 className="font-semibold">Actions</h3>
            <div className="space-y-2">
              <button
                onClick={() => window.location.reload()}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Force Refresh Page
              </button>
              <button
                onClick={() => window.location.href = '/superadmin?force-refresh=true'}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 ml-2"
              >
                Force Refresh with Cache Bust
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
