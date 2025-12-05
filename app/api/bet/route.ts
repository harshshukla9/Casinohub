import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/lib/user';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const { walletAddress, betAmount } = await request.json();
    
    console.log('Bet API - Received data:', { walletAddress, betAmount });
    
    if (!walletAddress || !betAmount) {
      return NextResponse.json(
        { error: 'Missing required fields: walletAddress, betAmount' },
        { status: 400 }
      );
    }
    
    const normalizedWalletAddress = walletAddress.toLowerCase();
    const betAmountNumber = parseFloat(betAmount);
    
    if (isNaN(betAmountNumber) || betAmountNumber <= 0) {
      return NextResponse.json(
        { error: 'Invalid bet amount' },
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
    
    console.log('Bet API - User found:', { 
      balance: user.balance, 
      betAmount: betAmountNumber 
    });
    
    // Check if user has sufficient balance
    if (user.balance < betAmountNumber) {
      return NextResponse.json(
        { error: 'Insufficient balance' },
        { status: 400 }
      );
    }
    
    // Deduct bet amount from balance
    user.balance -= betAmountNumber;
    user.totalBets = (user.totalBets || 0) + betAmountNumber;
    
    await user.save();
    
    console.log('Bet API - Bet deducted successfully:', {
      newBalance: user.balance,
      totalBets: user.totalBets
    });
    
    return NextResponse.json({
      success: true,
      newBalance: user.balance,
      betAmount: betAmountNumber,
      message: 'Bet placed successfully'
    });
    
  } catch (error) {
    console.error('Bet API - Error:', error);
    return NextResponse.json(
      { error: 'Failed to place bet' },
      { status: 500 }
    );
  }
}
