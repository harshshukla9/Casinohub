"use client";

import { motion } from "framer-motion";
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
import { Tabs, TabsContent, TabsContents, TabsList, TabsTrigger } from "./animate-ui/components/animate/tabs";

interface ControlsProps {
  onBetPlaced?: () => void;
}

interface UserBalanceData {
  balance: number;
  totalDeposited: number;
  totalWithdrawn: number;
}

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
  const canStart =
    (status === "idle" ||
      status === "won" ||
      status === "lost" ||
      status === "cashed_out") &&
    numericBetValue >= 0.01 &&
    !hasInsufficientBalance;
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
    const newValue = numericBetValue * 2;
    const rounded = Math.round(newValue * 100) / 100;
    setBetInputValue(rounded.toFixed(2));
  };

  const handleStartGame = async () => {
    if (canStart) {
      try {
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
    if (status !== 'playing') return;
    
    // Find all hidden tiles
    const hiddenTiles: { row: number; col: number }[] = [];
    grid.forEach((row, rowIndex) => {
      row.forEach((tile, colIndex) => {
        if (tile === 'hidden') {
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
    if (status !== 'idle' && status !== 'won' && status !== 'lost' && status !== 'cashed_out') return;
    if (autoBetRemaining <= 0) {
      setIsAutoBetting(false);
      fetchUserBalance();
      return;
    }

    const startNextGame = async () => {
      try {
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
        
        setUserBalance((prev) => prev ? {
          ...prev,
          balance: result.newBalance,
        } : null);

        await startGame();
        setAutoBetRemaining(prev => prev - 1);
      } catch (error) {
        console.error("Auto-bet failed:", error);
        setIsAutoBetting(false);
        setAutoBetRemaining(0);
        setAutoBetError(error instanceof Error ? error.message : "Auto-bet failed");
        setTimeout(() => setAutoBetError(""), 5000);
      }
    };

    const timer = setTimeout(startNextGame, 500);
    return () => clearTimeout(timer);
  }, [isAutoBetting, status, autoBetRemaining, numericBetValue, address]);

  // Auto-bet logic - Pick random tiles during gameplay
  useEffect(() => {
    if (!isAutoBetting || status !== 'playing') return;

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
      setAutoBetError('Please connect your wallet first');
      setTimeout(() => setAutoBetError(""), 3000);
      return;
    }

    if (count <= 0) {
      setAutoBetError('Please enter a valid number of bets');
      setTimeout(() => setAutoBetError(""), 3000);
      return;
    }

    if (numericBetValue < 0.01) {
      setAutoBetError('Minimum bet amount is 0.01 STT');
      setTimeout(() => setAutoBetError(""), 3000);
      return;
    }

    if (userBalance && totalRequired > userBalance.balance) {
      setAutoBetError(`Insufficient balance. Need ${totalRequired.toFixed(2)} STT for ${count} bets`);
      setTimeout(() => setAutoBetError(""), 5000);
      return;
    }

    setAutoBetError('');
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
    <div className="py-2 px-2 flex  flex-col gap-4">
      <Tabs className="w-full bg-transparent">
  <TabsList className="w-full flex rounded-full overflow-hidden text-xl bg-[#110D14] p-2">
    <TabsTrigger value="manual" className="text-xl data-[state=active]:text-white p-2 text-white">Manual</TabsTrigger>
    <TabsTrigger value="auto" className="text-xl p-2 data-[state=active]:text-white text-white">Auto</TabsTrigger>
  </TabsList>


  <TabsContents>

    {/* MANUAL */}
    <TabsContent value="manual" className="flex flex-col gap-4">
    <div className="">
        {isPlaying && (
          <div className="bg-gradient-to-r from-green-900/30 via-emerald-900/20 to-green-900/30 flex rounded-t-lg px-4 py-3 items-center justify-between border border-green-500/40 shadow-lg shadow-green-500/10">
            <div className="flex flex-col">
              <div className="text-xs uppercase tracking-wider text-green-300/70 mb-1 font-medium">
                Multiplier
              </div>
              <div className="text-3xl font-bold text-green-400 tracking-tight">
                {multiplier.toFixed(2)}
                <span className="text-xl">x</span>
              </div>
            </div>
            <div className="flex flex-col items-end">
              <div className="text-xs uppercase tracking-wider text-gray-400/70 mb-1 font-medium">
                Available
              </div>
              <div className="text-xl font-semibold text-white">
                {(betAmount * multiplier).toFixed(2)}{" "}
                <span className="text-sm text-gray-300">STT</span>
              </div>
            </div>
          </div>
        )}
            {gameHash && (
              <div className={`bg-blue-900/20 border border-blue-500/30 rounded-lg px-3 py-2 text-xs ${isPlaying ? 'mt-2' : 'mt-0'}`}>
                <div className="text-blue-300 font-medium mb-1">🔒 Provable Fair Hash</div>
                <div className="text-blue-200 font-mono break-all text-[10px]">
                  {gameHash}
                </div>
                {serverSeedHash && (
                  <div className="text-blue-200/70 font-mono break-all text-[9px] mt-1">
                    Server Seed Hash: {serverSeedHash.slice(0, 16)}...
                  </div>
                )}
                {status === 'playing' ? (
                  <div className="text-gray-400 text-[10px] mt-1">
                    ⏳ Verify link will be available after game ends
                  </div>
                ) : (
                  <button
                    onClick={async () => {
                      if (!serverSeed && gameId) {
                        const revealedSeed = await revealServerSeed();
                        if (revealedSeed) {
                          window.open(
                            `/verify?hash=${gameHash}&serverSeed=${revealedSeed}&clientSeed=${clientSeed}&mines=${mineCount}&mode=${mode}&bet=${betAmount}`,
                            '_blank'
                          );
                        }
                      } else if (serverSeed) {
                        window.open(
                          `/verify?hash=${gameHash}&serverSeed=${serverSeed}&clientSeed=${clientSeed}&mines=${mineCount}&mode=${mode}&bet=${betAmount}`,
                          '_blank'
                        );
                      }
                    }}
                    className="text-blue-400 hover:text-blue-300 underline mt-1 inline-block cursor-pointer bg-transparent border-none p-0"
                  >
                    ✅ Verify Game
                  </button>
                )}
              </div>
            )}
      </div>

      <div className="">
        <div className="flex justify-between items-center">
          <label className="text-base font-medium text-gray-300">
            Bet Amount
          </label>
        </div>
        {hasInsufficientBalance && (
          <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3">
            <div className="flex items-center gap-2">
                <div className="text-sm text-red-300">
                <div className="font-medium">Insufficient Balance</div>
                <div className="text-xs">
                  You need {numericBetValue.toFixed(2)} STT but only have{" "}
                  {userBalance?.balance.toFixed(2)} STT
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
                <div className="text-xs">Minimum bet amount is 0.01 STT</div>
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
              className="w-full text-lg px-4 py-6 h-14 border-gray-600 bg-[#1E2838] text-white rounded-lg pr-12"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-orange-500 text-xl">
              🪙
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
        <label className="block text-base font-medium text-gray-300">
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
          <SelectTrigger className="w-full h-14 px-4 bg-[#1E2838] rounded-lg text-white text-lg border-gray-600 focus:outline-none focus:ring-0 disabled:opacity-50 disabled:cursor-not-allowed">
            <SelectValue placeholder="Select Mines" />
          </SelectTrigger>
          <SelectContent className="bg-[#1a1a1a] border border-gray-700 text-white max-h-[300px]">
            {Array.from({ length: 24 }, (_, i) => i + 1).map((num) => (
              <SelectItem key={num} value={num.toString()} className="cursor-pointer">
                {num} {num === 1 ? 'Mine' : 'Mines'}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Gems */}
      <div className="">
        <label className="block text-base font-medium text-gray-300">
          Gems
        </label>
        <div className="w-full h-14 px-4 bg-[#1E2838] rounded-lg text-white text-lg border border-gray-600 flex items-center">
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
          <div className="w-full h-14 px-4 bg-[#1E2838] rounded-lg text-white text-lg border border-gray-600 flex items-center pr-12">
            {(betAmount * multiplier - betAmount).toFixed(8)}
          </div>
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-orange-500 text-xl">
            🪙
          </span>
        </div>
      </div>

      {/* Random Pick Button for Manual Mode */}
      <button
        onClick={pickRandomTile}
        disabled={!isPlaying}
        className="w-full py-3 bg-gray-700/50 hover:bg-gray-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        Random Pick
      </button>

      <div className="flex flex-col gap-2 md:mt-4">
        <motion.button
          onClick={
            canStart
              ? handleStartGame
              : canCashOut
              ? handleCashOut
              : handleStartGame
          }
          disabled={!canStart && !canCashOut && !canReset}
          className={`w-full py-3 bg-[#945DF8] hover:bg-[#945DF8]/80 transition-all duration-150 text-white ${
            isPlaying ? "rounded-b-lg" : "rounded-lg"
          } font-semibold text-lg`}
          whileTap={canStart || canCashOut || canReset ? { scale: 0.98 } : {}}
        >
          {hasInsufficientBalance
            ? "Insufficient Balance"
            : isBelowMinimum
            ? "Minimum 0.01 STT"
            : canStart
            ? "Bet"
            : canCashOut
            ? "Cashout"
            : canReset
            ? "Play Again"
            : "Bet"}
        </motion.button>

        <button
          className={`w-full py-3 bg-[#51545F] hover:bg-[#51545F]/80 transition-all duration-150 text-white ${
            isPlaying ? "rounded-b-lg" : "rounded-lg"
          } font-semibold text-lg`}
        >
          Random Pick
        </button>
      </div>
    </TabsContent>


    {/* AUTO */}
    <TabsContent value="auto" className="flex flex-col gap-4">
    <div className="">
        {isPlaying && (
          <div className="bg-gradient-to-r from-green-900/30 via-emerald-900/20 to-green-900/30 flex rounded-t-lg px-4 py-3 items-center justify-between border border-green-500/40 shadow-lg shadow-green-500/10">
            <div className="flex flex-col">
              <div className="text-xs uppercase tracking-wider text-green-300/70 mb-1 font-medium">
                Multiplier
              </div>
              <div className="text-3xl font-bold text-green-400 tracking-tight">
                {multiplier.toFixed(2)}
                <span className="text-xl">x</span>
              </div>
            </div>
            <div className="flex flex-col items-end">
              <div className="text-xs uppercase tracking-wider text-gray-400/70 mb-1 font-medium">
                Available
              </div>
              <div className="text-xl font-semibold text-white">
                {(betAmount * multiplier).toFixed(2)}{" "}
                <span className="text-sm text-gray-300">STT</span>
              </div>
            </div>
          </div>
        )}
            {gameHash && (
              <div className={`bg-blue-900/20 border border-blue-500/30 rounded-lg px-3 py-2 text-xs ${isPlaying ? 'mt-2' : 'mt-0'}`}>
                <div className="text-blue-300 font-medium mb-1">🔒 Provable Fair Hash</div>
                <div className="text-blue-200 font-mono break-all text-[10px]">
                  {gameHash}
                </div>
                {serverSeedHash && (
                  <div className="text-blue-200/70 font-mono break-all text-[9px] mt-1">
                    Server Seed Hash: {serverSeedHash.slice(0, 16)}...
                  </div>
                )}
                {status === 'playing' ? (
                  <div className="text-gray-400 text-[10px] mt-1">
                    ⏳ Verify link will be available after game ends
                  </div>
                ) : (
                  <button
                    onClick={async () => {
                      if (!serverSeed && gameId) {
                        const revealedSeed = await revealServerSeed();
                        if (revealedSeed) {
                          window.open(
                            `/verify?hash=${gameHash}&serverSeed=${revealedSeed}&clientSeed=${clientSeed}&mines=${mineCount}&mode=${mode}&bet=${betAmount}`,
                            '_blank'
                          );
                        }
                      } else if (serverSeed) {
                        window.open(
                          `/verify?hash=${gameHash}&serverSeed=${serverSeed}&clientSeed=${clientSeed}&mines=${mineCount}&mode=${mode}&bet=${betAmount}`,
                          '_blank'
                        );
                      }
                    }}
                    className="text-blue-400 hover:text-blue-300 underline mt-1 inline-block cursor-pointer bg-transparent border-none p-0"
                  >
                    ✅ Verify Game
                  </button>
                )}
              </div>
            )}
      </div>

      <div className="">
        <div className="flex justify-between items-center">
          <label className="text-base font-medium text-gray-300">
            Bet Amount
          </label>
        </div>
        {hasInsufficientBalance && (
          <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3">
            <div className="flex items-center gap-2">
                <div className="text-sm text-red-300">
                <div className="font-medium">Insufficient Balance</div>
                <div className="text-xs">
                  You need {numericBetValue.toFixed(2)} STT but only have{" "}
                  {userBalance?.balance.toFixed(2)} STT
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
                <div className="text-xs">Minimum bet amount is 0.01 STT</div>
              </div>
            </div>
          </div>
        )}
        <div className="relative flex">
          <Input
            placeholder="0.00"
            type="number"
            value={betInputValue}
            disabled={isPlaying}
            onChange={handleBetAmountChange}
            step="0.01"
            className="flex-1 text-lg px-4 py-6 rounded-none focus:outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0 border-gray-600 bg-black text-white rounded-l-lg"
          />
          <div className="flex">
            <button
              onClick={handleBetHalf}
              disabled={isPlaying}
              className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-500 text-sm text-white  disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              1/2
            </button>
            <button
              onClick={handleBetDouble}
              disabled={isPlaying}
              className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-500 text-sm text-white rounded-r-lg  disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              2x
            </button>
          </div>
        </div>
      </div>

      <div className="">
        <label className="block text-base font-medium text-gray-300">
          Mines
        </label>
        <div className="relative">
          <Select
            value={mineCount.toString()}
            onValueChange={(val) => {
              const value = parseInt(val) || 1;
              setMineCount(Math.min(Math.max(value, 1), 24));
            }}
            disabled={isPlaying}
          >
            <SelectTrigger className="w-full h-12 px-4 bg-black rounded-lg text-white border-[#51545F] focus:outline-none focus:ring-0 disabled:opacity-50 disabled:cursor-not-allowed">
              <SelectValue placeholder="Select Mines" />
            </SelectTrigger>
            <SelectContent className="bg-black border border-gray-700 text-white max-h-[300px]">
              {Array.from({ length: 24 }, (_, i) => i + 1).map((num) => (
                <SelectItem key={num} value={num.toString()} className="cursor-pointer">
                  {num} {num === 1 ? 'Mine' : 'Mines'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="">
        <label className="block text-base font-medium text-gray-300">
          Number of Mines (1-24)
        </label>
        <div className="relative">
          <Select
            value={mineCount.toString()}
            onValueChange={(val) => {
              const value = parseInt(val) || 1;
              setMineCount(Math.min(Math.max(value, 1), 24));
            }}
            disabled={isPlaying}
          >
            <SelectTrigger className="w-full h-12 px-4 bg-black rounded-lg text-white border-[#51545F] focus:outline-none focus:ring-0 disabled:opacity-50 disabled:cursor-not-allowed">
              <SelectValue placeholder="Select Mines" />
            </SelectTrigger>
            <SelectContent className="bg-black border border-gray-700 text-white max-h-[300px]">
              {Array.from({ length: 24 }, (_, i) => i + 1).map((num) => (
                <SelectItem key={num} value={num.toString()} className="cursor-pointer">
                  {num} {num === 1 ? 'Mine' : 'Mines'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-gray-400 mt-1">
            💎 Safe tiles: {25 - mineCount} | 💣 Mines: {mineCount}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-2 md:mt-4">
        <label className="text-base font-medium text-gray-300">
            Number of Auto Bets
          </label>
          <Input
            placeholder="10"
            type="number"
            value={autoBetCount}
            onChange={(e) => {
              const value = e.target.value;
              // Only allow positive integers
              if (value === "" || /^\d+$/.test(value)) {
                setAutoBetCount(value);
              }
            }}
            min="1"
            step="1"
            disabled={isPlaying}
            className="flex-1 text-lg focus:outline-none focus-visible:outline-none focus-visible:ring-0 px-4 py-4 rounded-none focus:outline-none border-gray-600 bg-black text-white! rounded-lg"
          />


{/* Auto-bet Error Message */}
        {autoBetError && (
          <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3 text-sm text-red-300">
            ❌ {autoBetError}
          </div>
        )}

        {/* Auto-bet Status */}
        {isAutoBetting && (
          <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-3 text-sm text-blue-300">
            🤖 Auto-betting... {autoBetRemaining} bet{autoBetRemaining !== 1 ? 's' : ''} remaining
          </div>
        )}

        <motion.button
          onClick={
            isAutoBetting
              ? handleStopAutoBet
              : canStart
              ? handleStartAutoBet
              : canCashOut
              ? handleCashOut
              : handleStartAutoBet
          }
          disabled={!isAutoBetting && !canStart && !canCashOut && !canReset}
          className={`w-full py-3 mt-4 bg-[#945DF8] hover:bg-[#945DF8]/80 transition-all duration-150 text-white ${
            isPlaying ? "rounded-b-lg" : "rounded-lg"
          } font-semibold text-lg`}
          whileTap={isAutoBetting || canStart || canCashOut || canReset ? { scale: 0.98 } : {}}
        >
          {isAutoBetting
            ? "Stop Auto-Bet"
            : hasInsufficientBalance
            ? "Insufficient Balance"
            : isBelowMinimum
            ? "Minimum 0.01 STT"
            : canStart
            ? "Start Autobet"
            : canCashOut
            ? "Cashout"
            : canReset
            ? "Play Again"
            : "Start Autobet"}
        </motion.button>
      </div>
    </TabsContent>
  </TabsContents>
</Tabs>
    </div>
  );
};
