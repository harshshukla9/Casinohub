import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Withdrawal from '@/lib/withdrawal';

// Admin API key for security (set in environment variables)
const ADMIN_API_KEY = process.env.ADMIN_API_KEY || 'your-secret-admin-key-change-this';

/**
 * POST /api/admin/withdrawals/batch
 * Batch update multiple withdrawals after processing
 * For use by the admin processing script
 */
export async function POST(request: NextRequest) {
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

    const { updates } = await request.json();

    // Validation
    if (!updates || !Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json(
        { error: 'Missing or invalid updates array' },
        { status: 400 }
      );
    }

    console.log(`Admin API - Processing batch update for ${updates.length} withdrawals`);

    const results = {
      successful: [] as string[],
      failed: [] as { id: string; error: string }[],
    };

    // Process each update
    for (const update of updates) {
      try {
        const { withdrawalId, status, transactionHash, rejectionReason } = update;

        if (!withdrawalId || !status) {
          results.failed.push({
            id: withdrawalId || 'unknown',
            error: 'Missing withdrawalId or status',
          });
          continue;
        }

        // Find and update withdrawal
        const withdrawal = await Withdrawal.findById(withdrawalId);

        if (!withdrawal) {
          results.failed.push({
            id: withdrawalId,
            error: 'Withdrawal not found',
          });
          continue;
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
        results.successful.push(withdrawalId);

        console.log(`✅ Updated withdrawal ${withdrawalId} to ${status}`);

      } catch (error) {
        console.error(`❌ Failed to update withdrawal ${update.withdrawalId}:`, error);
        results.failed.push({
          id: update.withdrawalId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    console.log(`Admin API - Batch complete: ${results.successful.length} successful, ${results.failed.length} failed`);

    return NextResponse.json({
      success: true,
      summary: {
        total: updates.length,
        successful: results.successful.length,
        failed: results.failed.length,
      },
      results,
    });

  } catch (error) {
    console.error('Admin API - Error in batch update:', error);
    return NextResponse.json(
      { error: 'Failed to process batch update' },
      { status: 500 }
    );
  }
}

