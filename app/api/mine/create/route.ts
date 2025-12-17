import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/lib/user';
import { activeGames } from '../gamestore';

function generateMineGrid(mines: number): (0 | 1)[] {
  const totalCells = 25;
  const grid = new Array(totalCells).fill(0);

  // Place mines randomly
  let minesPlaced = 0;
  while (minesPlaced < mines) {
    const pos = Math.floor(Math.random() * totalCells);
    if (grid[pos] === 0) {
      grid[pos] = 1; // mine
      minesPlaced++;
    }
  }

  return grid;
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const { mines, amount, walletAddress } = await request.json();

    if (!mines || !amount) {
      return NextResponse.json({ error: 'Mines and amount required' }, { status: 400 });
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

    // Create new game
    const grid = generateMineGrid(mines);
    const gameId = `${normalizedWalletAddress}_${Date.now()}`;

    const gameData = {
      walletAddress: normalizedWalletAddress,
      mines,
      amount,
      grid,
      revealed: new Array(25).fill(false),
      gameId,
      createdAt: new Date(),
    };

    activeGames.set(gameId, gameData);

    console.log('Mine game created:', { gameId, mines, amount });

    return NextResponse.json({
      status: 'BET',
      gameId,
    });

  } catch (error) {
    console.error('Mine create API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

