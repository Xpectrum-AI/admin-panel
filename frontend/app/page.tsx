"use client";  // ← makes this a Client Component

import { useAuthInfo } from "@propelauth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import {SyncLoader} from "react-spinners";

const SUPER_ADMIN_ORG_ID = process.env.SUPER_ADMIN_ORG_ID || "";

export default function Home() {
  const { userClass, loading } = useAuthInfo();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (userClass) {
      const isSuperAdmin = userClass
        .getOrgs()
        .some((org) => org.orgId === SUPER_ADMIN_ORG_ID);

      router.push(isSuperAdmin ? "/superadmin" : "/dashboard");
    } else {
      window.location.href = "/login";
    }
  }, [userClass, loading, router]);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
      <SyncLoader size={15} color="#000000" />
    </div>
  );
}

