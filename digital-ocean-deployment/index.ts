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
                }
                // All other environment variables are managed in App Platform UI as Encrypted
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
                }
                // All other environment variables are managed in App Platform UI as Encrypted
            ]
        }]
    }
});

// Export separate URLs
export const adminPanelUrl = adminApp.liveUrl;
export const developerDashboardUrl = devApp.liveUrl;
export const adminAppId = adminApp.id;
export const devAppId = devApp.id;