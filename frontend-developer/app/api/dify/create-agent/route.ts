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
    console.log('🔄 Creating Dify agent using direct API calls...');
    
    const consoleOrigin = process.env.NEXT_PUBLIC_DIFY_CONSOLE_ORIGIN;
    const adminEmail = process.env.NEXT_PUBLIC_DIFY_ADMIN_EMAIL;
    const adminPassword = process.env.NEXT_PUBLIC_DIFY_ADMIN_PASSWORD;
    const workspaceId = process.env.NEXT_PUBLIC_DIFY_WORKSPACE_ID;

    if (!consoleOrigin || !adminEmail || !adminPassword || !workspaceId) {
      throw new Error('Missing required Dify environment variables');
    }

    // Step 1: Login to get token
    console.log('🔐 Logging into Dify console...');
    const loginResponse = await fetch(`${consoleOrigin}/console/api/login`, {
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
      throw new Error(`Login failed: ${loginResponse.status} ${loginResponse.statusText}`);
    }

    const loginData = await loginResponse.json();
    const token = loginData.data?.access_token || loginData.access_token || loginData.data?.token;
    
    if (!token) {
      throw new Error('No access token received from login');
    }

    console.log('✅ Successfully logged into Dify console');

    // Step 2: Create app using YAML import
    console.log('📝 Creating app via YAML import...');
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

    console.log(`✅ App created with ID: ${appId}`);

    // Step 3: Create API key
    console.log('🔑 Creating API key...');
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

    console.log('✅ API key created successfully');

    // Step 4: Get service origin
    console.log('🌐 Getting service origin...');
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

    console.log('✅ Dify agent created successfully via direct API calls');

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
    console.error('❌ Direct API creation failed:', error);
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

    console.log('🚀 Creating Dify agent:', { agentName, organizationId, modelProvider, modelName, agentType });

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
          console.log('⚠️ Script is not executable, attempting to make it executable...');
          fs.chmodSync(scriptPath, '755');
        }
      } catch (chmodError) {
        console.log('⚠️ Could not check/modify script permissions:', chmodError);
      }
    }

    try {
      // Execute the script
      console.log('🔧 Executing Dify agent creation script...');
      console.log('📁 Script path:', scriptPath);
      
      // Check if environment variables are properly set
      const requiredEnvVars = {
        NEXT_PUBLIC_DIFY_CONSOLE_ORIGIN: process.env.NEXT_PUBLIC_DIFY_CONSOLE_ORIGIN,
        NEXT_PUBLIC_DIFY_ADMIN_EMAIL: process.env.NEXT_PUBLIC_DIFY_ADMIN_EMAIL,
        NEXT_PUBLIC_DIFY_ADMIN_PASSWORD: process.env.NEXT_PUBLIC_DIFY_ADMIN_PASSWORD,
        NEXT_PUBLIC_DIFY_WORKSPACE_ID: process.env.NEXT_PUBLIC_DIFY_WORKSPACE_ID,
      };
      
      console.log('🔧 Environment variables for script:', {
        CONSOLE_ORIGIN: requiredEnvVars.NEXT_PUBLIC_DIFY_CONSOLE_ORIGIN ? 'Set' : 'Missing',
        ADMIN_EMAIL: requiredEnvVars.NEXT_PUBLIC_DIFY_ADMIN_EMAIL ? 'Set' : 'Missing',
        ADMIN_PASSWORD: requiredEnvVars.NEXT_PUBLIC_DIFY_ADMIN_PASSWORD ? 'Set' : 'Missing',
        WORKSPACE_ID: requiredEnvVars.NEXT_PUBLIC_DIFY_WORKSPACE_ID ? 'Set' : 'Missing',
      });
      
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
      
      console.log('🔧 Executing command:', command);
      console.log('🔧 Platform:', process.platform);
      
      // Check if required tools are available (for debugging)
      try {
        const { stdout: curlCheck } = await execAsync('which curl', { timeout: 5000 });
        console.log('✅ curl available:', curlCheck.trim());
      } catch (curlError) {
        console.log('⚠️ curl not available:', curlError);
      }
      
      try {
        const { stdout: jqCheck } = await execAsync('which jq', { timeout: 5000 });
        console.log('✅ jq available:', jqCheck.trim());
      } catch (jqError) {
        console.log('⚠️ jq not available:', jqError);
      }
      
      console.log('🚀 Starting script execution...');
      const { stdout, stderr } = await execAsync(command, {
        timeout: 60000, // 60 second timeout
        maxBuffer: 1024 * 1024 * 10, // 10MB buffer
        env: envVars // Pass environment variables to the script
      });

      console.log('📝 Script stdout:', stdout);
      if (stderr) {
        console.log('⚠️ Script stderr:', stderr);
      }
      
      // Additional debugging for environment issues
      if (stdout.includes('Error:') || stderr.includes('Error:')) {
        console.log('❌ Script execution failed with errors');
        console.log('🔍 Full stdout:', stdout);
        console.log('🔍 Full stderr:', stderr);
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
        console.error('❌ No JSON output found in script result');
        console.error('📝 Full stdout:', stdout);
        console.error('📝 Full stderr:', stderr);
        throw new Error(`No JSON output found in script result. Stdout: ${stdout}, Stderr: ${stderr}`);
      }

      let result;
      try {
        result = JSON.parse(jsonOutput);
      } catch (parseError) {
        console.error('❌ Failed to parse JSON output:', jsonOutput);
        throw new Error(`Failed to parse JSON output: ${parseError instanceof Error ? parseError.message : 'Unknown parse error'}`);
      }
      
      if (!result.success || !result.app_key) {
        console.error('❌ Script execution failed or no API key generated');
        console.error('📝 Result:', result);
        throw new Error(`Script execution failed or no API key generated. Result: ${JSON.stringify(result)}`);
      }

      console.log('✅ Dify agent created successfully:', {
        appId: result.app_id,
        appName: result.app_name,
        hasApiKey: !!result.app_key,
        serviceOrigin: result.service_origin
      });

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
      console.error('❌ Script execution error:', execError);
      console.error('❌ Error details:', {
        message: execError instanceof Error ? execError.message : 'Unknown error',
        code: (execError as any)?.code,
        signal: (execError as any)?.signal,
        cmd: (execError as any)?.cmd
      });

      // Try fallback method using direct API calls
      console.log('🔄 Attempting fallback method using direct API calls...');
      try {
        const fallbackResult = await createDifyAgentDirectly(agentName, organizationId, modelProvider, modelName, agentType);
        if (fallbackResult.success) {
          console.log('✅ Fallback method succeeded');
          return NextResponse.json({
            success: true,
            data: fallbackResult.data,
            message: 'Dify agent created successfully using fallback method'
          });
        }
      } catch (fallbackError) {
        console.error('❌ Fallback method also failed:', fallbackError);
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
    console.error('❌ Create Dify agent error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}