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

    // Check for active game
    for (const [gameId, game] of activeGames.entries()) {
      if (game.walletAddress === normalizedWalletAddress) {
        return NextResponse.json({
          datas: game.grid.map((mine, index) => ({
            point: index,
            mine: game.revealed[index] ? (mine === 1 ? 'BOMB' : 'GEM') : null,
            mined: game.revealed[index],
          })),
          amount: game.amount,
          mines: game.mines,
        });
      }
    }

    return NextResponse.json({
      message: 'No active game',
    });

  } catch (error) {
    console.error('Mine status API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

