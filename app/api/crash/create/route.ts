import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/lib/user';
import { activeGames, createGame, listGames, CrashGame } from '../gamestore';

// Generate random crash point between 1.00x and 100x
function generateCrashPoint(): number {
  // Higher probability of crashing at lower multipliers
  const rand = Math.random();
  let crashPoint: number;
  
  if (rand < 0.3) {
    // 30% chance: crash between 1.00x - 2.00x
    crashPoint = 1.00 + Math.random();
  } else if (rand < 0.6) {
    // 30% chance: crash between 2.00x - 5.00x
    crashPoint = 2.00 + Math.random() * 3;
  } else if (rand < 0.85) {
    // 25% chance: crash between 5.00x - 20.00x
    crashPoint = 5.00 + Math.random() * 15;
  } else {
    // 15% chance: crash between 20.00x - 100.00x
    crashPoint = 20.00 + Math.random() * 80;
  }
  
  return Math.round(crashPoint * 100) / 100; // Round to 2 decimals
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const { walletAddress, betAmount, target } = await request.json();

    if (!walletAddress || !betAmount) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    // Target is optional (0 or undefined means no target)
    const targetValue = target || 0;

    const normalizedWalletAddress = walletAddress.toLowerCase();

    // Find user
    const user = await User.findOne({ walletAddress: normalizedWalletAddress });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Generate crash point
    const crashPoint = generateCrashPoint();
    const gameId = `${normalizedWalletAddress}_${Date.now()}`;

    const gameData: CrashGame = {
      walletAddress: normalizedWalletAddress,
      betAmount,
      target: targetValue * 100, // Convert to percentage (e.g., 5x = 500), 0 means no target
      crashPoint,
      currentMultiplier: 1.00,
      gameId,
      startedAt: 0, // Will be set when game starts
      status: 'waiting',
    };

    createGame(gameId, gameData);
    listGames(); // Debug: show all games

    console.log('Crash game created:', { gameId, betAmount, target, crashPoint });

    return NextResponse.json({
      success: true,
      gameId,
      crashPoint, // For testing - in production, don't send this
      status: 'waiting',
    });

  } catch (error) {
    console.error('Crash create API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

