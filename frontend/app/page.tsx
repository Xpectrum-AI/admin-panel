"use client";  // ← makes this a Client Component

import { useEffect } from "react";
import { useAuthInfo } from "@propelauth/react";
import { useRedirectFunctions } from "@propelauth/react";
import { useRouter } from "next/navigation";
import {SyncLoader} from "react-spinners";

export default function Home() {
  const { user, loading } = useAuthInfo();
  const { redirectToLoginPage } = useRedirectFunctions();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (user) {
      router.push("/dashboard");
    } else {
      redirectToLoginPage({
	postLoginRedirectUrl: 'http://localhost:3000/dashboard'
});
    }
  }, [user, loading, redirectToLoginPage, router]);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
      <SyncLoader size={15} color="#000000" />
    </div>
  );
}

