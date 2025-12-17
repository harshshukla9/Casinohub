// Shared game store for all mine API routes
export const activeGames = new Map<string, {
  walletAddress: string;
  mines: number;
  amount: number;
  grid: (0 | 1)[]; // 0 = safe, 1 = mine
  revealed: boolean[];
  gameId: string;
  createdAt: Date;
}>();

