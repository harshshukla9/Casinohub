'use client'
import AmountInput from "@/components/shared/AmountInput";
import BetNumberInput from "@/components/shared/BetNumberInput";
import MineButton from "@/components/games/Mine/MineButton";
import MineCustomInput from "@/components/games/Mine/MineCustomInput";
import MineModal from "@/components/games/Mine/MineModal";
import { GAME_STATUS, MINE_OBJECT, MineArea } from "@/components/games/Mine/types";
import ProfitAmount from "@/components/shared/ProfitAmount";
import { BombSvg, EthSvg } from "@/components/svgs";
import SwitchTab from "@/components/shared/SwitchTab";

import Layout from "@/layout/layout";
import axiosServices from "@/util/axios";
import { Button } from "@/components/ui/button";
import { useEffect, useRef, useState } from "react";
import { useAccount } from "wagmi";
import { useUserBalance } from "@/hooks/useUserBalance";
import { placeBet as placeBetBalance, cashout as cashoutBalance, hasSufficientBalance } from "@/lib/game-balance";
import { GameBalanceDisplay } from "@/components/shared/GameBalanceDisplay";
import { motion } from "motion/react";
import Image from "next/image";
const MINE_API = "/api/mine";

function calculateMinesGame(mines: number, picks: number, bet: number): any {
    const totalSlots = 25; // Total number of slots
    const safeSlots = totalSlots - mines; // Slots without mines

    // Function to calculate factorial
    function factorial(n: number): number {
        let value = 1;
        for (let i = 2; i <= n; i++) {
            value *= i;
        }
        return value;
    }

    // Function to calculate combinations
    function combination(n: number, k: number): number {
        if (k > n) return 0;
        return factorial(n) / (factorial(k) * factorial(n - k));
    }

    // Calculate total combinations and safe combinations
    const totalCombinations = combination(totalSlots, picks);
    const safeCombinations = combination(safeSlots, picks);

    // Calculate probability and other metrics
    let probability = 0.99 * (totalCombinations / safeCombinations);
    probability = Math.round(probability * 100) / 100;

    const winAmount = bet * probability;
    const roundedWinAmount = Math.round(winAmount * 100000000) / 100000000;

    const lossAmount = 100 / (probability - 1);
    const roundedLossAmount = Math.round(lossAmount * 100) / 100;

    const chance = 99 / probability;
    const roundedChance = Math.round(chance * 100000) / 100000;

    // Log results if conditions are met
    if (mines + picks <= totalSlots && picks > 0 && mines > 0) {
        if (mines && picks) {
            return {
                probability,
                roundedLossAmount,
                roundedChance,
                roundedWinAmount,
            };
            // console.log("Probability:", probability);
            // console.log("Loss:", roundedLossAmount);
            // console.log("Chance:", roundedChance);
            // if (bet > 0.00000000999) console.log("Win:", roundedWinAmount);
        }
    }
    return {
        probability: 0,
        roundedLossAmount: 0,
        roundedChance: 0,
        roundedWinAmount: 0,
    };
}

const MineGame: React.FC = () => {
    const { address } = useAccount();
    const { balance, isLoading: isLoadingBalance } = useUserBalance();
    const [activeTab, setActiveTab] = useState(0); // 0 for Manual, 1 for Auto
    const [mineCount, setMineCount] = useState<number>(3);
    const [betAmount, setBetAmount] = useState<number>(0);
    const [status, setStatus] = useState<GAME_STATUS>(GAME_STATUS.READY);
    const [loading, setLoading] = useState(false);
    const [mineAreas, setMineAreas] = useState<MineArea[]>([]);
    const [autoAreas, setAutoAreas] = useState<MineArea[]>([]);

    const statusRef = useRef<any>(null);
    const [resultVisible, setResultVisible] = useState(false);
    const [autoBetCount, setAutoBetCount] = useState(0);
    const [isInfinity, setInfinity] = useState(false);
    const [stopProfitA, setStopProfitA] = useState(0);
    const [stopLossA, setStopLossA] = useState(0);
    const [onWinP, setOnWinP] = useState(0);
    const [onLossP, setOnLossP] = useState(0);
    const [areaFlag, setAreaFlag] = useState(true);

    const [totalProfit, setProfitA] = useState<number>(0);
    const [totalLoss, setLossA] = useState<number>(0);

    const [result, setResult] = useState({
        odds: 0,
        profit: 0,
    });
    // Calculate picks: number of revealed safe cells (gems)
    const picks = mineAreas.filter(m => m.mined && m.mine === MINE_OBJECT.GEM).length;
    const profitAndOdds = calculateMinesGame(
        mineCount,
        picks,
        betAmount
    );
    const resetGame = () => {
        setResultVisible(false);
        setMineAreas([]);
        setStatus(GAME_STATUS.READY);
        setLoading(false);
    };

    const handleApiError = (point?: number) => {
        if (point !== undefined) {
            setMineAreas(mineAreas.filter((m) => m.point !== point));
        }
        setLoading(false);
    };

    const checkActiveGame = async () => {
        try {
            const { data } = await axiosServices.post(`${MINE_API}/status`, {
                walletAddress: address,
            });
            if (data.datas) {
                const { datas, amount, mines } = data;
                setStatus(GAME_STATUS.LIVE);
                setMineAreas(datas);
                setBetAmount(amount);
                setMineCount(mines);
            }
        } catch (error) {
            handleApiError();
        }
    };

    const createBet = async () => {
        if (loading) return;
        if (!address) {
            alert("Please connect your wallet");
            return;
        }

        // Check balance before creating bet
        if (!hasSufficientBalance(balance, betAmount)) {
            alert("Insufficient balance");
            return;
        }

        resetGame();
        setLoading(true);
        try {
            // First, deduct balance using unified API
            const betResult = await placeBetBalance(address, betAmount);
            if (!betResult.success) {
                alert(betResult.error || "Failed to place bet");
                setLoading(false);
                return;
            }

            // Then create the game
            const { data } = await axiosServices.post(`${MINE_API}/create`, {
                mines: mineCount,
                amount: betAmount,
                walletAddress: address,
            });

            if (data.status === "BET") {
                // Initialize empty grid with 25 cells
                const emptyGrid = Array.from({ length: 25 }, (_, index) => ({
                    point: index,
                    mine: null,
                    mined: false,
                }));
                setMineAreas(emptyGrid);
                setStatus(GAME_STATUS.LIVE);
            } else {
                checkActiveGame();
            }
        } catch (error) {
            console.error("Create bet error:", error);
            handleApiError();
        }
        setLoading(false);
    };

    const selectArea = async (point: number) => {
        if (status === GAME_STATUS.LIVE) return;
        const autoIndex = autoAreas.findIndex((m: MineArea) => m.point === point);
        if (autoIndex === -1) {
            setAutoAreas((prev) => [...prev, { point, mine: null, mined: false }]);
        } else {
            setAutoAreas([
                ...autoAreas.filter(
                    (m: MineArea, index: number) => index !== autoIndex
                ),
            ]);
        }
    };

    const placeBet = async (point: number) => {
        if (status !== GAME_STATUS.LIVE) return;
        const mine = mineAreas.find((m: MineArea) => m.point === point);
        if (mine && mine.mined) return;

        setLoading(true);

        // Don't add to array, just mark as selected (will be updated by API response)

        try {
            const { data } = await axiosServices.post(`${MINE_API}/bet`, {
                point,
                walletAddress: address,
            });

            if (data.status === "BET") {
                // Update all cells from API response
                const updatedAreas = data.datas.map((cell: any) => ({
                    point: cell.point,
                    mine: cell.mine === 'GEM' ? MINE_OBJECT.GEM : cell.mine === 'BOMB' ? MINE_OBJECT.BOMB : null,
                    mined: cell.mined || false,
                }));
                setMineAreas(updatedAreas);
            } else if (data.status === "END") {
                // Game ended - check if won or lost
                const hasBomb = data.datas.some((cell: any) => cell.mine === 'BOMB' && cell.mined);

                if (!hasBomb) {
                    // Won - add winnings
                    console.log('Mine Auto-Win - Cashing out:', { betAmount, multiplier: profitAndOdds.probability });
                    const cashoutResult = await cashoutBalance(address?.toString() || "", betAmount, profitAndOdds.probability);
                    console.log('Mine Auto-Win - Cashout result:', cashoutResult);
                    if (cashoutResult.success) {
                        console.log('Mine Auto-Win - New balance:', cashoutResult.newBalance);
                        setResult({
                            odds: profitAndOdds.probability,
                            profit: profitAndOdds.roundedWinAmount,
                        });
                        setResultVisible(true);
                    } else {
                        console.error('Mine Auto-Win - Cashout failed:', cashoutResult.error);
                    }
                }

                // Convert API response to our format
                const endAreas = data.datas.map((cell: any) => ({
                    point: cell.point,
                    mine: cell.mine === 'GEM' ? MINE_OBJECT.GEM : cell.mine === 'BOMB' ? MINE_OBJECT.BOMB : null,
                    mined: cell.mined || false,
                }));
                setMineAreas(endAreas);
                setStatus(GAME_STATUS.READY);
            }
        } catch (error) {
            console.error("Place bet error:", error);
            handleApiError(point);
        }
        setLoading(false);
    };

    const cashout = async () => {
        if (status !== GAME_STATUS.LIVE || loading || mineAreas.length === 0)
            return;
        if (!address) return;

        setLoading(true);
        try {
            // Calculate winnings based on current picks
            const multiplier = profitAndOdds.probability;
            const winnings = profitAndOdds.roundedWinAmount;
            
            console.log('Mine Cashout - Starting cashout:', { multiplier, winnings, betAmount });

            // Add winnings to balance using unified API
            const cashoutResult = await cashoutBalance(address, betAmount, multiplier);
            console.log('Mine Cashout - Cashout result:', cashoutResult);
            
            if (!cashoutResult.success) {
                alert(cashoutResult.error || "Failed to cashout");
                setLoading(false);
                return;
            }

            console.log('Mine Cashout - Balance updated, newBalance:', cashoutResult.newBalance);

            // Then process game cashout
            const { data } = await axiosServices.post(`${MINE_API}/cashout`, {
                walletAddress: address,
            });
            if (data.status === "END") {
                // Convert API response to our format
                const endAreas = data.datas.map((cell: any) => ({
                    point: cell.point,
                    mine: cell.mine === 'GEM' ? MINE_OBJECT.GEM : cell.mine === 'BOMB' ? MINE_OBJECT.BOMB : null,
                    mined: cell.mined || false,
                }));
                setMineAreas(endAreas);
                setResult({
                    odds: profitAndOdds.probability,
                    profit: profitAndOdds.roundedWinAmount,
                });
                setStatus(GAME_STATUS.READY);
                setResultVisible(true);
            } else checkActiveGame();
        } catch (error) {
            console.error('Mine Cashout - Error:', error);
        }
        setLoading(false);
    };

    const randomBet = async () => {
        const excludeArray = mineAreas.map((m) => m.point);
        const allNumbers: number[] = Array.from({ length: 25 }, (_, i) => i); // Creates an array [0, 1, 2, ..., 24]
        const availableNumbers = allNumbers.filter(
            (num) => !excludeArray.includes(num)
        ); // Exclude numbers

        if (availableNumbers.length === 0) {
            throw new Error("No available numbers to choose from");
        }

        const randomIndex = Math.floor(Math.random() * availableNumbers.length);
        placeBet(availableNumbers[randomIndex]);
    };

    const handleAmountChange = (amount: number) => {
        if (status === GAME_STATUS.READY) {
            setBetAmount(amount);
        }
    };

    const handleTabChange = (s: number) => {
        if (status === GAME_STATUS.READY) {
            setActiveTab(s);
            resetGame();
        }
    };

    const handleBetCount = (value: number) => {
        const count = value;
        if (count >= 0) {
            setAutoBetCount(value);
        }
        setInfinity(count === 0);
    };

    useEffect(() => {
        checkActiveGame();
    }, []);

    //------------------- auto -----------------------//

    // Function to start auto betting
    const autoBet = () => {
        if (loading) return;
        setLoading(true);
        setInfinity(autoBetCount === 0);
        setStatus(GAME_STATUS.LIVE);
    };

    // Function to stop auto betting
    const stopBet = () => {
        setLoading(false);
        setStatus(GAME_STATUS.READY);
    };

    // Function to handle the betting loop
    const runTimeBet = async () => {
        if (statusRef.current == GAME_STATUS.READY) return;

        setMineAreas([...autoAreas]);

        try {
            const { data } = await axiosServices.post(`${MINE_API}/autobet`, {
                points: autoAreas.map((a) => a.point),
                walletAddress: address,
            });

            if (data.status == "END") {
                let minedBombIndex = data.datas.findIndex(
                    (m: any) => m.mined && m.mine === 'BOMB'
                );
                if (minedBombIndex === -1) {
                    const _profitAndOdds = calculateMinesGame(
                        mineCount,
                        autoAreas.length,
                        1
                    );

                    setResult({
                        odds: _profitAndOdds.probability,
                        profit: _profitAndOdds.roundedWinAmount,
                    });
                    setResultVisible(true);
                    if (stopProfitA !== 0) {
                        setProfitA((prevCount) => {
                            if (prevCount + betAmount >= stopProfitA) {
                                stopBet();
                                return 0;
                            }
                            return prevCount + betAmount;
                        });
                    }
                } else {
                    if (stopLossA !== 0) {
                        setLossA((prevCount) => {
                            if (prevCount + betAmount >= stopLossA) {
                                stopBet();
                                return 0;
                            }
                            return prevCount + betAmount;
                        });
                    }
                }
                setMineAreas(data.datas);
            } else {
                stopBet();
            }
        } catch (error) {
            stopBet(); // Stop betting if the conditions aren't met
        }

        if (isInfinity) {
            setTimeout(() => {
                setResultVisible(false);
                setMineAreas([]);
                setTimeout(() => {
                    runTimeBet();
                }, 1000);
            }, 1500);
        } else if (autoBetCount > 0) {
            setTimeout(() => {
                setResultVisible(false);
                setMineAreas([]);
                setAutoBetCount((prevCount) => {
                    const newCount = prevCount > 0 ? prevCount - 1 : prevCount;
                    if (newCount == 0) {
                        stopBet(); // Stop betting when no more bets are left
                    }
                    return newCount;
                });
            }, 1500);
        } else {
            stopBet(); // Stop betting if the conditions aren't met
        }
    };

    // Automatically trigger the betting loop when autoBetCount or isAutoRun changes
    useEffect(() => {
        if (status === GAME_STATUS.LIVE && activeTab === 1) {
            setTimeout(runTimeBet, 1000); // Adjust delay as needed
        }
    }, [status, activeTab, autoBetCount]);

    // -------------auto end ---------------------//

    useEffect(() => {
        statusRef.current = status;
    }, [status]);

    useEffect(() => {
        if (autoAreas.length > 0) {
            setAreaFlag(true);
        }
    }, [autoAreas]);

    const disabled = GAME_STATUS.LIVE === status || loading;
    const isAuto = activeTab === 1;



    // Render mine count slider
    const renderMineCount = () => (
        <div className="flex flex-col space-y-2">
            <p className={`text-xs font-medium ${disabled ? "text-gray-400" : "text-gray-700"}`}>
                Mines
            </p>
            <div
                className={`flex items-center px-4 py-3 ${disabled ? "bg-gray-50" : "bg-white"
                    } rounded-xl border border-gray-200 hover:border-gray-400 transition-all duration-200 shadow-sm`}
            >
                <div className="min-w-[20px] text-sm font-semibold text-black">{mineCount}</div>
                <input
                    type="range"
                    min="1"
                    max="24"
                    disabled={disabled}
                    value={mineCount}
                    onChange={(e) => setMineCount(Number(e.target.value))}
                    className="mx-4 w-full h-2 bg-gray-200 rounded-lg cursor-pointer accent-black"
                />
                <div className="min-w-[20px] text-sm font-medium text-gray-400">24</div>
            </div>
        </div>
    );

    // Render mine status fields
    const renderMineStatus = () => (
        <div className="w-full space-y-3">
            <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col space-y-2">
                    <p className="text-xs font-medium text-gray-700">
                        Mines
                    </p>
                    <input
                        value={mineCount}
                        disabled
                        className="bg-gray-50 text-gray-900 font-medium border border-gray-200 rounded-lg w-full px-3 py-2.5 text-sm shadow-sm"
                    />
                </div>
                <div className="flex flex-col space-y-2">
                    <p className="text-xs font-medium text-gray-700">
                        Gems
                    </p>
                    <input
                        value={25 - mineCount - mineAreas.length}
                        disabled
                        className="bg-gray-50 text-gray-900 font-medium border border-gray-200 rounded-lg w-full px-3 py-2.5 text-sm shadow-sm"
                    />
                </div>
            </div>
        </div>
    );

    // Render pick random tile button
    const renderRandomPickBtn = () => (
        <Button
            onClick={randomBet}
            className="w-full font-semibold py-3  rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-900 border border-gray-200 shadow-sm transition-all duration-200"
        >
            Pick Random Tile
        </Button>
    );

    // Render bet button
    const renderBetBtn = () => {
        const disabledbtn =
            (!isAuto && loading) || (isAuto && autoAreas.length == 0);
        return (
            <div className="w-full space-y-2">
                <Button
                    disabled={disabledbtn}
                    onClick={() => {
                        if (!isAuto) {
                            if (!loading) {
                                if (status === GAME_STATUS.LIVE) {
                                    cashout();
                                } else {
                                    createBet();
                                }
                            }
                        } else {
                            if (status === GAME_STATUS.LIVE) {
                                stopBet();
                            } else {
                                if (!loading) {
                                    autoBet();
                                }
                            }
                        }
                    }}
                    className={`${disabledbtn ? "bg-gray-200" : "bg-black hover:bg-gray-900"
                        } ${disabledbtn ? "text-gray-400" : "text-white"} p-6 bg-sky-400 w-full hover:bg-sky-500 text-white rounded-3xl text-lg flex items-center gap-3 transition-colors`}
                >
                    <div className="flex items-center gap-2 text-nowrap">
                        {status === GAME_STATUS.LIVE
                            ? isAuto
                                ? "Stop Autobet"
                                : "CASHOUT"
                            : isAuto
                                ? "Start AutoBet"
                                : "BET"}
                        {loading && (
                            <div className=" flex items-center justify-center animate-spin">
                                <BombSvg />
                            </div>
                        )}
                    </div>
                </Button>
            </div>
        );
    };

    const renderStopProfitAmount = () => (
        <div className="space-y-2">
            <p className={`text-xs font-medium ${disabled ? "text-gray-400" : "text-gray-700"}`}>
                Stop on Profit
            </p>
            <div
                className={`flex w-full items-center border border-gray-200 hover:border-gray-400 ${disabled ? "bg-gray-50" : "bg-white"
                    } rounded-xl px-4 py-3 transition-all duration-200 shadow-sm`}
            >
                <input
                    disabled={disabled}
                    type="number"
                    min={0}
                    value={stopProfitA}
                    onChange={(e: any) => setStopProfitA(Number(e.target.value))}
                    placeholder="0.00"
                    className={`${disabled ? "bg-gray-50" : "bg-white"
                        } text-gray-900 font-medium w-full flex-1 text-sm focus:outline-none`}
                />
                <div className="w-5 ml-2">
                    <Image
                        src="/impAssets/Chip.webp"
                        alt="coin"
                        width={24}
                        height={24}
                    />
                </div>
            </div>
        </div>
    );

    const renderStopLossAmount = () => (
        <div className="space-y-2">
            <p className={`text-xs font-medium ${disabled ? "text-gray-400" : "text-gray-700"}`}>
                Stop on Loss
            </p>
            <div
                className={`flex w-full items-center border border-gray-200 hover:border-gray-400 ${disabled ? "bg-gray-50" : "bg-white"
                    } rounded-xl px-4 py-3 transition-all duration-200 shadow-sm`}
            >
                <input
                    disabled={disabled}
                    type="number"
                    min={0}
                    onChange={(e: any) => setStopLossA(Number(e.target.value))}
                    value={stopLossA}
                    placeholder="0.00"
                    className={`${disabled ? "bg-gray-50" : "bg-white"
                        } text-gray-900 font-medium w-full flex-1 text-sm focus:outline-none`}
                />
                <div className="w-5 ml-2">
                    <Image
                        src="/impAssets/Chip.webp"
                        alt="coin"
                        width={24}
                        height={24}
                    />
                </div>
            </div>
        </div>
    );

    return (
        <Layout>
            <div className="w-full min-h-[calc(100vh-80px)] px-2 sm:px-4 lg:px-6 py-6 md:py-8">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col lg:flex-row gap-4  rounded-2xl overflow-hidden shadow-2xl">
                        {/* Main Game Grid */}
                        <div className="flex-1 flex items-center justify-center p-2 md:p-6">
                            <div className="w-full max-w-2xl">
                                <div className={`grid grid-cols-5 gap-2 p-2 ${!areaFlag ? "animate-bounding" : ""}`}>
                                    {[...Array(25)].map((_, index) => {
                                        const mine = mineAreas.find((m) => m.point == index);
                                        const auto = isAuto
                                            ? autoAreas.findIndex((m) => m.point == index) !== -1
                                            : false;
                                        return (
                                            <motion.div
                                                key={index}
                                                whileHover={{
                                                    x: -1,
                                                    y: -1,
                                                }}
                                                className={`overflow-hidden hover:shadow-lg max-h-[126px] ${mineAreas.length == 0 ? "animate-zoomIn" : ""}`}
                                            >
                                                <MineButton
                                                    point={index}
                                                    mine={mine}
                                                    isAuto={auto}
                                                    onClick={isAuto ? selectArea : placeBet}
                                                />
                                            </motion.div>
                                        );
                                    })}
                                </div>
                                <MineModal
                                    visible={resultVisible}
                                    data={{
                                        odds: result.odds,
                                        profit: result.profit,
                                        coin: null,
                                    }}
                                />
                            </div>
                        </div>

                        {/* Control Panel */}
                        <div className="w-full lg:w-[380px] bg-white border-t lg:border-t-0 lg:border-l border-gray-200 rounded-t-2xl lg:rounded-t-none px-5 py-6 lg:p-6">
                            {status === GAME_STATUS.LIVE &&
                                <motion.div
                                    initial={{ y: "-100%" }}
                                    animate={{ y: 0 }}
                                    transition={{ duration: 0.6, ease: "easeOut" }}
                                    className="absolute h-[10vh] top-0 left-0 right-0 z-50 bg-white shadow-lg"
                                >
                                    <div className="h-full flex items-center justify-between px-4">
                                        {/* Left: Bet Info */}
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-medium uppercase tracking-wider">Bet</span>
                                            <div className="flex items-center gap-1">
                                                <Image src="/impAssets/Chip.webp" alt="coin" width={16} height={16} />
                                                <span className="text-sm font-bold">{(Number(betAmount) || 0).toFixed(2)}</span>
                                            </div>
                                        </div>

                                        {/* Center: Multiplier */}
                                        <div className="flex flex-col items-center">
                                            <span className="text-[10px] font-medium uppercase tracking-wider">Multiplier</span>
                                            <motion.div
                                                animate={{
                                                    scale: [1, 1.1, 1],
                                                    color: picks > 0 ? ["#000000", "#fef08a", "#000000"] : "#000000"
                                                }}
                                                transition={{ duration: 0.5 }}
                                                className="text-2xl font-black "
                                            >
                                                {(Number(profitAndOdds?.probability) || 0).toFixed(2)}x
                                            </motion.div>
                                        </div>

                                        {/* Right: Potential Win */}
                                        <div className="flex flex-col items-end">
                                            <span className="text-[10px] font-medium uppercase tracking-wider">Win</span>
                                            <div className="flex items-center gap-1">
                                                <motion.span
                                                    animate={{ scale: picks > 0 ? [1, 1.05, 1] : 1 }}
                                                    transition={{ duration: 0.3 }}
                                                    className="text-sm font-bold text-blue-500"
                                                >
                                                    +{(Number(profitAndOdds?.roundedWinAmount) || 0).toFixed(2)}
                                                </motion.span>
                                                <Image src="/impAssets/Chip.webp" alt="coin" width={16} height={16} />
                                            </div>
                                            <span className="text-[9px] font-medium">{picks} gem{picks !== 1 ? 's' : ''} 💎</span>
                                        </div>
                                    </div>
                                </motion.div>}


                            {isAuto ? (
                                <div className="flex flex-col space-y-3">
                                    <AmountInput value={betAmount} onChange={handleAmountChange} disabled={disabled} />
                                    {renderMineCount()}
                                    <BetNumberInput value={autoBetCount} disabled={disabled} onChange={handleBetCount} />
                                    <MineCustomInput
                                        onChange={(value) => setOnWinP(value)}
                                        value={onWinP}
                                        label={"On Win"}
                                        disabled={disabled}
                                    />
                                    <MineCustomInput
                                        onChange={(value) => setOnLossP(value)}
                                        value={onLossP}
                                        label={"On Loss"}
                                        disabled={disabled}
                                    />
                                    {renderStopProfitAmount()}
                                    {renderStopLossAmount()}
                                    {renderBetBtn()}
                                    <SwitchTab onChange={handleTabChange} active={activeTab} disabled={disabled} />
                                </div>
                            ) : (
                                <div className="flex flex-col gap-4">
                                    {renderBetBtn()}
                                    <AmountInput value={betAmount} onChange={handleAmountChange} disabled={disabled} />
                                    {status === GAME_STATUS.READY && renderMineCount()}
                                    {status === GAME_STATUS.LIVE && renderMineStatus()}
                                    {status === GAME_STATUS.LIVE && (
                                        <ProfitAmount
                                            disabled={disabled}
                                            multiplier={profitAndOdds.probability}
                                            profit={profitAndOdds.roundedWinAmount}
                                            icon={<Image src="/impAssets/Chip.webp" alt="coin" width={24} height={24} />}
                                        />
                                    )}
                                    <SwitchTab onChange={handleTabChange} active={activeTab} disabled={disabled} />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default MineGame