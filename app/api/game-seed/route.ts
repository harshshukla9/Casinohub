import { NextRequest, NextResponse } from 'next/server';
import { generateRandomSeed, sha256 } from '@/lib/provable-fair';
import { connectDB } from '@/lib/db';
import Game from '@/lib/game';
import { 
  combineSeeds, 
  generateMinePositions, 
  generateGameHash 
} from '@/lib/provable-fair';

// Helper function to hash server seed
async function hashServerSeed(seed: string): Promise<string> {
  return await sha256(seed);
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const { walletAddress, mineCount, mode, betAmount } = await request.json();
    
    if (!walletAddress || !mineCount || !mode || !betAmount) {
      return NextResponse.json(
        { error: 'Missing required fields: walletAddress, mineCount, mode, betAmount' },
        { status: 400 }
      );
    }
    
    // Generate seeds on server (user cannot manipulate)
    const serverSeed = generateRandomSeed();
    const clientSeed = generateRandomSeed(); // Auto-generated, user can't set it
    
    // Create hash of server seed (this is what we reveal before game)
    const serverSeedHash = await hashServerSeed(serverSeed);
    
    // Generate game state
    const combinedSeed = await combineSeeds(serverSeed, clientSeed);
    const minePositions = generateMinePositions(combinedSeed, mineCount, 25);
    
    // Generate game hash
    const gameHash = await generateGameHash({
      minePositions,
      mineCount,
      totalTiles: 25,
      mode,
      betAmount,
      serverSeed,
      clientSeed,
    });
    
    // Store game in database with server seed (stored securely on server)
    // We store the actual seed but only reveal the hash to client
    const game = await Game.create({
      walletAddress: walletAddress.toLowerCase(),
      gameHash,
      serverSeedHash,
      serverSeed, // Store actual seed securely on server
      clientSeed,
      minePositions,
      mineCount,
      mode,
      betAmount,
      status: 'playing',
    });
    
    // Return only the hash of server seed (not actual seed) + client seed + mine positions
    // Mine positions are needed for client-side gameplay but are validated by gameHash
    return NextResponse.json({
      serverSeedHash, // User can verify this matches later
      clientSeed, // User can verify this matches
      gameHash, // User can verify game state
      minePositions, // Needed for gameplay, validated by hash
      gameId: game._id.toString(),
    });
    
  } catch (error) {
    console.error('Error generating game seed:', error);
    return NextResponse.json(
      { error: 'Failed to generate game seed' },
      { status: 500 }
    );
  }
}

