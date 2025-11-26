import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiKey } from '@/lib/middleware/auth';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';

const execAsync = promisify(exec);

interface DeleteDifyAgentRequest {
  agentName: string;
  organizationId: string;
  appId?: string;
}

export async function DELETE(request: NextRequest) {
  try {
    // Authenticate the request
    const authResult = await authenticateApiKey(request);
    if (!authResult.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: DeleteDifyAgentRequest = await request.json();
    const { agentName, organizationId, appId } = body;

    if (!agentName || !organizationId) {
      return NextResponse.json({ 
        error: 'Missing required fields: agentName and organizationId' 
      }, { status: 400 });
    }
/**
 * Get workspace ID from environment variable ONLY
 * This ensures agents are always deleted from the workspace specified in .env
 * and NOT from the currently active workspace context
 */
function getWorkspaceIdFromEnv(): string {
  const workspaceId = process.env.NEXT_PUBLIC_DIFY_WORKSPACE_ID;
  
  if (!workspaceId || workspaceId.trim() === '') {
    throw new Error('NEXT_PUBLIC_DIFY_WORKSPACE_ID is not set in environment variables. Agent deletion requires a workspace ID from .env file.');
  }
  
  return workspaceId.trim();
}

    // For now, we'll try to delete using the Dify Console API directly
    // Since we don't have a delete script, we'll use curl commands
    try {
      const consoleOrigin = process.env.NEXT_PUBLIC_DIFY_CONSOLE_ORIGIN;
      const adminEmail = process.env.NEXT_PUBLIC_DIFY_ADMIN_EMAIL;
      const adminPassword = process.env.NEXT_PUBLIC_DIFY_ADMIN_PASSWORD;
      
      // CRITICAL: Always use workspace ID from environment variable, never from request headers or user context
      const workspaceId = getWorkspaceIdFromEnv();
      console.log(`[Agent Deletion] Using workspace ID from environment: ${workspaceId.substring(0, 8)}...`);

      if (!consoleOrigin || !adminEmail || !adminPassword) {
        return NextResponse.json({
          success: true,
          message: 'Dify deletion skipped - environment not configured',
          data: { agentName, organizationId }
        });
      }
      
      // Explicitly ignore any workspace ID from request headers to prevent conflicts
      const requestWorkspaceId = request.headers.get('x-workspace-id') || request.headers.get('X-Workspace-Id');
      if (requestWorkspaceId && requestWorkspaceId !== workspaceId) {
        console.warn(`[Agent Deletion] WARNING: Request contains workspace ID header (${requestWorkspaceId.substring(0, 8)}...), but using environment variable workspace ID instead.`);
      }

      // Step 1: Login to get token
      const loginResponse = await fetch(`${consoleOrigin}/console/api/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          'Cache-Control': 'no-cache',
          'User-Agent': 'DifyAgentDeleter/1.0'
        },
        body: JSON.stringify({
          email: adminEmail,
          password: adminPassword
        })
      });

      if (!loginResponse.ok) {
        throw new Error(`Login failed: ${loginResponse.status} ${loginResponse.statusText}`);
      }

      const loginData = await loginResponse.json();
      const token = loginData.data?.access_token || loginData.access_token || loginData.data?.token;
      
      if (!token) {
        throw new Error('No access token received from login');
      }
      
      // CRITICAL: Switch workspace after login to ensure all operations use the correct workspace
      console.log(`[Agent Deletion] Switching workspace to: ${workspaceId.substring(0, 8)}...`);
      try {
        const switchResponse = await fetch(`${consoleOrigin}/console/api/workspaces/switch`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            tenant_id: workspaceId
          })
        });

        if (switchResponse.ok) {
          console.log(`[Agent Deletion] ✓ Workspace switched successfully to: ${workspaceId.substring(0, 8)}...`);
        } else {
          const errorText = await switchResponse.text().catch(() => 'Unable to read error');
          console.warn(`[Agent Deletion] ⚠️ Workspace switch failed: ${switchResponse.status} ${switchResponse.statusText}`);
          console.warn(`[Agent Deletion] Error: ${errorText.substring(0, 500)}`);
        }
      } catch (switchError) {
        console.warn(`[Agent Deletion] ⚠️ Workspace switch error:`, switchError);
      }
      
      // Step 2: List apps to find the agent by name
      const appsResponse = await fetch(`${consoleOrigin}/console/api/apps`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Workspace-Id': workspaceId,
          'Content-Type': 'application/json'
        }
      });

      if (!appsResponse.ok) {
        throw new Error(`Failed to fetch apps: ${appsResponse.status} ${appsResponse.statusText}`);
      }

      const appsData = await appsResponse.json();
      const apps = appsData.data || appsData;
      
      // Find the app by name
      const targetApp = apps.find((app: any) => 
        app.name === agentName || 
        app.app_name === agentName ||
        app.id === appId
      );

      if (!targetApp) {
        return NextResponse.json({
          success: true,
          message: 'Agent not found in Dify workspace (may have been already deleted)',
          data: { agentName, organizationId }
        });
      }

      const appIdToDelete = targetApp.id || targetApp.app_id;
      // Step 3: Delete the app
      const deleteResponse = await fetch(`${consoleOrigin}/console/api/apps/${appIdToDelete}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Workspace-Id': workspaceId,
          'Content-Type': 'application/json'
        }
      });

      if (!deleteResponse.ok) {
        const errorText = await deleteResponse.text();
        // Don't throw error here, just log it as the app might not exist
      } else {
      }

      return NextResponse.json({
        success: true,
        message: 'Dify agent deleted successfully',
        data: {
          agentName,
          organizationId,
          deletedAppId: appIdToDelete
        }
      });

    } catch (difyError) {
      // Don't fail the entire request if Dify deletion fails
      return NextResponse.json({
        success: true,
        message: 'Dify deletion failed but continuing with backend deletion',
        error: difyError instanceof Error ? difyError.message : 'Unknown Dify error',
        data: { agentName, organizationId }
      });
    }

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
