import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Health check for Doctor Dashboard
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'doctor-dashboard',
      environment: process.env.NODE_ENV || 'development',
      basePath: '/',
      version: '1.0.0'
    }, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Doctor dashboard health check failed:', error);
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      service: 'doctor-dashboard',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { 
      status: 500,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Content-Type': 'application/json'
      }
    });
  }
}