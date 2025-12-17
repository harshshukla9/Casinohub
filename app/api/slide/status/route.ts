import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/lib/user';
import { activeGames } from '../gamestore';

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
        return NextResponse.json({
          success: true,
          gameId: game.gameId,
          numbers: game.numbers,
          currentIndex: game.currentIndex,
          status: game.status,
          betAmount: game.betAmount,
          target: game.target,
        });
      }
    }

    return NextResponse.json({
      success: false,
      message: 'No active game',
    });

  } catch (error) {
    console.error('Slide status API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

