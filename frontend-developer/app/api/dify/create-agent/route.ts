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
    const workspaceId = process.env.NEXT_PUBLIC_DIFY_WORKSPACE_ID;

    if (!consoleOrigin || !adminEmail || !adminPassword || !workspaceId) {
      throw new Error('Missing required Dify environment variables');
    }

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

    const token = loginData.data?.access_token || loginData.access_token || loginData.data?.token;
    
    if (!token) {
      throw new Error(`No access token received from login. Response: ${JSON.stringify(loginData).substring(0, 500)}`);
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

    if (!importResponse.ok) {
      const errorText = await importResponse.text();
      throw new Error(`App import failed: ${importResponse.status} ${importResponse.statusText} - ${errorText}`);
    }

    const importData = await importResponse.json();
    const appId = importData.app_id || importData.data?.app_id;
    
    if (!appId) {
      throw new Error('No app ID received from import');
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
    // Step 4: Get service origin
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
      serviceOrigin = appDetail.data?.api_server || appDetail.api_server || '';
      if (serviceOrigin) {
        serviceOrigin = serviceOrigin.replace('/v1', '');
      }
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
      // Check if environment variables are properly set
      const requiredEnvVars = {
        NEXT_PUBLIC_DIFY_CONSOLE_ORIGIN: process.env.NEXT_PUBLIC_DIFY_CONSOLE_ORIGIN,
        NEXT_PUBLIC_DIFY_ADMIN_EMAIL: process.env.NEXT_PUBLIC_DIFY_ADMIN_EMAIL,
        NEXT_PUBLIC_DIFY_ADMIN_PASSWORD: process.env.NEXT_PUBLIC_DIFY_ADMIN_PASSWORD,
        NEXT_PUBLIC_DIFY_WORKSPACE_ID: process.env.NEXT_PUBLIC_DIFY_WORKSPACE_ID,
      };
      // Check if all required environment variables are set
      const missingVars = Object.entries(requiredEnvVars)
        .filter(([key, value]) => !value)
        .map(([key]) => key);
      
      if (missingVars.length > 0) {
        throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
      }
      
      // Prepare environment variables for the script
      const envVars = {
        ...process.env,
        ...requiredEnvVars,
      };
      
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
      const { stdout, stderr } = await execAsync(command, {
        timeout: 60000, // 60 second timeout
        maxBuffer: 1024 * 1024 * 10, // 10MB buffer
        env: envVars // Pass environment variables to the script
      });
      if (stderr) {
      }
      
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
// Try fallback method using direct API calls
      try {
        const fallbackResult = await createDifyAgentDirectly(agentName, organizationId, modelProvider, modelName, agentType);
        if (fallbackResult.success) {
          return NextResponse.json({
            success: true,
            data: fallbackResult.data,
            message: 'Dify agent created successfully using fallback method'
          });
        }
      } catch (fallbackError) {
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