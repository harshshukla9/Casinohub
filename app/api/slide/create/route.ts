import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/lib/user';
import { activeGames } from '../gamestore';

// Generate random multipliers for the slide game
function generateSlideNumbers(): number[] {
  const numbers: number[] = [];
  const count = 50; // Number of tiles in the slide
  
  for (let i = 0; i < count; i++) {
    // Generate multipliers between 1.0x and 100x
    // Higher probability of lower multipliers
    const rand = Math.random();
    let multiplier: number;
    
    if (rand < 0.4) {
      // 40% chance: 1.0x - 2.0x
      multiplier = 1.0 + Math.random();
    } else if (rand < 0.7) {
      // 30% chance: 2.0x - 5.0x
      multiplier = 2.0 + Math.random() * 3;
    } else if (rand < 0.9) {
      // 20% chance: 5.0x - 20.0x
      multiplier = 5.0 + Math.random() * 15;
    } else {
      // 10% chance: 20.0x - 100.0x
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
    
    // Target is optional (0 or undefined means no target)
    const targetValue = target || 0;

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

