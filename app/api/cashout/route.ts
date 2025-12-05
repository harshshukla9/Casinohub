import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/lib/user';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const { walletAddress, betAmount, multiplier } = await request.json();
    
    console.log('Cashout API - Received data:', { walletAddress, betAmount, multiplier });
    
    if (!walletAddress || !betAmount || !multiplier) {
      return NextResponse.json(
        { error: 'Missing required fields: walletAddress, betAmount, multiplier' },
        { status: 400 }
      );
    }
    
    const normalizedWalletAddress = walletAddress.toLowerCase();
    const betAmountNumber = parseFloat(betAmount);
    const multiplierNumber = parseFloat(multiplier);
    
    if (isNaN(betAmountNumber) || betAmountNumber <= 0) {
      return NextResponse.json(
        { error: 'Invalid bet amount' },
        { status: 400 }
      );
    }
    
    if (isNaN(multiplierNumber) || multiplierNumber < 1) {
      return NextResponse.json(
        { error: 'Invalid multiplier' },
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
    
    // Calculate winnings
    const winnings = betAmountNumber * multiplierNumber;
    
    console.log('Cashout API - Calculating winnings:', {
      betAmount: betAmountNumber,
      multiplier: multiplierNumber,
      winnings: winnings
    });
    
    // Add winnings to balance
    user.balance += winnings;
    user.totalWinnings = (user.totalWinnings || 0) + winnings;
    
    await user.save();
    
    console.log('Cashout API - Cashout successful:', {
      newBalance: user.balance,
      winnings: winnings,
      totalWinnings: user.totalWinnings
    });
    
    return NextResponse.json({
      success: true,
      newBalance: user.balance,
      winnings: winnings,
      multiplier: multiplierNumber,
      message: 'Cashout successful'
    });
    
  } catch (error) {
    console.error('Cashout API - Error:', error);
    return NextResponse.json(
      { error: 'Failed to cashout' },
      { status: 500 }
    );
  }
}
