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

$CONSOLE_ORIGIN = $env:NEXT_PUBLIC_DIFY_CONSOLE_ORIGIN
$ADMIN_EMAIL = $env:NEXT_PUBLIC_DIFY_ADMIN_EMAIL
$ADMIN_PASSWORD = $env:NEXT_PUBLIC_DIFY_ADMIN_PASSWORD
$WS_ID = $env:NEXT_PUBLIC_DIFY_WORKSPACE_ID
$APP_NAME = $AgentName

# Validate required environment variables
if (-not $CONSOLE_ORIGIN) { Write-Error "Error: NEXT_PUBLIC_DIFY_CONSOLE_ORIGIN is not set"; exit 1 }
if (-not $ADMIN_EMAIL) { Write-Error "Error: NEXT_PUBLIC_DIFY_ADMIN_EMAIL is not set"; exit 1 }
if (-not $ADMIN_PASSWORD) { Write-Error "Error: NEXT_PUBLIC_DIFY_ADMIN_PASSWORD is not set"; exit 1 }
if (-not $WS_ID) { Write-Error "Error: NEXT_PUBLIC_DIFY_WORKSPACE_ID is not set"; exit 1 }
$MODEL_PROVIDER_FQN = $ModelProvider
$MODEL_NAME = $ModelName

$SERVICE_ORIGIN = ""

function Write-Log {
    param([string]$Message)
    $timestamp = Get-Date -Format "HH:mm:ss"
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
    $loginResponse = Invoke-RestMethod -Uri "$CONSOLE_ORIGIN/console/api/login" -Method POST -Body $loginBody -Headers $headers -UseBasicParsing
    $TOKEN = $loginResponse.data.access_token
    if (-not $TOKEN) {
        throw "Login failed - no token received"
    }
    Write-Log "logged in, workspace=$WS_ID"
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
    $appDetailResponse = Invoke-RestMethod -Uri "$CONSOLE_ORIGIN/console/api/apps/$APP_ID" -Method GET -Headers $headers -UseBasicParsing
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
