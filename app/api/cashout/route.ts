import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/lib/user';

export async function POST(request: NextRequest) {
  console.log('=== CASHOUT API CALLED ===');
  
  try {
    await connectDB();
    
    const body = await request.json();
    const { walletAddress, betAmount, multiplier } = body;
    
    console.log('Cashout API - Received data:', { 
      walletAddress, 
      betAmount, 
      multiplier,
      types: {
        walletAddress: typeof walletAddress,
        betAmount: typeof betAmount,
        multiplier: typeof multiplier
      }
    });
    
    // Check for missing fields - multiplier can be 0
    if (!walletAddress || betAmount === undefined || betAmount === null || multiplier === undefined || multiplier === null) {
      console.error('Cashout API - Missing fields:', { walletAddress, betAmount, multiplier });
      return NextResponse.json(
        { error: 'Missing required fields: walletAddress, betAmount, multiplier' },
        { status: 400 }
      );
    }
    
    const normalizedWalletAddress = walletAddress.toLowerCase();
    const betAmountNumber = parseFloat(String(betAmount));
    const multiplierNumber = parseFloat(String(multiplier));
    
    console.log('Cashout API - Parsed values:', { 
      normalizedWalletAddress,
      betAmountNumber, 
      multiplierNumber 
    });
    
    if (isNaN(betAmountNumber) || betAmountNumber <= 0) {
      console.error('Cashout API - Invalid bet amount:', betAmountNumber);
      return NextResponse.json(
        { error: 'Invalid bet amount' },
        { status: 400 }
      );
    }
    
    // Allow multipliers >= 0 (for games with low multipliers like 0.5x, 0.8x)
    // Only reject negative multipliers
    if (isNaN(multiplierNumber) || multiplierNumber < 0) {
      console.error('Cashout API - Invalid multiplier:', multiplierNumber);
      return NextResponse.json(
        { error: 'Invalid multiplier' },
        { status: 400 }
      );
    }
    
    // Find user by wallet address
    console.log('Cashout API - Looking for user:', normalizedWalletAddress);
    const user = await User.findOne({ 
      walletAddress: normalizedWalletAddress 
    });
    
    if (!user) {
      console.error('Cashout API - User not found:', normalizedWalletAddress);
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    console.log('Cashout API - User found:', {
      walletAddress: user.walletAddress,
      currentBalance: user.balance,
      totalWinnings: user.totalWinnings
    });
    
    // Calculate winnings (betAmount * multiplier)
    const winnings = betAmountNumber * multiplierNumber;
    const previousBalance = user.balance;
    
    console.log('Cashout API - Calculating winnings:', {
      betAmount: betAmountNumber,
      multiplier: multiplierNumber,
      winnings: winnings,
      previousBalance: previousBalance,
      newBalance: previousBalance + winnings
    });
    
    // Add winnings to balance
    user.balance = previousBalance + winnings;
    user.totalWinnings = (user.totalWinnings || 0) + winnings;
    
    // Save with explicit error handling
    try {
      await user.save();
      console.log('Cashout API - User saved successfully');
    } catch (saveError) {
      console.error('Cashout API - Failed to save user:', saveError);
      return NextResponse.json(
        { error: 'Failed to save winnings to database' },
        { status: 500 }
      );
    }
    
    console.log('Cashout API - ✅ Cashout successful:', {
      previousBalance: previousBalance,
      winnings: winnings,
      newBalance: user.balance,
      totalWinnings: user.totalWinnings
    });
    
    return NextResponse.json({
      success: true,
      newBalance: user.balance,
      winnings: winnings,
      multiplier: multiplierNumber,
      previousBalance: previousBalance,
      message: 'Cashout successful'
    });
    
  } catch (error) {
    console.error('Cashout API - ❌ Error:', error);
    return NextResponse.json(
      { error: 'Failed to cashout: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}
