# PowerShell script for Dify agent creation
param(
    [Parameter(Mandatory=$true)]
    [string]$AgentName,
    [Parameter(Mandatory=$true)]
    [string]$ModelProvider = "langgenius/openai/openai",
    [Parameter(Mandatory=$true)]
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
    
    Write-Log "POST /console/api/apps/$APP_ID/model-config (ensure completion_params)"
    $modelConfigBody = @{
        model = @{
            provider = $MODEL_PROVIDER_FQN
            name = $MODEL_NAME
            completion_params = @{
                temperature = 0.3
            }
        }
        pre_prompt = "You are a helpful assistant."
    } | ConvertTo-Json -Depth 10
    
    try {
        Invoke-RestMethod -Uri "$CONSOLE_ORIGIN/console/api/apps/$APP_ID/model-config" -Method POST -Body $modelConfigBody -Headers $headers -UseBasicParsing
    } catch {
        Write-Log "WARN: model-config update failed: $_"
    }
    
    Write-Log "PUT /console/api/apps/$APP_ID (switch to advanced-chat)"
    $updateAppBody = @{
        app = @{
            mode = "advanced-chat"
            name = $APP_NAME
            description = "Created via CLI on Dify 1.4"
        }
    } | ConvertTo-Json -Depth 10
    
    try {
        Invoke-RestMethod -Uri "$CONSOLE_ORIGIN/console/api/apps/$APP_ID" -Method PUT -Body $updateAppBody -Headers $headers -UseBasicParsing
    } catch {
        Write-Log "WARN: app update failed: $_"
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
    Write-Log "POST $CHATS_URL"
    $testBody = @{
        inputs = @{}
        query = "hello"
        response_mode = "blocking"
        user = "cli-test"
    } | ConvertTo-Json
    
    try {
        $testHeaders = @{
            "Authorization" = "Bearer $APP_KEY"
            "Content-Type" = "application/json"
        }
        $testResponse = Invoke-RestMethod -Uri $CHATS_URL -Method POST -Body $testBody -Headers $testHeaders -UseBasicParsing
        Write-Log "Test response: $($testResponse | ConvertTo-Json -Compress)"
    } catch {
        Write-Log "WARN: test request failed: $_"
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
    service_origin = $SERVICE_ORIGIN
} | ConvertTo-Json -Compress

Write-Output $result
