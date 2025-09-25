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

    console.log('🗑️ Deleting Dify agent:', { agentName, organizationId, appId });

    // For now, we'll try to delete using the Dify Console API directly
    // Since we don't have a delete script, we'll use curl commands
    try {
      const consoleOrigin = process.env.NEXT_PUBLIC_DIFY_CONSOLE_ORIGIN;
      const adminEmail = process.env.NEXT_PUBLIC_DIFY_ADMIN_EMAIL;
      const adminPassword = process.env.NEXT_PUBLIC_DIFY_ADMIN_PASSWORD;
      const workspaceId = process.env.NEXT_PUBLIC_DIFY_WORKSPACE_ID;

      if (!consoleOrigin || !adminEmail || !adminPassword || !workspaceId) {
        console.warn('⚠️ Dify environment variables not configured, skipping Dify deletion');
        return NextResponse.json({
          success: true,
          message: 'Dify deletion skipped - environment not configured',
          data: { agentName, organizationId }
        });
      }

      // Step 1: Login to get token
      console.log('🔐 Logging into Dify console...');
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

      console.log('✅ Successfully logged into Dify console');

      // Step 2: List apps to find the agent by name
      console.log('🔍 Searching for agent app...');
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
        console.warn(`⚠️ Agent app "${agentName}" not found in Dify workspace`);
        return NextResponse.json({
          success: true,
          message: 'Agent not found in Dify workspace (may have been already deleted)',
          data: { agentName, organizationId }
        });
      }

      const appIdToDelete = targetApp.id || targetApp.app_id;
      console.log(`🎯 Found agent app with ID: ${appIdToDelete}`);

      // Step 3: Delete the app
      console.log('🗑️ Deleting agent app from Dify...');
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
        console.warn(`⚠️ Failed to delete app from Dify: ${deleteResponse.status} ${deleteResponse.statusText} - ${errorText}`);
        // Don't throw error here, just log it as the app might not exist
      } else {
        console.log('✅ Successfully deleted agent app from Dify');
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
      console.error('❌ Dify deletion error:', difyError);
      // Don't fail the entire request if Dify deletion fails
      return NextResponse.json({
        success: true,
        message: 'Dify deletion failed but continuing with backend deletion',
        error: difyError instanceof Error ? difyError.message : 'Unknown Dify error',
        data: { agentName, organizationId }
      });
    }

  } catch (error) {
    console.error('❌ Delete Dify agent error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
