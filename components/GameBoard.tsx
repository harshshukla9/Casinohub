"use client";

import { motion } from "framer-motion";
import { useGameStore, type TileState } from "../store/gameStore";
import { useAccount } from "wagmi";
import { useState, useEffect } from "react";
import Image from "next/image";
import { toast } from "sonner";

interface TileProps {
  tile: TileState;
  row: number;
  col: number;
  isClickable: boolean;
  onClick: (row: number, col: number) => void;
  gameMode: "easy" | "medium" | "hard";
}

const Tile = ({
  tile,
  row,
  col,
  isClickable,
  onClick,
  gameMode,
}: TileProps) => {
  const getTileClasses = () => {
    const baseClasses =
      "w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 lg:w-28 lg:h-28 rounded-lg transition-all duration-300 flex items-center justify-center text-xl sm:text-2xl md:text-3xl font-bold cursor-pointer relative overflow-hidden";
    if (!isClickable) {
      return `${baseClasses} text-gray-500 cursor-not-allowed`;
    }
    switch (tile) {
      case "hidden":
        return `${baseClasses} text-gray-300`;
      case "safe":
        return `${baseClasses} text-white`;
      case "trap":
        return `${baseClasses} text-white`;
      default:
        return baseClasses;
    }
  };

  const getFrameClasses = () => {
    return "w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 lg:w-36 lg:h-36";
  };

  const getFrameStyle = () => {
    return {
      backgroundImage: `url('/all%20assets/general%20stone%20frame%20display.png')`,
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
      zIndex: 1,
      width: "100%",
      height: "100%",
    };
  };

  const getTileBackgroundImage = () => {
    let backgroundUrl = "";
    switch (tile) {
      case "hidden":
        if (gameMode === "easy") {
          backgroundUrl = `url(/all%20assets/Active%20play%20grid%20easy%20mode.png)`;
        } else if (gameMode === "medium") {
          backgroundUrl = `url(/all%20assets/general%20grid%20medium%20mode.png)`;
        } else {
          backgroundUrl = `url(/all%20assets/general%20grid%20Hard%20mode.png)`;
        }
        return backgroundUrl;
      case "safe":
        return "";
      case "trap":
        return "";
      default:
        return "";
    }
  };

  const getTileBackgroundSize = () => {
    if (tile === "hidden" && (gameMode === "medium" || gameMode === "hard")) {
      return "80%";
    }
    return "cover";
  };

  const getTileBackgroundRepeat = () => {
    if (tile === "hidden" && (gameMode === "medium" || gameMode === "hard")) {
      return "repeat";
    }
    return "no-repeat";
  };

  const getTileContent = () => {
    switch (tile) {
      case "hidden":
        return (
          <motion.div
            className="w-full h-full flex items-center justify-center"
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <span className="text-gray-300">?</span>
          </motion.div>
        );
      case "safe":
        return (
          <motion.div
            className="w-full h-full flex items-center justify-center overflow-hidden"
            initial={{ scale: 0, rotate: 180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{
              duration: 0.8,
              ease: "easeOut",
              scale: { duration: 0.6, ease: "easeOut" },
            }}
          >
            <img
              src="/all%20assets/diamond%20safe%20grid%20mockup.png"
              alt="Safe tile"
              className="w-full h-full object-contain z-10"
            />
          </motion.div>
        );
      case "trap":
        return (
          <motion.div
            className="w-full h-full flex items-center justify-center"
            initial={{ scale: 0, rotate: 180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <span className="text-white">💀</span>
          </motion.div>
        );
      default:
        return null;
    }
  };

  return (
    <motion.div
      className={getTileClasses()}
      style={{
        backgroundImage: getTileBackgroundImage(),
        backgroundSize: getTileBackgroundSize(),
        backgroundPosition: "center",
        backgroundRepeat: getTileBackgroundRepeat(),
        backgroundColor: "rgba(0,0,0,0.3)",
      }}
      onClick={() => isClickable && onClick(row, col)}
      whileHover={isClickable ? { scale: 1.05, y: -2 } : {}}
      whileTap={isClickable ? { scale: 0.95 } : {}}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3, delay: (row + col) * 0.05 }}
    >
      {getTileContent()}
    </motion.div>
  );
};

export const GameBoard = () => {
  const { address } = useAccount();
  const {
    grid,
    config,
    status,
    clickTile,
    betAmount,
    multiplier,
    cashOut,
    mode,
    revealedSafeTiles,
  } = useGameStore();
  const [showMultiplierPopup, setShowMultiplierPopup] = useState(false);
  const [lastMultiplier, setLastMultiplier] = useState(1);
  const [showExplosion, setShowExplosion] = useState(false);
  const [explodedTile, setExplodedTile] = useState<{ row: number; col: number } | null>(null);
  const [winStreak, setWinStreak] = useState(0);

  const gridMines = grid.slice(0, 6);

  const getGridConfig = () => {
    switch (mode) {
      case "easy":
        return {
          cols: 4,
          rows: 9,
          totalBoxes: 36,
          gridClass: "grid-cols-4 grid-rows-9",
        };
      case "medium":
        return {
          cols: 3,
          rows: 9,
          totalBoxes: 27,
          gridClass: "grid-cols-3 grid-rows-9",
        };
      case "hard":
        return {
          cols: 2,
          rows: 9,
          totalBoxes: 18,
          gridClass: "grid-cols-2 grid-rows-9",
        };
      default:
        return {
          cols: 4,
          rows: 9,
          totalBoxes: 36,
          gridClass: "grid-cols-4 grid-rows-9",
        };
    }
  };

  const gridConfig = getGridConfig();

  const getChestDisplay = () => {
    if (status === "won" || status === "cashed_out") {
      return {
        image: "/all%20assets/Winning%20Chest.png",
        alt: "Winning Chest",
      };
    } else if (status === "lost") {
      return {
        image: "/all%20assets/Lost%20chest.png",
        alt: "Lost Chest",
      };
    } else {
      return {
        image: "/all%20assets/General%20chest%20display.png",
        alt: "General Chest",
      };
    }
  };

  const maxPotentialMultiplier = Math.pow(config.baseMultiplier, 25);
  const maxPotentialReward = betAmount * maxPotentialMultiplier;

  useEffect(() => {
    if (multiplier > 1) {
      setShowMultiplierPopup(true);
      const timer = setTimeout(() => {
        setShowMultiplierPopup(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [multiplier]);

  // Listen for trap reveal event to show explosion feedback
  useEffect(() => {
    const handleTrapReveal = (event: CustomEvent) => {
      const { row, col } = event.detail || {};
      if (row !== undefined && col !== undefined) {
        setExplodedTile({ row, col });
        setShowExplosion(true);
        setTimeout(() => {
          setShowExplosion(false);
          setExplodedTile(null);
        }, 800);
      }
    };

    window.addEventListener('game:trapReveal', handleTrapReveal as EventListener);
    return () => {
      window.removeEventListener('game:trapReveal', handleTrapReveal as EventListener);
    };
  }, []);

  // Track wins / losses and trigger feedback
  useEffect(() => {
    if (status === 'lost') {
      setWinStreak(0);
      setShowExplosion(true);
      setTimeout(() => {
        setShowExplosion(false);
      }, 1000);

      // Show toast with profit and play again button
      const lossAmount = betAmount;
      toast.custom(
        (t) => (
          <div 
            className="flex flex-col gap-3 bg-black text-white p-4 rounded-lg border border-white/20 shadow-lg min-w-[300px]"
            style={{ backgroundColor: "#000000", color: "#ffffff" }}
          >
            <div className="text-center">
              <div className="text-lg font-bold text-white mb-1">Game Over!</div>
              <div className="text-sm text-white/80">
                You lost {lossAmount.toFixed(2)} STT
              </div>
            </div>
            <button
              onClick={() => {
                const { resetGame } = useGameStore.getState();
                resetGame();
                window.dispatchEvent(new CustomEvent("balanceUpdated"));
                toast.dismiss(t);
              }}
              className="w-full bg-[#945DF8] hover:bg-[#945DF8]/80 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
            >
              Play Again
            </button>
          </div>
        ),
        {
          position: "bottom-center",
          duration: 10000,
        }
      );
    }
    if (status === 'won') {
      setWinStreak((prev) => prev + 1);
    }
  }, [status, betAmount]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const assetSources = [
      "/all%20assets/Active%20play%20grid%20easy%20mode.png",
      "/all%20assets/general%20grid%20easy%20mode.png",
      "/all%20assets/Active%20play%20grid%20medium%20mode.png",
      "/all%20assets/general%20grid%20medium%20mode.png",
      "/all%20assets/Active%20play%20grid%20Hard%20mode.png",
      "/all%20assets/general%20grid%20Hard%20mode.png",
    ];
    const images = assetSources.map((src) => {
      const img = new window.Image();
      img.src = src;
      return img;
    });
    return () => {
      images.forEach((img) => {
        img.src = "";
      });
    };
  }, []);

  if (!grid.length) {
    return (
      <div className="relative h-full w-full flex items-center justify-center">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-10 w-16 h-16 bg-gray-600 rounded-full opacity-50"></div>
          <div className="absolute bottom-20 right-10 w-12 h-12 bg-gray-600 rounded-full opacity-30"></div>
          <div className="absolute top-40 right-20 w-8 h-8 bg-gray-600 rounded-full opacity-40"></div>
        </div>
        <div className="text-center">
          <div className="text-xl text-gray-400">
            Place your bet to start climbing
          </div>
        </div>
      </div>
    );
  }

  const currentPayout = betAmount * multiplier;

  return (
    <div className="relative h-[68vh] lg:h-full lg:rounded-xl overflow-hidden w-full">
      {/* Explosion flash overlay */}
      {showExplosion && (
        <motion.div
          className="absolute inset-0 z-100 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.7, 0] }}
          transition={{ duration: 0.8 }}
          style={{
            background: "radial-gradient(circle, rgba(255, 0, 0, 0.7) 0%, rgba(255, 100, 0, 0.5) 50%, transparent 100%)",
          }}
        />
      )}

      <div
        className="h-full w-full z-10 object-cover lg:rounded-xl overflow-hidden"
        style={{
          backgroundImage: "url(/all%20assets/PrimaryBg.svg)",
          backgroundSize: "cover",
          backgroundPosition: "top",
          backgroundRepeat: "no-repeat",
        }}
      />

      {status === "lost" && (
        <>
          <div className="absolute inset-0 z-30 bg-black/50 pointer-events-none" />
          <Image
            src="/stone/TryAgain2.svg"
            alt="Stone"
            width={100}
            height={100}
            className="absolute bottom-24 md:bottom-48 right-18 md:right-38 w-36 md:w-52 z-50"
          />
        </>
      )}
      {status === "won" && (
        <Image
          src={winStreak > 1 ? "/stone/winAgain.svg" : "/stone/firstWin.svg"}
          alt="Win"
          width={120}
          height={120}
          className="absolute bottom-28 md:bottom-52 left-4 md:left-10 w-40 md:w-56 z-50"
        />
      )}
      <Image
            src="/LOGO/Dragon.svg"
            alt="Dragon"
            width={100}
            height={100}
            className="absolute bottom-0 right-2 w-22 md:w-[12vw] z-50"
          />
      <div className="h-full w-full z-10">
        <div className="absolute top-[-10px] left-1/3 transform -translate-x-1/2 z-30 flex justify-center items-center">
          <div className="relative">
            {status === "won" && (
              <div className="absolute -bottom-2 left-1/3 transform -translate-x-1/2 bg-green-600 text-white px-3 py-1 rounded-full text-xs font-bold"></div>
            )}
            {status === "cashed_out" && (
              <div className="absolute -bottom-2 left-1/3 transform -translate-x-1/2 bg-yellow-600 text-white px-3 py-1 rounded-full text-xs font-bold">
                CASHED OUT!
              </div>
            )}
            {status === "lost" && (
              <div className="absolute -bottom-2 left-1/3 transform -translate-x-1/2 bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold">
                GAME OVER
              </div>
            )}
          </div>
        </div>

        {showMultiplierPopup && (
          <motion.div
            className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50"
            initial={{ opacity: 0, scale: 0.5, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: -20 }}
            transition={{ duration: 0.3 }}
          ></motion.div>
        )}

        <div className="flex flex-col md:items-center lg:items-start absolute top-16 left-1/2 -translate-x-1/2 sm:top-4 md:top-4 lg:top-8 xl:top-15 lg:left-[65%] lg:-translate-x-1/2 h-full w-full lg:w-full px-2 sm:px-3 md:px-4 lg:px-4">
          <div className="relative w-[95vw] sm:w-[90vw] md:w-[80vw] lg:w-[50vw] z-10 p-3 sm:p-4 md:p-6 lg:p-7 xl:p-10 overflow-hidden h-[50vh] sm:h-[55vh] md:h-[60vh] lg:h-[82vh] xl:h-[85vh] flex flex-col items-center justify-center">
            <div className="absolute inset-0 bg-[url('/all%20assets/MineFrame.svg')] bg-contain md:bg-contain lg:bg-contain xl:bg-cover bg-no-repeat bg-center pointer-events-none" />
            <div
              className={`grid grid-cols-5 p-6 md:py-2 md:gap-2 z-20 h-full w-full items-center justify-center overflow-hidden`}
              style={{ gridAutoRows: "1fr" }}
            >
              {gridMines.map((row, rowIdx) =>
                row.map((tile, colIdx) => {
                  const isClickable = status === "playing" && tile === "hidden";

                  const getTileBackground = () => {
                    if (tile === "hidden") {
                      return "url('https://ox35safakaidjuzg.public.blob.vercel-storage.com/WithoutOpenTile.svg')";
                    }
                    return "url('https://ox35safakaidjuzg.public.blob.vercel-storage.com/WithOpenTile.svg')";
                  };
                  

                  const getTileContent = () => {
                    if (tile === "hidden") {
                      return "";
                    } else if (tile === "safe") {
                      return (
                        <Image
                          key={`safe-${rowIdx}-${colIdx}`}
                          width={30}
                          height={30}
                          src="/all%20assets/purpleMines.svg"
                          alt="Safe"
                          className="w-[60%] h-[60%] md:w-[60%] md:h-[60%] lg:w-[70%] lg:h-[70%] object-contain"
                        />
                      );
                    } else if (tile === "trap") {
                      return (
                        <Image
                          width={35}
                          height={35}
                          src="/all%20assets/Dynamite.svg"
                          alt="trap"
                          className="w-[60%] h-[60%] md:w-[65%] md:h-[65%] lg:w-[70%] lg:h-[70%] object-contain"
                        />
                      );
                    }
                    return null;
                  };

                  const isExploded = explodedTile?.row === rowIdx && explodedTile?.col === colIdx;

                  return (
                    <motion.div
                      key={`${rowIdx}-${colIdx}`}
                      className={`aspect-square md:h-[9vh] lg:h-[14vh] h-[8vh] w-full max-h-full max-w-full rounded-lg flex items-center justify-center text-white text-2xl font-bold overflow-hidden relative ${
                        isClickable ? "cursor-pointer " : "cursor-not-allowed"
                      }`}
                      style={{
                        backgroundColor: tile === "hidden" ? "transparent" : "",
                        backgroundImage: getTileBackground(),
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                        backgroundRepeat: "no-repeat",
                      }}
                      onClick={() => isClickable && clickTile(rowIdx, colIdx)}
                      whileTap={isClickable ? { scale: 0.95 } : {}}
                      animate={
                        isExploded
                          ? {
                              scale: [1, 1.3, 1],
                              backgroundColor: ["transparent", "rgba(255, 0, 0, 0.5)", "transparent"],
                            }
                          : {}
                      }
                      transition={
                        isExploded
                          ? {
                              duration: 0.6,
                              ease: "easeOut",
                            }
                          : {}
                      }
                    >
                      {isExploded && (
                        <motion.div
                          className="absolute inset-0 bg-red-500/50 rounded-lg"
                          initial={{ opacity: 0, scale: 0 }}
                          animate={{ opacity: [0, 1, 0], scale: [0, 2, 0] }}
                          transition={{ duration: 0.6 }}
                        />
                      )}
                      <div className="w-full h-full max-w-full max-h-full flex items-center justify-center p-1 absolute inset-0">
                        {getTileContent()}
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
