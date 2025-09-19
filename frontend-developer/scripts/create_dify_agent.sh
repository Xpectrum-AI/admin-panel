#!/usr/bin/env bash
set -euo pipefail

# Get parameters
AGENT_NAME="$1"
MODEL_PROVIDER="${2:-langgenius/openai/openai}"
MODEL_NAME="${3:-gpt-4o}"

CONSOLE_ORIGIN="https://test.xpectrum-ai.com"
ADMIN_EMAIL="ghosh.ishw@gmail.com"
ADMIN_PASSWORD="Ghosh1@*123"
WS_ID="cd0309e7-6517-4932-8fc8-21c3bc4eb41b"
APP_NAME="$AGENT_NAME"

: "${MODEL_PROVIDER_FQN:=$MODEL_PROVIDER}"
: "${MODEL_NAME:=$MODEL_NAME}"

SERVICE_ORIGIN="${SERVICE_ORIGIN:-}"

command -v curl >/dev/null || { echo "need curl"; exit 1; }
command -v jq   >/dev/null || { echo "need jq";   exit 1; }

say(){ printf "[%s] %s\n" "$(date +%H:%M:%S)" "$*"; }
hdr_code(){ awk 'NR==1{print $2}'; }
hdr_ct(){ awk 'BEGIN{IGNORECASE=1}/^content-type:/{print $2}' | tr -d '\r'; }

say "login"
RESP=$(curl -sS -X POST "$CONSOLE_ORIGIN/console/api/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}")
TOKEN=$(echo "$RESP" | jq -r '.data.access_token // .access_token // .data.token // empty')
[ -n "$TOKEN" ] || { echo "login error"; exit 1; }
AUTH=(-H "Authorization: Bearer $TOKEN")
WS_HDR=(-H "X-Workspace-Id: $WS_ID")
say "logged in, workspace=$WS_ID"

DSL_A="$(cat <<YAML
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
YAML
)"
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

  say "POST /console/api/apps/$APP_ID/model-config (ensure completion_params)"
  _try_post_json "/console/api/apps/$APP_ID/model-config" \
    "$(jq -n \
        --arg pfqn "$MODEL_PROVIDER_FQN" \
        --arg mname "$MODEL_NAME" \
        --arg pre 'You are a helpful assistant.' \
        '{model:{provider:$pfqn, name:$mname, completion_params:{temperature:0.3}}, pre_prompt:$pre}')"

  say "PUT /console/api/apps/$APP_ID (switch to advanced-chat)"
  H=$(mktemp); B=$(mktemp)
  curl -sS -D "$H" -o "$B" -X PUT "$CONSOLE_ORIGIN/console/api/apps/$APP_ID" \
    "${AUTH[@]}" "${WS_HDR[@]}" -H "Content-Type: application/json" \
    -d "$(jq -n \
          --arg name "$APP_NAME" \
          --arg desc "Created via CLI on Dify 1.4" \
          '{app:{mode:"advanced-chat", name:$name, description:$desc}}')" || true
  echo "status=$(hdr_code <"$H") ct=$(hdr_ct <"$H")"
  (cat "$B" | jq '.') 2>/dev/null || { head -c 400 "$B"; echo; }
  rm -f "$H" "$B"

  sleep 1

  say "POST /console/api/apps/$APP_ID/workflows/publish"
  _try_post_json "/console/api/apps/$APP_ID/workflows/publish" \
    '{"marked_name":"auto","marked_comment":"publish via CLI"}' || true
}

publish_app

if [ -n "$SERVICE_ORIGIN" ]; then
  CHATS_URL="$SERVICE_ORIGIN/v1/chat-messages"
  say "POST $CHATS_URL"
  TEST_BODY='{"inputs": {},"query": "hello","response_mode": "blocking","user": "cli-test"}'
  TEST_RESP=$(curl -sS -X POST "$CHATS_URL" \
    -H "Authorization: Bearer '"$APP_KEY"'" \
    -H "Content-Type: application/json" \
    -d "$TEST_BODY" || true)
  echo "$TEST_RESP" | jq '.' || echo "$TEST_RESP"
else
  say "skip runtime test: SERVICE_ORIGIN empty"
fi

# Output the results in JSON format for easy parsing
echo "{\"success\": true, \"app_id\": \"$APP_ID\", \"app_key\": \"$APP_KEY\", \"app_name\": \"$APP_NAME\", \"service_origin\": \"$SERVICE_ORIGIN\"}"
