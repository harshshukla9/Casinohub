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
    let currentGame: any = null;
    let gameId: string = '';

    for (const [gid, game] of activeGames.entries()) {
      if (game.walletAddress === normalizedWalletAddress) {
        currentGame = game;
        gameId = gid;
        break;
      }
    }

    if (!currentGame) {
      return NextResponse.json({ error: 'No active game' }, { status: 400 });
    }

    // Reveal all cells
    const gameDatas = currentGame.grid.map((mine: number, index: number) => ({
      point: index,
      mine: mine === 1 ? 'BOMB' : 'GEM',
      mined: true,
    }));

    // Remove game
    activeGames.delete(gameId);

    return NextResponse.json({
      status: 'END',
      datas: gameDatas,
    });

  } catch (error) {
    console.error('Mine cashout API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

