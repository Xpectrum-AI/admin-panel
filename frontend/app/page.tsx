"use client";  // ← makes this a Client Component

import { useEffect } from "react";
import { useAuthInfo } from "@propelauth/react";
import { useRouter } from "next/navigation";
import {SyncLoader} from "react-spinners";

const SUPER_ADMIN_ORG_ID = process.env.NEXT_PUBLIC_SUPER_ADMIN_ORG_ID || "";

export default function Home() {
  const { user, loading , orgHelper} = useAuthInfo();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (user) {
      const orgs = orgHelper?.getOrgs?.() || [];
      const isSuperAdmin = orgs.some((org: { orgId: string }) => org.orgId === SUPER_ADMIN_ORG_ID);
      
      // Debug logging
      console.log('Home Page Debug:', {
        SUPER_ADMIN_ORG_ID,
        userOrgs: orgs,
        isSuperAdmin,
        user: user?.email
      });
      
      if (isSuperAdmin) {
        router.push("/superadmin");
      } else {
      router.push("/dashboard");
      }
    } else {
      window.location.href = "/login";
    }
  }, [user, loading, router]);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
      <SyncLoader size={15} color="#000000" />
    </div>
  );
}

