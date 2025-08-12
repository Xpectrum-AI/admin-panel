import { NextResponse } from 'next/server';
import { createSuccessResponse, handleApiError } from '@/lib/utils/apiResponse';

export async function GET() {
  try {
    const healthData = {
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
    };

    return createSuccessResponse(healthData, 'Health check completed successfully');
  } catch (error) {
    return handleApiError(error, 'Health API');
  }
}