"use client"

import WorkspaceTabs from './components/WorkspaceTabs';
import { useAuthInfo } from '@propelauth/react';

export default function WorkspacePage() {
  
  const { orgHelper } = useAuthInfo();
  // Get the org where the user is an owner
  const ownerOrgs = orgHelper?.getOrgs();
  const org = ownerOrgs?.[0];

  if (!org) {
    return <div className="p-8 text-gray-500">You are not an owner of any organization.</div>;
  }

  const workspaceData = {
    orgId: org.orgId,
    name: org.orgName,
    description: ("description" in org ? String(org.description) : "")
  };

  return <WorkspaceTabs workspace={workspaceData} />;
} 