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
    for (const [gameId, game] of activeGames.entries()) {
      if (game.walletAddress === normalizedWalletAddress) {
        let currentMultiplier = 1.00;
        
        if (game.status === 'waiting') {
          // Game hasn't started yet
          currentMultiplier = 1.00;
        } else if (game.status === 'running') {
          // Calculate current multiplier based on elapsed time
          if (game.startedAt === 0) {
            // Game just started
            game.startedAt = Date.now();
            currentMultiplier = 1.00;
          } else {
            const elapsed = (Date.now() - game.startedAt) / 1000; // seconds
            currentMultiplier = Math.min(1.00 + (elapsed * 0.1), game.crashPoint);
            
            // Check if crashed
            if (currentMultiplier >= game.crashPoint) {
              game.status = 'crashed';
              currentMultiplier = game.crashPoint;
            }
          }
        } else if (game.status === 'crashed') {
          currentMultiplier = game.crashPoint;
        } else if (game.status === 'cashed_out') {
          currentMultiplier = game.currentMultiplier;
        }

        // Update game state
        game.currentMultiplier = currentMultiplier;

        return NextResponse.json({
          success: true,
          gameId: game.gameId,
          currentMultiplier: Math.round(currentMultiplier * 100) / 100,
          crashPoint: game.crashPoint,
          status: game.status,
          betAmount: game.betAmount,
          target: game.target / 100,
        });
      }
    }

    return NextResponse.json({
      success: false,
      message: 'No active game',
    });

  } catch (error) {
    console.error('Crash status API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

