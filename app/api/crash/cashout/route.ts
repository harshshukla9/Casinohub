import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/lib/user';
import { activeGames } from '../create/route';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const { walletAddress } = await request.json();

    if (!walletAddress) {
      return NextResponse.json({ error: 'Wallet address required' }, { status: 400 });
    }

    const normalizedWalletAddress = walletAddress.toLowerCase();

    // Find user
    const user = await User.findOne({ walletAddress: normalizedWalletAddress });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Find active game
    let currentGame: any = null;
    let gameId: string = '';

    for (const [gid, game] of activeGames.entries()) {
      if (game.walletAddress === normalizedWalletAddress) {
        // Allow cashout if game is running or waiting (game might have started on frontend)
        if (game.status === 'running' || game.status === 'waiting') {
          currentGame = game;
          gameId = gid;
          break;
        }
      }
    }

    if (!currentGame) {
      return NextResponse.json({ error: 'No active game to cashout' }, { status: 400 });
    }

    // If game is waiting but has startedAt set, update status to running
    if (currentGame.status === 'waiting' && currentGame.startedAt > 0) {
      currentGame.status = 'running';
    }

    // Calculate current multiplier based on elapsed time
    let currentMultiplier = 1.00;
    if (currentGame.status === 'running') {
      if (currentGame.startedAt > 0) {
        const elapsed = (Date.now() - currentGame.startedAt) / 1000;
        currentMultiplier = Math.min(1.00 + (elapsed * 0.1), currentGame.crashPoint);
      } else {
        // Game just started but startedAt not set, set it now
        currentGame.startedAt = Date.now();
        currentGame.status = 'running';
        currentMultiplier = 1.00;
      }
    } else if (currentGame.status === 'waiting') {
      // Game hasn't started yet, can't cashout
      return NextResponse.json({ error: 'Game has not started yet' }, { status: 400 });
    }

    // Mark as cashed out
    currentGame.status = 'cashed_out';
    currentGame.currentMultiplier = currentMultiplier;

    // Remove game
    activeGames.delete(gameId);

    return NextResponse.json({
      success: true,
      multiplier: Math.round(currentMultiplier * 100) / 100,
      winnings: currentGame.betAmount * currentMultiplier,
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

