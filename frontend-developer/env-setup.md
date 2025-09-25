# Environment Variables Setup

## Required Environment Variables

To fix the 401 UNAUTHORIZED error in model configuration, you need to create a `.env.local` file in the `admin-panel/frontend-developer/` directory with the following variables:

```bash
# API Authentication Keys
NEXT_PUBLIC_LIVE_API_KEY=your_live_api_key_here
NEXT_PUBLIC_PROPELAUTH_API_KEY=your_propelauth_api_key_here

# Dify Integration
NEXT_PUBLIC_DIFY_BASE_URL=https://api.dify.ai/v1
NEXT_PUBLIC_CHATBOT_API_KEY=your_dify_chatbot_api_key_here

# Model Provider API Keys
NEXT_PUBLIC_MODEL_OPEN_AI_API_KEY=your_openai_api_key_here
NEXT_PUBLIC_MODEL_GROQ_API_KEY=your_groq_api_key_here
NEXT_PUBLIC_MODEL_ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Other Configuration
NODE_ENV=development
```

## Steps to Fix the 401 Error

1. **Create the .env.local file:**

   ```bash
   cd admin-panel/frontend-developer
   touch .env.local
   ```

2. **Add the environment variables** with your actual API keys

3. **Restart the development server:**
   ```bash
   npm run dev
   ```

## Key Variables for Model Configuration

- `NEXT_PUBLIC_LIVE_API_KEY`: Required for API authentication (main cause of 401 error)
- `NEXT_PUBLIC_PROPELAUTH_API_KEY`: Backup authentication key
- `NEXT_PUBLIC_CHATBOT_API_KEY`: Required for Dify API calls
- `NEXT_PUBLIC_DIFY_BASE_URL`: Dify API base URL
- Model provider keys: For specific AI model integrations

## Authentication Flow

The error occurs in this flow:

1. `ModelConfig.tsx` calls `modelConfigService.configureModel()`
2. Service makes request to `/api/model-config` with `X-API-Key` header
3. API route uses `authenticateApiKey()` middleware
4. Middleware checks for `NEXT_PUBLIC_LIVE_API_KEY` or `NEXT_PUBLIC_PROPELAUTH_API_KEY`
5. If neither is set, returns 401 UNAUTHORIZED

## Testing

After setting up the environment variables, the model configuration should work without the 401 error.
