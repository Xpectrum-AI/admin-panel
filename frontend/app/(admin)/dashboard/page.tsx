"use client";

import { ProtectedRoute } from "../../(admin)/auth/ProtectedRoute";
import Header from './Header';
import StatCard from './StatCard';
import RecentActivity from './RecentActivity';
import QuickActions from './QuickActions';
import { Users, DollarSign, BarChart, Zap } from 'lucide-react';
import { OAuthAuthProvider } from "./DashboardAuthProvider";

export default function Dashboard() {
  return (
    <OAuthAuthProvider>
      <ProtectedRoute>
        <div className="flex flex-col min-h-screen ">
          <Header />
          <main className="flex-1 p-8">
            <div className="max-w-7xl mx-auto">
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <p className="mt-1 text-lg text-gray-600">
                Welcome back! Here&apos;s what&apos;s happening with your business today.
              </p>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
                <StatCard title="Total Users" value="2,345" percentage="+12% from last month" Icon={Users} trend="up" />
                <StatCard title="Revenue" value="$45,231" percentage="+8% from last month" Icon={DollarSign} trend="up" />
                <StatCard title="Active Sessions" value="1,234" percentage="+2% from last hour" Icon={Zap} trend="up" />
                <StatCard title="Growth Rate" value="12.5%" percentage="+4% from last quarter" Icon={BarChart} trend="up" />
              </div>

              {/* Main Content */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
                <div className="lg:col-span-2">
                  <RecentActivity />
                </div>
                <div>
                  <QuickActions />
                </div>
              </div>
            </div>
          </main>
        </div>
      </ProtectedRoute>
    </OAuthAuthProvider>
  );
} 