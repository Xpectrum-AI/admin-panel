"use client";

import { useEffect, useState } from 'react';
import { useAuthInfo } from '@propelauth/react';
import { ProtectedRoute } from "../../(admin)/auth/ProtectedRoute";
import Header from './Header';
import StatCard from './StatCard';
import RecentActivity from './RecentActivity';
import QuickActions from './QuickActions';
import { Users, DollarSign, BarChart, Zap } from 'lucide-react';
import { SyncLoader } from 'react-spinners';
import axios from 'axios';
import WelcomeSetupModal from '../components/WelcomeSetupModel';
import OrgSetup from '../components/OrgSetup';
import { removeUserFromOrg } from '@/service/orgService';
import { useErrorHandler } from '@/hooks/useErrorHandler';

const API_BASE_URL = process.env.NEXT_PUBLIC_CALENDAR_API_URL || 'https://admin-test.xpectrum-ai.com/calendar-api'; 

export default function Dashboard() {
  const { accessToken, user, loading, orgHelper } = useAuthInfo();
  const [callbackCompleted, setCallbackCompleted] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showOrgSetup, setShowOrgSetup] = useState(false);
  const [showOrgChoice, setShowOrgChoice] = useState(false);
  const [orgs, setOrgs] = useState<any[]>([]);
  const { showError, showSuccess } = useErrorHandler();

  useEffect(() => {
    if (!loading && orgHelper) {
      const orgs = orgHelper.getOrgs?.() || [];
      setOrgs(orgs);
      if (orgs.length === 0) {
        setShowOrgSetup(true);
        setShowOrgChoice(false);
      } else if (orgs.length > 1) {
        setShowOrgSetup(false);
        setShowOrgChoice(true);
      } else {
        setShowOrgSetup(false);
        setShowOrgChoice(false);
      }
    }
  }, [loading, orgHelper]);

  // Handler for choosing an org
  const handleChooseOrg = async (chosenOrgId: string) => {
    if (!user?.userId) {
      showError('User not found. Please log in again.');
      return;
    }
    // Remove user from all orgs except the chosen one
    const orgsToRemove = orgs.filter((org: any) => (org.orgId || org.id) !== chosenOrgId);
    try {
      await Promise.all(orgsToRemove.map((org: any) =>
        removeUserFromOrg(org.orgId || org.id, user.userId)
      ));
      showSuccess('Workspace selected successfully!');
      setShowOrgChoice(false);
      window.location.reload();
    } catch (err: any) {
      showError(err?.message || 'Failed to update workspace selection. Please try again.');
    }
  };

  return (
    <ProtectedRoute>
      {showOrgSetup && <OrgSetup onOrgCreated={() => setShowOrgSetup(false)} />}
      {showOrgChoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 bg-opacity-40">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-lg relative animate-fade-in max-h-[90vh] flex flex-col border border-gray-200">
            <h2 className="text-2xl font-bold mb-4">Choose Your Workspace</h2>
            <ul className="space-y-4">
              {orgs.map((org: any) => (
                <li
                  key={org.orgId || org.id}
                  className="border border-gray-300 rounded-xl p-4 flex flex-col bg-gray-50"
                >
                  <div className="font-semibold text-lg text-gray-900">{org.orgName || org.name}</div>
                  <div className="text-gray-600 text-sm mb-2">{org.description || org.metadata?.description || ''}</div>
                  <button
                    className="mt-2 px-4 py-2 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700 transition min-w-[160px]"
                    onClick={() => handleChooseOrg(org.orgId || org.id)}
                  >
                    Choose this workspace
                  </button>
                </li>
              ))}
            </ul>
            <div className="text-sm text-gray-500 mt-4">
              You can only be part of one workspace. Choosing one will remove you from the others.
            </div>
          </div>
        </div>
      )}
      {!showOrgSetup && !showOrgChoice && showWelcome && <WelcomeSetupModal onComplete={() => setShowWelcome(false)} />}
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
  );
} 