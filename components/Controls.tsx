"use client";

import { motion } from "framer-motion";
import { toast } from "sonner";
import { useGameStore, type GameMode } from "../store/gameStore";
import { useAccount } from "wagmi";
import { useState, useEffect, useCallback } from "react";
import { Input } from "./ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Tabs,
  TabsContent,
  TabsContents,
  TabsList,
  TabsTrigger,
} from "./animate-ui/components/animate/tabs";
import Image from "next/image";

interface ControlsProps {
  onBetPlaced?: () => void;
}

interface UserBalanceData {
  balance: number;
  totalDeposited: number;
  totalWithdrawn: number;
}

// Maximum bet limits for each mine configuration (based on Karma Climber Mines table)
const MAX_BET_LIMITS: Record<number, number> = {
  1: 5000,    // 1 mine, 24 diamonds
  2: 3599,    // 2 mines, 23 diamonds
  3: 588,     // 3 mines, 22 diamonds
  4: 108,     // 4 mines, 21 diamonds
  5: 26,      // 5 mines, 20 diamonds
  6: 7.85,    // 6 mines, 19 diamonds
  7: 2.91,    // 7 mines, 18 diamonds
  8: 1.29,    // 8 mines, 17 diamonds
  9: 0.69,    // 9 mines, 16 diamonds
  10: 0.43,   // 10 mines, 15 diamonds
  11: 0.31,   // 11 mines, 14 diamonds
  12: 0.26,   // 12 mines, 13 diamonds
  13: 0.26,   // 13 mines, 12 diamonds
  14: 0.31,   // 14 mines, 11 diamonds
  15: 0.43,   // 15 mines, 10 diamonds
  16: 0.69,   // 16 mines, 9 diamonds
  17: 1.29,   // 17 mines, 8 diamonds
  18: 2.91,   // 18 mines, 7 diamonds
  19: 7.85,   // 19 mines, 6 diamonds
  20: 26,     // 20 mines, 5 diamonds
  21: 108,    // 21 mines, 4 diamonds
  22: 588,    // 22 mines, 3 diamonds
  23: 3599,   // 23 mines, 2 diamonds
  24: 5000,   // 24 mines, 1 diamond
};

// Helper function to get max bet for a given mine count
const getMaxBetForMineCount = (mineCount: number): number => {
  return MAX_BET_LIMITS[mineCount] || Infinity;
};

export const Controls = ({ onBetPlaced }: ControlsProps) => {
  const { address } = useAccount();
  const [userBalance, setUserBalance] = useState<UserBalanceData | null>(null);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [betInputValue, setBetInputValue] = useState<string>("");
  const [autoBetCount, setAutoBetCount] = useState<string>("5");

  // Auto-bet state
  const [isAutoBetting, setIsAutoBetting] = useState(false);
  const [autoBetRemaining, setAutoBetRemaining] = useState(0);
  const [autoBetError, setAutoBetError] = useState("");
  const numericBetValue =
    betInputValue === "" ? 0 : parseFloat(betInputValue) || 0;

  const {
    mode,
    betAmount,
    status,
    multiplier,
    mineCount,
    gameHash,
    serverSeedHash,
    serverSeed,
    clientSeed,
    gameId,
    grid,
    setMode,
    setMineCount,
    setBetAmount,
    setWalletAddress,
    startGame,
    cashOut,
    resetGame,
    clearVerificationData,
    revealServerSeed,
    clickTile,
  } = useGameStore();

  const isPlaying = status === "playing";
  const hasInsufficientBalance =
    userBalance && numericBetValue > userBalance.balance;
  const isBelowMinimum = numericBetValue > 0 && numericBetValue < 0.01;
  
  // Get max bet limit for current mine configuration
  const maxBetLimit = getMaxBetForMineCount(mineCount);
  const exceedsMaxBetLimit = numericBetValue > maxBetLimit;
  
  const canStart =
    (status === "idle" ||
      status === "won" ||
      status === "lost" ||
      status === "cashed_out") &&
    numericBetValue >= 0.01 &&
    !hasInsufficientBalance &&
    !exceedsMaxBetLimit;
  const canCashOut = isPlaying;
  const canReset =
    status === "won" || status === "lost" || status === "cashed_out";

  const fetchUserBalance = useCallback(async () => {
    if (!address) return;

    setIsLoadingBalance(true);
    try {
      const response = await fetch(
        `/api/user-balance?walletAddress=${address}`
      );
      if (response.ok) {
        const data = await response.json();
        setUserBalance(data.user);
        console.log("Controls - Balance fetched:", data.user);
      }
    } catch (error) {
      console.error("Failed to fetch user balance:", error);
    } finally {
      setIsLoadingBalance(false);
    }
  }, [address]);

  useEffect(() => {
    fetchUserBalance();
    if (address) {
      setWalletAddress(address);
    }
  }, [address, fetchUserBalance, setWalletAddress]);

  // Don't auto-set bet amount - keep it blank on initial load
  // (removed auto-fill logic)

  useEffect(() => {
    if (
      (status === "won" || status === "lost" || status === "cashed_out") &&
      betAmount > 0
    ) {
      const rounded = Math.round(betAmount * 100) / 100;
      setBetInputValue(rounded.toFixed(2));
    }
  }, [status, betAmount]);

  // Auto-cap bet amount when mine count changes
  useEffect(() => {
    if (isPlaying || !betInputValue) return; // Don't modify bet while playing or if empty
    
    const maxBetLimit = getMaxBetForMineCount(mineCount);
    const currentBet = parseFloat(betInputValue) || 0;
    
    if (currentBet > maxBetLimit) {
      setBetInputValue(maxBetLimit.toFixed(2));
      const diamonds = 25 - mineCount;
      toast.info(
        `Maximum bet for ${mineCount} ${mineCount === 1 ? 'mine' : 'mines'} (${diamonds} ${diamonds === 1 ? 'diamond' : 'diamonds'}) is ${maxBetLimit.toLocaleString()} MCS`,
        { duration: 3000 }
      );
    }
  }, [mineCount, isPlaying, betInputValue]);

  useEffect(() => {
    if (!address) return;

    const handleDepositCompleted = () => {
      console.log("Controls - Deposit completed event received");
      fetchUserBalance();
    };

    const handleBetPlaced = () => {
      console.log("Controls - Bet placed event received");
      fetchUserBalance();
    };

    const handleBalanceUpdated = () => {
      console.log("Controls - Balance updated event received");
      fetchUserBalance();
    };

    window.addEventListener("depositCompleted", handleDepositCompleted);
    window.addEventListener("betPlaced", handleBetPlaced);
    window.addEventListener("balanceUpdated", handleBalanceUpdated);
    return () => {
      window.removeEventListener("depositCompleted", handleDepositCompleted);
      window.removeEventListener("betPlaced", handleBetPlaced);
      window.removeEventListener("balanceUpdated", handleBalanceUpdated);
    };
  }, [address, fetchUserBalance]);

  const handleBetAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;

    if (inputValue === "") {
      setBetInputValue("");
      return;
    }

    const sanitized = inputValue.replace(/[^0-9.]/g, "");
    const [intPart, decimalPart = ""] = sanitized.split(".");

    if (decimalPart.length > 2) {
      setBetInputValue(`${intPart}.${decimalPart.slice(0, 2)}`);
      return;
    }

    // Apply bet limit based on mine configuration
    const maxBetLimit = getMaxBetForMineCount(mineCount);
    const numValue = parseFloat(sanitized) || 0;
    
    if (numValue > maxBetLimit) {
      setBetInputValue(maxBetLimit.toFixed(2));
      const diamonds = 25 - mineCount;
      toast.info(
        `Maximum bet for ${mineCount} ${mineCount === 1 ? 'mine' : 'mines'} (${diamonds} ${diamonds === 1 ? 'diamond' : 'diamonds'}) is ${maxBetLimit.toLocaleString()} MCS`,
        { duration: 3000 }
      );
      return;
    }

    setBetInputValue(sanitized);
  };

  const handleModeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setMode(e.target.value as GameMode);
  };

  const handleBetHalf = () => {
    const newValue = numericBetValue / 2;
    const rounded = Math.round(newValue * 100) / 100;
    setBetInputValue(Math.max(0.01, rounded).toFixed(2));
  };

  const handleBetDouble = () => {
    const maxBetLimit = getMaxBetForMineCount(mineCount);
    const newValue = numericBetValue * 2;
    const rounded = Math.round(newValue * 100) / 100;
    
    // Cap at max bet for current configuration
    if (rounded > maxBetLimit) {
      setBetInputValue(maxBetLimit.toFixed(2));
      const diamonds = 25 - mineCount;
      toast.info(
        `Maximum bet for ${mineCount} ${mineCount === 1 ? 'mine' : 'mines'} (${diamonds} ${diamonds === 1 ? 'diamond' : 'diamonds'}) is ${maxBetLimit.toLocaleString()} MCS`,
        { duration: 3000 }
      );
      return;
    }
    
    setBetInputValue(rounded.toFixed(2));
  };

  const handleStartGame = async () => {
    if (canStart) {
      try {
        // Validate bet limit for current configuration
        const maxBetLimit = getMaxBetForMineCount(mineCount);
        
        if (numericBetValue > maxBetLimit) {
          const diamonds = 25 - mineCount;
          toast.error(`Maximum bet for ${mineCount} ${mineCount === 1 ? 'mine' : 'mines'} (${diamonds} ${diamonds === 1 ? 'diamond' : 'diamonds'}) is ${maxBetLimit.toLocaleString()} MCS`);
          return;
        }
        
        // Clear previous game's verification data before starting new game
        clearVerificationData();
        resetGame();
        const wagerAmount = Math.round(numericBetValue * 100) / 100;
        setBetAmount(wagerAmount);

        const response = await fetch("/api/bet", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            walletAddress: address,
            betAmount: wagerAmount,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to place bet");
        }

        const result = await response.json();
        console.log("Bet placed successfully:", result);

        if (userBalance) {
          setUserBalance({
            ...userBalance,
            balance: result.newBalance,
          });
        }

        await startGame();
        setBetInputValue("");
        if (onBetPlaced) {
          onBetPlaced();
        }
        window.dispatchEvent(new CustomEvent("betPlaced"));
        window.dispatchEvent(new CustomEvent("balanceUpdated"));
      } catch (error) {
        console.error("Failed to place bet:", error);
        alert(
          `Failed to place bet: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
    } else if (canReset) {
      resetGame();
    }
  };

  const handleCashOut = async () => {
    if (!canCashOut || !address) return;

    try {
      const response = await fetch("/api/cashout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          walletAddress: address,
          betAmount: betAmount,
          multiplier: multiplier,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to cashout");
      }

      const result = await response.json();
      console.log("Cashout successful:", result);

      if (userBalance) {
        setUserBalance({
          ...userBalance,
          balance: result.newBalance,
        });
      }

      window.dispatchEvent(new CustomEvent("balanceUpdated"));
      cashOut();
    } catch (error) {
      console.error("Failed to cashout:", error);
      alert(
        `Failed to cashout: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  // Random tile picker for auto-bet
  const pickRandomTile = useCallback(() => {
    if (status !== "playing") return;

    // Find all hidden tiles
    const hiddenTiles: { row: number; col: number }[] = [];
    grid.forEach((row, rowIndex) => {
      row.forEach((tile, colIndex) => {
        if (tile === "hidden") {
          hiddenTiles.push({ row: rowIndex, col: colIndex });
        }
      });
    });

    if (hiddenTiles.length === 0) return;

    // Pick a random hidden tile
    const randomIndex = Math.floor(Math.random() * hiddenTiles.length);
    const { row, col } = hiddenTiles[randomIndex];

    clickTile(row, col);
  }, [status, grid, clickTile]);

  // Auto-bet logic - Start new game when needed
  useEffect(() => {
    if (!isAutoBetting) return;
    if (
      status !== "idle" &&
      status !== "won" &&
      status !== "lost" &&
      status !== "cashed_out"
    )
      return;
    if (autoBetRemaining <= 0) {
      setIsAutoBetting(false);
      fetchUserBalance();
      return;
    }

    const startNextGame = async () => {
      try {
        // Validate bet limit for current configuration
        const maxBetLimit = getMaxBetForMineCount(mineCount);
        
        if (numericBetValue > maxBetLimit) {
          const diamonds = 25 - mineCount;
          setAutoBetError(`Maximum bet for ${mineCount} ${mineCount === 1 ? 'mine' : 'mines'} (${diamonds} ${diamonds === 1 ? 'diamond' : 'diamonds'}) is ${maxBetLimit.toLocaleString()} MCS`);
          setIsAutoBetting(false);
          setAutoBetRemaining(0);
          setTimeout(() => setAutoBetError(""), 5000);
          return;
        }
        
        clearVerificationData();
        resetGame();
        const wagerAmount = Math.round(numericBetValue * 100) / 100;
        setBetAmount(wagerAmount);

        const response = await fetch("/api/bet", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            walletAddress: address,
            betAmount: wagerAmount,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to place bet");
        }

        const result = await response.json();

        setUserBalance((prev) =>
          prev
            ? {
                ...prev,
                balance: result.newBalance,
              }
            : null
        );

        await startGame();
        setAutoBetRemaining((prev) => prev - 1);
      } catch (error) {
        console.error("Auto-bet failed:", error);
        setIsAutoBetting(false);
        setAutoBetRemaining(0);
        setAutoBetError(
          error instanceof Error ? error.message : "Auto-bet failed"
        );
        setTimeout(() => setAutoBetError(""), 5000);
      }
    };

    const timer = setTimeout(startNextGame, 500);
    return () => clearTimeout(timer);
  }, [isAutoBetting, status, autoBetRemaining, numericBetValue, address]);

  // Auto-bet logic - Pick random tiles during gameplay
  useEffect(() => {
    if (!isAutoBetting || status !== "playing") return;

    const revealInterval = setInterval(() => {
      pickRandomTile();
    }, 800); // Pick a tile every 800ms

    return () => clearInterval(revealInterval);
  }, [isAutoBetting, status, pickRandomTile]);

  // Handle auto-bet start
  const handleStartAutoBet = () => {
    const count = parseInt(autoBetCount) || 0;
    const totalRequired = numericBetValue * count;

    if (!address) {
      setAutoBetError("Please connect your wallet first");
      setTimeout(() => setAutoBetError(""), 3000);
      return;
    }

    if (count <= 0) {
      setAutoBetError("Please enter a valid number of bets");
      setTimeout(() => setAutoBetError(""), 3000);
      return;
    }

    if (numericBetValue < 0.01) {
      setAutoBetError("Minimum bet amount is 0.01 MCS");
      setTimeout(() => setAutoBetError(""), 3000);
      return;
    }

    // Check bet limit for current configuration
    const maxBetLimit = getMaxBetForMineCount(mineCount);
    
    if (numericBetValue > maxBetLimit) {
      const diamonds = 25 - mineCount;
      setAutoBetError(
        `Maximum bet for ${mineCount} ${mineCount === 1 ? 'mine' : 'mines'} (${diamonds} ${diamonds === 1 ? 'diamond' : 'diamonds'}) is ${maxBetLimit.toLocaleString()} MCS`
      );
      setTimeout(() => setAutoBetError(""), 5000);
      return;
    }

    if (userBalance && totalRequired > userBalance.balance) {
      setAutoBetError(
        `Insufficient balance. Need ${totalRequired.toFixed(
          2
        )} MCS for ${count} bets`
      );
      setTimeout(() => setAutoBetError(""), 5000);
      return;
    }

    setAutoBetError("");
    setIsAutoBetting(true);
    setAutoBetRemaining(count);
  };

  // Stop auto-bet
  const handleStopAutoBet = () => {
    setIsAutoBetting(false);
    setAutoBetRemaining(0);
  };

  const totalProfit = betAmount * multiplier - betAmount;

  return (
    <div className="px-2 flex flex-col gap-4">
      {/* <Tabs className="w-full bg-transparent">
  <TabsList className="w-full flex rounded-full overflow-hidden text-xl bg-[#110D14] p-2">
    <TabsTrigger value="manual" className="text-xl data-[state=active]:text-white p-2 text-white">Manual</TabsTrigger>
    <TabsTrigger value="auto" className="text-xl p-2 data-[state=active]:text-white text-white">Auto</TabsTrigger>
  </TabsList> */}

      {/* <TabsContents> */}

      {/* MANUAL */}
      <div className="flex flex-col gap-4 h-full overflow-y-auto">
        <div className="">
          <div className="flex md:hidden flex-col gap-2 md:mt-4 mt-4">
            {!isPlaying ? (
              <motion.button
                onClick={() => {
                  if (numericBetValue <= 0) {
                    toast.error("Please enter a bet amount");
                    return;
                  }
                  if (isBelowMinimum) {
                    toast.error("Minimum bet is 0.01 MCS");
                    return;
                  }
                  if (hasInsufficientBalance) {
                    toast.error("Insufficient balance");
                    return;
                  }
                  if (canStart) {
                    handleStartGame();
                  }
                }}
                className="w-full py-3 bg-[#945DF8] hover:bg-[#945DF8]/80 transition-all duration-150 text-white rounded-lg font-semibold text-lg"
                whileTap={{ scale: 0.98 }}
              >
                {hasInsufficientBalance
                  ? "Insufficient Balance"
                  : isBelowMinimum
                  ? "Minimum 0.01 MCS"
                  : "Bet"}
              </motion.button>
            ) : (
              <div className="flex gap-2">
                <motion.button
                  onClick={handleCashOut}
                  className="flex-1 py-3 bg-[#945DF8] hover:bg-[#945DF8]/80 transition-all duration-150 text-white rounded-lg font-semibold text-lg"
                  whileTap={{ scale: 0.98 }}
                >
                  Cash Out
                </motion.button>
                <button
                  onClick={pickRandomTile}
                  className="flex-1 py-3 bg-[#51545F] hover:bg-[#51545F]/80 transition-all duration-150 text-white rounded-lg font-semibold text-lg"
                >
                  Random Pick
                </button>
              </div>
            )}
          </div>
          {isPlaying && (
            <div className="bg-white/10 mt-4 md:mt-2 border border-white/20 rounded-lg px-4 py-3 flex items-center justify-between">
              <div>
                <div className="text-xs text-white/60 mb-1">Multiplier</div>
                <div className="text-2xl font-semibold text-white">
                  {multiplier.toFixed(2)}x
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-white/60 mb-1">Available</div>
                <div className="text-lg font-semibold text-white">
                  {(betAmount * multiplier).toFixed(2)} MCS
                </div>
              </div>
            </div>
          )}

          {gameHash && (
            <div
              className={`bg-white/10 border md:mt-4 border-white/20 mt-4 md:mt-0 rounded-lg px-3 py-2.5 ${
                isPlaying ? "mt-2" : ""
              }`}
            >
              <div className="text-xs font-medium text-white mb-2">
                Provable Fair Hash
              </div>
              <div className="text-[10px]  font-mono text-white/80 break-all mb-2">
                {gameHash}
              </div>
              {serverSeedHash && (
                <div className="text-[10px] font-mono text-white/60 mb-2">
                  Server Seed: {serverSeedHash.slice(0, 16)}...
                </div>
              )}
              {status === "playing" ? (
                <div className="text-[10px] text-white/50">
                  Verify link available after game ends
                </div>
              ) : (
                <button
                  onClick={async () => {
                    if (!serverSeed && gameId) {
                      const revealedSeed = await revealServerSeed();
                      if (revealedSeed) {
                        window.open(
                          `/verify?hash=${gameHash}&serverSeed=${revealedSeed}&clientSeed=${clientSeed}&mines=${mineCount}&mode=${mode}&bet=${betAmount}`,
                          "_blank"
                        );
                      }
                    } else if (serverSeed) {
                      window.open(
                        `/verify?hash=${gameHash}&serverSeed=${serverSeed}&clientSeed=${clientSeed}&mines=${mineCount}&mode=${mode}&bet=${betAmount}`,
                        "_blank"
                      );
                    }
                  }}
                  className="text-sm w-fit bg-[#54B6A0]  text-white p-2 rounded-lg  hover:text-white underline cursor-pointer"
                >
                  Verify Game
                </button>
              )}
            </div>
          )}
        </div>

        <div className="">
          <div className="flex justify-between items-center">
            <label className="text-base font-medium text-gray-300 mb-1">
              Bet Amount
            </label>
          </div>
          {hasInsufficientBalance && (
            <div className="bg-red-500/20 my-2 border border-red-500/30 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <div className="text-sm text-red-300">
                  <div className="font-medium">Insufficient Balance</div>
                  <div className="text-xs">
                    You need {numericBetValue.toFixed(2)} MCS but only have{" "}
                    {userBalance?.balance.toFixed(2)} MCS
                  </div>
                </div>
              </div>
            </div>
          )}
          {isBelowMinimum && (
            <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <div className="text-sm text-yellow-300">
                  <div className="font-medium">Minimum Bet Required</div>
                  <div className="text-xs">Minimum bet amount is 0.01 MCS</div>
                </div>
              </div>
            </div>
          )}
          {exceedsMaxBetLimit && (
            <div className="bg-orange-500/20 border border-orange-500/30 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <div className="text-sm text-orange-300">
                  <div className="font-medium">Maximum Bet Limit</div>
                  <div className="text-xs">
                    Maximum bet for {mineCount} {mineCount === 1 ? 'mine' : 'mines'} ({25 - mineCount} {25 - mineCount === 1 ? 'diamond' : 'diamonds'}) is {maxBetLimit.toLocaleString()} MCS
                  </div>
                </div>
              </div>
            </div>
          )}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Input
                placeholder="0.00"
                type="number"
                value={betInputValue}
                disabled={isPlaying}
                onChange={handleBetAmountChange}
                step="0.01"
                className="w-full text-lg focus:outline-none focus-visible:outline-none focus-visible:ring-0 px-4 py-6 h-14 border-gray-600 bg-black text-white rounded-lg pr-12"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-orange-500 text-xl">
                <Image
                  src={"/token/SttToken.png"}
                  alt="sepolia"
                  width={50}
                  height={20}
                  className="w-8 h-8"
                />
              </span>
            </div>
            <button
              onClick={handleBetHalf}
              disabled={isPlaying}
              className="px-6 h-14 bg-[#2A3441] hover:bg-gray-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              ½
            </button>
            <button
              onClick={handleBetDouble}
              disabled={isPlaying}
              className="px-5 h-14 bg-[#2A3441] hover:bg-gray-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              2×
            </button>
          </div>
        </div>

        {/* Mines Selector */}
        <div className="">
          <label className="block text-base font-medium text-gray-300 mb-1">
            Mines
          </label>
          <Select
            value={mineCount.toString()}
            onValueChange={(val) => {
              const value = parseInt(val) || 1;
              setMineCount(Math.min(Math.max(value, 1), 24));
            }}
            disabled={isPlaying}
          >
            <SelectTrigger className="w-full h-14 px-4 bg-black rounded-lg text-white text-lg border-gray-600 focus:outline-none focus:ring-0 disabled:opacity-50 disabled:cursor-not-allowed">
              <SelectValue placeholder="Select Mines" />
            </SelectTrigger>
            <SelectContent className="bg-black border border-gray-700 text-white max-h-[300px]">
              {Array.from({ length: 24 }, (_, i) => i + 1).map((num) => (
                <SelectItem
                  key={num}
                  value={num.toString()}
                  className="cursor-pointer"
                >
                  {num} {num === 1 ? "Mine" : "Mines"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Gems */}
        <div className="">
          <label className="block text-base font-medium text-gray-300 mb-1">
            Gems
          </label>
          <div className="w-full h-14 px-4 bg-black rounded-lg text-white text-lg border border-gray-600 flex items-center">
            {25 - mineCount}
          </div>
        </div>

        {/* Total Profit */}
        <div className="">
          <div className="flex items-center justify-between mb-1">
            <label className="block text-base font-medium text-gray-300">
              Total Profit ({multiplier.toFixed(2)}×)
            </label>
            <span className="text-sm text-gray-400">
              ${(betAmount * multiplier - betAmount).toFixed(2)}
            </span>
          </div>
          <div className="relative">
            <div className="w-full h-14 px-4 bg-black rounded-lg text-white text-lg border border-gray-600 flex items-center pr-12">
              {(betAmount * multiplier - betAmount).toFixed(8)}
            </div>
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-orange-500 text-xl">
              <Image
                src={"/token/SttToken.png"}
                alt="sepolia"
                width={50}
                height={20}
                className="w-8 h-8"
              />
            </span>
          </div>
        </div>

        <div className="md:flex hidden flex-col gap-2 md:mt-4">
          {!isPlaying ? (
            <motion.button
              onClick={() => {
                if (numericBetValue <= 0) {
                  toast.error("Please enter a bet amount");
                  return;
                }
                if (isBelowMinimum) {
                  toast.error("Minimum bet is 0.01 MCS");
                  return;
                }
                if (hasInsufficientBalance) {
                  toast.error("Insufficient balance");
                  return;
                }
                if (exceedsMaxBetLimit) {
                  const diamonds = 25 - mineCount;
                  toast.error(`Maximum bet for ${mineCount} ${mineCount === 1 ? 'mine' : 'mines'} (${diamonds} ${diamonds === 1 ? 'diamond' : 'diamonds'}) is ${maxBetLimit.toLocaleString()} MCS`);
                  return;
                }
                if (canStart) {
                  handleStartGame();
                }
              }}
              className="w-full py-3 bg-[#945DF8] hover:bg-[#945DF8]/80 transition-all duration-150 text-white rounded-lg font-semibold text-lg"
              whileTap={{ scale: 0.98 }}
            >
              {hasInsufficientBalance
                ? "Insufficient Balance"
                : isBelowMinimum
                ? "Minimum 0.01 MCS"
                : exceedsMaxBetLimit
                ? `Max ${maxBetLimit.toLocaleString()} MCS`
                : "Bet"}
            </motion.button>
          ) : (
            <div className="flex gap-2">
              <motion.button
                onClick={handleCashOut}
                className="flex-1 py-3 bg-[#945DF8] hover:bg-[#945DF8]/80 transition-all duration-150 text-white rounded-lg font-semibold text-lg"
                whileTap={{ scale: 0.98 }}
              >
                Cash Out
              </motion.button>
              <button
                onClick={pickRandomTile}
                className="flex-1 py-3 bg-[#51545F] hover:bg-[#51545F]/80 transition-all duration-150 text-white rounded-lg font-semibold text-lg"
              >
                Random Pick
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
