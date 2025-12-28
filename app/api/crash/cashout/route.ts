import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/lib/user';
import { activeGames, getActiveGameByWallet, deleteGame, listGames } from '../gamestore';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const { walletAddress, multiplier: clientMultiplier } = await request.json();

    console.log('=== CASHOUT API CALLED ===', { walletAddress, clientMultiplier });

    if (!walletAddress) {
      return NextResponse.json({ error: 'Wallet address required' }, { status: 400 });
    }

    const normalizedWalletAddress = walletAddress.toLowerCase();

    // Find user
    const user = await User.findOne({ walletAddress: normalizedWalletAddress });
    if (!user) {
      console.log('User not found:', normalizedWalletAddress);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Debug: List all games
    listGames();

    // Find active game using helper
    const foundGame = getActiveGameByWallet(normalizedWalletAddress);

    if (!foundGame) {
      console.log('No active game found for wallet:', normalizedWalletAddress);
      return NextResponse.json({ error: 'No active game to cashout' }, { status: 400 });
    }

    const { gameId, game: currentGame } = foundGame;
    console.log('Found game:', { gameId, status: currentGame.status, startedAt: currentGame.startedAt });

    // Calculate current multiplier based on elapsed time
    let currentMultiplier = 1.00;
    
    if (currentGame.status === 'running' && currentGame.startedAt > 0) {
      const elapsed = (Date.now() - currentGame.startedAt) / 1000;
      currentMultiplier = Math.min(1.00 + (elapsed * 0.1), currentGame.crashPoint);
    } else if (currentGame.status === 'waiting') {
      // If game is waiting, use client multiplier if provided, otherwise use 1.0
      // This handles the case where the frontend started the game but didn't update server status
      if (clientMultiplier && clientMultiplier > 1) {
        currentMultiplier = Math.min(clientMultiplier, currentGame.crashPoint);
        console.log('Using client multiplier:', clientMultiplier);
      } else {
        // Start the game now and use minimum multiplier
        currentGame.startedAt = Date.now();
        currentGame.status = 'running';
        currentMultiplier = 1.01; // Give them at least 1.01x
        console.log('Game was waiting, starting now with 1.01x');
      }
    }

    // Ensure multiplier doesn't exceed crash point
    if (currentMultiplier > currentGame.crashPoint) {
      currentMultiplier = currentGame.crashPoint;
    }

    console.log('Final multiplier:', currentMultiplier, 'Crash point:', currentGame.crashPoint);

    // Mark as cashed out
    currentGame.status = 'cashed_out';
    currentGame.currentMultiplier = currentMultiplier;

    // Remove game using helper
    deleteGame(gameId);

    const winnings = currentGame.betAmount * currentMultiplier;
    console.log('Cashout successful:', { multiplier: currentMultiplier, winnings, betAmount: currentGame.betAmount });

    return NextResponse.json({
      success: true,
      multiplier: Math.round(currentMultiplier * 100) / 100,
      winnings: winnings,
      status: 'cashed_out',
    });

  } catch (error) {
    console.error('Crash cashout API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

