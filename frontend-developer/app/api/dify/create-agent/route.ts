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

    // Create the script content dynamically based on platform
    const isWindows = process.platform === 'win32';
    const scriptContent = isWindows ? 
      // PowerShell version for Windows
      `# PowerShell script for Dify agent creation
$ErrorActionPreference = "Stop"

$CONSOLE_ORIGIN = "https://test.xpectrum-ai.com"
$ADMIN_EMAIL = "ghosh.ishw@gmail.com"
$ADMIN_PASSWORD = "Ghosh1@*123"
$WS_ID = "cd0309e7-6517-4932-8fc8-21c3bc4eb41b"
$APP_NAME = "${agentName}"
$MODEL_PROVIDER_FQN = "${modelProvider}"
$MODEL_NAME = "${modelName}"

function Write-Log {
    param([string]$Message)
    $timestamp = Get-Date -Format "HH:mm:ss"
    Write-Host "[$timestamp] $Message"
}

Write-Log "login"
$loginBody = @{
    email = $ADMIN_EMAIL
    password = $ADMIN_PASSWORD
} | ConvertTo-Json

try {
    # For older PowerShell versions, use -UseBasicParsing instead of -SkipCertificateCheck
    $loginResponse = Invoke-RestMethod -Uri "$CONSOLE_ORIGIN/console/api/login" -Method POST -Body $loginBody -ContentType "application/json" -UseBasicParsing
    $TOKEN = $loginResponse.data.access_token
    if (-not $TOKEN) {
        throw "Login failed - no token received"
    }
    Write-Log "logged in, workspace=$WS_ID"
} catch {
    Write-Error "Login error: $_"
    exit 1
}

# Create YAML content
$yamlContent = @"
version: "0.3.0"
kind: "app"
app:
  mode: "chat"
  name: "$APP_NAME"
  description: "Created via CLI on Dify 1.4"
model_config:
  model:
    provider: "$MODEL_PROVIDER_FQN"
    name: "$MODEL_NAME"
  pre_prompt: "You are a helpful assistant."
  parameters:
    temperature: 0.3
"@

$importBody = @{
    mode = "yaml-content"
    yaml_content = $yamlContent
} | ConvertTo-Json

Write-Log "import app"
try {
    $headers = @{
        "Authorization" = "Bearer $TOKEN"
        "X-Workspace-Id" = $WS_ID
        "Content-Type" = "application/json"
    }
    $importResponse = Invoke-RestMethod -Uri "$CONSOLE_ORIGIN/console/api/apps/imports" -Method POST -Body $importBody -Headers $headers -UseBasicParsing
    $STATUS = $importResponse.status
    $APP_ID = $importResponse.app_id
    
    if ($STATUS -ne "completed" -or -not $APP_ID) {
        throw "Import failed - Status: $STATUS, App ID: $APP_ID"
    }
    Write-Log "app_id=$APP_ID"
} catch {
    Write-Error "Import error: $_"
    exit 1
}

Write-Log "create app key"
$keyBody = @{
    name = "cli-$(Get-Date -Format 'yyyyMMddHHmmss')"
} | ConvertTo-Json

try {
    $keyResponse = Invoke-RestMethod -Uri "$CONSOLE_ORIGIN/console/api/apps/$APP_ID/api-keys" -Method POST -Body $keyBody -Headers $headers -UseBasicParsing
    $APP_KEY = $keyResponse.token
    
    if (-not $APP_KEY) {
        throw "Failed to create API key"
    }
    Write-Log "app_key=$APP_KEY"
} catch {
    Write-Error "API key creation error: $_"
    exit 1
}

# Output the results in JSON format
$result = @{
    success = $true
    app_id = $APP_ID
    app_key = $APP_KEY
    app_name = $APP_NAME
} | ConvertTo-Json -Compress

Write-Output $result
` :
      // Bash version for Linux/Mac
      `#!/usr/bin/env bash
set -euo pipefail

CONSOLE_ORIGIN="https://test.xpectrum-ai.com"
ADMIN_EMAIL="ghosh.ishw@gmail.com"
ADMIN_PASSWORD="Ghosh1@*123"
WS_ID="cd0309e7-6517-4932-8fc8-21c3bc4eb41b"
APP_NAME="${agentName}"

# === defaults (safe for \`set -u\`) ===
: "\${MODEL_PROVIDER_FQN:=${modelProvider}}"
: "\${MODEL_NAME:=${modelName}}"

SERVICE_ORIGIN="\${SERVICE_ORIGIN:-}"

command -v curl >/dev/null || { echo "need curl"; exit 1; }
command -v jq   >/dev/null || { echo "need jq";   exit 1; }

say(){ printf "[%s] %s\\n" "\$(date +%H:%M:%S)" "\$*"; }
hdr_code(){ awk 'NR==1{print \$2}'; }
hdr_ct(){ awk 'BEGIN{IGNORECASE=1}/^content-type:/{print \$2}' | tr -d '\\r'; }

say "login"
RESP=\$(curl -sS -X POST "\$CONSOLE_ORIGIN/console/api/login" \\
  -H "Content-Type: application/json" \\
  -d "{\\"email\\":\\"\$ADMIN_EMAIL\\",\\"password\\":\\"\$ADMIN_PASSWORD\\"}")
TOKEN=\$(echo "\$RESP" | jq -r '.data.access_token // .access_token // .data.token // empty')
[ -n "\$TOKEN" ] || { echo "login error"; exit 1; }
AUTH=(-H "Authorization: Bearer \$TOKEN")
WS_HDR=(-H "X-Workspace-Id: \$WS_ID")
say "logged in, workspace=\$WS_ID"

# --- DSL: provider 放进 model 且使用 FQN ---
DSL_A="\$(cat <<YAML
version: "0.3.0"
kind: "app"
app:
  mode: "chat"
  name: "\$APP_NAME"
  description: "Created via CLI on Dify 1.4"
model_config:
  model:
    provider: "\$MODEL_PROVIDER_FQN"
    name: "\$MODEL_NAME"
  pre_prompt: "You are a helpful assistant."
  parameters:
    temperature: 0.3
YAML
)"
BODY=\$(jq -n --arg mode "yaml-content" --arg yaml "\$DSL_A" '{mode:\$mode,yaml_content:\$yaml}')
say "import app"
RESP=\$(curl -sS -X POST "\$CONSOLE_ORIGIN/console/api/apps/imports" \\
  "\${AUTH[@]}" "\${WS_HDR[@]}" -H "Content-Type: application/json" -d "\$BODY")
echo "\$RESP" | jq '.'
STATUS=\$(echo "\$RESP" | jq -r '.status // .data.status // empty')
APP_ID=\$(echo "\$RESP" | jq -r '.app_id // .data.app_id // empty')
[ "\$STATUS" = "completed" ] && [ -n "\$APP_ID" ] || { echo "import failed"; exit 1; }
say "app_id=\$APP_ID"

say "create app key"
KEY_RESP=\$(curl -sS -X POST "\$CONSOLE_ORIGIN/console/api/apps/\$APP_ID/api-keys" \\
  "\${AUTH[@]}" "\${WS_HDR[@]}" -H "Content-Type: application/json" \\
  -d "{\\"name\\":\\"cli-\$(date +%s)\\"}")
echo "\$KEY_RESP" | jq '.'
APP_KEY=\$(echo "\$KEY_RESP" | jq -r '.data.api_key // .data.key // .key // .token // empty')
[ -n "\$APP_KEY" ] || { echo "failed to create api key"; exit 1; }
say "app_key=\$APP_KEY"

# Output the results in JSON format for easy parsing
echo "{\\"success\\": true, \\"app_id\\": \\"\$APP_ID\\", \\"app_key\\": \\"\$APP_KEY\\", \\"app_name\\": \\"\$APP_NAME\\"}"
`;

    // Create a temporary script file
    const tempDir = path.join(process.cwd(), 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const scriptExtension = isWindows ? '.ps1' : '.sh';
    const scriptPath = path.join(tempDir, `create_dify_agent_${Date.now()}${scriptExtension}`);
    fs.writeFileSync(scriptPath, scriptContent, { mode: 0o755 });

    try {
      // Execute the script
      console.log('🔧 Executing Dify agent creation script...');
      console.log('📁 Script path:', scriptPath);
      console.log('📝 Script content preview:', scriptContent.substring(0, 200) + '...');
      
      // Determine the correct command based on the operating system
      const isWindows = process.platform === 'win32';
      const command = isWindows ? `powershell -ExecutionPolicy Bypass -File "${scriptPath}"` : `bash "${scriptPath}"`;
      
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
        hasApiKey: !!result.app_key
      });

      // Clean up the temporary script file
      fs.unlinkSync(scriptPath);

      return NextResponse.json({
        success: true,
        data: {
          appId: result.app_id,
          appKey: result.app_key,
          appName: result.app_name,
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
      
      // Clean up the temporary script file
      if (fs.existsSync(scriptPath)) {
        fs.unlinkSync(scriptPath);
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
