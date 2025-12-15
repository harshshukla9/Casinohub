import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import Withdrawal from '@/lib/withdrawal'

export const dynamic = 'force-dynamic'

/**
 * Mark a withdrawal as completed (or rejected) after on-chain transaction result.
 * This is called from the frontend once claimWithdrawal has succeeded on-chain.
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB()

    const { withdrawalId, walletAddress, transactionHash, status, rejectionReason } =
      await request.json()

    if (!withdrawalId || !walletAddress || !transactionHash) {
      return NextResponse.json(
        { error: 'Missing required fields: withdrawalId, walletAddress, transactionHash' },
        { status: 400 }
      )
    }

    const normalizedWalletAddress = (walletAddress as string).toLowerCase()
    const newStatus: 'completed' | 'rejected' = status === 'rejected' ? 'rejected' : 'completed'

    const withdrawal = await Withdrawal.findOne({
      _id: withdrawalId,
      walletAddress: normalizedWalletAddress,
    })

    if (!withdrawal) {
      return NextResponse.json(
        { error: 'Withdrawal not found' },
        { status: 404 }
      )
    }

    // Only update if still pending, to avoid double-processing
    if (withdrawal.status !== 'pending') {
      return NextResponse.json(
        {
          success: true,
          message: 'Withdrawal already processed',
          withdrawal,
        },
        { status: 200 }
      )
    }

    withdrawal.status = newStatus
    withdrawal.transactionHash = transactionHash
    withdrawal.processedAt = new Date()

    if (newStatus === 'rejected' && rejectionReason) {
      withdrawal.rejectionReason = rejectionReason
    }

    await withdrawal.save()

    return NextResponse.json({
      success: true,
      status: withdrawal.status,
      withdrawal,
    })
  } catch (error) {
    console.error('Withdraw Complete API - Error:', error)
    return NextResponse.json(
      { error: 'Failed to update withdrawal status' },
      { status: 500 }
    )
  }
}


