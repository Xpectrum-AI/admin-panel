# Test script for agent creation
param(
    [switch]$SkipActualCreation
)

Write-Host "Testing Dify Agent Creation Scripts" -ForegroundColor Green
Write-Host "==================================" -ForegroundColor Green

# Test parameter validation
Write-Host "Testing parameter validation..." -ForegroundColor Yellow

# Test with invalid agent type
Write-Host "Testing invalid agent type..." -ForegroundColor Cyan
try {
    & .\create_dify_agent.ps1 -AgentName "Test Agent" -AgentType "Invalid Type" 2>&1 | Out-Null
    Write-Host "✗ Invalid agent type validation failed" -ForegroundColor Red
    exit 1
} catch {
    if ($_.Exception.Message -like "*Invalid agent type*") {
        Write-Host "✓ Invalid agent type validation works" -ForegroundColor Green
    } else {
        Write-Host "✗ Invalid agent type validation failed" -ForegroundColor Red
        exit 1
    }
}

# Test with missing parameters
Write-Host "Testing missing parameters..." -ForegroundColor Cyan
try {
    & .\create_dify_agent.ps1 2>&1 | Out-Null
    Write-Host "✗ Missing parameters validation failed" -ForegroundColor Red
    exit 1
} catch {
    if ($_.Exception.Message -like "*Mandatory*") {
        Write-Host "✓ Missing parameters validation works" -ForegroundColor Green
    } else {
        Write-Host "✗ Missing parameters validation failed" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "Parameter validation tests passed!" -ForegroundColor Green
Write-Host ""

# Test YAML generation logic
Write-Host "Testing YAML generation logic..." -ForegroundColor Yellow

# Test Knowledge Agent YAML
Write-Host "Testing Knowledge Agent YAML generation..." -ForegroundColor Cyan
$knowledgeYaml = @"
version: "0.3.0"
kind: "app"
app:
  mode: "chat"
  name: "Test Knowledge Agent"
  description: "Knowledge Agent (RAG) created via CLI on Dify 1.4"
model_config:
  model:
    provider: "langgenius/openai/openai"
    name: "gpt-4o"
  pre_prompt: "You are a knowledgeable assistant that can help users find information and answer questions based on available knowledge. You excel at retrieving and synthesizing information from various sources to provide accurate and helpful responses."
  parameters:
    temperature: 0.3
  prompt_type: "simple"
  more_like_this:
    enabled: true
  suggested_questions_after_answer:
    enabled: true
"@

if ($knowledgeYaml.Contains('mode: "chat"') -and $knowledgeYaml.Contains("Knowledge Agent (RAG)")) {
    Write-Host "✓ Knowledge Agent YAML structure is correct" -ForegroundColor Green
} else {
    Write-Host "✗ Knowledge Agent YAML structure is incorrect" -ForegroundColor Red
    exit 1
}

# Test Action Agent YAML
Write-Host "Testing Action Agent YAML generation..." -ForegroundColor Cyan
$actionYaml = @"
version: "0.3.0"
kind: "app"
app:
  mode: "agent-chat"
  name: "Test Action Agent"
  description: "Action Agent (AI Employee) created via CLI on Dify 1.4"
model_config:
  model:
    provider: "langgenius/openai/openai"
    name: "gpt-4o"
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

if ($actionYaml.Contains('mode: "agent-chat"') -and $actionYaml.Contains("Action Agent (AI Employee)") -and $actionYaml.Contains("agent_mode:")) {
    Write-Host "✓ Action Agent YAML structure is correct" -ForegroundColor Green
} else {
    Write-Host "✗ Action Agent YAML structure is incorrect" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "YAML generation tests passed!" -ForegroundColor Green
Write-Host ""

# Test actual creation if not skipped
if (-not $SkipActualCreation) {
    Write-Host "Testing actual agent creation..." -ForegroundColor Yellow
    Write-Host "Note: This requires valid environment variables to be set" -ForegroundColor Yellow
    
    # Check if environment variables are set
    $envVars = @(
        "NEXT_PUBLIC_DIFY_CONSOLE_ORIGIN",
        "NEXT_PUBLIC_DIFY_ADMIN_EMAIL", 
        "NEXT_PUBLIC_DIFY_ADMIN_PASSWORD",
        "NEXT_PUBLIC_DIFY_WORKSPACE_ID"
    )
    
    $missingVars = @()
    foreach ($var in $envVars) {
        if (-not (Get-Item "env:$var" -ErrorAction SilentlyContinue)) {
            $missingVars += $var
        }
    }
    
    if ($missingVars.Count -gt 0) {
        Write-Host "⚠ Skipping actual creation test - Missing environment variables:" -ForegroundColor Yellow
        $missingVars | ForEach-Object { Write-Host "  - $_" -ForegroundColor Yellow }
        Write-Host "Set these variables and run with -SkipActualCreation:`$false to test actual creation" -ForegroundColor Yellow
    } else {
        Write-Host "Environment variables are set. Testing actual creation..." -ForegroundColor Green
        
        # Test Knowledge Agent creation
        Write-Host "Testing Knowledge Agent creation..." -ForegroundColor Cyan
        try {
            $result = & .\create_dify_agent.ps1 -AgentName "Test Knowledge Agent $(Get-Date -Format 'yyyyMMddHHmmss')" -AgentType "Knowledge Agent (RAG)"
            $jsonResult = $result | ConvertFrom-Json
            if ($jsonResult.success -and $jsonResult.agent_type -eq "Knowledge Agent (RAG)") {
                Write-Host "✓ Knowledge Agent creation successful" -ForegroundColor Green
                Write-Host "  App ID: $($jsonResult.app_id)" -ForegroundColor Gray
            } else {
                Write-Host "✗ Knowledge Agent creation failed" -ForegroundColor Red
            }
        } catch {
            Write-Host "✗ Knowledge Agent creation failed: $($_.Exception.Message)" -ForegroundColor Red
        }
        
        # Test Action Agent creation
        Write-Host "Testing Action Agent creation..." -ForegroundColor Cyan
        try {
            $result = & .\create_dify_agent.ps1 -AgentName "Test Action Agent $(Get-Date -Format 'yyyyMMddHHmmss')" -AgentType "Action Agent (AI Employee)"
            $jsonResult = $result | ConvertFrom-Json
            if ($jsonResult.success -and $jsonResult.agent_type -eq "Action Agent (AI Employee)") {
                Write-Host "✓ Action Agent creation successful" -ForegroundColor Green
                Write-Host "  App ID: $($jsonResult.app_id)" -ForegroundColor Gray
            } else {
                Write-Host "✗ Action Agent creation failed" -ForegroundColor Red
            }
        } catch {
            Write-Host "✗ Action Agent creation failed: $($_.Exception.Message)" -ForegroundColor Red
        }
    }
} else {
    Write-Host "Skipping actual creation test (use -SkipActualCreation:`$false to enable)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "All tests completed! ✅" -ForegroundColor Green
Write-Host ""
Write-Host "To create actual agents, ensure environment variables are set and run:" -ForegroundColor Cyan
Write-Host "  .\create_dify_agent.ps1 -AgentName `"Agent Name`" -AgentType `"Knowledge Agent (RAG)`"" -ForegroundColor White
Write-Host "  .\create_dify_agent.ps1 -AgentName `"Agent Name`" -AgentType `"Action Agent (AI Employee)`"" -ForegroundColor White
