import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/lib/user';
import { activeGames } from '../gamestore';

// Generate random multipliers for the slide game
// Including low multipliers (0.0, 0.1, 0.3, 0.5, 0.8) for more excitement!
function generateSlideNumbers(): number[] {
  const numbers: number[] = [];
  const count = 50; // Number of tiles in the slide
  
  for (let i = 0; i < count; i++) {
    const rand = Math.random();
    let multiplier: number;
    
    // Add low/zero multipliers for more risk and fun!
    if (rand < 0.05) {
      // 5% chance: 0.0x (total loss!)
      multiplier = 0.0;
    } else if (rand < 0.10) {
      // 5% chance: 0.1x - 0.3x
      multiplier = 0.1 + Math.random() * 0.2;
    } else if (rand < 0.18) {
      // 8% chance: 0.3x - 0.5x
      multiplier = 0.3 + Math.random() * 0.2;
    } else if (rand < 0.28) {
      // 10% chance: 0.5x - 0.8x
      multiplier = 0.5 + Math.random() * 0.3;
    } else if (rand < 0.40) {
      // 12% chance: 0.8x - 1.0x
      multiplier = 0.8 + Math.random() * 0.2;
    } else if (rand < 0.60) {
      // 20% chance: 1.0x - 2.0x
      multiplier = 1.0 + Math.random();
    } else if (rand < 0.80) {
      // 20% chance: 2.0x - 5.0x
      multiplier = 2.0 + Math.random() * 3;
    } else if (rand < 0.92) {
      // 12% chance: 5.0x - 20.0x
      multiplier = 5.0 + Math.random() * 15;
    } else {
      // 8% chance: 20.0x - 100.0x
      multiplier = 20.0 + Math.random() * 80;
    }
    
    numbers.push(Math.round(multiplier * 100) / 100);
  }
  
  return numbers;
}

// Choose a random card/multiplier from the slide
function chooseRandomCard(numbers: number[]): number {
  const randomIndex = Math.floor(Math.random() * numbers.length);
  return numbers[randomIndex];
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const { walletAddress, betAmount, target } = await request.json();

    if (!walletAddress || !betAmount) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    // Target is MANDATORY - must be greater than 0
    if (!target || target <= 0) {
      return NextResponse.json({ error: 'Target multiplier is required! Please select a target (e.g., 2x, 3x, 5x)' }, { status: 400 });
    }
    
    const targetValue = target;

    const normalizedWalletAddress = walletAddress.toLowerCase();

    // Find user
    const user = await User.findOne({ walletAddress: normalizedWalletAddress });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Generate slide numbers
    const numbers = generateSlideNumbers();
    
    // Choose a random card/multiplier from the slide
    const chosenMultiplier = chooseRandomCard(numbers);
    const chosenIndex = numbers.indexOf(chosenMultiplier);
    
    const gameId = `${normalizedWalletAddress}_${Date.now()}`;

    const gameData = {
      walletAddress: normalizedWalletAddress,
      betAmount,
      target: targetValue,
      numbers,
      chosenMultiplier, // The randomly chosen multiplier
      chosenIndex, // Index of the chosen card
      currentIndex: 0,
      gameId,
      createdAt: new Date(),
      status: 'waiting' as const,
    };

    activeGames.set(gameId, gameData);

    console.log('Slide game created:', { 
      gameId, 
      betAmount, 
      target: targetValue, 
      chosenMultiplier,
      chosenIndex,
      numbersCount: numbers.length 
    });

    return NextResponse.json({
      success: true,
      gameId,
      numbers,
      chosenMultiplier, // Return the chosen multiplier
      chosenIndex, // Return the chosen index
      status: 'waiting',
    });

  } catch (error) {
    console.error('Slide create API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

