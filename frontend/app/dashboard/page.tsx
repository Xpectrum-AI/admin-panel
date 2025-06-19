"use client";

import { ProtectedRoute } from "../auth/ProtectedRoute";
import { useAuthInfo } from "@propelauth/react";

export default function Dashboard() {
  const { user } = useAuthInfo();

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            Welcome to your Dashboard
          </h1>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">User Information</h2>
            <div className="space-y-2">
              <p><strong>Email:</strong> {user?.email}</p>
              <p><strong>User ID:</strong> {user?.userId}</p>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
} 