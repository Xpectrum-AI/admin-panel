import * as pulumi from "@pulumi/pulumi";
import * as digitalocean from "@pulumi/digitalocean";

// Get configuration values
const config = new pulumi.Config();
const region = config.get("region") || "sfo3";
const githubRepo = config.get("githubRepo") || "Xpectrum-AI/admin-panel";

// Get current stack name
const stack = pulumi.getStack(); // "frontend-dev", "frontend-release", or "frontend-prod"

// Create nested config objects for all environments
// Each environment uses the same namespace for both admin-panel and developer-dashboard
const devConfig = new pulumi.Config("dev");        // For both admin-panel and developer-dashboard in dev
const releaseConfig = new pulumi.Config("release"); // For both admin-panel and developer-dashboard in release
const prodConfig = new pulumi.Config("prod");      // For both admin-panel and developer-dashboard in prod

// Note: All secrets should be set using: pulumi config set --secret <key> <value>

// Helper function to create Admin Panel App
function createAdminPanelApp(env: string, adminEnvConfig: pulumi.Config) {
    const appName = `admin-panel-app-${env}`;
    const serviceName = `admin-panel-${env}`;
    // For production, use admin.xpectrum-ai.com (no -prod suffix)
    // For other environments, use admin-{env}.xpectrum-ai.com
    const domain = env === "prod" ? "admin.xpectrum-ai.com" : `admin-${env}.xpectrum-ai.com`;
    const repository = `admin-${env}`;

    return new digitalocean.App(appName, {
        spec: {
            name: appName,
            region: region,
            domains: [domain],
            services: [{
                name: serviceName,
                image: {
                    registryType: "DOCR",
                    repository: repository,
                    tag: "latest"
                },
                httpPort: 3000,
                instanceCount: 1,
                instanceSizeSlug: "basic-xs",
                healthCheck: {
                    httpPath: "/api/health",
                    initialDelaySeconds: 10,
                    periodSeconds: 10,
                    timeoutSeconds: 5,
                    successThreshold: 1,
                    failureThreshold: 3
                },
                envs: [
                    {
                        key: "NODE_ENV",
                        value: "production"
                    },
                    {
                        key: "PORT",
                        value: "3000"
                    },
                    {
                        key: "HOSTNAME",
                        value: "0.0.0.0"
                    },
                    {
                        key: "NEXT_PUBLIC_PROPELAUTH_URL",
                        value: adminEnvConfig.require("propelauthUrl")
                    },
                    {
                        key: "NEXT_PUBLIC_PROPELAUTH_API_KEY",
                        value: adminEnvConfig.requireSecret("propelauthApiKey")
                    },
                    {
                        key: "NEXT_PUBLIC_LIVE_API_URL",
                        value: adminEnvConfig.require("liveApiUrl")
                    },
                    {
                        key: "NEXT_PUBLIC_LIVE_API_KEY",
                        value: adminEnvConfig.requireSecret("liveApiKey")
                    },
                    {
                        key: "NEXT_PUBLIC_SUPER_ADMIN_ORG_ID",
                        value: adminEnvConfig.get("superAdminOrgId") || "c53e8731-2ce7-4484-919c-0aba50c2f46a"
                    }
                ]
            }]
        }
    });
}

// Helper function to create Developer Dashboard App
function createDeveloperDashboardApp(env: string, envConfig: pulumi.Config) {
    const appName = `developer-dashboard-app-${env}`;
    const serviceName = `developer-dashboard-${env}`;
    // For production, use developer.xpectrum-ai.com (no -prod suffix)
    // For other environments, use developer-{env}.xpectrum-ai.com
    const domain = env === "prod" ? "developer.xpectrum-ai.com" : `developer-${env}.xpectrum-ai.com`;
    const repository = `developer-${env}`;

    return new digitalocean.App(appName, {
        spec: {
            name: appName,
            region: region,
            domains: [domain],
            services: [{
                name: serviceName,
                image: {
                    registryType: "DOCR",
                    repository: repository,
                    tag: "latest"
                },
                httpPort: 3000,
                instanceCount: 1,
                instanceSizeSlug: "basic-xs",
                healthCheck: {
                    httpPath: "/api/health",
                    initialDelaySeconds: 10,
                    periodSeconds: 10,
                    timeoutSeconds: 5,
                    successThreshold: 1,
                    failureThreshold: 3
                },
                envs: [
                    {
                        key: "NODE_ENV",
                        value: "production"
                    },
                    {
                        key: "PORT",
                        value: "3000"
                    },
                    {
                        key: "HOSTNAME",
                        value: "0.0.0.0"
                    },
                    {
                        key: "NEXT_PUBLIC_DEVELOPMENT_PROPELAUTH_URL",
                        value: envConfig.require("propelauthUrl")
                    },
                    {
                        key: "NEXT_PUBLIC_API_BASE_URL",
                        value: envConfig.require("apiBaseUrl")
                    },
                    {
                        key: "NEXT_PUBLIC_DEVELOPMENT_PROPELAUTH_API_KEY",
                        value: envConfig.requireSecret("propelauthApiKey")
                    },
                    {
                        key: "NEXT_PUBLIC_ENABLE_EMAIL_VERIFICATION",
                        value: envConfig.get("enableEmailVerification") || "true"
                    },
                    {
                        key: "NEXT_PUBLIC_DIFY_CONSOLE_ORIGIN",
                        value: envConfig.require("difyConsoleOrigin")
                    },
                    {
                        key: "NEXT_PUBLIC_DIFY_ADMIN_EMAIL",
                        value: envConfig.require("difyAdminEmail")
                    },
                    {
                        key: "NEXT_PUBLIC_DIFY_ADMIN_PASSWORD",
                        value: envConfig.requireSecret("difyAdminPassword")
                    },
                    {
                        key: "NEXT_PUBLIC_DIFY_WORKSPACE_ID",
                        value: envConfig.require("difyWorkspaceId")
                    },
                    {
                        key: "NEXT_PUBLIC_DIFY_BASE_URL",
                        value: envConfig.require("difyBaseUrl")
                    },
                    {
                        key: "NEXT_PUBLIC_MODEL_OPEN_AI_API_KEY",
                        value: envConfig.requireSecret("modelOpenAiApiKey")
                    },
                    {
                        key: "NEXT_PUBLIC_MODEL_GROQ_API_KEY",
                        value: envConfig.requireSecret("modelGroqApiKey")
                    },
                    {
                        key: "NEXT_PUBLIC_MODEL_ANTHROPIC_API_KEY",
                        value: envConfig.requireSecret("modelAnthropicApiKey")
                    },
                    {
                        key: "NEXT_PUBLIC_CHATBOT_API_URL",
                        value: envConfig.require("chatbotApiUrl")
                    },
                    {
                        key: "NEXT_PUBLIC_CHATBOT_API_KEY",
                        value: envConfig.requireSecret("chatbotApiKey")
                    },
                    {
                        key: "NEXT_PUBLIC_ELEVEN_LABS_API_KEY",
                        value: envConfig.requireSecret("elevenLabsApiKey")
                    },
                    {
                        key: "NEXT_PUBLIC_OPEN_AI_API_KEY",
                        value: envConfig.requireSecret("openAiApiKey")
                    },
                    {
                        key: "NEXT_PUBLIC_WHISPER_API_KEY",
                        value: envConfig.requireSecret("whisperApiKey")
                    },
                    {
                        key: "NEXT_PUBLIC_DEEPGRAM_API_KEY",
                        value: envConfig.requireSecret("deepgramApiKey")
                    },
                    {
                        key: "NEXT_PUBLIC_CARTESIA_API_KEY",
                        value: envConfig.requireSecret("cartesiaApiKey")
                    },
                    {
                        key: "NEXT_PUBLIC_CARTESIA_VOICE_ID",
                        value: envConfig.require("cartesiaVoiceId")
                    },
                    {
                        key: "NEXT_PUBLIC_ELEVEN_LABS_VOICE_ID",
                        value: envConfig.require("elevenLabsVoiceId")
                    },
                    {
                        key: "NEXT_PUBLIC_LIVE_API_URL",
                        value: envConfig.require("liveApiUrl")
                    },
                    {
                        key: "NEXT_PUBLIC_LIVE_API_KEY",
                        value: envConfig.requireSecret("liveApiKey")
                    },
                    {
                        key: "DATABASE_NAME",
                        value: envConfig.get("databaseName") || "your_database_name"
                    },
                    {
                        key: "NEXT_PUBLIC_APP_NAME",
                        value: envConfig.get("appName") || "Developer Dashboard"
                    },
                    {
                        key: "NEXT_PUBLIC_APP_VERSION",
                        value: envConfig.get("appVersion") || "1.0.0"
                    }
                ]
            }]
        }
    });
}

// Conditionally create resources based on stack name
let adminApp: digitalocean.App | undefined;
let developerApp: digitalocean.App | undefined;

if (stack === "frontend-dev") {
    // Development environment
    // Both Admin Panel and Developer Dashboard use: dev: namespace
    adminApp = createAdminPanelApp("dev", devConfig);
    developerApp = createDeveloperDashboardApp("dev", devConfig);
} else if (stack === "frontend-release") {
    // Release environment
    // Both Admin Panel and Developer Dashboard use: release: namespace
    adminApp = createAdminPanelApp("release", releaseConfig);
    developerApp = createDeveloperDashboardApp("release", releaseConfig);
} else if (stack === "frontend-prod") {
    // Production environment
    // Both Admin Panel and Developer Dashboard use: prod: namespace
    adminApp = createAdminPanelApp("prod", prodConfig);
    developerApp = createDeveloperDashboardApp("prod", prodConfig);
} else {
    throw new Error(`Unknown stack: ${stack}. Expected: frontend-dev, frontend-release, or frontend-prod`);
}

// Export URLs and IDs
export const adminPanelUrl = adminApp!.liveUrl;
export const developerDashboardUrl = developerApp!.liveUrl;
export const adminAppId = adminApp!.id;
export const developerAppId = developerApp!.id;
