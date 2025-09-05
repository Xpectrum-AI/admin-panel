# API Configuration Setup

This guide explains how to set up the environment variables for the API services used in the developer dashboard.

## Environment Variables

Create a `.env.local` file in the `frontend-developer` directory with the following variables:

```bash
# Model Configuration API
NEXT_PUBLIC_MODEL_API_BASE_URL=https://d22yt2oewbcglh.cloudfront.net/v1
NEXT_PUBLIC_MODEL_API_KEY=app-CV6dxVdo4K226Yvm3vBj3iUO

# Agent Configuration API
NEXT_PUBLIC_AGENT_API_BASE_URL=https://d22yt2oewbcglh.cloudfront.net/v1
NEXT_PUBLIC_AGENT_API_KEY=app-CV6dxVdo4K226Yvm3vBj3iUO

# Voice Provider API Keys (for development)
NEXT_PUBLIC_OPENAI_API_KEY=your-openai-api-key
NEXT_PUBLIC_ELEVENLABS_API_KEY=your-elevenlabs-api-key
NEXT_PUBLIC_CARTESIA_API_KEY=your-cartesia-api-key

# Voice Provider Voice IDs (for development)
NEXT_PUBLIC_ELEVENLABS_VOICE_ID=your-elevenlabs-voice-id
NEXT_PUBLIC_CARTESIA_VOICE_ID=your-cartesia-voice-id
```

## API Endpoints

### Model Configuration API
- **Base URL**: `https://d22yt2oewbcglh.cloudfront.net/v1`
- **Endpoints**:
  - `GET /apps/current/model-config` - Get current model configuration
  - `POST /apps/current/model-config` - Configure model
  - `GET /apps/current/prompt` - Get current prompt configuration
  - `POST /apps/current/prompt` - Configure prompt

### Agent Configuration API
- **Base URL**: `https://d22yt2oewbcglh.cloudfront.net/v1`
- **Endpoints**:
  - `GET /agents/{agentName}` - Get current agent configuration
  - `POST /agents/{agentName}` - Configure agent
  - `GET /agents/{agentName}/voice` - Get current voice configuration
  - `POST /agents/{agentName}/voice` - Configure voice

## Features

### ModelConfig Component
- ✅ Real API calls instead of localStorage
- ✅ Load current configuration from API
- ✅ Save configuration to API
- ✅ Proper error handling and loading states
- ✅ Configuration status tracking

### VoiceConfig Component
- ✅ Real API calls instead of localStorage
- ✅ Load current voice configuration from API
- ✅ Save voice configuration to API
- ✅ Support for multiple voice providers (OpenAI, 11Labs, Cartesia)
- ✅ Proper error handling and loading states

### ToolsConfig Component
- ✅ Real API calls instead of localStorage
- ✅ Load current agent configuration from API
- ✅ Create/update agent with complete configuration
- ✅ Integration with voice and transcriber configurations
- ✅ Proper error handling and loading states

## Usage

1. Set up your environment variables in `.env.local`
2. Start the development server: `npm run dev`
3. Navigate to the developer dashboard
4. Configure your model, voice, and transcriber settings
5. Use the Tools tab to create or update your agent

## Notes

- All API calls include proper error handling
- Configuration status is tracked and displayed
- Components automatically load existing configurations when editing
- API keys are masked in the UI for security
- Default API keys are provided for development purposes
