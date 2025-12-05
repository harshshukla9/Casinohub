import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/lib/user';
import Withdrawal from '@/lib/withdrawal';

// Minimum withdrawal amount
const MIN_WITHDRAWAL_AMOUNT = 0.1;

// 24 hour cooldown in milliseconds
const COOLDOWN_PERIOD = 24 * 60 * 60 * 1000;

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const { walletAddress, amount, fid, username } = await request.json();
    
    console.log('Withdraw API - Received data:', { walletAddress, amount, fid, username });
    
    // Validation: Required fields
    if (!walletAddress || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields: walletAddress, amount' },
        { status: 400 }
      );
    }
    
    const normalizedWalletAddress = walletAddress.toLowerCase();
    const withdrawAmount = parseFloat(amount);
    
    // Validation: Valid amount
    if (isNaN(withdrawAmount) || withdrawAmount <= 0) {
      return NextResponse.json(
        { error: 'Invalid withdrawal amount' },
        { status: 400 }
      );
    }
    
    // Validation: Minimum withdrawal amount
    if (withdrawAmount < MIN_WITHDRAWAL_AMOUNT) {
      return NextResponse.json(
        { error: `Minimum withdrawal amount is ${MIN_WITHDRAWAL_AMOUNT} STT` },
        { status: 400 }
      );
    }
    
    // Find user by wallet address
    const user = await User.findOne({ 
      walletAddress: normalizedWalletAddress 
    });
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    console.log('Withdraw API - User found:', { 
      balance: user.balance, 
      withdrawAmount 
    });
    
    // Validation: Sufficient balance
    if (user.balance < withdrawAmount) {
      return NextResponse.json(
        { 
          error: 'Insufficient balance',
          currentBalance: user.balance,
          requestedAmount: withdrawAmount
        },
        { status: 400 }
      );
    }
    
    // Check for pending withdrawals in the last 24 hours
    const twentyFourHoursAgo = new Date(Date.now() - COOLDOWN_PERIOD);
    const recentWithdrawal = await Withdrawal.findOne({
      walletAddress: normalizedWalletAddress,
      requestedAt: { $gte: twentyFourHoursAgo },
      status: { $in: ['pending', 'completed'] }
    }).sort({ requestedAt: -1 });
    
    if (recentWithdrawal) {
      const timeSinceLastWithdrawal = Date.now() - recentWithdrawal.requestedAt.getTime();
      const hoursRemaining = Math.ceil((COOLDOWN_PERIOD - timeSinceLastWithdrawal) / (60 * 60 * 1000));
      
      return NextResponse.json(
        { 
          error: `You can only request one withdrawal per 24 hours. Please wait ${hoursRemaining} more hour(s).`,
          lastWithdrawalTime: recentWithdrawal.requestedAt,
          hoursRemaining
        },
        { status: 429 } // 429 Too Many Requests
      );
    }
    
    // Deduct balance immediately (before creating withdrawal request)
    const previousBalance = user.balance;
    user.balance -= withdrawAmount;
    user.totalWithdrawn = (user.totalWithdrawn || 0) + withdrawAmount;
    
    await user.save();
    
    console.log('Withdraw API - Balance deducted:', {
      previousBalance,
      newBalance: user.balance,
      deductedAmount: withdrawAmount
    });
    
    // Create withdrawal request
    const withdrawal = new Withdrawal({
      walletAddress: normalizedWalletAddress,
      amount: withdrawAmount,
      status: 'pending',
      requestedAt: new Date(),
      fid,
      username,
    });
    
    await withdrawal.save();
    
    console.log('Withdraw API - Withdrawal request created:', {
      withdrawalId: withdrawal._id,
      amount: withdrawAmount,
      status: withdrawal.status
    });
    
    return NextResponse.json({
      success: true,
      withdrawalId: withdrawal._id,
      amount: withdrawAmount,
      newBalance: user.balance,
      status: 'pending',
      message: 'Withdrawal request created successfully. Balance deducted immediately.',
      estimatedProcessingTime: '24-48 hours'
    });
    
  } catch (error) {
    console.error('Withdraw API - Error:', error);
    return NextResponse.json(
      { error: 'Failed to process withdrawal request' },
      { status: 500 }
    );
  }
}

// GET endpoint to check withdrawal history
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('walletAddress');
    
    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Missing walletAddress parameter' },
        { status: 400 }
      );
    }
    
    const normalizedWalletAddress = walletAddress.toLowerCase();
    
    // Get all withdrawals for this user
    const withdrawals = await Withdrawal.find({
      walletAddress: normalizedWalletAddress
    }).sort({ requestedAt: -1 }).limit(10);
    
    // Check if user can make a new withdrawal
    const twentyFourHoursAgo = new Date(Date.now() - COOLDOWN_PERIOD);
    const recentWithdrawal = await Withdrawal.findOne({
      walletAddress: normalizedWalletAddress,
      requestedAt: { $gte: twentyFourHoursAgo },
      status: { $in: ['pending', 'completed'] }
    }).sort({ requestedAt: -1 });
    
    let canWithdraw = true;
    let hoursRemaining = 0;
    
    if (recentWithdrawal) {
      const timeSinceLastWithdrawal = Date.now() - recentWithdrawal.requestedAt.getTime();
      hoursRemaining = Math.ceil((COOLDOWN_PERIOD - timeSinceLastWithdrawal) / (60 * 60 * 1000));
      canWithdraw = hoursRemaining <= 0;
    }
    
    return NextResponse.json({
      withdrawals,
      canWithdraw,
      hoursRemaining: canWithdraw ? 0 : hoursRemaining,
      lastWithdrawal: recentWithdrawal
    });
    
  } catch (error) {
    console.error('Withdraw API GET - Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch withdrawal history' },
      { status: 500 }
    );
  }
}

