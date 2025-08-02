import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'admin-panel-frontend',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    port: process.env.PORT || 3000,
    // Additional health information
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    platform: process.platform,
    nodeVersion: process.version,
    // All APIs now handled by Next.js
    apis: {
      agents: '/api/agents',
      orgs: '/api/org',
      users: '/api/user',
      stripe: '/api/stripe/v1',
      health: '/api/health'
    }
  });
}