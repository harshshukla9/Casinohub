import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Game from '@/lib/game';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const { gameId, walletAddress, status, multiplier, revealedSafeTiles } = await request.json();
    
    if (!gameId || !walletAddress || !status) {
      return NextResponse.json(
        { error: 'Missing required fields: gameId, walletAddress, status' },
        { status: 400 }
      );
    }
    
    // Find and update the game
    const game = await Game.findOneAndUpdate(
      {
        _id: gameId,
        walletAddress: walletAddress.toLowerCase(),
      },
      {
        status,
        multiplier,
        revealedSafeTiles,
        endedAt: new Date(),
      },
      { new: true }
    );
    
    if (!game) {
      return NextResponse.json(
        { error: 'Game not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      game,
    });
    
  } catch (error) {
    console.error('Error updating game status:', error);
    return NextResponse.json(
      { error: 'Failed to update game status' },
      { status: 500 }
    );
  }
}

