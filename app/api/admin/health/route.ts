import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Withdrawal from '@/lib/withdrawal';

// Admin API key for security (set in environment variables)
const ADMIN_API_KEY = process.env.ADMIN_API_KEY || 'your-secret-admin-key-change-this';

/**
 * Admin health check endpoint
 * GET /api/admin/health
 * 
 * Used by the admin processing script to verify:
 * - API is reachable
 * - Authentication is working
 * - Database is connected
 * - Withdrawal system is operational
 */
export async function GET(request: NextRequest) {
  try {
    // Verify admin API key
    const authHeader = request.headers.get('authorization');
    const apiKey = authHeader?.replace('Bearer ', '');
    
    if (!apiKey || apiKey !== ADMIN_API_KEY) {
      return NextResponse.json(
        { 
          status: 'error',
          error: 'Unauthorized. Invalid API key.',
          timestamp: new Date().toISOString(),
        },
        { status: 401 }
      );
    }

    // Initialize health status
    const health: any = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      checks: {
        authentication: 'ok',
        database: 'checking',
        withdrawalSystem: 'checking',
      },
    };

    // Check database connection
    try {
      await connectDB();
      health.checks.database = 'ok';
    } catch (dbError) {
      health.checks.database = 'error';
      health.status = 'degraded';
      console.error('Admin health check - DB connection error:', dbError);
    }

    // Check withdrawal system
    try {
      // Count pending withdrawals
      const pendingCount = await Withdrawal.countDocuments({ status: 'pending' });
      health.checks.withdrawalSystem = 'ok';
      health.pendingWithdrawals = pendingCount;
    } catch (withdrawalError) {
      health.checks.withdrawalSystem = 'error';
      health.status = 'degraded';
      console.error('Admin health check - Withdrawal system error:', withdrawalError);
    }

    const statusCode = health.status === 'ok' ? 200 : 503;

    return NextResponse.json(health, { status: statusCode });
  } catch (error) {
    console.error('Admin health check error:', error);
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

