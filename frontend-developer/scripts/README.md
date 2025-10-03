# Dify Agent Creation Scripts

This directory contains scripts for creating Dify agents with support for two different agent types.

## Agent Types

### 1. Knowledge Agent (RAG)

- **Mode**: `chat` (converted to `advanced-chat` after creation)
- **Purpose**: Retrieval-Augmented Generation for knowledge-based Q&A
- **Response Mode**: `blocking`
- **Features**:
  - Optimized for information retrieval and synthesis
  - More Like This functionality enabled
  - Suggested questions after answer enabled
  - Simple prompt type

### 2. Action Agent (AI Employee)

- **Mode**: `agent-chat`
- **Purpose**: AI Employee capable of task execution and tool usage
- **Response Mode**: `streaming`
- **Features**:
  - Agent mode enabled with function calling strategy
  - Tool integration ready (empty tools array by default)
  - More Like This functionality enabled
  - Suggested questions after answer enabled
  - Simple prompt type

## Usage

### PowerShell Script (Windows)

```powershell
# Create a Knowledge Agent (RAG)
.\create_dify_agent.ps1 -AgentName "My Knowledge Agent" -AgentType "Knowledge Agent (RAG)"

# Create an Action Agent (AI Employee)
.\create_dify_agent.ps1 -AgentName "My Action Agent" -AgentType "Action Agent (AI Employee)"

# With custom model settings
.\create_dify_agent.ps1 -AgentName "Custom Agent" -AgentType "Knowledge Agent (RAG)" -ModelProvider "langgenius/openai/openai" -ModelName "gpt-4o"
```

### Bash Script (Linux/macOS)

```bash
# Create a Knowledge Agent (RAG)
./create_dify_agent.sh "My Knowledge Agent" "Knowledge Agent (RAG)"

# Create an Action Agent (AI Employee)
./create_dify_agent.sh "My Action Agent" "Action Agent (AI Employee)"

# With custom model settings
./create_dify_agent.sh "Custom Agent" "Knowledge Agent (RAG)" "langgenius/openai/openai" "gpt-4o"
```

## Environment Variables

Both scripts require the following environment variables to be set:

- `NEXT_PUBLIC_DIFY_CONSOLE_ORIGIN`: Dify console URL
- `NEXT_PUBLIC_DIFY_ADMIN_EMAIL`: Admin email for authentication
- `NEXT_PUBLIC_DIFY_ADMIN_PASSWORD`: Admin password for authentication
- `NEXT_PUBLIC_DIFY_WORKSPACE_ID`: Workspace ID for agent creation

## Output

Both scripts return a JSON object with the following structure:

```json
{
  "success": true,
  "app_id": "agent-app-id",
  "app_key": "agent-api-key",
  "app_name": "Agent Name",
  "agent_type": "Knowledge Agent (RAG)" | "Action Agent (AI Employee)",
  "service_origin": "https://api.dify.com",
  "response_mode": "blocking" | "streaming"
}
```

## Testing

The scripts automatically test the created agents:

- **Knowledge Agents**: Tested with a renewable energy information query using blocking mode
- **Action Agents**: Tested with an analytical query using streaming mode

## API Usage Examples

### Knowledge Agent (RAG)

```bash
curl -X POST 'https://api.dify.com/v1/chat-messages' \
  -H 'Authorization: Bearer YOUR_API_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "inputs": {},
    "query": "What is renewable energy?",
    "response_mode": "blocking",
    "user": "user123"
  }'
```

### Action Agent (AI Employee)

```bash
curl -X POST 'https://api.dify.com/v1/chat-messages' \
  -H 'Authorization: Bearer YOUR_API_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "inputs": {},
    "query": "Help me analyze the pros and cons of renewable energy",
    "response_mode": "streaming",
    "user": "user123"
  }'
```

## Notes

- Action Agents require `streaming` response mode, not `blocking`
- Knowledge Agents are automatically converted to `advanced-chat` mode after creation
- Both agent types support the same model providers and configurations
- The scripts include comprehensive error handling and logging
