import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiKey } from '@/lib/middleware/auth';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';

const execAsync = promisify(exec);

interface CreateDifyAgentRequest {
  agentName: string;
  organizationId: string;
  modelProvider?: string;
  modelName?: string;
  agentType?: 'Knowledge Agent (RAG)' | 'Action Agent (AI Employee)';
}

/**
 * Get workspace ID from environment variable ONLY
 * This ensures agents are always created in the workspace specified in .env
 * and NOT in the currently active workspace context
 */
function getWorkspaceIdFromEnv(): string {
  const workspaceId = process.env.NEXT_PUBLIC_DIFY_WORKSPACE_ID;
  
  if (!workspaceId || workspaceId.trim() === '') {
    throw new Error('NEXT_PUBLIC_DIFY_WORKSPACE_ID is not set in environment variables. Agent creation requires a workspace ID from .env file.');
  }
  
  return workspaceId.trim();
}

// Fallback function to create Dify agent using direct API calls
async function createDifyAgentDirectly(
  agentName: string, 
  organizationId: string, 
  modelProvider: string, 
  modelName: string,
  agentType: string = 'Knowledge Agent (RAG)'
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    let consoleOrigin = process.env.NEXT_PUBLIC_DIFY_CONSOLE_ORIGIN;
    const adminEmail = process.env.NEXT_PUBLIC_DIFY_ADMIN_EMAIL;
    const adminPassword = process.env.NEXT_PUBLIC_DIFY_ADMIN_PASSWORD;
    
    // CRITICAL: Always use workspace ID from environment variable, never from request headers or user context
    const workspaceId = getWorkspaceIdFromEnv();

    if (!consoleOrigin || !adminEmail || !adminPassword) {
      throw new Error('Missing required Dify environment variables');
    }
    
    // Log the workspace ID being used for debugging
    console.log(`[Agent Creation] Using workspace ID from environment: ${workspaceId.substring(0, 8)}...`);

    // Normalize CONSOLE_ORIGIN: ensure it ends with /api for proper URL construction
    consoleOrigin = consoleOrigin.replace(/\/$/, ''); // Remove trailing slash
    if (!consoleOrigin.endsWith('/api')) {
      consoleOrigin = `${consoleOrigin}/api`;
    }

    // Step 1: Login to get token
    const loginUrl = `${consoleOrigin}/console/api/login`;
    const loginResponse = await fetch(loginUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        'Cache-Control': 'no-cache',
        'User-Agent': 'DifyAgentCreator/1.0'
      },
      body: JSON.stringify({
        email: adminEmail,
        password: adminPassword
      })
    });

    if (!loginResponse.ok) {
      const errorText = await loginResponse.text().catch(() => 'Unable to read error response');
      const errorPreview = errorText.substring(0, 500);
      throw new Error(`Login failed: ${loginResponse.status} ${loginResponse.statusText}. URL: ${loginUrl}. Error: ${errorPreview}`);
    }

    let loginData;
    try {
      loginData = await loginResponse.json();
    } catch (parseError) {
      const errorText = await loginResponse.text().catch(() => 'Unable to read response');
      const errorPreview = errorText.substring(0, 500);
      throw new Error(`Failed to parse JSON response from login. Response: ${errorPreview}`);
    }

    // Log login response to check for workspace information
    console.log(`[Agent Creation] Login response data:`, JSON.stringify({
      hasData: !!loginData.data,
      hasAccessToken: !!(loginData.data?.access_token || loginData.access_token),
      userInfo: loginData.data?.user ? {
        id: loginData.data.user.id,
        email: loginData.data.user.email,
        currentWorkspaceId: loginData.data.user.current_workspace_id,
        currentWorkspace: loginData.data.user.current_workspace
      } : null,
      workspaceInfo: loginData.data?.workspace || loginData.workspace || null
    }, null, 2));

    const token = loginData.data?.access_token || loginData.access_token || loginData.data?.token;
    
    if (!token) {
      throw new Error(`No access token received from login. Response: ${JSON.stringify(loginData).substring(0, 500)}`);
    }
    
    // Log if login response contains workspace information that differs from env
    const loginWorkspaceId = loginData.data?.user?.current_workspace_id || loginData.data?.workspace?.id || loginData.workspace?.id;
    if (loginWorkspaceId && loginWorkspaceId !== workspaceId) {
      console.warn(`[Agent Creation] WARNING: Login response indicates active workspace is ${loginWorkspaceId.substring(0, 8)}..., but we're using env workspace ${workspaceId.substring(0, 8)}...`);
      console.log(`[Agent Creation] Switching workspace to target workspace...`);
    }
    
    // CRITICAL: Switch workspace after login to ensure all operations use the correct workspace
    // Dify API ignores X-Workspace-Id header and uses the session's active workspace
    // We must explicitly switch the workspace in the session
    console.log(`[Agent Creation] Switching workspace to: ${workspaceId.substring(0, 8)}...`);
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
        const switchData = await switchResponse.json().catch(() => ({}));
        console.log(`[Agent Creation] ✓ Workspace switched successfully to: ${workspaceId.substring(0, 8)}...`);
        console.log(`[Agent Creation] Switch response:`, JSON.stringify(switchData, null, 2));
      } else {
        const errorText = await switchResponse.text().catch(() => 'Unable to read error');
        console.warn(`[Agent Creation] ⚠️ Workspace switch failed: ${switchResponse.status} ${switchResponse.statusText}`);
        console.warn(`[Agent Creation] Error response: ${errorText.substring(0, 500)}`);
        console.warn(`[Agent Creation] Continuing with current workspace - app may be created in wrong workspace`);
      }
    } catch (switchError) {
      console.warn(`[Agent Creation] ⚠️ Workspace switch error:`, switchError);
      console.warn(`[Agent Creation] Continuing with current workspace - app may be created in wrong workspace`);
    }
    
    // Step 2: Create app using YAML import
    const yamlContent = `version: "0.3.0"
kind: "app"
app:
  mode: "chat"
  name: "${agentName}"
  description: "Created via API on Dify"
model_config:
  model:
    provider: "${modelProvider}"
    name: "${modelName}"
  pre_prompt: "You are a helpful assistant."
  parameters:
    temperature: 0.3`;

    // Log the request details before sending
    console.log(`[Agent Creation] Creating app with workspace ID: ${workspaceId}`);
    console.log(`[Agent Creation] Request URL: ${consoleOrigin}/console/api/apps/imports`);
    console.log(`[Agent Creation] Request headers:`, {
      'Authorization': 'Bearer [REDACTED]',
      'X-Workspace-Id': workspaceId,
      'Content-Type': 'application/json'
    });

    const importResponse = await fetch(`${consoleOrigin}/console/api/apps/imports`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-Workspace-Id': workspaceId,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        mode: 'yaml-content',
        yaml_content: yamlContent
      })
    });

    // Log response status and headers
    console.log(`[Agent Creation] Import response status: ${importResponse.status} ${importResponse.statusText}`);
    console.log(`[Agent Creation] Import response headers:`, Object.fromEntries(importResponse.headers.entries()));

    if (!importResponse.ok) {
      const errorText = await importResponse.text();
      console.error(`[Agent Creation] Import failed. Error: ${errorText}`);
      throw new Error(`App import failed: ${importResponse.status} ${importResponse.statusText} - ${errorText}`);
    }

    const importData = await importResponse.json();
    
    // Log full import response to see workspace information
    console.log(`[Agent Creation] Import response data:`, JSON.stringify({
      app_id: importData.app_id || importData.data?.app_id,
      status: importData.status || importData.data?.status,
      workspace_id: importData.workspace_id || importData.data?.workspace_id,
      fullResponse: importData
    }, null, 2));
    
    const appId = importData.app_id || importData.data?.app_id;
    
    if (!appId) {
      throw new Error('No app ID received from import');
    }
    
    // Verify workspace ID in response matches what we sent
    const responseWorkspaceId = importData.workspace_id || importData.data?.workspace_id;
    if (responseWorkspaceId && responseWorkspaceId !== workspaceId) {
      console.error(`[Agent Creation] CRITICAL: App was created in workspace ${responseWorkspaceId.substring(0, 8)}... but we requested ${workspaceId.substring(0, 8)}...`);
    } else if (responseWorkspaceId) {
      console.log(`[Agent Creation] ✓ App created in correct workspace: ${responseWorkspaceId.substring(0, 8)}...`);
    }
    // Step 3: Create API key
    const keyResponse = await fetch(`${consoleOrigin}/console/api/apps/${appId}/api-keys`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-Workspace-Id': workspaceId,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: `api-key-${Date.now()}`
      })
    });

    if (!keyResponse.ok) {
      const errorText = await keyResponse.text();
      throw new Error(`API key creation failed: ${keyResponse.status} ${keyResponse.statusText} - ${errorText}`);
    }

    const keyData = await keyResponse.json();
    const appKey = keyData.data?.api_key || keyData.data?.key || keyData.key || keyData.token;
    
    if (!appKey) {
      throw new Error('No API key received');
    }
    // Step 4: Get service origin and verify app workspace
    console.log(`[Agent Creation] Fetching app details for app ID: ${appId} with workspace ID: ${workspaceId}`);
    const appDetailResponse = await fetch(`${consoleOrigin}/console/api/apps/${appId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-Workspace-Id': workspaceId
      }
    });

    let serviceOrigin = '';
    if (appDetailResponse.ok) {
      const appDetail = await appDetailResponse.json();
      
      // Log app details to verify workspace
      console.log(`[Agent Creation] App detail response:`, JSON.stringify({
        app_id: appDetail.data?.id || appDetail.id,
        app_name: appDetail.data?.name || appDetail.name,
        workspace_id: appDetail.data?.workspace_id || appDetail.workspace_id,
        mode: appDetail.data?.mode || appDetail.mode,
        hasApiServer: !!(appDetail.data?.api_server || appDetail.api_server)
      }, null, 2));
      
      const appWorkspaceId = appDetail.data?.workspace_id || appDetail.workspace_id;
      if (appWorkspaceId && appWorkspaceId !== workspaceId) {
        console.error(`[Agent Creation] CRITICAL: App detail shows workspace ${appWorkspaceId.substring(0, 8)}... but we requested ${workspaceId.substring(0, 8)}...`);
      } else if (appWorkspaceId) {
        console.log(`[Agent Creation] ✓ App detail confirms correct workspace: ${appWorkspaceId.substring(0, 8)}...`);
      }
      
      serviceOrigin = appDetail.data?.api_server || appDetail.api_server || '';
      if (serviceOrigin) {
        serviceOrigin = serviceOrigin.replace('/v1', '');
      }
    } else {
      console.warn(`[Agent Creation] Failed to fetch app details: ${appDetailResponse.status} ${appDetailResponse.statusText}`);
    }
    
    // Step 5: Verify app exists in the correct workspace by listing apps
    console.log(`[Agent Creation] Verifying app exists in workspace ${workspaceId.substring(0, 8)}...`);
    console.log(`[Agent Creation] Full workspace ID: ${workspaceId}`);
    try {
      const listAppsResponse = await fetch(`${consoleOrigin}/console/api/apps?page=1&limit=100`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Workspace-Id': workspaceId
        }
      });
      
      if (listAppsResponse.ok) {
        const appsData = await listAppsResponse.json();
        const apps = appsData.data || appsData || [];
        console.log(`[Agent Creation] Found ${apps.length} apps in workspace ${workspaceId.substring(0, 8)}...`);
        
        const foundApp = apps.find((app: any) => (app.id || app.app_id) === appId);
        
        if (foundApp) {
          console.log(`[Agent Creation] ✓ VERIFIED: App ${appId.substring(0, 8)}... exists in workspace ${workspaceId.substring(0, 8)}...`);
          console.log(`[Agent Creation] Full workspace ID: ${workspaceId}`);
          console.log(`[Agent Creation] App name in workspace: ${foundApp.name || foundApp.app_name || 'N/A'}`);
          console.log(`[Agent Creation] App details:`, JSON.stringify({
            id: foundApp.id || foundApp.app_id,
            name: foundApp.name || foundApp.app_name,
            mode: foundApp.mode
          }, null, 2));
          console.log(`[Agent Creation] ⚠️ IMPORTANT: If the app appears in a different workspace in the UI, the UI might be using the active workspace context instead of filtering by workspace ID.`);
          console.log(`[Agent Creation] ⚠️ The app was created in workspace: ${workspaceId}`);
          console.log(`[Agent Creation] ⚠️ Make sure you're viewing the correct workspace in the Dify UI to see this app.`);
        } else {
          console.error(`[Agent Creation] ⚠️ WARNING: App ${appId.substring(0, 8)}... NOT FOUND in workspace ${workspaceId.substring(0, 8)}...`);
          console.error(`[Agent Creation] This suggests the app was created in a different workspace!`);
          console.error(`[Agent Creation] Total apps found in target workspace: ${apps.length}`);
          if (apps.length > 0) {
            console.error(`[Agent Creation] First few app IDs in workspace:`, apps.slice(0, 3).map((app: any) => app.id || app.app_id));
          }
        }
      } else {
        const errorText = await listAppsResponse.text().catch(() => 'Unable to read error');
        console.warn(`[Agent Creation] Could not verify workspace - list apps failed: ${listAppsResponse.status} ${listAppsResponse.statusText}`);
        console.warn(`[Agent Creation] Error response: ${errorText.substring(0, 500)}`);
      }
    } catch (verifyError) {
      console.warn(`[Agent Creation] Could not verify workspace:`, verifyError);
    }
    return {
      success: true,
      data: {
        appId,
        appKey,
        appName: agentName,
        serviceOrigin,
        organizationId,
        modelProvider,
        modelName
      }
    };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate the request
    const authResult = await authenticateApiKey(request);
    if (!authResult.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // CRITICAL: Ensure workspace ID is from environment variable ONLY
    // Do NOT read from request headers (x-workspace-id) or user context
    // This prevents agents from being created in the wrong workspace
    const workspaceIdFromEnv = getWorkspaceIdFromEnv();
    console.log(`[Agent Creation API] Workspace ID from environment: ${workspaceIdFromEnv.substring(0, 8)}...`);
    
    // Explicitly ignore any workspace ID from request headers to prevent conflicts
    const requestWorkspaceId = request.headers.get('x-workspace-id') || request.headers.get('X-Workspace-Id');
    if (requestWorkspaceId && requestWorkspaceId !== workspaceIdFromEnv) {
      console.warn(`[Agent Creation API] WARNING: Request contains workspace ID header (${requestWorkspaceId.substring(0, 8)}...), but using environment variable workspace ID instead.`);
    }

    const body: CreateDifyAgentRequest = await request.json();
    const { agentName, organizationId, modelProvider = 'langgenius/openai/openai', modelName = 'gpt-4o', agentType = 'Knowledge Agent (RAG)' } = body;

    if (!agentName || !organizationId) {
      return NextResponse.json({ 
        error: 'Missing required fields: agentName and organizationId' 
      }, { status: 400 });
    }
    // Determine the correct script path based on the operating system
    const isWindows = process.platform === 'win32';
    const scriptPath = isWindows 
      ? path.join(process.cwd(), 'scripts', 'create_dify_agent.ps1')
      : path.join(process.cwd(), 'scripts', 'create_dify_agent.sh');

    // Check if script file exists
    if (!fs.existsSync(scriptPath)) {
      throw new Error(`Script file not found: ${scriptPath}`);
    }
    
    // Check if script is executable (for Unix systems)
    if (!isWindows) {
      try {
        const stats = fs.statSync(scriptPath);
        const isExecutable = (stats.mode & parseInt('111', 8)) !== 0;
        if (!isExecutable) {
          fs.chmodSync(scriptPath, '755');
        }
      } catch (chmodError) {
      }
    }

    try {
      // Execute the script
      // CRITICAL: Ensure workspace ID is from environment variable ONLY
      // Do NOT pass any workspace ID from request headers or user context to the script
      const requiredEnvVars = {
        NEXT_PUBLIC_DIFY_CONSOLE_ORIGIN: process.env.NEXT_PUBLIC_DIFY_CONSOLE_ORIGIN,
        NEXT_PUBLIC_DIFY_ADMIN_EMAIL: process.env.NEXT_PUBLIC_DIFY_ADMIN_EMAIL,
        NEXT_PUBLIC_DIFY_ADMIN_PASSWORD: process.env.NEXT_PUBLIC_DIFY_ADMIN_PASSWORD,
        // Always use workspace ID from environment variable, never from request
        NEXT_PUBLIC_DIFY_WORKSPACE_ID: workspaceIdFromEnv,
      };
      
      // Check if all required environment variables are set
      const missingVars = Object.entries(requiredEnvVars)
        .filter(([key, value]) => !value)
        .map(([key]) => key);
      
      if (missingVars.length > 0) {
        throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
      }
      
      // Prepare environment variables for the script
      // Explicitly override any workspace ID that might exist in process.env
      // to ensure we always use the one from .env file
      const envVars = {
        ...process.env,
        ...requiredEnvVars,
        // Force override to ensure script uses correct workspace ID
        NEXT_PUBLIC_DIFY_WORKSPACE_ID: workspaceIdFromEnv,
      };
      
      console.log(`[Agent Creation API] Passing workspace ID to script: ${workspaceIdFromEnv.substring(0, 8)}...`);
      
      // Determine the correct command based on the operating system
      const command = isWindows 
        ? `powershell -ExecutionPolicy Bypass -File "${scriptPath}" -AgentName "${agentName}" -AgentType "${agentType}" -ModelProvider "${modelProvider}" -ModelName "${modelName}"`
        : `bash "${scriptPath}" "${agentName}" "${agentType}" "${modelProvider}" "${modelName}"`;
      // Check if required tools are available (for debugging)
      try {
        const { stdout: curlCheck } = await execAsync('which curl', { timeout: 5000 });
} catch (curlError) {
      }
      
      try {
        const { stdout: jqCheck } = await execAsync('which jq', { timeout: 5000 });
} catch (jqError) {
      }
      console.log(`[Agent Creation API] Executing script: ${command.substring(0, 100)}...`);
      console.log(`[Agent Creation API] Script will output logs below...`);
      
      const { stdout, stderr } = await execAsync(command, {
        timeout: 60000, // 60 second timeout
        maxBuffer: 1024 * 1024 * 10, // 10MB buffer
        env: envVars // Pass environment variables to the script
      });
      
      // Log all script output for debugging - this is critical for workspace debugging
      console.log(`\n========== SCRIPT OUTPUT (STDOUT) ==========`);
      if (stdout && stdout.trim()) {
        // Split by lines and log each line with prefix for clarity
        const stdoutLines = stdout.split('\n');
        stdoutLines.forEach((line, index) => {
          if (line.trim()) {
            console.log(`[Script] ${line}`);
          }
        });
      } else {
        console.log(`[Script] (no stdout output)`);
      }
      console.log(`==========================================\n`);
      
      console.log(`\n========== SCRIPT ERRORS (STDERR) ==========`);
      if (stderr && stderr.trim()) {
        const stderrLines = stderr.split('\n');
        stderrLines.forEach((line, index) => {
          if (line.trim()) {
            console.error(`[Script Error] ${line}`);
          }
        });
      } else {
        console.log(`[Script] (no stderr output)`);
      }
      console.log(`==========================================\n`);
      
      // Additional debugging for environment issues
      if (stdout.includes('Error:') || stderr.includes('Error:')) {
        throw new Error(`Script execution failed: ${stderr || stdout}`);
      }

      // Parse the JSON output from the script
      const lines = stdout.split('\n');
      let jsonOutput = '';
      
      // Find the JSON line in the output
      for (const line of lines) {
        if (line.trim().startsWith('{') && line.trim().endsWith('}')) {
          jsonOutput = line.trim();
          break;
        }
      }

      if (!jsonOutput) {
        throw new Error(`No JSON output found in script result. Stdout: ${stdout}, Stderr: ${stderr}`);
      }

      let result;
      try {
        result = JSON.parse(jsonOutput);
      } catch (parseError) {
        throw new Error(`Failed to parse JSON output: ${parseError instanceof Error ? parseError.message : 'Unknown parse error'}`);
      }
      
      if (!result.success || !result.app_key) {
        throw new Error(`Script execution failed or no API key generated. Result: ${JSON.stringify(result)}`);
      }
      return NextResponse.json({
        success: true,
        data: {
          appId: result.app_id,
          appKey: result.app_key,
          appName: result.app_name,
          serviceOrigin: result.service_origin,
          organizationId,
          modelProvider,
          modelName
        },
        message: 'Dify agent created successfully'
      });

    } catch (execError) {
      console.error(`[Agent Creation API] Script execution error:`, execError);
      console.error(`[Agent Creation API] Error details:`, {
        message: execError instanceof Error ? execError.message : 'Unknown error',
        code: (execError as any)?.code,
        signal: (execError as any)?.signal
      });
      
      // Try fallback method using direct API calls
      console.log(`[Agent Creation API] Attempting fallback method (direct API calls)...`);
      try {
        const fallbackResult = await createDifyAgentDirectly(agentName, organizationId, modelProvider, modelName, agentType);
        if (fallbackResult.success) {
          console.log(`[Agent Creation API] Fallback method succeeded`);
          return NextResponse.json({
            success: true,
            data: fallbackResult.data,
            message: 'Dify agent created successfully using fallback method'
          });
        } else {
          console.error(`[Agent Creation API] Fallback method failed:`, fallbackResult.error);
        }
      } catch (fallbackError) {
        console.error(`[Agent Creation API] Fallback method error:`, fallbackError);
      }

      return NextResponse.json({
        success: false,
        error: 'Failed to execute Dify agent creation script',
        details: execError instanceof Error ? execError.message : 'Unknown error',
        errorCode: (execError as any)?.code,
        errorSignal: (execError as any)?.signal
      }, { status: 500 });
    }

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}