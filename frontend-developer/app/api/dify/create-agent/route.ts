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

    try {
      // Execute the script
      console.log('🔧 Executing Dify agent creation script...');
      console.log('📁 Script path:', scriptPath);
      
      // Determine the correct command based on the operating system
      const command = isWindows 
        ? `powershell -ExecutionPolicy Bypass -File "${scriptPath}" -AgentName "${agentName}" -ModelProvider "${modelProvider}" -ModelName "${modelName}"`
        : `bash "${scriptPath}" "${agentName}" "${modelProvider}" "${modelName}"`;
      
      console.log('🔧 Executing command:', command);
      console.log('🔧 Platform:', process.platform);
      
      const { stdout, stderr } = await execAsync(command, {
        timeout: 60000, // 60 second timeout
        maxBuffer: 1024 * 1024 * 10 // 10MB buffer
      });

      console.log('📝 Script stdout:', stdout);
      if (stderr) {
        console.log('⚠️ Script stderr:', stderr);
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