import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/lib/user';
import { activeGames } from '../gamestore';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const { walletAddress, currentIndex } = await request.json();

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
      if (game.walletAddress === normalizedWalletAddress && game.status !== 'ended') {
        currentGame = game;
        gameId = gid;
        break;
      }
    }

    if (!currentGame) {
      return NextResponse.json({ error: 'No active game to cashout' }, { status: 400 });
    }

    // Get multiplier at current index
    const index = currentIndex !== undefined ? currentIndex : currentGame.currentIndex;
    const multiplier = currentGame.numbers[index] || currentGame.numbers[currentGame.numbers.length - 1];

    // Mark as ended
    currentGame.status = 'ended';
    currentGame.currentIndex = index;

    // Remove game
    activeGames.delete(gameId);

    return NextResponse.json({
      success: true,
      multiplier: Math.round(multiplier * 100) / 100,
      winnings: currentGame.betAmount * multiplier,
      status: 'ended',
    });

  } catch (error) {
    console.error('Slide cashout API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

