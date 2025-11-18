#!/usr/bin/env bash
set -euo pipefail

# Get parameters
AGENT_NAME="$1"
AGENT_TYPE="$2"  # "Knowledge Agent (RAG)" or "Action Agent (AI Employee)"
MODEL_PROVIDER="${3:-langgenius/openai/openai}"
MODEL_NAME="${4:-gpt-4o}"

# Validate agent type
if [[ "$AGENT_TYPE" != "Knowledge Agent (RAG)" && "$AGENT_TYPE" != "Action Agent (AI Employee)" ]]; then
    echo "Error: Invalid agent type. Must be 'Knowledge Agent (RAG)' or 'Action Agent (AI Employee)'"
    exit 1
fi

CONSOLE_ORIGIN="${NEXT_PUBLIC_DIFY_CONSOLE_ORIGIN}"
ADMIN_EMAIL="${NEXT_PUBLIC_DIFY_ADMIN_EMAIL}"
ADMIN_PASSWORD="${NEXT_PUBLIC_DIFY_ADMIN_PASSWORD}"
WS_ID="${NEXT_PUBLIC_DIFY_WORKSPACE_ID}"
APP_NAME="$AGENT_NAME"

# Validate required environment variables
[ -n "$CONSOLE_ORIGIN" ] || { echo "Error: NEXT_PUBLIC_DIFY_CONSOLE_ORIGIN is not set"; exit 1; }
[ -n "$ADMIN_EMAIL" ] || { echo "Error: NEXT_PUBLIC_DIFY_ADMIN_EMAIL is not set"; exit 1; }
[ -n "$ADMIN_PASSWORD" ] || { echo "Error: NEXT_PUBLIC_DIFY_ADMIN_PASSWORD is not set"; exit 1; }
[ -n "$WS_ID" ] || { echo "Error: NEXT_PUBLIC_DIFY_WORKSPACE_ID is not set"; exit 1; }

# Normalize CONSOLE_ORIGIN: ensure it ends with /api for proper URL construction
# Remove trailing slash if present
CONSOLE_ORIGIN="${CONSOLE_ORIGIN%/}"
# Add /api if not already present
if [[ "$CONSOLE_ORIGIN" != */api ]]; then
  CONSOLE_ORIGIN="${CONSOLE_ORIGIN}/api"
fi

: "${MODEL_PROVIDER_FQN:=$MODEL_PROVIDER}"
: "${MODEL_NAME:=$MODEL_NAME}"

SERVICE_ORIGIN="${SERVICE_ORIGIN:-}"

command -v curl >/dev/null || { echo "need curl"; exit 1; }
command -v jq   >/dev/null || { echo "need jq";   exit 1; }

say(){ printf "[%s] %s\n" "$(date +%H:%M:%S)" "$*"; }
hdr_code(){ awk 'NR==1{print $2}'; }
hdr_ct(){ awk 'BEGIN{IGNORECASE=1}/^content-type:/{print $2}' | tr -d '\r'; }

say "login"
LOGIN_URL="$CONSOLE_ORIGIN/console/api/login"
say "Login URL: $LOGIN_URL"
RESP=$(curl -sS -X POST "$LOGIN_URL" \
  -H "Content-Type: application/json" \
  -H "X-Requested-With: XMLHttpRequest" \
  -H "Cache-Control: no-cache" \
  -H "User-Agent: DifyAgentCreator/1.0" \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}" \
  -w "\nHTTP_CODE:%{http_code}")

# Extract HTTP status code and response body
HTTP_CODE=$(echo "$RESP" | grep -o "HTTP_CODE:[0-9]*" | cut -d: -f2)
RESP_BODY=$(echo "$RESP" | sed '/HTTP_CODE:/d')

# Check if we got a valid HTTP response
if [ -z "$HTTP_CODE" ] || [ "$HTTP_CODE" != "200" ]; then
  echo "Login failed with HTTP code: ${HTTP_CODE:-unknown}"
  echo "Response (first 500 chars):"
  echo "$RESP_BODY" | head -c 500
  echo ""
  exit 1
fi

# Try to parse JSON, show error if it fails
TOKEN=$(echo "$RESP_BODY" | jq -r '.data.access_token // .access_token // .data.token // empty' 2>/dev/null)
if [ $? -ne 0 ]; then
  echo "Failed to parse JSON response. Response was:"
  echo "$RESP_BODY" | head -c 500
  echo ""
  exit 1
fi

[ -n "$TOKEN" ] || { 
  echo "Login error: No token found in response"
  echo "Response (first 500 chars):"
  echo "$RESP_BODY" | head -c 500
  echo ""
  exit 1
}
AUTH=(-H "Authorization: Bearer $TOKEN")
WS_HDR=(-H "X-Workspace-Id: $WS_ID")
say "logged in, workspace=$WS_ID"

# Create DSL based on agent type
if [[ "$AGENT_TYPE" == "Knowledge Agent (RAG)" ]]; then
    DSL_A="$(cat <<YAML
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
YAML
)"
else
    # Action Agent (AI Employee)
    DSL_A="$(cat <<YAML
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
YAML
)"
fi
BODY=$(jq -n --arg mode "yaml-content" --arg yaml "$DSL_A" '{mode:$mode,yaml_content:$yaml}')
say "import app"
RESP=$(curl -sS -X POST "$CONSOLE_ORIGIN/console/api/apps/imports" \
  "${AUTH[@]}" "${WS_HDR[@]}" -H "Content-Type: application/json" -d "$BODY")
echo "$RESP" | jq '.'
STATUS=$(echo "$RESP" | jq -r '.status // .data.status // empty')
APP_ID=$(echo "$RESP" | jq -r '.app_id // .data.app_id // empty')
[ "$STATUS" = "completed" ] && [ -n "$APP_ID" ] || { echo "import failed"; exit 1; }
say "app_id=$APP_ID"

say "create app key"
KEY_RESP=$(curl -sS -X POST "$CONSOLE_ORIGIN/console/api/apps/$APP_ID/api-keys" \
  "${AUTH[@]}" "${WS_HDR[@]}" -H "Content-Type: application/json" \
  -d "{\"name\":\"cli-$(date +%s)\"}")
echo "$KEY_RESP" | jq '.'
APP_KEY=$(echo "$KEY_RESP" | jq -r '.data.api_key // .data.key // .key // .token // empty')
[ -n "$APP_KEY" ] || { echo "failed to create api key"; exit 1; }
say "app_key=$APP_KEY"

say "discover service origin"
APP_DETAIL=$(curl -sS -X GET "$CONSOLE_ORIGIN/console/api/apps/$APP_ID" "${AUTH[@]}" "${WS_HDR[@]}" || true)
RAW_BASE=$(echo "$APP_DETAIL" | jq -r '.data.api_server // .api_server // .data.api_base_url // .api_base_url // empty')
if [ -z "${SERVICE_ORIGIN}" ] && [ -n "$RAW_BASE" ]; then
  SERVICE_ORIGIN="$RAW_BASE"
fi
SERVICE_ORIGIN="${SERVICE_ORIGIN%/}"
SERVICE_ORIGIN="${SERVICE_ORIGIN%/v1}"
say "SERVICE_ORIGIN=$SERVICE_ORIGIN"
if [ -z "$SERVICE_ORIGIN" ]; then
  say "WARN: cannot discover API Server from console; set SERVICE_ORIGIN manually"
fi

_try_post_json() {
  local EP="$1"; local DATA="$2"
  H=$(mktemp); B=$(mktemp)
  curl -sS -D "$H" -o "$B" -X POST "$CONSOLE_ORIGIN$EP" \
    "${AUTH[@]}" "${WS_HDR[@]}" -H "Content-Type: application/json" \
    -d "$DATA" || true
  local code; code=$(hdr_code <"$H")
  echo "status=$code ct=$(hdr_ct <"$H")"
  (cat "$B" | jq '.') 2>/dev/null || { head -c 400 "$B"; echo; }
  rm -f "$H" "$B"
  [[ "$code" =~ ^2 ]] && return 0 || return 1
}

publish_app() {
  say "publish app (auto for Dify 1.4)"

  if [[ "$AGENT_TYPE" == "Knowledge Agent (RAG)" ]]; then
    say "POST /console/api/apps/$APP_ID/model-config (configure Knowledge Agent)"
    _try_post_json "/console/api/apps/$APP_ID/model-config" \
      "$(jq -n \
          --arg pfqn "$MODEL_PROVIDER_FQN" \
          --arg mname "$MODEL_NAME" \
          --arg pre 'You are a knowledgeable assistant that can help users find information and answer questions based on available knowledge. You excel at retrieving and synthesizing information from various sources to provide accurate and helpful responses.' \
          '{
            model: {
              provider: $pfqn, 
              name: $mname, 
              completion_params: {
                temperature: 0.3
              }
            }, 
            pre_prompt: $pre,
            prompt_type: "simple",
            more_like_this: {
              enabled: true
            },
            suggested_questions_after_answer: {
              enabled: true
            }
          }')"

    say "PUT /console/api/apps/$APP_ID (switch to advanced-chat for Knowledge Agent)"
    H=$(mktemp); B=$(mktemp)
    curl -sS -D "$H" -o "$B" -X PUT "$CONSOLE_ORIGIN/console/api/apps/$APP_ID" \
      "${AUTH[@]}" "${WS_HDR[@]}" -H "Content-Type: application/json" \
      -d "$(jq -n \
            --arg name "$APP_NAME" \
            --arg desc "Knowledge Agent (RAG) created via CLI on Dify 1.4" \
            '{app:{mode:"advanced-chat", name:$name, description:$desc}}')" || true
    echo "status=$(hdr_code <"$H") ct=$(hdr_ct <"$H")"
    (cat "$B" | jq '.') 2>/dev/null || { head -c 400 "$B"; echo; }
    rm -f "$H" "$B"
  else
    # Action Agent (AI Employee)
    say "POST /console/api/apps/$APP_ID/model-config (configure Action Agent)"
    _try_post_json "/console/api/apps/$APP_ID/model-config" \
      "$(jq -n \
          --arg pfqn "$MODEL_PROVIDER_FQN" \
          --arg mname "$MODEL_NAME" \
          --arg pre 'You are an intelligent AI agent. You can help users with various tasks, analyze information, and use tools when needed. Always think step by step and provide helpful, accurate responses.' \
          '{
            model: {
              provider: $pfqn, 
              name: $mname, 
              completion_params: {
                temperature: 0.3,
                stop: []
              }
            }, 
            pre_prompt: $pre,
            agent_mode: {
              enabled: true,
              strategy: "function_call",
              tools: []
            },
            prompt_type: "simple",
            more_like_this: {
              enabled: true
            },
            suggested_questions_after_answer: {
              enabled: true
            }
          }')"

    say "Action Agent configured in agent-chat mode"
  fi

  sleep 1

  say "POST /console/api/apps/$APP_ID/workflows/publish"
  _try_post_json "/console/api/apps/$APP_ID/workflows/publish" \
    '{"marked_name":"auto","marked_comment":"publish via CLI"}' || true
}

publish_app

if [ -n "$SERVICE_ORIGIN" ]; then
  CHATS_URL="$SERVICE_ORIGIN/v1/chat-messages"
  say "Testing $AGENT_TYPE"
  
  if [[ "$AGENT_TYPE" == "Knowledge Agent (RAG)" ]]; then
    # Test Knowledge Agent with blocking mode
    say "Testing Knowledge Agent with blocking mode"
    TEST_BODY='{"inputs": {},"query": "Hello! Can you help me find information about renewable energy?","response_mode": "blocking","user": "cli-test"}'
    TEST_RESP=$(curl -sS -X POST "$CHATS_URL" \
      -H "Authorization: Bearer '"$APP_KEY"'" \
      -H "Content-Type: application/json" \
      -d "$TEST_BODY" || true)
    echo "$TEST_RESP" | jq '.' || echo "$TEST_RESP"
  else
    # Test Action Agent with streaming mode
    say "Testing Action Agent with streaming mode"
    TEST_BODY='{"inputs": {},"query": "Hello! Can you help me analyze the pros and cons of renewable energy? Please think through this systematically.","response_mode": "streaming","user": "cli-test"}'
    TEST_RESP=$(curl -sS -X POST "$CHATS_URL" \
      -H "Authorization: Bearer '"$APP_KEY"'" \
      -H "Content-Type: application/json" \
      -d "$TEST_BODY" || true)
    echo "$TEST_RESP" | jq '.' || echo "$TEST_RESP"
  fi
else
  say "skip runtime test: SERVICE_ORIGIN empty"
fi

# Output the results in JSON format for easy parsing
if [[ "$AGENT_TYPE" == "Knowledge Agent (RAG)" ]]; then
  RESPONSE_MODE="blocking"
else
  RESPONSE_MODE="streaming"
fi

echo "{\"success\": true, \"app_id\": \"$APP_ID\", \"app_key\": \"$APP_KEY\", \"app_name\": \"$APP_NAME\", \"agent_type\": \"$AGENT_TYPE\", \"service_origin\": \"$SERVICE_ORIGIN\", \"response_mode\": \"$RESPONSE_MODE\"}"