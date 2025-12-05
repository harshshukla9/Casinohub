import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Game from '@/lib/game';
import { sha256, generateRandomSeed } from '@/lib/provable-fair';

// Helper function to hash server seed
async function hashServerSeed(seed: string): Promise<string> {
  return await sha256(seed);
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const { gameId, walletAddress } = await request.json();
    
    if (!gameId || !walletAddress) {
      return NextResponse.json(
        { error: 'Missing required fields: gameId, walletAddress' },
        { status: 400 }
      );
    }
    
    // Find the game
    const game = await Game.findOne({
      _id: gameId,
      walletAddress: walletAddress.toLowerCase(),
      status: { $in: ['won', 'lost', 'cashed_out'] }, // Only reveal after game ends
    });
    
    if (!game) {
      return NextResponse.json(
        { error: 'Game not found or not ended yet' },
        { status: 404 }
      );
    }
    
    // Verify the stored server seed hash matches
    if (!game.serverSeed) {
      return NextResponse.json(
        { error: 'Server seed not found' },
        { status: 404 }
      );
    }
    
    // Verify the hash matches (security check)
    const computedHash = await hashServerSeed(game.serverSeed);
    if (computedHash !== game.serverSeedHash) {
      console.error('Server seed hash mismatch! Security issue detected.');
      return NextResponse.json(
        { error: 'Server seed verification failed' },
        { status: 500 }
      );
    }
    
    // Return the server seed (it was stored securely, now we reveal it)
    return NextResponse.json({
      serverSeed: game.serverSeed,
      message: 'Server seed revealed',
    });
    
  } catch (error) {
    console.error('Error revealing server seed:', error);
    return NextResponse.json(
      { error: 'Failed to reveal server seed' },
      { status: 500 }
    );
  }
}

