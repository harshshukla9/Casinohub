import { create } from 'zustand';
import {
  generateRandomSeed,
  combineSeeds,
  generateMinePositions,
  generateGameHash,
  reconstructGameState,
} from '../lib/provable-fair';

export type GameMode = 'easy' | 'medium' | 'hard';
export type GameStatus = 'idle' | 'playing' | 'won' | 'lost' | 'cashed_out';
export type TileState = 'hidden' | 'safe' | 'trap';

interface GameConfig {
  rows: number;
  cols: number;
  totalTiles: number;
  mineCount: number;
  baseMultiplier: number;
}

// All modes now use 5x5 grid (25 tiles)
const GAME_CONFIGS: Record<GameMode, Omit<GameConfig, 'mineCount'>> = {
  easy: {
    rows: 5,
    cols: 5,
    totalTiles: 25,
    baseMultiplier: 1.1, // Lower risk, lower reward
  },
  medium: {
    rows: 5,
    cols: 5,
    totalTiles: 25,
    baseMultiplier: 1.15, // Medium risk, medium reward
  },
  hard: {
    rows: 5,
    cols: 5,
    totalTiles: 25,
    baseMultiplier: 1.2, // Higher risk, higher reward
  },
};

interface GameState {
  // Game configuration
  mode: GameMode;
  config: GameConfig;
  mineCount: number; // User-selected mine count (1-24)
  
  // Game state
  grid: TileState[][];
  actualGrid: TileState[][];
  status: GameStatus;
  multiplier: number;
  betAmount: number;
  walletAddress?: string;
  revealedSafeTiles: number;
  totalSafeTiles: number;
  
  // Provable Fair
  serverSeedHash?: string; // Hash of server seed (revealed before game)
  serverSeed?: string; // Actual server seed (only revealed after game ends)
  clientSeed?: string;
  gameHash?: string;
  minePositions?: number[];
  gameId?: string; // Database game ID
  
  // Actions
  setMode: (mode: GameMode) => void;
  setMineCount: (count: number) => void;
  setBetAmount: (amount: number) => void;
  setWalletAddress: (address: string) => void;
  setStatus: (status: GameStatus) => void;
  startGame: () => Promise<void>;
  revealServerSeed: () => Promise<string | null>;
  clickTile: (row: number, col: number) => void;
  cashOut: () => void;
  resetGame: () => void;
  clearVerificationData: () => void;
  updateGameStatus: (gameStatus: 'won' | 'lost' | 'cashed_out', finalMultiplier: number, finalRevealedTiles: number) => Promise<void>;
  handleGameEnd: (isWin: boolean, betAmount: number, multiplier: number) => Promise<void>;
}

const dispatchGameEvent = (eventName: string, detail?: Record<string, unknown>) => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(eventName, { detail }));
  }
};

// Generate a 5x5 grid with specified number of mines using provable fair
const generateGridFromSeeds = async (
  serverSeed: string,
  clientSeed: string,
  mineCount: number
): Promise<{ 
  grid: TileState[][], 
  actualGrid: TileState[][],
  minePositions: number[],
  gameHash: string
}> => {
  const rows = 5;
  const cols = 5;
  const totalTiles = 25;
  
  // Initialize grids
  const grid: TileState[][] = Array(rows).fill(null).map(() => Array(cols).fill('hidden'));
  const actualGrid: TileState[][] = Array(rows).fill(null).map(() => Array(cols).fill('safe'));
  
  // Combine seeds
  const combinedSeed = await combineSeeds(serverSeed, clientSeed);
  
  // Generate mine positions deterministically
  const minePositions = generateMinePositions(combinedSeed, mineCount, totalTiles);
  
  // Set mines in actual grid
  minePositions.forEach(pos => {
    const row = Math.floor(pos / cols);
    const col = pos % cols;
    actualGrid[row][col] = 'trap';
  });
  
  // Generate game hash
  const gameHash = await generateGameHash({
    minePositions,
    mineCount,
    totalTiles,
    mode: 'easy', // Will be set by caller
    betAmount: 0, // Will be set by caller
    serverSeed,
    clientSeed,
  });
  
  return { grid, actualGrid, minePositions, gameHash };
};

// Legacy function for non-provable fair generation (used for previews)
const generateGrid = (mineCount: number): { grid: TileState[][], actualGrid: TileState[][] } => {
  const rows = 5;
  const cols = 5;
  const totalTiles = 25;
  
  // Initialize grids
  const grid: TileState[][] = Array(rows).fill(null).map(() => Array(cols).fill('hidden'));
  const actualGrid: TileState[][] = Array(rows).fill(null).map(() => Array(cols).fill('safe'));
  
  // Randomly place mines (for preview only)
  const minePositions = new Set<number>();
  while (minePositions.size < mineCount) {
    const pos = Math.floor(Math.random() * totalTiles);
    minePositions.add(pos);
  }
  
  // Set mines in actual grid
  minePositions.forEach(pos => {
    const row = Math.floor(pos / cols);
    const col = pos % cols;
    actualGrid[row][col] = 'trap';
  });
  
  return { grid, actualGrid };
};

// Calculate multiplier based on revealed tiles and mine count
// Uses probability-based formula with dynamic house edge
const calculateMultiplier = (revealedSafeTiles: number, mineCount: number): number => {
  if (revealedSafeTiles === 0) return 1;
  
  const TOTAL_TILES = 25;
  const gems = TOTAL_TILES - mineCount;
  
  // Validate inputs
  if (mineCount < 1 || mineCount >= TOTAL_TILES) return 1;
  if (revealedSafeTiles > gems) return 1;
  
  // Dynamic house edge based on mine count
  // Lower mines = lower house edge (easier games have less edge)
  // Higher mines = higher house edge (riskier games have more edge)
  const baseHouseEdge = 0.01; // 1% minimum
  const maxHouseEdge = 0.04; // 4% maximum
  const houseEdge = baseHouseEdge + ((mineCount / TOTAL_TILES) * (maxHouseEdge - baseHouseEdge));
  
  // Calculate cumulative multiplier for all steps
  let totalMultiplier = 1;
  
  for (let step = 1; step <= revealedSafeTiles; step++) {
    const opened = step - 1; // Tiles already opened before this step
    const remainingTiles = TOTAL_TILES - opened;
    const remainingGems = gems - opened;
    
    // Safety check
    if (remainingTiles <= 0 || remainingGems <= 0) break;
    
    // Probability of hitting a safe tile (gem) at this step
    const pSafe = remainingGems / remainingTiles;
    
    // Fair multiplier (no edge)
    const fairStepMult = 1 / pSafe;
    
    // Apply house edge
    const stepMult = fairStepMult * (1 - houseEdge);
    
    // Multiply into total
    totalMultiplier *= stepMult;
  }
  
  // Ensure multiplier is always at least 1.0 (never lose money on successful reveals)
  return Math.max(1.0, totalMultiplier);
};

// Initialize with default values
const initialMode = 'easy';
const initialMineCount = 3; // Default: 3 mines
const initialConfig = {
  ...GAME_CONFIGS[initialMode],
  mineCount: initialMineCount,
};
const { grid: initialGrid, actualGrid: initialActualGrid } = generateGrid(initialMineCount);

export const useGameStore = create<GameState>((set, get) => ({
  mode: initialMode,
  config: initialConfig,
  mineCount: initialMineCount,
  grid: initialGrid,
  actualGrid: initialActualGrid,
  status: 'idle',
  multiplier: 1,
  betAmount: 0,
  walletAddress: undefined,
  revealedSafeTiles: 0,
  totalSafeTiles: 25 - initialMineCount,
  serverSeedHash: undefined,
  serverSeed: undefined,
  clientSeed: undefined,
  gameHash: undefined,
  minePositions: undefined,
  gameId: undefined,

  setMode: (mode: GameMode) => {
    const { mineCount } = get();
    const config = {
      ...GAME_CONFIGS[mode],
      mineCount,
    };
    const { grid, actualGrid } = generateGrid(mineCount);
    set({
      mode,
      config,
      grid,
      actualGrid,
      status: 'idle',
      multiplier: 1,
      revealedSafeTiles: 0,
      totalSafeTiles: 25 - mineCount,
    });
  },

  setMineCount: (count: number) => {
    const { mode, status } = get();
    
    // Can only change mine count when not playing
    if (status === 'playing') return;
    
    // Validate mine count (1-24)
    const validCount = Math.min(Math.max(count, 1), 24);
    
    const config = {
      ...GAME_CONFIGS[mode],
      mineCount: validCount,
    };
    
    const { grid, actualGrid } = generateGrid(validCount);
    
    set({
      mineCount: validCount,
      config,
      grid,
      actualGrid,
      totalSafeTiles: 25 - validCount,
      revealedSafeTiles: 0,
      multiplier: 1,
    });
  },

  setBetAmount: (amount: number) => {
    set({ betAmount: Math.max(0, amount) });
  },

  setWalletAddress: (address: string) => {
    set({ walletAddress: address });
  },

  setStatus: (status: GameStatus) => {
    set({ status });
  },

  startGame: async () => {
    const { betAmount, mineCount, mode, walletAddress } = get();
    if (betAmount <= 0 || !walletAddress) return;
    
    try {
      // Get game seed from server (server generates both seeds)
      const response = await fetch('/api/game-seed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          walletAddress,
          mineCount,
          mode,
          betAmount,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to get game seed');
      }
      
      const data = await response.json();
      const { serverSeedHash, clientSeed, gameHash, minePositions, gameId } = data;
      
      // Mine positions come from server (validated by gameHash)
      // User cannot manipulate them because they're part of the hash
      
      // Create grids
      const rows = 5;
      const cols = 5;
      const grid: TileState[][] = Array(rows).fill(null).map(() => Array(cols).fill('hidden'));
      const actualGrid: TileState[][] = Array(rows).fill(null).map(() => Array(cols).fill('safe'));
      
      minePositions.forEach((pos: number) => {
        const row = Math.floor(pos / cols);
        const col = pos % cols;
        actualGrid[row][col] = 'trap';
      });
      
      set({
        grid,
        actualGrid,
        status: 'playing',
        multiplier: 1,
        revealedSafeTiles: 0,
        serverSeedHash, // Only hash is available before game ends
        clientSeed,
        gameHash,
        minePositions,
        gameId,
      });
      
      // Dispatch event with game hash for UI display
      dispatchGameEvent('game:started', { 
        gameHash,
        serverSeedHash,
        clientSeed,
      });
    } catch (error) {
      console.error('Failed to start game:', error);
      throw error;
    }
  },
  
  revealServerSeed: async () => {
    const { gameId, walletAddress, status } = get();
    
    // Only reveal after game ends
    if (status === 'playing') {
      throw new Error('Cannot reveal server seed while game is active');
    }
    
    if (!gameId || !walletAddress) {
      throw new Error('Game ID or wallet address missing');
    }
    
    try {
      const response = await fetch('/api/game-reveal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameId, walletAddress }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to reveal server seed');
      }
      
      const data = await response.json();
      const serverSeed = data.serverSeed;
      
      set({ serverSeed });
      
      return serverSeed;
    } catch (error) {
      console.error('Failed to reveal server seed:', error);
      return null;
    }
  },

  clickTile: (row: number, col: number) => {
    const { 
      grid, 
      actualGrid, 
      status, 
      config, 
      betAmount, 
      walletAddress, 
      handleGameEnd,
      revealedSafeTiles,
      totalSafeTiles,
    } = get();
    
    if (status !== 'playing') return;
    
    // Check if tile is already revealed
    if (grid[row][col] !== 'hidden') return;
    
    const actualTile = actualGrid[row][col];
    const newGrid = grid.map(r => [...r]);
    newGrid[row][col] = actualTile;
    
    if (actualTile === 'safe') {
      const newRevealedCount = revealedSafeTiles + 1;
      const newMultiplier = calculateMultiplier(newRevealedCount, config.mineCount);
      
      // Check if all safe tiles are revealed
      if (newRevealedCount >= totalSafeTiles) {
        // Player wins! Revealed all diamonds
        set({
          grid: newGrid,
          revealedSafeTiles: newRevealedCount,
          multiplier: newMultiplier,
          status: 'won',
        });
        dispatchGameEvent('game:safeReveal', { row, col });
        dispatchGameEvent('game:win', { multiplier: newMultiplier });
        
        // Handle win in database
        if (walletAddress) {
          handleGameEnd(true, betAmount, newMultiplier);
        }
        
        // Update game status in database
        get().updateGameStatus('won', newMultiplier, newRevealedCount);
      } else {
        // Continue playing
        set({
          grid: newGrid,
          revealedSafeTiles: newRevealedCount,
          multiplier: newMultiplier,
        });
        dispatchGameEvent('game:safeReveal', { row, col });
      }
    } else {
      // Hit a mine - game over - reveal all tiles
      const revealedGrid = actualGrid.map(r => [...r]);
      set({
        grid: revealedGrid,
        status: 'lost',
      });
      dispatchGameEvent('game:trapReveal', { row, col });
      
      // Handle loss in database
      if (walletAddress) {
        handleGameEnd(false, betAmount, 1);
      }
      
      // Update game status in database
      get().updateGameStatus('lost', 1, revealedSafeTiles);
    }
  },

  cashOut: () => {
    const { status, actualGrid, multiplier, revealedSafeTiles } = get();
    if (status === 'playing') {
      // Reveal all tiles when cashing out
      const revealedGrid = actualGrid.map(r => [...r]);
      set({ 
        grid: revealedGrid,
        status: 'cashed_out' 
      });
      dispatchGameEvent('game:cashout', { multiplier });
      
      // Update game status in database
      get().updateGameStatus('cashed_out', multiplier, revealedSafeTiles);
    }
  },
  
  updateGameStatus: async (gameStatus: 'won' | 'lost' | 'cashed_out', finalMultiplier: number, finalRevealedTiles: number) => {
    const { gameId, walletAddress } = get();
    if (!gameId || !walletAddress) return;
    
    try {
      await fetch('/api/game-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameId,
          walletAddress,
          status: gameStatus,
          multiplier: finalMultiplier,
          revealedSafeTiles: finalRevealedTiles,
        }),
      });
    } catch (error) {
      console.error('Failed to update game status:', error);
    }
  },

  resetGame: () => {
    const { mineCount } = get();
    const { grid, actualGrid } = generateGrid(mineCount);
    set({
      grid,
      actualGrid,
      status: 'idle',
      multiplier: 1,
      revealedSafeTiles: 0,
      // Keep gameHash, serverSeed, clientSeed, and minePositions for verification
      // Only clear them when starting a completely new game
    });
    dispatchGameEvent('game:reset');
  },
  
  clearVerificationData: () => {
    set({
      serverSeedHash: undefined,
      serverSeed: undefined,
      clientSeed: undefined,
      gameHash: undefined,
      minePositions: undefined,
      gameId: undefined,
    });
  },

  handleGameEnd: async (isWin: boolean, betAmount: number, multiplier: number) => {
    const { walletAddress } = get();
    if (!walletAddress) return;

    try {
      if (isWin) {
        // Call cashout API to add winnings to balance
        const response = await fetch('/api/cashout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            walletAddress: walletAddress,
            betAmount: betAmount,
            multiplier: multiplier,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to process win');
        }

        const result = await response.json();
        console.log('Win processed successfully:', result);
        
        // Dispatch event to refresh balance displays
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('balanceUpdated'));
        }
      } else {
        // If lost, balance was already deducted when bet was placed
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('balanceUpdated'));
        }
      }
    } catch (error) {
      console.error('Failed to process game end:', error);
    }
  },
}));
