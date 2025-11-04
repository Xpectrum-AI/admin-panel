import * as pulumi from "@pulumi/pulumi";
import * as digitalocean from "@pulumi/digitalocean";

// Get configuration values
const config = new pulumi.Config();
const region = config.get("region") || "sfo3";
const githubRepo = config.get("githubRepo") || "Xpectrum-AI/admin-panel";

// Create nested config objects for admin and dev namespaces
const adminConfig = new pulumi.Config("admin");
const devConfig = new pulumi.Config("dev");

// Note: All secrets should be set using: pulumi config set --secret <key> <value>

// Admin Panel App
const adminApp = new digitalocean.App("admin-panel-app", {
    spec: {
        name: "admin-panel-app",
        region: region,
        domains: ["admin-dev.xpectrum-ai.com"],
        services: [{
            name: "admin-panel",
            image: {
                registryType: "DOCR",
                repository: "admin-panel",
                tag: "latest"
            },
            httpPort: 3000,
            instanceCount: 1,
            instanceSizeSlug: "basic-xxs",
            envs: [
                {
                    key: "NODE_ENV",
                    value: "production"
                },
                {
                    key: "NEXT_PUBLIC_PROPELAUTH_URL",
                    value: adminConfig.get("propelauthUrl") || "https://auth.admin-dev.xpectrum-ai.com"
                },
                {
                    key: "NEXT_PUBLIC_PROPELAUTH_API_KEY",
                    value: adminConfig.requireSecret("propelauthApiKey")
                },
                {
                    key: "NEXT_PUBLIC_LIVE_API_URL",
                    value: adminConfig.get("liveApiUrl") || "https://d3sgivh2kmd3c8.cloudfront.net"
                },
                {
                    key: "NEXT_PUBLIC_LIVE_API_KEY",
                    value: adminConfig.requireSecret("liveApiKey")
                },
                {
                    key: "NEXT_PUBLIC_SUPER_ADMIN_ORG_ID",
                    value: adminConfig.get("superAdminOrgId") || "c53e8731-2ce7-4484-919c-0aba50c2f46a"
                }
            ]
        }]
    }
});

// Developer Dashboard App
const devApp = new digitalocean.App("developer-dashboard-app", {
    spec: {
        name: "developer-dashboard-app",
        region: region,
        domains: ["developer-dev.xpectrum-ai.com"],
        services: [{
            name: "developer-dashboard",
            image: {
                registryType: "DOCR",
                repository: "developer-dashboard",
                tag: "latest"
            },
            httpPort: 3000,
            instanceCount: 1,
            instanceSizeSlug: "basic-xxs",
            envs: [
                {
                    key: "NODE_ENV",
                    value: "development"
                },
                {
                    key: "NEXT_PUBLIC_DEVELOPMENT_PROPELAUTH_URL",
                    value: devConfig.get("propelauthUrl") || "https://auth.developer-dev.xpectrum-ai.com"
                },
                {
                    key: "NEXT_PUBLIC_API_BASE_URL",
                    value: devConfig.get("apiBaseUrl") || "http://localhost:3001/api"
                },
                {
                    key: "NEXT_PUBLIC_DEVELOPMENT_PROPELAUTH_API_KEY",
                    value: devConfig.requireSecret("propelauthApiKey")
                },
                {
                    key: "NEXT_PUBLIC_ENABLE_EMAIL_VERIFICATION",
                    value: devConfig.get("enableEmailVerification") || "true"
                },
                {
                    key: "NEXT_PUBLIC_DIFY_CONSOLE_ORIGIN",
                    value: devConfig.get("difyConsoleOrigin") || "https://demos.xpectrum-ai.com/"
                },
                {
                    key: "NEXT_PUBLIC_DIFY_ADMIN_EMAIL",
                    value: devConfig.get("difyAdminEmail") || "ghosh.ishw@gmail.com"
                },
                {
                    key: "NEXT_PUBLIC_DIFY_ADMIN_PASSWORD",
                    value: devConfig.requireSecret("difyAdminPassword")
                },
                {
                    key: "NEXT_PUBLIC_DIFY_WORKSPACE_ID",
                    value: devConfig.get("difyWorkspaceId") || "661d95ae-77ee-4cfd-88e3-e6f3ef8d638b"
                },
                {
                    key: "NEXT_PUBLIC_DIFY_BASE_URL",
                    value: devConfig.get("difyBaseUrl") || "https://demos.xpectrum-ai.com/v1"
                },
                {
                    key: "NEXT_PUBLIC_MODEL_OPEN_AI_API_KEY",
                    value: devConfig.requireSecret("modelOpenAiApiKey")
                },
                {
                    key: "NEXT_PUBLIC_MODEL_GROQ_API_KEY",
                    value: devConfig.requireSecret("modelGroqApiKey")
                },
                {
                    key: "NEXT_PUBLIC_MODEL_ANTHROPIC_API_KEY",
                    value: devConfig.requireSecret("modelAnthropicApiKey")
                },
                {
                    key: "NEXT_PUBLIC_CHATBOT_API_URL",
                    value: devConfig.get("chatbotApiUrl") || "https://demos.xpectrum-ai.com/v1/chat-messages"
                },
                {
                    key: "NEXT_PUBLIC_CHATBOT_API_KEY",
                    value: devConfig.requireSecret("chatbotApiKey")
                },
                {
                    key: "NEXT_PUBLIC_ELEVEN_LABS_API_KEY",
                    value: devConfig.requireSecret("elevenLabsApiKey")
                },
                {
                    key: "NEXT_PUBLIC_OPEN_AI_API_KEY",
                    value: devConfig.requireSecret("openAiApiKey")
                },
                {
                    key: "NEXT_PUBLIC_WHISPER_API_KEY",
                    value: devConfig.requireSecret("whisperApiKey")
                },
                {
                    key: "NEXT_PUBLIC_DEEPGRAM_API_KEY",
                    value: devConfig.requireSecret("deepgramApiKey")
                },
                {
                    key: "NEXT_PUBLIC_CARTESIA_API_KEY",
                    value: devConfig.requireSecret("cartesiaApiKey")
                },
                {
                    key: "NEXT_PUBLIC_CARTESIA_VOICE_ID",
                    value: devConfig.get("cartesiaVoiceId") || "e8e5fffb-252c-436d-b842-8879b84445b6"
                },
                {
                    key: "NEXT_PUBLIC_ELEVEN_LABS_VOICE_ID",
                    value: devConfig.get("elevenLabsVoiceId") || "pNInz6obpgDQGcFmaJgB"
                },
                {
                    key: "NEXT_PUBLIC_LIVE_API_URL",
                    value: devConfig.get("liveApiUrl") || "https://d3sgivh2kmd3c8.cloudfront.net"
                },
                {
                    key: "NEXT_PUBLIC_LIVE_API_KEY",
                    value: devConfig.requireSecret("liveApiKey")
                },
                {
                    key: "MONGODB_URL",
                    value: devConfig.requireSecret("mongodbUrl")
                },
                {
                    key: "DATABASE_NAME",
                    value: devConfig.get("databaseName") || "your_database_name"
                },
                {
                    key: "NEXT_PUBLIC_APP_NAME",
                    value: devConfig.get("appName") || "Developer Dashboard"
                },
                {
                    key: "NEXT_PUBLIC_APP_VERSION",
                    value: devConfig.get("appVersion") || "1.0.0"
                }
            ]
        }]
    }
});

// Export separate URLs
export const adminPanelUrl = adminApp.liveUrl;
export const developerDashboardUrl = devApp.liveUrl;
export const adminAppId = adminApp.id;
export const devAppId = devApp.id;