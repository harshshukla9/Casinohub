import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/lib/user';
import { activeGames } from '../gamestore';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const { points, walletAddress } = await request.json();

    if (!points || !Array.isArray(points)) {
      return NextResponse.json({ error: 'Points array required' }, { status: 400 });
    }

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

    // Reveal all specified points
    let gameEnded = false;

    for (const point of points) {
      if (!currentGame.revealed[point]) {
        currentGame.revealed[point] = true;
        if (currentGame.grid[point] === 1) {
          gameEnded = true;
          break;
        }
      }
    }

    let gameStatus = 'BET';
    let gameDatas = [];

    if (gameEnded) {
      gameStatus = 'END';
      gameDatas = currentGame.grid.map((mine, index) => ({
        point: index,
        mine: mine === 1 ? 'BOMB' : 'GEM',
        mined: true,
      }));
      activeGames.delete(gameId);
    } else {
      gameDatas = currentGame.grid.map((mine, index) => ({
        point: index,
        mine: currentGame.revealed[index] ? (mine === 1 ? 'BOMB' : 'GEM') : null,
        mined: currentGame.revealed[index],
      }));

      // Check if all safe cells are revealed
      const totalSafeCells = 25 - currentGame.mines;
      const revealedSafeCells = currentGame.revealed.filter((revealed, index) =>
        revealed && currentGame.grid[index] === 0
      ).length;

      if (revealedSafeCells === totalSafeCells) {
        gameStatus = 'END';
        gameDatas = currentGame.grid.map((mine, index) => ({
          point: index,
          mine: mine === 1 ? 'BOMB' : 'GEM',
          mined: true,
        }));
        activeGames.delete(gameId);
      }
    }

    return NextResponse.json({
      status: gameStatus,
      datas: gameDatas,
    });

  } catch (error) {
    console.error('Mine autobet API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

