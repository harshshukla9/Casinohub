import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';

/**
 * Health check endpoint
 * GET /api/health
 * 
 * Used for monitoring and checking if the service is running properly
 */
export async function GET() {
  try {
    // Basic health check
    const health: any = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
    };

    // Optional: Check database connection
    try {
      await connectDB();
      health.database = 'connected';
    } catch (dbError) {
      health.database = 'error';
      health.status = 'degraded';
      console.error('Health check - DB connection error:', dbError);
    }

    const statusCode = health.status === 'ok' ? 200 : 503;

    return NextResponse.json(health, { status: statusCode });
  } catch (error) {
    console.error('Health check error:', error);
    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: 'Health check failed',
      },
      { status: 503 }
    );
  }
}

