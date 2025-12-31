"use client"

import AmountInput from "@/components/shared/AmountInput";
import BetNumberInput from "@/components/shared/BetNumberInput";
import GameCanvas from "@/components/games/Crash/CrashXCanvas";
import GameHistory from "@/components/shared/GameHistory";
import MultiPlierInput from "@/components/shared/MultiplierInput";
import ProfitAmount from "@/components/shared/ProfitAmount";
import StopProfitAmount from "@/components/shared/StopProfitAmount";
import { EthSvg, InfinitySvg } from "@/components/svgs";
import SwitchTab from "@/components/shared/SwitchTab";
import VerifyModal from "@/components/shared/VerifyModal";

import Layout from "@/layout/layout";
import { useAccount } from "wagmi";
import { useUserBalance } from "@/hooks/useUserBalance";
import { placeBet as placeBetBalance, cashout as cashoutBalance, hasSufficientBalance } from "@/lib/game-balance";
import { GameBalanceDisplay } from "@/components/shared/GameBalanceDisplay";
import { Button } from "@/components/ui/button";
import React, { useEffect, useRef, useState } from "react";
import axiosServices from "@/util/axios";
import Image from "next/image";
import { motion } from "motion/react";



const GAME_STATES = {
    NotStarted: 1,
    Starting: 2,
    InProgress: 3,
    Over: 4,
    Blocking: 5,
    Refunded: 6,
};

const CRASH_API = "/api/crash";





const SelectedPaymentIcon = ({ currency }: any) => {
    if (currency && currency?.symbol) {
        return <img src={currency.icon} className="w-6 h-6" alt="currency" />;
    } else {
        return <EthSvg />;
    }
};

const playSound = (audioFile: any) => {
    try {
        audioFile.play().catch((error: any) => {
            console.error("Error playing sound:", error);
        });
    } catch (error) {
        console.log(error);
    }
};

const CrashGame = () => {
    const { address } = useAccount();
    const { balance, isLoading: isLoadingBalance } = useUserBalance();

    const [activeTab, setActiveTab] = useState(0);

    const [subActiveTab, setSubActiveTab] = useState(0);

    const [gameId, setGameId] = useState("");
    const [betAmount, setBetAmount] = useState(0);
    const [target, setTarget] = useState(0);
    const [gameState, setGameState] = useState(GAME_STATES.NotStarted);
    const [payout, setPayout] = useState(1);
    const [crashed, setCrashed] = useState(false);
    const [betting, setBetting] = useState(false);
    const [cashedOut, setCashedOut] = useState(false);
    const [cashedOutMultiplier, setCashedOutMultiplier] = useState(0);
    const [loading, setLoading] = useState(false);
    const [history, setHistory] = useState<any[]>([]);
    const [verifyId, setGameVerifyId] = useState("");
    const [startTime, setStartTime] = useState<any>(null);
    const [amountInputFlag, setAmountInputFlag] = useState(true);


    const [autoBetCount, setAutoCount] = useState(0);
    const [stopProfitA, setStopPorfitA] = useState(0);
    const [stopLossA, setStopLossA] = useState(0);
    const [autoBetEnabled, setAutoBetEnabled] = useState(false);
    const [plannedBet, setPlannedBet] = useState(false);
    const [joining, setJoining] = useState(false);
    const [savebetAmount, setBetSaveAmount] = useState(0);
    const [players, setPlayers] = useState<any[]>([]);


    const currency: any = {};

    const gameIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const gameStartTimeRef = useRef<number>(0);
    const crashPointRef = useRef<number>(0);
    const payoutRef = useRef<number>(1);
    const cashedOutRef = useRef<boolean>(false);
    const cashedOutMultiplierRef = useRef<number>(0);



    const clickBet = async () => {
        if (!address) {
            alert("Please connect your wallet first");
            return;
        }

        if (betAmount <= 0) {
            alert("Please input your bet amount!");
            return;
        }


        if (!hasSufficientBalance(balance, betAmount)) {
            alert("Insufficient balance");
            return;
        }

        if (gameState === GAME_STATES.InProgress || gameState === GAME_STATES.Starting) {
            alert("Game already in progress!");
            return;
        }

        setLoading(true);
        try {

            const betResult = await placeBetBalance(address, betAmount);
            if (!betResult.success) {
                alert(betResult.error || "Failed to place bet");
                setLoading(false);
                return;
            }


            const response = await axiosServices.post(`${CRASH_API}/create`, {
                walletAddress: address,
                betAmount,
                target: target || 0,
            });

            const data = response.data;

            if (data && data.success) {
                setGameId(data.gameId);
                setGameState(GAME_STATES.Starting);
                payoutRef.current = 1;
                setPayout(1);
                setCrashed(false);
                setCashedOut(false);
                setCashedOutMultiplier(0);
                cashedOutRef.current = false;
                cashedOutMultiplierRef.current = 0;
                setBetting(true);
                setBetSaveAmount(betAmount);


                if (data.crashPoint) {
                    crashPointRef.current = data.crashPoint;
                } else {

                    try {
                        const statusResponse = await axiosServices.post(`${CRASH_API}/status`, {
                            walletAddress: address,
                        });

                        if (statusResponse.data && statusResponse.data.success) {
                            crashPointRef.current = statusResponse.data.crashPoint;
                        }
                    } catch (statusError) {
                        console.error("Status API error:", statusError);
                    }
                }


                setTimeout(() => {
                    startGame();
                }, 3000);
            } else {
                console.error("Create game response:", data);
                alert(data?.error || "Failed to create game");
                setLoading(false);
                setBetting(false);
            }
        } catch (error: any) {
            console.error("Create game error:", error);
            const errorMessage = error?.response?.data?.error || error?.message || "Failed to create game";
            alert(errorMessage);
            setLoading(false);
            setBetting(false);
        }
    };

    const startGame = async () => {
        setGameState(GAME_STATES.InProgress);
        const now = Date.now();
        gameStartTimeRef.current = now;
        setStartTime(now);
        setLoading(false);


        try {
            console.log("Starting game on server...");
            const statusResponse = await axiosServices.post(`${CRASH_API}/status`, {
                walletAddress: address,
                action: 'start'
            });
            console.log("Game started on server:", statusResponse.data);
        } catch (error) {
            console.error("Failed to update game status:", error);
        }


        gameIntervalRef.current = setInterval(() => {
            const elapsed = (Date.now() - gameStartTimeRef.current) / 1000;
            const currentMultiplier = Math.min(1.00 + (elapsed * 0.1), crashPointRef.current);

            const roundedPayout = Math.round(currentMultiplier * 100) / 100;
            payoutRef.current = roundedPayout;
            setPayout(roundedPayout);


            if (currentMultiplier >= crashPointRef.current) {

                if (gameIntervalRef.current) {
                    clearInterval(gameIntervalRef.current);
                    gameIntervalRef.current = null;
                }
                setGameState(GAME_STATES.Over);
                setCrashed(true);
                setBetting(false);


                const historyItem = {
                    _id: gameId || `game_${Date.now()}`,
                    crashPoint: crashPointRef.current,
                    multiplier: cashedOutRef.current ? cashedOutMultiplierRef.current : crashPointRef.current,
                    cashedOut: cashedOutRef.current,
                };
                setHistory(prev => [historyItem, ...prev.slice(0, 5)]);
            }
        }, 100);
    };


    const handleAutoBetChange = (value: any) => {

    };


    const clickCashout = async () => {

        const currentPayout = payoutRef.current;
        console.log("💰 clickCashout called:", {
            address,
            currentPayout,
            payoutState: payout,
            gameState,
            cashedOut,
            betAmount,
            gameId
        });

        if (!address) {
            console.error("❌ No wallet address");
            alert("Please connect your wallet first");
            return;
        }

        if (gameState !== GAME_STATES.InProgress) {
            console.error("❌ Game not in progress", gameState);
            alert("No active game to cash out");
            return;
        }

        if (cashedOut) {
            console.log("❌ Already cashed out");
            return;
        }

        if (!gameId) {
            console.error("❌ No game ID");
            alert("Game not properly initialized");
            return;
        }


        if (currentPayout <= 1) {
            console.log("❌ Payout is 1 or less, game not running. Current payout:", currentPayout);
            return;
        }

        console.log("✅ Proceeding with cashout... Payout:", currentPayout);

        setLoading(true);
        try {


            const currentMultiplier = currentPayout;
            console.log("Attempting cashout:", { currentMultiplier, betAmount, gameId });


            const response = await axiosServices.post(`${CRASH_API}/cashout`, {
                walletAddress: address,
                multiplier: currentMultiplier,
            });

            const cashoutData = response.data;
            console.log("Cashout API response:", cashoutData);

            if (cashoutData && cashoutData.success) {

                const finalMultiplier = cashoutData.multiplier || currentMultiplier;

                const betToUse = savebetAmount || betAmount;
                console.log("Cashout successful, adding winnings:", { finalMultiplier, betToUse });


                const cashoutResult = await cashoutBalance(address, betToUse, finalMultiplier);
                console.log("Cashout balance result:", cashoutResult);

                if (cashoutResult.success) {

                    setCashedOut(true);
                    setCashedOutMultiplier(finalMultiplier);
                    cashedOutRef.current = true;
                    cashedOutMultiplierRef.current = finalMultiplier;

                    if (gameIntervalRef.current) {
                        clearInterval(gameIntervalRef.current);
                        gameIntervalRef.current = null;
                    }

                    setGameState(GAME_STATES.Over);
                    setBetting(false);
                    setLoading(false);

                    console.log("✅ Cashed out at", finalMultiplier + "x", "Game reset for next round");
                } else {
                    console.error("Cashout balance error:", cashoutResult);
                    alert(cashoutResult.error || "Failed to add winnings to balance");
                    setLoading(false);
                }
            } else {
                console.error("Cashout API error:", cashoutData);
                alert(cashoutData?.error || "Failed to cashout");
                setLoading(false);
            }
        } catch (error: any) {
            console.error("Cashout error:", error);
            const errorMessage = error?.response?.data?.error || error?.message || "Failed to cashout";
            console.error("Error details:", error?.response?.data);
            alert(errorMessage);
            setLoading(false);
        }
    };


    const onTargetChange = (value: any) => {
        const numValue = parseFloat(value) || 0;
        setTarget(numValue);
    };


    useEffect(() => {
        if (gameState === GAME_STATES.InProgress && !cashedOut && target > 0 && address) {
            if (payout >= target) {
                clickCashout();
            }
        }

    }, [payout, target, gameState, cashedOut, address]);

    useEffect(() => {
        if (gameState === GAME_STATES.Over) {
            const resetTimer = setTimeout(() => {
                setGameState(GAME_STATES.NotStarted);
                setCashedOut(false);
                setCashedOutMultiplier(0);
                setCrashed(false);
                setPayout(1);
            }, 3000);

            return () => clearTimeout(resetTimer);
        }
    }, [gameState]);



    const disabled = loading || (betting && gameState !== GAME_STATES.InProgress) || gameState === GAME_STATES.Starting;
    const isAuto = activeTab === 1;

    return (
        <Layout>
            <div className="w-full min-h-[calc(100vh-80px)] px-2 sm:px-4 lg:px-6 py-4 md:py-6">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col lg:flex-row gap-4  overflow-hidden">

                        <div className="flex-1 flex flex-col">
                            <div className="w-full h-[40vh] md:h-[50vh] lg:h-[60vh] bg-gradient-to-br from-gray-900 to-black">
                                <GameCanvas
                                    status={gameState}
                                    payout={payout}
                                    startTime={startTime}
                                />

                                {(gameState === GAME_STATES.InProgress || (gameState === GAME_STATES.Over && (cashedOut || crashed))) && (
                                    <motion.div
                                        initial={{ y: "-100%" }}
                                        animate={{ y: 0 }}
                                        transition={{ duration: 0.6, ease: "easeOut" }}
                                        className={`absolute h-[10vh] top-0 left-0 right-0 z-50 shadow-lg ${crashed && !cashedOut ? 'bg-red-50 border-2 border-red-500' : 'bg-white'
                                            }`}
                                    >
                                        <div className="h-full flex items-center justify-between px-6">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] text-gray-600 font-medium uppercase tracking-wider">Bet</span>
                                                <div className="flex items-center gap-1.5">
                                                    <Image src="/impAssets/Chip.webp" alt="coin" width={18} height={18} />
                                                    <span className="text-base font-bold text-gray-900">{(Number(savebetAmount) || 0).toFixed(2)}</span>
                                                </div>
                                            </div>

                                            <div className="flex flex-col items-center">
                                                <span className="text-[10px] text-gray-600 font-medium uppercase tracking-wider">
                                                    {crashed && !cashedOut ? "Crashed @" : cashedOut ? "Cashed @" : "Multiplier"}
                                                </span>
                                                <motion.div
                                                    animate={{
                                                        scale: gameState === GAME_STATES.InProgress ? [1, 1.08, 1] : 1,
                                                        color: crashed && !cashedOut ? "#dc2626" : cashedOut ? "#10b981" : "#000000"
                                                    }}
                                                    transition={{ duration: 0.4, repeat: gameState === GAME_STATES.InProgress ? Infinity : 0 }}
                                                    className="text-3xl font-black"
                                                >
                                                    {crashed && !cashedOut
                                                        ? `${crashPointRef.current.toFixed(2)}x`
                                                        : cashedOut
                                                            ? `${cashedOutMultiplier.toFixed(2)}x`
                                                            : `${payout.toFixed(2)}x`
                                                    }
                                                </motion.div>
                                            </div>

                                            <div className="flex flex-col items-end">
                                                <span className="text-[10px] text-gray-600 font-medium uppercase tracking-wider">
                                                    {crashed && !cashedOut ? "Lost" : cashedOut ? "Won" : "Potential"}
                                                </span>
                                                <div className="flex items-center gap-1.5">
                                                    <motion.span
                                                        animate={{
                                                            scale: gameState === GAME_STATES.InProgress ? [1, 1.05, 1] : 1
                                                        }}
                                                        transition={{ duration: 0.3, repeat: gameState === GAME_STATES.InProgress ? Infinity : 0 }}
                                                        className={`text-base font-bold ${crashed && !cashedOut ? 'text-red-600' : cashedOut ? 'text-emerald-600' : 'text-blue-600'
                                                            }`}
                                                    >
                                                        {crashed && !cashedOut
                                                            ? `-${(savebetAmount || 0).toFixed(2)}`
                                                            : cashedOut
                                                                ? `+${((savebetAmount || 0) * cashedOutMultiplier).toFixed(2)}`
                                                                : `+${((savebetAmount || 0) * payout).toFixed(2)}`
                                                        }
                                                    </motion.span>
                                                    <Image src="/impAssets/Chip.webp" alt="coin" width={18} height={18} />
                                                </div>
                                                {cashedOut && gameState === GAME_STATES.Over && (
                                                    <motion.span
                                                        initial={{ opacity: 0, y: -5 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        className="text-[9px] text-amber-600 font-semibold mt-0.5"
                                                    >
                                                        Safe! 🎉
                                                    </motion.span>
                                                )}
                                                {crashed && !cashedOut && gameState === GAME_STATES.Over && (
                                                    <motion.span
                                                        initial={{ opacity: 0, y: -5 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        className="text-[9px] text-red-600 font-semibold mt-0.5"
                                                    >
                                                        Busted! 💥
                                                    </motion.span>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </div>
                        </div>


                        <div className="w-full lg:w-[380px] bg-white rounded-2xl p-5 lg:p-6">

                            <div className="flex flex-col space-y-3">
                                <div className="">
                                    {isAuto ? (
                                        <Button
                                            className="p-6 bg-sky-400 w-full hover:bg-sky-500 text-white rounded-3xl text-lg flex items-center gap-3 transition-colors"
                                            disabled={
                                                betting &&
                                                gameState !== GAME_STATES.InProgress &&
                                                !autoBetEnabled
                                            }
                                            onClick={() => {
                                                if (!betting) {
                                                    if (autoBetEnabled) {
                                                        handleAutoBetChange(false);
                                                    } else {
                                                        clickBet();
                                                        handleAutoBetChange(true);
                                                    }
                                                } else if (
                                                    gameState === GAME_STATES.InProgress &&
                                                    !cashedOut
                                                ) {
                                                    clickCashout();
                                                } else if (autoBetEnabled) {
                                                    handleAutoBetChange(false);
                                                }
                                            }}
                                        >
                                            {!betting
                                                ? autoBetEnabled
                                                    ? "Stop Autobet"
                                                    : "Start Autobet"
                                                : gameState === GAME_STATES.InProgress && !cashedOut
                                                    ? "CASHOUT"
                                                    : autoBetEnabled
                                                        ? "Stop Autobet"
                                                        : "Finishing Bet"}
                                        </Button>
                                    ) : (
                                        <Button
                                            type="button"
                                            className={`p-6 bg-sky-400 w-full hover:bg-sky-500 text-white rounded-3xl text-lg flex items-center gap-3 transition-colors`}
                                            disabled={loading}
                                            onClick={async (e) => {
                                                e.preventDefault();
                                                e.stopPropagation();

                                                if (loading) {
                                                    return;
                                                }

                                                if (gameState === GAME_STATES.InProgress && payout > 1 && !cashedOut) {
                                                    await clickCashout();
                                                } else {
                                                    clickBet();
                                                }
                                            }}
                                        >
                                            {!betting
                                                ? joining
                                                    ? "BETTING..."
                                                    : plannedBet
                                                        ? "CANCEL BET"
                                                        : "Place Bet"
                                                : cashedOut
                                                    ? `CASHED OUT @ ${cashedOutMultiplier.toFixed(2)}x`
                                                    : "CASHOUT"}
                                        </Button>
                                    )}
                                </div>

                                {(!isAuto || subActiveTab !== 1) && (
                                    <>
                                        <AmountInput
                                            disabled={disabled}
                                            value={betAmount}
                                            onChange={setBetAmount}
                                        />
                                        <MultiPlierInput
                                            disabled={disabled}
                                            value={target}
                                            onChange={onTargetChange}
                                        />
                                    </>
                                )}

                                {isAuto && subActiveTab !== 1 && (
                                    <>
                                        <BetNumberInput
                                            disabled={disabled}
                                            value={autoBetCount}
                                            onChange={setAutoCount}
                                            Icon={<Image src={"/impAssets/Chip.webp"} alt="ETH" width={20} height={20} />}
                                        />
                                        <StopProfitAmount
                                            disabled={disabled}
                                            Label={"Stop on Profit"}
                                            onChange={setStopPorfitA}
                                            value={stopProfitA}
                                            Icon={<Image src={"/impAssets/Chip.webp"} alt="ETH" width={20} height={20} />}
                                        />
                                        <StopProfitAmount
                                            disabled={disabled}
                                            Label={"Loss on Profit"}
                                            onChange={setStopLossA}
                                            value={stopLossA}
                                            Icon={<Image src={"/impAssets/Chip.webp"} alt="ETH" width={20} height={20} />}
                                        />
                                    </>
                                )}

                                <ProfitAmount
                                    multiplier={payout}
                                    disabled={true}
                                    profit={payout * savebetAmount}
                                    icon={<Image src={"/impAssets/Chip.webp"} alt="ETH" width={20} height={20} />}
                                />

                                <SwitchTab
                                    onChange={setActiveTab}
                                    disabled={disabled}
                                    active={activeTab}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <VerifyModal
                Label={"crash"}
                gameId={verifyId}
                setGameId={() => setGameVerifyId("")}
            />
        </Layout>
    );
};

export default CrashGame;

const parseCommasToThousands = (value: number) =>
    value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

const cutDecimalPoints = (num: any) =>
    num.toString().match(/^-?\d+(?:\.\d{0,2})?/)[0];

const NetStatus = ({ payout }: { payout: number }) => {
    const [netStatus, setNetStatus] = useState(false);

    useEffect(() => {
        setNetStatus(true);
        const timer = setTimeout(() => setNetStatus(false), 500);
        return () => {
            clearTimeout(timer);
        };
    }, [payout]);

    return (
        <div
            className={`w-[10px] h-[10px] rounded-full  bg-[#24db5b] ${netStatus ? " animate-zoom " : ""
                }`}
        />
    );
};
