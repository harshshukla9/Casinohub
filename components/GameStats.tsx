'use client';

import { motion } from 'framer-motion';
import { useGameStore } from '../store/gameStore';

export const GameStats = () => {
  const { revealedSafeTiles, config, multiplier, betAmount, status, mode, mineCount } = useGameStore();
  
  // Calculate current row based on revealed tiles (assuming tiles are revealed row by row)
  // For a 5x5 grid, each row has config.cols tiles
  const currentRow = Math.floor(revealedSafeTiles / config.cols);
  const safeTilesPerRow = config.cols; // All tiles in a row are safe (mines are distributed across grid)

  const getStatusColor = () => {
    switch (status) {
      case 'idle':
        return 'text-gray-400';
      case 'playing':
        return 'text-blue-400';
      case 'won':
        return 'text-green-400';
      case 'lost':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'idle':
        return 'Ready to Play';
      case 'playing':
        return 'Climbing...';
      case 'won':
        return 'Victory!';
      case 'lost':
        return 'Defeat!';
      default:
        return 'Unknown';
    }
  };

  const currentPayout = betAmount * multiplier;
  const potentialProfit = currentPayout - betAmount;

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 space-y-4 border border-gray-700/50">
      <h3 className="text-lg font-bold text-white text-center">Game Stats</h3>
      
      {/* Status */}
      <div className="text-center">
        <div className={`text-lg font-bold ${getStatusColor()}`}>
          {getStatusText()}
        </div>
      </div>

      {/* Game Progress */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gray-700/50 rounded-lg p-3 text-center">
          <div className="text-xl font-bold text-white">
            {Math.min(currentRow + 1, config.rows)}
          </div>
          <div className="text-xs text-gray-400">Revealed</div>
        </div>
        
        <div className="bg-gray-700/50 rounded-lg p-3 text-center">
          <div className="text-xl font-bold text-white">
            {config.totalTiles}
          </div>
          <div className="text-xs text-gray-400">Total</div>
        </div>
      </div>

      {/* Financial Stats */}
      <div className="bg-gray-700/50 rounded-lg p-4 space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-gray-400 text-sm">Current Multiplier</span>
          <span className="text-white font-semibold">{multiplier.toFixed(4)}x</span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-gray-400 text-sm">Current Payout</span>
          <span className="text-white font-semibold">{currentPayout.toFixed(2)} MCS</span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-gray-400 text-sm">Profit</span>
          <span className={`font-semibold ${potentialProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {potentialProfit >= 0 ? '+' : ''}{potentialProfit.toFixed(2)} MCS
          </span>
        </div>
      </div>

      {/* Difficulty Info - Simplified */}
      <div className="bg-gray-700/50 rounded-lg p-4">
        <div className="text-center">
          <div className="text-sm font-semibold text-white capitalize">{mode} Mode</div>
          <div className="text-xs text-gray-400 mt-1">
            {config.cols} columns • {config.totalTiles - mineCount} safe tiles total
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs">
          <span className="text-gray-400">Progress</span>
          <span className="text-white">
            {Math.round(((currentRow) / config.rows) * 100)}%
          </span>
        </div>
        <div className="w-full bg-gray-700/50 rounded-full h-2">
          <motion.div
            className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${((currentRow) / config.rows) * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      {/* Max Potential */}
      {status === 'playing' && (
        <motion.div
          className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 rounded-lg p-3 border border-purple-500/50"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="text-center">
            <div className="text-sm font-bold text-white mb-1">Max Potential</div>
            <div className="text-lg font-bold text-purple-300">
              {(betAmount * Math.pow(config.baseMultiplier, config.totalTiles)).toFixed(2)} MCS
            </div>
            <div className="text-xs text-purple-200">
              {Math.pow(config.baseMultiplier, config.totalTiles).toFixed(2)}x
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};
