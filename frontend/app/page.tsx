"use client";  // ← makes this a Client Component

import { useEffect } from "react";
import { useAuthInfo } from "@propelauth/react";
import { useRouter } from "next/navigation";

export default function Home() {
  const { user, loading } = useAuthInfo();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (user) {
      router.push("/dashboard");
    } else {
      router.push("/login");
      //redirectToLoginPage();
    }
  }, [user, loading, router]);

  return <div>Loading…</div>;
}
