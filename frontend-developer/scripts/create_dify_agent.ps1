# PowerShell script for Dify agent creation
param(
    [Parameter(Mandatory=$true)]
    [string]$AgentName,
    [Parameter(Mandatory=$true)]
    [ValidateSet("Knowledge Agent (RAG)", "Action Agent (AI Employee)")]
    [string]$AgentType,
    [Parameter(Mandatory=$false)]
    [string]$ModelProvider = "langgenius/openai/openai",
    [Parameter(Mandatory=$false)]
    [string]$ModelName = "gpt-4o"
)

$ErrorActionPreference = "Stop"

# CRITICAL: Always use workspace ID from environment variable ONLY
# This ensures agents are always created in the workspace specified in .env
# and NOT in the currently active workspace context
# Do NOT read workspace ID from any other source (request headers, user context, etc.)

$CONSOLE_ORIGIN = $env:NEXT_PUBLIC_DIFY_CONSOLE_ORIGIN
$ADMIN_EMAIL = $env:NEXT_PUBLIC_DIFY_ADMIN_EMAIL
$ADMIN_PASSWORD = $env:NEXT_PUBLIC_DIFY_ADMIN_PASSWORD
$WS_ID = $env:NEXT_PUBLIC_DIFY_WORKSPACE_ID
$APP_NAME = $AgentName

# Validate required environment variables
if (-not $CONSOLE_ORIGIN) { Write-Error "Error: NEXT_PUBLIC_DIFY_CONSOLE_ORIGIN is not set"; exit 1 }
if (-not $ADMIN_EMAIL) { Write-Error "Error: NEXT_PUBLIC_DIFY_ADMIN_EMAIL is not set"; exit 1 }
if (-not $ADMIN_PASSWORD) { Write-Error "Error: NEXT_PUBLIC_DIFY_ADMIN_PASSWORD is not set"; exit 1 }
if (-not $WS_ID) { 
    Write-Error "Error: NEXT_PUBLIC_DIFY_WORKSPACE_ID is not set in environment variables. Agent creation requires a workspace ID from .env file."; 
    exit 1 
}

# Trim whitespace and validate workspace ID is not empty
$WS_ID = $WS_ID.Trim()
if ([string]::IsNullOrWhiteSpace($WS_ID)) {
    Write-Error "Error: NEXT_PUBLIC_DIFY_WORKSPACE_ID is empty. Please set a valid workspace ID in .env file."; 
    exit 1
}

Write-Host "[Agent Creation Script] Using workspace ID from environment: $($WS_ID.Substring(0, [Math]::Min(8, $WS_ID.Length)))..."

# Normalize CONSOLE_ORIGIN: ensure it ends with /api for proper URL construction
# Remove trailing slash if present
$CONSOLE_ORIGIN = $CONSOLE_ORIGIN.TrimEnd('/')
# Add /api if not already present
if (-not $CONSOLE_ORIGIN.EndsWith('/api')) {
    $CONSOLE_ORIGIN = "$CONSOLE_ORIGIN/api"
}
$MODEL_PROVIDER_FQN = $ModelProvider
$MODEL_NAME = $ModelName

$SERVICE_ORIGIN = ""

function Write-Log {
    param([string]$Message)
    $timestamp = Get-Date -Format "HH:mm:ss"
    # Write to stdout so it's captured by Node.js exec
    Write-Host "[$timestamp] $Message"
}

function Get-HeaderCode {
    param([string]$HeaderContent)
    return ($HeaderContent -split "`n" | Select-Object -First 1) -split " " | Select-Object -Index 1
}

function Get-ContentType {
    param([string]$HeaderContent)
    $contentTypeLine = $HeaderContent -split "`n" | Where-Object { $_ -match "^content-type:" -or $_ -match "^Content-Type:" }
    if ($contentTypeLine) {
        return ($contentTypeLine -split ":")[1].Trim()
    }
    return ""
}

Write-Log "login"
$loginUrl = "$CONSOLE_ORIGIN/console/api/login"
Write-Log "Login URL: $loginUrl"
$loginBody = @{
    email = $ADMIN_EMAIL
    password = $ADMIN_PASSWORD
} | ConvertTo-Json

try {
    $headers = @{
        "Content-Type" = "application/json"
        "X-Requested-With" = "XMLHttpRequest"
        "Cache-Control" = "no-cache"
        "User-Agent" = "DifyAgentCreator/1.0"
    }
    
    try {
        $loginResponse = Invoke-WebRequest -Uri $loginUrl -Method POST -Body $loginBody -Headers $headers -UseBasicParsing -ErrorAction Stop
        
        if ($loginResponse.StatusCode -ne 200) {
            $responsePreview = $loginResponse.Content.Substring(0, [Math]::Min(500, $loginResponse.Content.Length))
            Write-Error "Login failed with HTTP code: $($loginResponse.StatusCode)`nResponse (first 500 chars):`n$responsePreview"
            exit 1
        }
        
        $responseJson = $loginResponse.Content | ConvertFrom-Json
        $TOKEN = $responseJson.data.access_token
        if (-not $TOKEN) {
            $TOKEN = $responseJson.access_token
        }
        if (-not $TOKEN) {
            $TOKEN = $responseJson.data.token
        }
        
        if (-not $TOKEN) {
            $responsePreview = $loginResponse.Content.Substring(0, [Math]::Min(500, $loginResponse.Content.Length))
            Write-Error "Login error: No token found in response`nResponse (first 500 chars):`n$responsePreview"
            exit 1
        }
        
        # Log login response to check for workspace information
        $loginWorkspaceId = $null
        if ($responseJson.data.user.current_workspace_id) {
            $loginWorkspaceId = $responseJson.data.user.current_workspace_id
        } elseif ($responseJson.data.workspace.id) {
            $loginWorkspaceId = $responseJson.data.workspace.id
        } elseif ($responseJson.workspace.id) {
            $loginWorkspaceId = $responseJson.workspace.id
        }
        
        Write-Log "logged in, workspace=$WS_ID"
        Write-Log "Login response workspace: $(if ($loginWorkspaceId) { $loginWorkspaceId.Substring(0, [Math]::Min(8, $loginWorkspaceId.Length)) + '...' } else { 'not found' })"
        
        if ($loginWorkspaceId -and $loginWorkspaceId -ne $WS_ID) {
            Write-Host "[WARNING] Login response indicates active workspace is $($loginWorkspaceId.Substring(0, [Math]::Min(8, $loginWorkspaceId.Length)))..., but using env workspace $($WS_ID.Substring(0, [Math]::Min(8, $WS_ID.Length)))..." -ForegroundColor Yellow
            Write-Log "Switching to target workspace..."
        }
        
        # CRITICAL: Switch workspace after login to ensure all operations use the correct workspace
        Write-Log "Switching workspace to: $($WS_ID.Substring(0, [Math]::Min(8, $WS_ID.Length)))..."
        try {
            $switchBody = @{
                tenant_id = $WS_ID
            } | ConvertTo-Json
            
            $switchHeaders = @{
                "Authorization" = "Bearer $TOKEN"
                "Content-Type" = "application/json"
            }
            
            $switchResponse = Invoke-RestMethod -Uri "$CONSOLE_ORIGIN/console/api/workspaces/switch" -Method POST -Body $switchBody -Headers $switchHeaders -UseBasicParsing -ErrorAction Stop
            
            Write-Host "[SUCCESS] Workspace switched to: $($WS_ID.Substring(0, [Math]::Min(8, $WS_ID.Length)))..." -ForegroundColor Green
            Write-Log "Workspace switch response: $(if ($switchResponse) { 'Success' } else { 'No response' })"
        } catch {
            $errorMessage = $_.Exception.Message
            if ($_.Exception.Response) {
                $statusCode = [int]$_.Exception.Response.StatusCode
                $stream = $_.Exception.Response.GetResponseStream()
                $reader = New-Object System.IO.StreamReader($stream)
                $responseBody = $reader.ReadToEnd()
                Write-Host "[WARNING] Workspace switch failed with HTTP code: $statusCode" -ForegroundColor Yellow
                Write-Host "[WARNING] Response: $($responseBody.Substring(0, [Math]::Min(500, $responseBody.Length)))" -ForegroundColor Yellow
                Write-Log "Continuing with current workspace - app may be created in wrong workspace"
            } else {
                Write-Host "[WARNING] Workspace switch error: $errorMessage" -ForegroundColor Yellow
                Write-Log "Continuing with current workspace - app may be created in wrong workspace"
            }
        }
    } catch {
        $errorMessage = $_.Exception.Message
        if ($_.Exception.Response) {
            $statusCode = [int]$_.Exception.Response.StatusCode
            $stream = $_.Exception.Response.GetResponseStream()
            $reader = New-Object System.IO.StreamReader($stream)
            $responseBody = $reader.ReadToEnd()
            $responsePreview = $responseBody.Substring(0, [Math]::Min(500, $responseBody.Length))
            Write-Error "Login failed with HTTP code: $statusCode`nResponse (first 500 chars):`n$responsePreview"
        } else {
            Write-Error "Login error: $errorMessage"
        }
        exit 1
    }
} catch {
    Write-Error "Login error: $_"
    exit 1
}

# Create YAML content based on agent type
if ($AgentType -eq "Knowledge Agent (RAG)") {
    $yamlContent = @"
version: "0.3.0"
kind: "app"
app:
  mode: "chat"
  name: "$APP_NAME"
  description: "Knowledge Agent (RAG) created via CLI on Dify 1.4"
model_config:
  model:
    provider: "$MODEL_PROVIDER_FQN"
    name: "$MODEL_NAME"
  pre_prompt: "You are a knowledgeable assistant that can help users find information and answer questions based on available knowledge. You excel at retrieving and synthesizing information from various sources to provide accurate and helpful responses."
  parameters:
    temperature: 0.3
  prompt_type: "simple"
  more_like_this:
    enabled: true
  suggested_questions_after_answer:
    enabled: true
"@
} else {
    # Action Agent (AI Employee)
    $yamlContent = @"
version: "0.3.0"
kind: "app"
app:
  mode: "agent-chat"
  name: "$APP_NAME"
  description: "Action Agent (AI Employee) created via CLI on Dify 1.4"
model_config:
  model:
    provider: "$MODEL_PROVIDER_FQN"
    name: "$MODEL_NAME"
  pre_prompt: "You are an intelligent AI agent. You can help users with various tasks, analyze information, and use tools when needed. Always think step by step and provide helpful, accurate responses."
  parameters:
    temperature: 0.3
  agent_mode:
    enabled: true
    strategy: "function_call"
    tools: []
  prompt_type: "simple"
  completion_params:
    temperature: 0.3
    stop: []
"@
}

$importBody = @{
    mode = "yaml-content"
    yaml_content = $yamlContent
} | ConvertTo-Json

Write-Log "import app"
Write-Log "Request URL: $CONSOLE_ORIGIN/console/api/apps/imports"
Write-Log "Request workspace ID: $($WS_ID.Substring(0, [Math]::Min(8, $WS_ID.Length)))..."
try {
    $headers = @{
        "Authorization" = "Bearer $TOKEN"
        "X-Workspace-Id" = $WS_ID
        "Content-Type" = "application/json"
    }
    
    try {
        $importResponse = Invoke-RestMethod -Uri "$CONSOLE_ORIGIN/console/api/apps/imports" -Method POST -Body $importBody -Headers $headers -UseBasicParsing -ErrorAction Stop
    } catch {
        $errorDetails = $_.Exception.Message
        if ($_.Exception.Response) {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $errorBody = $reader.ReadToEnd()
            Write-Error "Import HTTP error: $($_.Exception.Response.StatusCode) - $errorBody"
        } else {
            Write-Error "Import error: $errorDetails"
        }
        throw
    }
    
    $STATUS = $importResponse.status
    $APP_ID = $importResponse.app_id
    $responseWorkspaceId = $importResponse.workspace_id
    
    # Log import response details
    Write-Log "Import response status: $STATUS"
    Write-Log "Import response app_id: $APP_ID"
    if ($responseWorkspaceId) {
        Write-Log "Import response workspace_id: $($responseWorkspaceId.Substring(0, [Math]::Min(8, $responseWorkspaceId.Length)))..."
        if ($responseWorkspaceId -ne $WS_ID) {
            Write-Host "[CRITICAL] App was created in workspace $($responseWorkspaceId.Substring(0, [Math]::Min(8, $responseWorkspaceId.Length)))... but we requested $($WS_ID.Substring(0, [Math]::Min(8, $WS_ID.Length)))..." -ForegroundColor Red
        } else {
            Write-Host "[SUCCESS] App created in correct workspace: $($responseWorkspaceId.Substring(0, [Math]::Min(8, $responseWorkspaceId.Length)))..." -ForegroundColor Green
        }
    } else {
        Write-Host "[WARNING] Import response does not contain workspace_id field" -ForegroundColor Yellow
    }
    
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
    $APP_KEY = $keyResponse.data.api_key
    if (-not $APP_KEY) {
        $APP_KEY = $keyResponse.data.key
    }
    if (-not $APP_KEY) {
        $APP_KEY = $keyResponse.key
    }
    if (-not $APP_KEY) {
        $APP_KEY = $keyResponse.token
    }
    
    if (-not $APP_KEY) {
        throw "Failed to create API key"
    }
    Write-Log "app_key=$APP_KEY"
} catch {
    Write-Error "API key creation error: $_"
    exit 1
}

Write-Log "discover service origin"
try {
    Write-Log "Fetching app details for app_id=$APP_ID with workspace_id=$($WS_ID.Substring(0, [Math]::Min(8, $WS_ID.Length)))..."
    $appDetailResponse = Invoke-RestMethod -Uri "$CONSOLE_ORIGIN/console/api/apps/$APP_ID" -Method GET -Headers $headers -UseBasicParsing
    
    # Log app detail workspace information
    $appDetailWorkspaceId = $null
    if ($appDetailResponse.data.workspace_id) {
        $appDetailWorkspaceId = $appDetailResponse.data.workspace_id
    } elseif ($appDetailResponse.workspace_id) {
        $appDetailWorkspaceId = $appDetailResponse.workspace_id
    }
    
    if ($appDetailWorkspaceId) {
        Write-Log "App detail workspace_id: $($appDetailWorkspaceId.Substring(0, [Math]::Min(8, $appDetailWorkspaceId.Length)))..."
        if ($appDetailWorkspaceId -ne $WS_ID) {
            Write-Host "[CRITICAL] App detail shows workspace $($appDetailWorkspaceId.Substring(0, [Math]::Min(8, $appDetailWorkspaceId.Length)))... but we requested $($WS_ID.Substring(0, [Math]::Min(8, $WS_ID.Length)))..." -ForegroundColor Red
        } else {
            Write-Host "[SUCCESS] App detail confirms correct workspace: $($appDetailWorkspaceId.Substring(0, [Math]::Min(8, $appDetailWorkspaceId.Length)))..." -ForegroundColor Green
        }
    } else {
        Write-Host "[WARNING] App detail response does not contain workspace_id field" -ForegroundColor Yellow
    }
    
    # Verify app exists in the correct workspace by listing apps
    Write-Log "Verifying app exists in workspace $($WS_ID.Substring(0, [Math]::Min(8, $WS_ID.Length)))..."
    try {
        $listAppsResponse = Invoke-RestMethod -Uri "$CONSOLE_ORIGIN/console/api/apps?page=1&limit=100" -Method GET -Headers $headers -UseBasicParsing
        $apps = $listAppsResponse.data
        if (-not $apps) {
            $apps = $listAppsResponse
        }
        if ($apps -is [System.Array]) {
            $foundApp = $apps | Where-Object { ($_.id -eq $APP_ID) -or ($_.app_id -eq $APP_ID) }
            if ($foundApp) {
                $appName = if ($foundApp.name) { $foundApp.name } elseif ($foundApp.app_name) { $foundApp.app_name } else { 'N/A' }
                Write-Host "[SUCCESS] VERIFIED: App $($APP_ID.Substring(0, [Math]::Min(8, $APP_ID.Length)))... exists in workspace $($WS_ID.Substring(0, [Math]::Min(8, $WS_ID.Length)))..." -ForegroundColor Green
                Write-Host "[INFO] Full workspace ID: $WS_ID" -ForegroundColor Cyan
                Write-Log "App name in workspace: $appName"
                Write-Log "Total apps in workspace: $($apps.Count)"
                Write-Log "Workspace ID used for verification: $WS_ID"
                Write-Host "[IMPORTANT] If the app appears in a different workspace in the UI, the UI might be using the active workspace context instead of filtering by workspace ID." -ForegroundColor Yellow
            } else {
                Write-Host "[CRITICAL] App $($APP_ID.Substring(0, [Math]::Min(8, $APP_ID.Length)))... NOT FOUND in workspace $($WS_ID.Substring(0, [Math]::Min(8, $WS_ID.Length)))..." -ForegroundColor Red
                Write-Host "[CRITICAL] This suggests the app was created in a different workspace!" -ForegroundColor Red
                Write-Log "Total apps found in target workspace: $($apps.Count)"
                Write-Log "First few app IDs in workspace: $($apps[0..2] | ForEach-Object { $_.id -or $_.app_id } | Out-String)"
            }
        } else {
            Write-Host "[WARNING] Apps list is not an array. Response structure: $($listAppsResponse | ConvertTo-Json -Depth 2)" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "[WARNING] Could not verify workspace: $_" -ForegroundColor Yellow
        Write-Host "[WARNING] Error details: $($_.Exception.Message)" -ForegroundColor Yellow
    }
    
    $RAW_BASE = $appDetailResponse.data.api_server
    if (-not $RAW_BASE) {
        $RAW_BASE = $appDetailResponse.api_server
    }
    if (-not $RAW_BASE) {
        $RAW_BASE = $appDetailResponse.data.api_base_url
    }
    if (-not $RAW_BASE) {
        $RAW_BASE = $appDetailResponse.api_base_url
    }
    
    if ($RAW_BASE) {
        $SERVICE_ORIGIN = $RAW_BASE.TrimEnd('/')
        $SERVICE_ORIGIN = $SERVICE_ORIGIN.TrimEnd('/v1')
    }
    Write-Log "SERVICE_ORIGIN=$SERVICE_ORIGIN"
    if (-not $SERVICE_ORIGIN) {
        Write-Log "WARN: cannot discover API Server from console; set SERVICE_ORIGIN manually"
    }
} catch {
    Write-Log "WARN: failed to discover service origin: $_"
}

function Publish-App {
    Write-Log "publish app (auto for Dify 1.4)"
    
    if ($AgentType -eq "Knowledge Agent (RAG)") {
        Write-Log "POST /console/api/apps/$APP_ID/model-config (configure Knowledge Agent)"
        $modelConfigBody = @{
            model = @{
                provider = $MODEL_PROVIDER_FQN
                name = $MODEL_NAME
                completion_params = @{
                    temperature = 0.3
                }
            }
            pre_prompt = "You are a knowledgeable assistant that can help users find information and answer questions based on available knowledge. You excel at retrieving and synthesizing information from various sources to provide accurate and helpful responses."
            prompt_type = "simple"
            more_like_this = @{
                enabled = $true
            }
            suggested_questions_after_answer = @{
                enabled = $true
            }
        } | ConvertTo-Json -Depth 10
        
        try {
            Invoke-RestMethod -Uri "$CONSOLE_ORIGIN/console/api/apps/$APP_ID/model-config" -Method POST -Body $modelConfigBody -Headers $headers -UseBasicParsing
        } catch {
            Write-Log "WARN: model-config update failed: $_"
        }
        
        Write-Log "PUT /console/api/apps/$APP_ID (switch to advanced-chat for Knowledge Agent)"
        $updateAppBody = @{
            app = @{
                mode = "advanced-chat"
                name = $APP_NAME
                description = "Knowledge Agent (RAG) created via CLI on Dify 1.4"
            }
        } | ConvertTo-Json -Depth 10
        
        try {
            Invoke-RestMethod -Uri "$CONSOLE_ORIGIN/console/api/apps/$APP_ID" -Method PUT -Body $updateAppBody -Headers $headers -UseBasicParsing
        } catch {
            Write-Log "WARN: app update failed: $_"
        }
    } else {
        # Action Agent (AI Employee)
        Write-Log "POST /console/api/apps/$APP_ID/model-config (configure Action Agent)"
        $modelConfigBody = @{
            model = @{
                provider = $MODEL_PROVIDER_FQN
                name = $MODEL_NAME
                completion_params = @{
                    temperature = 0.3
                    stop = @()
                }
            }
            pre_prompt = "You are an intelligent AI agent. You can help users with various tasks, analyze information, and use tools when needed. Always think step by step and provide helpful, accurate responses."
            agent_mode = @{
                enabled = $true
                strategy = "function_call"
                tools = @()
            }
            prompt_type = "simple"
            more_like_this = @{
                enabled = $true
            }
            suggested_questions_after_answer = @{
                enabled = $true
            }
        } | ConvertTo-Json -Depth 10
        
        try {
            Invoke-RestMethod -Uri "$CONSOLE_ORIGIN/console/api/apps/$APP_ID/model-config" -Method POST -Body $modelConfigBody -Headers $headers -UseBasicParsing
        } catch {
            Write-Log "WARN: model-config update failed: $_"
        }
        
        # Action agents stay in agent-chat mode, no need to switch
        Write-Log "Action Agent configured in agent-chat mode"
    }
    
    Start-Sleep -Seconds 1
    
    Write-Log "POST /console/api/apps/$APP_ID/workflows/publish"
    $publishBody = @{
        marked_name = "auto"
        marked_comment = "publish via CLI"
    } | ConvertTo-Json
    
    try {
        Invoke-RestMethod -Uri "$CONSOLE_ORIGIN/console/api/apps/$APP_ID/workflows/publish" -Method POST -Body $publishBody -Headers $headers -UseBasicParsing
    } catch {
        Write-Log "WARN: publish failed: $_"
    }
}

Publish-App

if ($SERVICE_ORIGIN) {
    $CHATS_URL = "$SERVICE_ORIGIN/v1/chat-messages"
    Write-Log "Testing $AgentType"
    
    if ($AgentType -eq "Knowledge Agent (RAG)") {
        # Test Knowledge Agent with blocking mode
        $testBody = @{
            inputs = @{}
            query = "Hello! Can you help me find information about renewable energy?"
            response_mode = "blocking"
            user = "cli-test"
        } | ConvertTo-Json
        
        try {
            $testHeaders = @{
                "Authorization" = "Bearer $APP_KEY"
                "Content-Type" = "application/json"
            }
            $testResponse = Invoke-RestMethod -Uri $CHATS_URL -Method POST -Body $testBody -Headers $testHeaders -UseBasicParsing
            Write-Log "Knowledge Agent test response: $($testResponse | ConvertTo-Json -Compress)"
        } catch {
            Write-Log "WARN: Knowledge Agent test request failed: $_"
        }
    } else {
        # Test Action Agent with streaming mode
        $testBody = @{
            inputs = @{}
            query = "Hello! Can you help me analyze the pros and cons of renewable energy? Please think through this systematically."
            response_mode = "streaming"
            user = "cli-test"
        } | ConvertTo-Json
        
        try {
            $testHeaders = @{
                "Authorization" = "Bearer $APP_KEY"
                "Content-Type" = "application/json"
            }
            $testResponse = Invoke-RestMethod -Uri $CHATS_URL -Method POST -Body $testBody -Headers $testHeaders -UseBasicParsing
            Write-Log "Action Agent test response: $($testResponse | ConvertTo-Json -Compress)"
        } catch {
            Write-Log "WARN: Action Agent test request failed: $_"
        }
    }
} else {
    Write-Log "skip runtime test: SERVICE_ORIGIN empty"
}

# Output the results in JSON format
$result = @{
    success = $true
    app_id = $APP_ID
    app_key = $APP_KEY
    app_name = $APP_NAME
    agent_type = $AgentType
    service_origin = $SERVICE_ORIGIN
    response_mode = if ($AgentType -eq "Knowledge Agent (RAG)") { "blocking" } else { "streaming" }
} | ConvertTo-Json -Compress

Write-Output $result