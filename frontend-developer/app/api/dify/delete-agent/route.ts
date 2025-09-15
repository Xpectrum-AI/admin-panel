import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiKey } from '@/lib/middleware/auth';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import os from 'os';

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

    // Create the script content dynamically based on platform
    const isWindows = process.platform === 'win32';
    const scriptContent = isWindows ? 
      // PowerShell version for Windows
      `
# Dify Agent Deletion Script for Windows
$ErrorActionPreference = "Stop"

# Configuration
$DIFY_API_URL = "${process.env.DIFY_API_URL || 'https://api.dify.ai/v1'}"
$DIFY_API_KEY = "${process.env.DIFY_API_KEY || ''}"
$AGENT_NAME = "${agentName}"
$ORG_ID = "${organizationId}"
${appId ? `$APP_ID = "${appId}"` : ''}

Write-Host "🗑️ Deleting Dify agent: $AGENT_NAME"

try {
    # If we have an app ID, try to delete the specific app
    ${appId ? `
    if ($APP_ID) {
        Write-Host "🔍 Deleting app with ID: $APP_ID"
        $deleteResponse = Invoke-RestMethod -Uri "$DIFY_API_URL/apps/$APP_ID" -Method DELETE -Headers @{
            "Authorization" = "Bearer $DIFY_API_KEY"
            "Content-Type" = "application/json"
        }
        Write-Host "✅ App deleted successfully"
    } else {
        Write-Host "⚠️ No app ID provided, skipping app deletion"
    }
    ` : `
    Write-Host "⚠️ No app ID provided, cannot delete specific app"
    `}
    
    # Return success response
    $result = @{
        success = $true
        message = "Dify agent deletion completed"
        agentName = $AGENT_NAME
        organizationId = $ORG_ID
    } | ConvertTo-Json -Compress
    
    Write-Host $result
} catch {
    Write-Host "❌ Error deleting Dify agent: $($_.Exception.Message)"
    $errorResult = @{
        success = $false
        error = $_.Exception.Message
        agentName = $AGENT_NAME
        organizationId = $ORG_ID
    } | ConvertTo-Json -Compress
    
    Write-Host $errorResult
    exit 1
}
      ` :
      // Bash version for Unix-like systems
      `
#!/bin/bash
set -e

# Configuration
DIFY_API_URL="${process.env.DIFY_API_URL || 'https://api.dify.ai/v1'}"
DIFY_API_KEY="${process.env.DIFY_API_KEY || ''}"
AGENT_NAME="${agentName}"
ORG_ID="${organizationId}"
${appId ? `APP_ID="${appId}"` : ''}

echo "🗑️ Deleting Dify agent: $AGENT_NAME"

# If we have an app ID, try to delete the specific app
${appId ? `
if [ -n "$APP_ID" ]; then
    echo "🔍 Deleting app with ID: $APP_ID"
    curl -X DELETE "$DIFY_API_URL/apps/$APP_ID" \\
        -H "Authorization: Bearer $DIFY_API_KEY" \\
        -H "Content-Type: application/json"
    echo "✅ App deleted successfully"
else
    echo "⚠️ No app ID provided, skipping app deletion"
fi
` : `
echo "⚠️ No app ID provided, cannot delete specific app"
`}

# Return success response
echo '{"success":true,"message":"Dify agent deletion completed","agentName":"'$AGENT_NAME'","organizationId":"'$ORG_ID'"}'
      `;

    // Create temporary script file
    const tempDir = os.tmpdir();
    const scriptName = `delete-dify-agent-${Date.now()}.${isWindows ? 'ps1' : 'sh'}`;
    const scriptPath = path.join(tempDir, scriptName);

    console.log('📝 Creating deletion script at:', scriptPath);
    fs.writeFileSync(scriptPath, scriptContent, { mode: 0o755 });

    try {
      // Execute the script
      console.log('🔧 Executing Dify agent deletion script...');
      console.log('📁 Script path:', scriptPath);
      
      // Determine the correct command based on the operating system
      const command = isWindows ? `powershell -ExecutionPolicy Bypass -File "${scriptPath}"` : `bash "${scriptPath}"`;
      
      console.log('🔧 Executing command:', command);
      console.log('🔧 Platform:', process.platform);
      
      const { stdout, stderr } = await execAsync(command, {
        timeout: 30000, // 30 second timeout
        maxBuffer: 1024 * 1024 * 5 // 5MB buffer
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
      
      if (!result.success) {
        throw new Error(result.error || 'Script execution failed');
      }

      console.log('✅ Dify agent deleted successfully:', {
        agentName: result.agentName,
        organizationId: result.organizationId
      });

      // Clean up the temporary script file
      fs.unlinkSync(scriptPath);

      return NextResponse.json({
        success: true,
        message: 'Dify agent deleted successfully',
        data: result
      });

    } catch (scriptError) {
      console.error('❌ Script execution error:', scriptError);
      
      // Clean up the temporary script file
      try {
        fs.unlinkSync(scriptPath);
      } catch (cleanupError) {
        console.warn('⚠️ Failed to clean up script file:', cleanupError);
      }

      return NextResponse.json({
        success: false,
        error: 'Failed to delete Dify agent',
        details: scriptError instanceof Error ? scriptError.message : 'Unknown error'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('❌ Dify agent deletion error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
