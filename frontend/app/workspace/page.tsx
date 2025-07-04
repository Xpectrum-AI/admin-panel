"use client"

import WorkspaceTabs from '../components/workspace/WorkspaceTabs';

export default function WorkspacePage() {
  // Always show the workspace tabs, no creation logic
  const workspaceData = { name: 'Default Workspace', description: 'Your default workspace' };
  return <WorkspaceTabs workspace={workspaceData} />;
} 