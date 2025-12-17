// In-memory storage for active slide games
export const activeGames = new Map<string, {
  walletAddress: string;
  betAmount: number;
  target: number;
  numbers: number[]; // Array of multipliers
  chosenMultiplier: number; // The randomly chosen multiplier
  chosenIndex: number; // Index of the chosen card
  currentIndex: number; // Current position in the slide
  gameId: string;
  createdAt: Date;
  status: 'waiting' | 'betting' | 'playing' | 'ended';
}>();

