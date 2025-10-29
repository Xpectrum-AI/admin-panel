import * as pulumi from "@pulumi/pulumi";
import * as digitalocean from "@pulumi/digitalocean";

// Get configuration values
const config = new pulumi.Config();
const region = config.get("region") || "sfo3";
const githubRepo = config.get("githubRepo") || "Xpectrum-AI/admin-panel";

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
                    value: "https://auth.admin-dev.xpectrum-ai.com"
                },
                {
                    key: "NEXT_PUBLIC_PROPELAUTH_API_KEY",
                    value: "888ea8af8e1d78888fcb15304e2633446516519573b7f6219943b306a4626df95d477061f77b939b8cdadd7a50559a6c"
                },
                {
                    key: "NEXT_PUBLIC_LIVE_API_URL",
                    value: "https://d3sgivh2kmd3c8.cloudfront.net"
                },
                {
                    key: "NEXT_PUBLIC_LIVE_API_KEY",
                    value: "xpectrum-ai@123"
                },
                {
                    key: "NEXT_PUBLIC_SUPER_ADMIN_ORG_ID",
                    value: "c53e8731-2ce7-4484-919c-0aba50c2f46a"
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
                    value: "https://auth.developer-dev.xpectrum-ai.com"
                },
                {
                    key: "NEXT_PUBLIC_API_BASE_URL",
                    value: "http://localhost:3001/api"
                },
                {
                    key: "NEXT_PUBLIC_DEVELOPMENT_PROPELAUTH_API_KEY",
                    value: "8203315022b0778dce72003f464938218ea7b22dfb0a396e1388250db6058579a412f9752a05e70611d377dc5fcc265f"
                },
                {
                    key: "NEXT_PUBLIC_ENABLE_EMAIL_VERIFICATION",
                    value: "true"
                },
                {
                    key: "NEXT_PUBLIC_DIFY_CONSOLE_ORIGIN",
                    value: "https://demos.xpectrum-ai.com/"
                },
                {
                    key: "NEXT_PUBLIC_DIFY_ADMIN_EMAIL",
                    value: "ghosh.ishw@gmail.com"
                },
                {
                    key: "NEXT_PUBLIC_DIFY_ADMIN_PASSWORD",
                    value: "Ghosh1@*123"
                },
                {
                    key: "NEXT_PUBLIC_DIFY_WORKSPACE_ID",
                    value: "661d95ae-77ee-4cfd-88e3-e6f3ef8d638b"
                },
                {
                    key: "NEXT_PUBLIC_DIFY_BASE_URL",
                    value: "https://demos.xpectrum-ai.com/v1"
                },
                {
                    key: "NEXT_PUBLIC_MODEL_OPEN_AI_API_KEY",
                    value: "REDACTED"
                },
                {
                    key: "NEXT_PUBLIC_MODEL_GROQ_API_KEY",
                    value: "REDACTED"
                },
                {
                    key: "NEXT_PUBLIC_MODEL_ANTHROPIC_API_KEY",
                    value: "REDACTED"
                },
                {
                    key: "NEXT_PUBLIC_CHATBOT_API_URL",
                    value: "https://demos.xpectrum-ai.com/v1/chat-messages"
                },
                {
                    key: "NEXT_PUBLIC_CHATBOT_API_KEY",
                    value: "REDACTED"
                },
                {
                    key: "NEXT_PUBLIC_ELEVEN_LABS_API_KEY",
                    value: "REDACTED"
                },
                {
                    key: "NEXT_PUBLIC_OPEN_AI_API_KEY",
                    value: "REDACTED"
                },
                {
                    key: "NEXT_PUBLIC_WHISPER_API_KEY",
                    value: "REDACTED"
                },
                {
                    key: "NEXT_PUBLIC_DEEPGRAM_API_KEY",
                    value: "e1db3c9cab55f4d427f6f03b8a5975bed3160aa9"
                },
                {
                    key: "NEXT_PUBLIC_CARTESIA_API_KEY",
                    value: "REDACTED"
                },
                {
                    key: "NEXT_PUBLIC_CARTESIA_VOICE_ID",
                    value: "e8e5fffb-252c-436d-b842-8879b84445b6"
                },
                {
                    key: "NEXT_PUBLIC_ELEVEN_LABS_VOICE_ID",
                    value: "pNInz6obpgDQGcFmaJgB"
                },
                {
                    key: "NEXT_PUBLIC_LIVE_API_URL",
                    value: "https://d3sgivh2kmd3c8.cloudfront.net"
                },
                {
                    key: "NEXT_PUBLIC_LIVE_API_KEY",
                    value: "xpectrum-ai@123"
                },
                {
                    key: "MONGODB_URL",
                    value: "your_mongodb_connection_string"
                },
                {
                    key: "DATABASE_NAME",
                    value: "your_database_name"
                },
                {
                    key: "NEXT_PUBLIC_APP_NAME",
                    value: "Developer Dashboard"
                },
                {
                    key: "NEXT_PUBLIC_APP_VERSION",
                    value: "1.0.0"
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