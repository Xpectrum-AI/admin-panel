# PowerShell script to set Pulumi configuration for frontend-release stack
# Make sure you're in the digital-ocean-deployment directory
# Replace the placeholder values with your actual secrets/vars

# Select the stack
pulumi stack select frontend-release

# Set region
pulumi config set index:region sfo3

# Admin Panel and Developer Dashboard share the same namespace (release:)
# Both use the same propelauthApiKey and propelauthUrl config keys
# Using Developer Dashboard values since they're more specific
pulumi config set release:propelauthApiKey "YOUR_PRODUCTION_PROPELAUTH_API_KEY" --secret
pulumi config set release:liveApiKey "YOUR_PRODUCTION_LIVE_API_KEY" --secret
pulumi config set release:propelauthUrl "YOUR_PRODUCTION_DEVELOPMENT_PROPELAUTH_URL"
pulumi config set release:liveApiUrl "YOUR_PRODUCTION_LIVE_API_URL"
pulumi config set release:superAdminOrgId "YOUR_PRODUCTION_SUPER_ADMIN_ORG_ID" --secret

# Developer Dashboard secrets - using PRODUCTION_* secrets, storing in release: namespace
pulumi config set release:difyAdminPassword "YOUR_PRODUCTION_DIFY_ADMIN_PASSWORD" --secret
pulumi config set release:modelOpenAiApiKey "YOUR_PRODUCTION_MODEL_OPEN_AI_API_KEY" --secret
pulumi config set release:modelGroqApiKey "YOUR_PRODUCTION_MODEL_GROQ_API_KEY" --secret
pulumi config set release:modelAnthropicApiKey "YOUR_PRODUCTION_MODEL_ANTHROPIC_API_KEY" --secret
pulumi config set release:chatbotApiKey "YOUR_PRODUCTION_CHATBOT_API_KEY" --secret
pulumi config set release:elevenLabsApiKey "YOUR_PRODUCTION_ELEVEN_LABS_API_KEY" --secret
pulumi config set release:openAiApiKey "YOUR_PRODUCTION_OPEN_AI_API_KEY" --secret
pulumi config set release:whisperApiKey "YOUR_PRODUCTION_WHISPER_API_KEY" --secret
pulumi config set release:deepgramApiKey "YOUR_PRODUCTION_DEEPGRAM_API_KEY" --secret
pulumi config set release:cartesiaApiKey "YOUR_PRODUCTION_CARTESIA_API_KEY" --secret

# Developer Dashboard config values - using PRODUCTION_* vars, storing in release: namespace
# Note: propelauthUrl already set above (shared with Admin Panel)
pulumi config set release:apiBaseUrl "YOUR_PRODUCTION_MODEL_API_BASE_URL"
pulumi config set release:enableEmailVerification "true"
pulumi config set release:difyConsoleOrigin "YOUR_PRODUCTION_DIFY_CONSOLE_ORIGIN"
pulumi config set release:difyAdminEmail "YOUR_PRODUCTION_DIFY_ADMIN_EMAIL"
pulumi config set release:difyWorkspaceId "YOUR_PRODUCTION_DIFY_WORKSPACE_ID"
pulumi config set release:difyBaseUrl "YOUR_PRODUCTION_DIFY_BASE_URL"
pulumi config set release:chatbotApiUrl "YOUR_PRODUCTION_CHATBOT_API_URL"
pulumi config set release:cartesiaVoiceId "YOUR_PRODUCTION_CARTESIA_VOICE_ID"
pulumi config set release:elevenLabsVoiceId "YOUR_PRODUCTION_ELEVEN_LABS_VOICE_ID"
pulumi config set release:liveApiUrl "YOUR_PRODUCTION_LIVE_API_URL"

Write-Host "✅ Pulumi configuration set for frontend-release stack"

