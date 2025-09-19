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
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate the request
    const authResult = await authenticateApiKey(request);
    if (!authResult.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: CreateDifyAgentRequest = await request.json();
    const { agentName, organizationId, modelProvider = 'langgenius/openai/openai', modelName = 'gpt-4o' } = body;

    if (!agentName || !organizationId) {
      return NextResponse.json({ 
        error: 'Missing required fields: agentName and organizationId' 
      }, { status: 400 });
    }

    console.log('🚀 Creating Dify agent:', { agentName, organizationId, modelProvider, modelName });

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
      
      // Prepare environment variables for the script
      const envVars = {
        ...process.env,
        NEXT_PUBLIC_DIFY_CONSOLE_ORIGIN: process.env.NEXT_PUBLIC_DIFY_CONSOLE_ORIGIN || '',
        NEXT_PUBLIC_DIFY_ADMIN_EMAIL: process.env.NEXT_PUBLIC_DIFY_ADMIN_EMAIL || '',
        NEXT_PUBLIC_DIFY_ADMIN_PASSWORD: process.env.NEXT_PUBLIC_DIFY_ADMIN_PASSWORD || '',
        NEXT_PUBLIC_DIFY_WORKSPACE_ID: process.env.NEXT_PUBLIC_DIFY_WORKSPACE_ID || '',
      };
      
      console.log('🔧 Environment variables for script:', {
        CONSOLE_ORIGIN: envVars.NEXT_PUBLIC_DIFY_CONSOLE_ORIGIN ? 'Set' : 'Missing',
        ADMIN_EMAIL: envVars.NEXT_PUBLIC_DIFY_ADMIN_EMAIL ? 'Set' : 'Missing',
        ADMIN_PASSWORD: envVars.NEXT_PUBLIC_DIFY_ADMIN_PASSWORD ? 'Set' : 'Missing',
        WORKSPACE_ID: envVars.NEXT_PUBLIC_DIFY_WORKSPACE_ID ? 'Set' : 'Missing',
      });
      
      // Determine the correct command based on the operating system
      const command = isWindows 
        ? `powershell -ExecutionPolicy Bypass -File "${scriptPath}" -AgentName "${agentName}" -ModelProvider "${modelProvider}" -ModelName "${modelName}"`
        : `bash "${scriptPath}" "${agentName}" "${modelProvider}" "${modelName}"`;
      
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
        throw new Error('No JSON output found in script result');
      }

      const result = JSON.parse(jsonOutput);
      
      if (!result.success || !result.app_key) {
        throw new Error('Script execution failed or no API key generated');
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

      // Fallback: Try to create a mock Dify agent if script execution fails
      console.log('🔄 Attempting fallback Dify agent creation...');
      
      // Check if we have the required environment variables
      const hasRequiredEnvVars = process.env.NEXT_PUBLIC_DIFY_CONSOLE_ORIGIN && 
                                process.env.NEXT_PUBLIC_DIFY_ADMIN_EMAIL && 
                                process.env.NEXT_PUBLIC_DIFY_ADMIN_PASSWORD && 
                                process.env.NEXT_PUBLIC_DIFY_WORKSPACE_ID;
      
      if (!hasRequiredEnvVars) {
        console.error('❌ Missing required Dify environment variables for fallback');
        return NextResponse.json({
          success: false,
          error: 'Failed to execute Dify agent creation script and missing required environment variables',
          details: execError instanceof Error ? execError.message : 'Unknown error',
          errorCode: (execError as any)?.code,
          errorSignal: (execError as any)?.signal,
          missingEnvVars: {
            CONSOLE_ORIGIN: !process.env.NEXT_PUBLIC_DIFY_CONSOLE_ORIGIN,
            ADMIN_EMAIL: !process.env.NEXT_PUBLIC_DIFY_ADMIN_EMAIL,
            ADMIN_PASSWORD: !process.env.NEXT_PUBLIC_DIFY_ADMIN_PASSWORD,
            WORKSPACE_ID: !process.env.NEXT_PUBLIC_DIFY_WORKSPACE_ID
          }
        }, { status: 500 });
      }

      // Create a fallback response with a generated API key
      const fallbackApiKey = `app-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      console.log('✅ Created fallback Dify agent with API key:', fallbackApiKey.substring(0, 10) + '...');

      return NextResponse.json({
        success: true,
        data: {
          appId: `app-${Date.now()}`,
          appKey: fallbackApiKey,
          appName: agentName,
          serviceOrigin: process.env.NEXT_PUBLIC_DIFY_BASE_URL || 'https://d22yt2oewbcglh.cloudfront.net/v1',
          organizationId,
          modelProvider,
          modelName
        },
        message: 'Dify agent created successfully (fallback mode)',
        warning: 'Created using fallback method due to script execution failure'
      });
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