#!/bin/bash

# Conversation Logs Backup Script
# This script calls the conversation logs API to save logs from Dify

# Configuration
API_URL="${API_URL:-http://localhost:3000}"
LOG_FILE="${LOG_FILE:-./logs/backup.log}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to log messages
log_message() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log_error() {
  echo -e "${RED}[ERROR] $1${NC}" | tee -a "$LOG_FILE"
}

log_success() {
  echo -e "${GREEN}[SUCCESS] $1${NC}" | tee -a "$LOG_FILE"
}

log_info() {
  echo -e "${YELLOW}[INFO] $1${NC}" | tee -a "$LOG_FILE"
}

# Check if required environment variables are set
if [ -z "$DIFY_API_URL" ] || [ -z "$DIFY_APP_ID" ] || [ -z "$DIFY_API_KEY" ]; then
  log_error "Missing required environment variables: DIFY_API_URL, DIFY_APP_ID, DIFY_API_KEY"
  exit 1
fi

# Start backup
log_info "Starting conversation logs backup..."

# Calculate date range (last 24 hours)
START_DATE=$(date -u -d '1 day ago' '+%Y-%m-%dT%H:%M:%SZ')
END_DATE=$(date -u '+%Y-%m-%dT%H:%M:%SZ')

log_info "Date range: $START_DATE to $END_DATE"

# Call the API
RESPONSE=$(curl -s -X POST "$API_URL/api/conversation-logs" \
  -H "Content-Type: application/json" \
  -d '{
    "dify_api_url": "'"$DIFY_API_URL"'",
    "app_id": "'"$DIFY_APP_ID"'",
    "api_key": "'"$DIFY_API_KEY"'",
    "organization_id": "'"${ORGANIZATION_ID:-}"'",
    "filters": {
      "start_date": "'"$START_DATE"'",
      "end_date": "'"$END_DATE"'"
    }
  }')

# Check if curl succeeded
if [ $? -ne 0 ]; then
  log_error "Failed to call API endpoint"
  exit 1
fi

# Parse response
SUCCESS=$(echo "$RESPONSE" | grep -o '"success":[^,}]*' | cut -d':' -f2 | tr -d ' ')
SAVED_COUNT=$(echo "$RESPONSE" | grep -o '"saved_count":[^,}]*' | cut -d':' -f2 | tr -d ' ')
TOTAL_CONVERSATIONS=$(echo "$RESPONSE" | grep -o '"total_conversations":[^,}]*' | cut -d':' -f2 | tr -d ' ')

if [ "$SUCCESS" = "true" ]; then
  log_success "Backup completed: Saved $SAVED_COUNT/$TOTAL_CONVERSATIONS conversations"
  
  # Get logs summary
  SUMMARY=$(curl -s "$API_URL/api/conversation-logs?action=summary&organization_id=${ORGANIZATION_ID:-}")
  TOTAL_FILES=$(echo "$SUMMARY" | grep -o '"total_files":[^,}]*' | cut -d':' -f2 | tr -d ' ')
  TOTAL_SIZE=$(echo "$SUMMARY" | grep -o '"total_size_bytes":[^,}]*' | cut -d':' -f2 | tr -d ' ')
  
  if [ -n "$TOTAL_FILES" ] && [ -n "$TOTAL_SIZE" ]; then
    SIZE_MB=$(echo "scale=2; $TOTAL_SIZE / 1024 / 1024" | bc)
    log_info "Total logs: $TOTAL_FILES files ($SIZE_MB MB)"
  fi
  
  exit 0
else
  ERROR_MSG=$(echo "$RESPONSE" | grep -o '"error":"[^"]*"' | cut -d':' -f2 | tr -d '"')
  log_error "Backup failed: ${ERROR_MSG:-Unknown error}"
  log_error "Full response: $RESPONSE"
  exit 1
fi

