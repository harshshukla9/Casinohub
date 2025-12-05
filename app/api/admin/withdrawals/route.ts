import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Withdrawal from '@/lib/withdrawal';

// Admin API key for security (set in environment variables)
const ADMIN_API_KEY = process.env.ADMIN_API_KEY || 'your-secret-admin-key-change-this';

/**
 * GET /api/admin/withdrawals
 * Fetch all pending withdrawal requests
 * For use by the admin processing script
 */
export async function GET(request: NextRequest) {
  try {
    // Verify admin API key
    const authHeader = request.headers.get('authorization');
    const apiKey = authHeader?.replace('Bearer ', '');
    
    if (!apiKey || apiKey !== ADMIN_API_KEY) {
      return NextResponse.json(
        { error: 'Unauthorized. Invalid API key.' },
        { status: 401 }
      );
    }

    await connectDB();

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'pending';
    const limit = parseInt(searchParams.get('limit') || '100', 10);

    // Fetch withdrawals
    const withdrawals = await Withdrawal.find({
      status: status,
    })
      .sort({ requestedAt: 1 }) // Oldest first (FIFO)
      .limit(limit)
      .lean();

    console.log(`Admin API - Fetched ${withdrawals.length} ${status} withdrawals`);

    return NextResponse.json({
      success: true,
      count: withdrawals.length,
      withdrawals: withdrawals.map(w => ({
        id: (w._id as any).toString(),
        walletAddress: w.walletAddress,
        amount: w.amount,
        status: w.status,
        requestedAt: w.requestedAt,
        fid: w.fid,
        username: w.username,
      })),
    });

  } catch (error) {
    console.error('Admin API - Error fetching withdrawals:', error);
    return NextResponse.json(
      { error: 'Failed to fetch withdrawals' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/withdrawals
 * Update withdrawal status after processing
 * For use by the admin processing script
 */
export async function PUT(request: NextRequest) {
  try {
    // Verify admin API key
    const authHeader = request.headers.get('authorization');
    const apiKey = authHeader?.replace('Bearer ', '');
    
    if (!apiKey || apiKey !== ADMIN_API_KEY) {
      return NextResponse.json(
        { error: 'Unauthorized. Invalid API key.' },
        { status: 401 }
      );
    }

    await connectDB();

    const { withdrawalId, status, transactionHash, rejectionReason } = await request.json();

    // Validation
    if (!withdrawalId || !status) {
      return NextResponse.json(
        { error: 'Missing required fields: withdrawalId, status' },
        { status: 400 }
      );
    }

    if (!['completed', 'rejected', 'processing'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be: completed, rejected, or processing' },
        { status: 400 }
      );
    }

    // Find and update withdrawal
    const withdrawal = await Withdrawal.findById(withdrawalId);

    if (!withdrawal) {
      return NextResponse.json(
        { error: 'Withdrawal not found' },
        { status: 404 }
      );
    }

    // Update withdrawal
    withdrawal.status = status;
    withdrawal.processedAt = new Date();
    
    if (transactionHash) {
      withdrawal.transactionHash = transactionHash;
    }
    
    if (rejectionReason) {
      withdrawal.rejectionReason = rejectionReason;
    }

    await withdrawal.save();

    console.log(`Admin API - Updated withdrawal ${withdrawalId} to ${status}`);

    return NextResponse.json({
      success: true,
      withdrawal: {
        id: withdrawal._id.toString(),
        walletAddress: withdrawal.walletAddress,
        amount: withdrawal.amount,
        status: withdrawal.status,
        transactionHash: withdrawal.transactionHash,
        processedAt: withdrawal.processedAt,
      },
    });

  } catch (error) {
    console.error('Admin API - Error updating withdrawal:', error);
    return NextResponse.json(
      { error: 'Failed to update withdrawal' },
      { status: 500 }
    );
  }
}

