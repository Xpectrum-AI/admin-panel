import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'developer-frontend',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      port: process.env.PORT || 3000,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      platform: process.platform,
      nodeVersion: process.version,
      apis: {
        auth: '/api/auth',
        user: '/api/user',
        health: '/api/health'
      }
    };

    return NextResponse.json({
      success: true,
      message: 'Health check completed successfully',
      data: healthData,
      timestamp: new Date().toISOString()
    }, { status: 200 });
  } catch (error) {
    console.error('Health API Error:', error);
    return NextResponse.json({
      success: false,
      message: 'Health API operation failed',
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
