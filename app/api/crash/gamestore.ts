// Crash game store - uses global to persist across hot reloads in development

export interface CrashGame {
  walletAddress: string;
  betAmount: number;
  target: number;
  crashPoint: number;
  currentMultiplier: number;
  gameId: string;
  startedAt: number;
  status: 'waiting' | 'running' | 'crashed' | 'cashed_out';
}

// Use global to persist across module reloads in development
const globalForGames = globalThis as unknown as {
  crashGames: Map<string, CrashGame> | undefined;
};

export const activeGames: Map<string, CrashGame> = globalForGames.crashGames ?? new Map();

if (process.env.NODE_ENV !== 'production') {
  globalForGames.crashGames = activeGames;
}

// Helper functions
export function createGame(gameId: string, game: CrashGame): void {
  activeGames.set(gameId, game);
  console.log('Game stored. Total games:', activeGames.size, 'GameId:', gameId);
}

export function getGameByWallet(walletAddress: string): { gameId: string; game: CrashGame } | null {
  const normalizedWallet = walletAddress.toLowerCase();
  for (const [gameId, game] of activeGames.entries()) {
    if (game.walletAddress === normalizedWallet) {
      return { gameId, game };
    }
  }
  return null;
}

export function getActiveGameByWallet(walletAddress: string): { gameId: string; game: CrashGame } | null {
  const normalizedWallet = walletAddress.toLowerCase();
  for (const [gameId, game] of activeGames.entries()) {
    if (game.walletAddress === normalizedWallet && game.status !== 'crashed' && game.status !== 'cashed_out') {
      return { gameId, game };
    }
  }
  return null;
}

export function deleteGame(gameId: string): boolean {
  const result = activeGames.delete(gameId);
  console.log('Game deleted:', gameId, 'Success:', result, 'Remaining games:', activeGames.size);
  return result;
}

export function listGames(): void {
  console.log('=== ALL ACTIVE GAMES ===');
  console.log('Total games:', activeGames.size);
  for (const [gameId, game] of activeGames.entries()) {
    console.log({
      gameId,
      wallet: game.walletAddress,
      status: game.status,
      startedAt: game.startedAt,
      crashPoint: game.crashPoint
    });
  }
  console.log('========================');
}

