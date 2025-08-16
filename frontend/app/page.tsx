"use client";

import { useAuthInfo } from "@propelauth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { SyncLoader } from "react-spinners";
import Dashboard from "./(admin)/dashboard/dashboard";

const SUPER_ADMIN_ORG_ID = process.env.NEXT_PUBLIC_SUPER_ADMIN_ORG_ID || "";

export default function Home() {
  const { userClass, loading } = useAuthInfo();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    // Since ProtectedRoute handles authentication globally,
    // we only need to handle routing for authenticated users
    if (userClass) {
      const isSuperAdmin = userClass
        .getOrgs()
        .some((org: any) => org.orgId === SUPER_ADMIN_ORG_ID);

      if (isSuperAdmin) {
        router.push("/superadmin");
      }
      // If not super admin, stay on root and show dashboard
    }
    // If user is not authenticated, ProtectedRoute will handle the redirect
  }, [userClass, loading, router]);

  // Show loading while checking authentication
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <SyncLoader size={15} color="#000000" />
      </div>
    );
  }

  // If user is authenticated and not a super admin, show dashboard
  if (userClass) {
    const isSuperAdmin = userClass
      .getOrgs()
      .some((org: any) => org.orgId === SUPER_ADMIN_ORG_ID);

    if (!isSuperAdmin) {
      return <Dashboard />;
    }
  }

  // Show loading while redirecting super admin
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
      <SyncLoader size={15} color="#000000" />
    </div>
  );
}

