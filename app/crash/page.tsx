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
import useIsMobile from "@/hooks/useIsMobile";
import Layout from "@/layout/layout";
import { useAccount } from "wagmi";
import { useUserBalance } from "@/hooks/useUserBalance";
import { placeBet as placeBetBalance, cashout as cashoutBalance, hasSufficientBalance } from "@/lib/game-balance";
import { GameBalanceDisplay } from "@/components/shared/GameBalanceDisplay";
import { Button } from "@/components/ui/button";
import React, { useEffect, useRef, useState } from "react";
import axiosServices from "@/util/axios";



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
    const isMobile = useIsMobile();
    const { address } = useAccount();
    const { balance, isLoading: isLoadingBalance } = useUserBalance();

    const [activeTab, setActiveTab] = useState(0);

    const [subActiveTab, setSubActiveTab] = useState(0);

    const [gameId, setGameId] = useState("");
    const [betAmount, setBetAmount] = useState(0);
    const [target, setTarget] = useState(0); // 0 means no target (optional)
    const [gameState, setGameState] = useState(GAME_STATES.NotStarted);
    const [payout, setPayout] = useState(1);
    const [crashed, setCrashed] = useState(false);
    const [betting, setBetting] = useState(false);
    const [cashedOut, setCashedOut] = useState(false);
    const [loading, setLoading] = useState(false);
    const [history, setHistory] = useState<any[]>([]);
    const [verifyId, setGameVerifyId] = useState("");
    const [startTime, setStartTime] = useState<any>(null);
    const [amountInputFlag, setAmountInputFlag] = useState(true);

    // Auto bet related states
    const [autoBetCount, setAutoCount] = useState(0);
    const [stopProfitA, setStopPorfitA] = useState(0);
    const [stopLossA, setStopLossA] = useState(0);
    const [autoBetEnabled, setAutoBetEnabled] = useState(false);
    const [plannedBet, setPlannedBet] = useState(false);
    const [joining, setJoining] = useState(false);
    const [savebetAmount, setBetSaveAmount] = useState(0);
    const [players, setPlayers] = useState<any[]>([]);

    // Currency object (can be extended later for multi-currency support)
    const currency: any = {};

    const gameIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const gameStartTimeRef = useRef<number>(0);
    const crashPointRef = useRef<number>(0);
    const payoutRef = useRef<number>(1); // Track current payout


    // Start new game
    const clickBet = async () => {
        if (!address) {
            alert("Please connect your wallet first");
            return;
        }

        if (betAmount <= 0) {
            alert("Please input your bet amount!");
            return;
        }

        // Check balance before placing bet
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
            // First, deduct balance using unified API
            const betResult = await placeBetBalance(address, betAmount);
            if (!betResult.success) {
                alert(betResult.error || "Failed to place bet");
                setLoading(false);
                return;
            }

            // Create game (target is optional, 0 means no target)
            const response = await axiosServices.post(`${CRASH_API}/create`, {
                walletAddress: address,
                betAmount,
                target: target || 0, // Send 0 if target not set
            });

            const data = response.data;

            if (data && data.success) {
                setGameId(data.gameId);
                setGameState(GAME_STATES.Starting);
                payoutRef.current = 1;
                setPayout(1);
                setCrashed(false);
                setCashedOut(false);
                setBetting(true);
                setBetSaveAmount(betAmount);

                // Use crash point from create response or get from status
                if (data.crashPoint) {
                    crashPointRef.current = data.crashPoint;
                } else {
                    // Fallback: get from status
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

                // Start game after 3 seconds
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

        // Update game status on server to 'running'
        try {
            await axiosServices.post(`${CRASH_API}/status`, {
                walletAddress: address,
            });
        } catch (error) {
            console.error("Failed to update game status:", error);
        }

        // Update multiplier every 100ms
        gameIntervalRef.current = setInterval(() => {
            const elapsed = (Date.now() - gameStartTimeRef.current) / 1000;
            const currentMultiplier = Math.min(1.00 + (elapsed * 0.1), crashPointRef.current);

            const roundedPayout = Math.round(currentMultiplier * 100) / 100;
            payoutRef.current = roundedPayout;
            setPayout(roundedPayout);

            // Check if crashed
            if (currentMultiplier >= crashPointRef.current) {
                endGame(false);
            }
        }, 100);
    };

    const endGame = (didCashout: boolean) => {
        if (gameIntervalRef.current) {
            clearInterval(gameIntervalRef.current);
            gameIntervalRef.current = null;
        }

        setGameState(GAME_STATES.Over);
        setCrashed(!didCashout);
        setBetting(false);

        if (didCashout) {
            setCashedOut(true);
        } else {
            // Player lost - balance already deducted
            setCashedOut(false);
        }

        // Add to history
        const historyItem = {
            _id: gameId || `game_${Date.now()}`,
            crashPoint: crashPointRef.current,
            multiplier: payout,
            cashedOut: didCashout,
        };
        setHistory(prev => [historyItem, ...prev.slice(0, 5)]);
    };

    // Switch to auto betting (simplified - not using socket)
    const handleAutoBetChange = (value: any) => {
        // Auto betting can be implemented later if needed
    };

    // Cashout
    const clickCashout = async () => {
        // Use ref to get CURRENT payout (not stale state)
        const currentPayout = payoutRef.current;
        console.log("💰 clickCashout called:", {
            address,
            currentPayout,
            payoutState: payout,
            gameState,
            cashedOut,
            betAmount
        });

        if (!address) {
            console.error("❌ No wallet address");
            alert("Please connect your wallet first");
            return;
        }

        if (cashedOut) {
            console.log("❌ Already cashed out");
            return;
        }

        // If payout <= 1, game hasn't really started
        if (currentPayout <= 1) {
            console.log("❌ Payout is 1 or less, game not running. Current payout:", currentPayout);
            return;
        }

        console.log("✅ Proceeding with cashout... Payout:", currentPayout);

        setLoading(true);
        try {
            // Stop the interval first
            if (gameIntervalRef.current) {
                clearInterval(gameIntervalRef.current);
                gameIntervalRef.current = null;
            }

            // Use current payout from ref as multiplier
            const currentMultiplier = currentPayout;
            console.log("Attempting cashout:", { currentMultiplier, betAmount, gameId });

            // Call cashout API
            const response = await axiosServices.post(`${CRASH_API}/cashout`, {
                walletAddress: address,
            });

            const cashoutData = response.data;
            console.log("Cashout API response:", cashoutData);

            if (cashoutData && cashoutData.success) {
                // Use multiplier from API response or current payout
                const finalMultiplier = cashoutData.multiplier || currentMultiplier;
                console.log("Cashout successful, adding winnings:", { finalMultiplier, betAmount });

                // Add winnings to balance
                const cashoutResult = await cashoutBalance(address, betAmount, finalMultiplier);
                console.log("Cashout balance result:", cashoutResult);

                if (cashoutResult.success) {
                    endGame(true);
                    setLoading(false);
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

    // handle target value (0 means no target)
    const onTargetChange = (value: any) => {
        const numValue = parseFloat(value) || 0;
        setTarget(numValue);
    };

    // Auto cashout if target reached (only if target is set > 0)
    useEffect(() => {
        if (gameState === GAME_STATES.InProgress && !cashedOut && target > 0 && address) {
            if (payout >= target) {
                clickCashout();
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [payout, target, gameState, cashedOut, address]);

    // Disabled for betting inputs, but NOT for cashout button when game is in progress
    const disabled = loading || (betting && gameState !== GAME_STATES.InProgress) || gameState === GAME_STATES.Starting;
    const isAuto = activeTab === 1;

    return (
        <Layout>
            <div className="flex w-full justify-center h-full">
                <div className="w-full h-full flex justify-center">
                    <div
                        className={`flex flex-col w-full h-full`}
                    >
                        <div
                            className={`w-full h-[40vh]`}
                        >
                            {/* <div className="absolute top-4 z-10 left-5 max-w-[70%]">
                                <div className="flex space-x-2 items-center">
                                    {history
                                        .slice(isMobile ? 3 : 0, 6)
                                        .map((item: any, key: number) => {
                                            const opacity = `opacity-${key + 4
                                                }0 hover:opacity-100 transition-all`;
                                            return (
                                                <div
                                                    key={key}
                                                    className={`text-gray-900 font-semibold bg-gray-100 px-2 py-1 rounded-lg animate-zoomIn cursor-pointer hover:bg-gray-200 transition-colors shadow-sm`}
                                                    onClick={() => setGameVerifyId(item._id)}
                                                >
                                                    {item.crashPoint < 1.2 ? (
                                                        <div
                                                            className={`px-1 rounded-full overflow-hidden  ${opacity}`}
                                                        >
                                                            {parseCommasToThousands(
                                                                cutDecimalPoints(item.crashPoint.toFixed(2))
                                                            )}
                                                            x
                                                        </div>
                                                    ) : item.crashPoint >= 1.2 && item.crashPoint < 2 ? (
                                                        <div
                                                            className={` px-1 rounded-full overflow-hidden  ${opacity}`}
                                                        >
                                                            {" "}
                                                            {parseCommasToThousands(
                                                                cutDecimalPoints(item.crashPoint.toFixed(2))
                                                            )}
                                                            x
                                                        </div>
                                                    ) : item.crashPoint >= 2 && item.crashPoint < 100 ? (
                                                        <div
                                                            className={` px-1 rounded-full overflow-hidden ${opacity}`}
                                                        >
                                                            {parseCommasToThousands(
                                                                cutDecimalPoints(item.crashPoint.toFixed(2))
                                                            )}
                                                            x
                                                        </div>
                                                    ) : (
                                                        <div
                                                            className={`px-1 rounded-full overflow-hidden  ${opacity}`}
                                                        >
                                                            {" "}
                                                            {parseCommasToThousands(
                                                                cutDecimalPoints(item.crashPoint.toFixed(2))
                                                            )}
                                                            x
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    <GameHistory Label={"crash"} setGameId={setGameVerifyId} />
                                </div>
                            </div> */}
                            {/* <span className="absolute top-4 right-5 z-10 h-6 text-base crash-game-status">
                                <div className="flex items-center">
                                    <div className="p-2">
                                        <NetStatus payout={payout} />
                                    </div>
                                </div>
                            </span> */}
                            <GameCanvas
                                status={gameState}
                                payout={payout}
                                startTime={startTime}
                            />
                        </div>

                        {/* controls */}
                        <div className="h-full flex justify-center mt-4 ">
                            {/* {!isMobile && (
                                <div className="col-span-1 p-6 min-h-[560px] bg-white border-l border-gray-200 shadow-sm flex flex-col justify-between xl:w-[340px]">
                                    <div className="gap-1 flex flex-col space-y-1">
                                        {address && <div className="mb-6 pb-5 border-b border-gray-100"><GameBalanceDisplay /></div>}
                                        <SwitchTab
                                            onChange={(e) => setActiveTab(e)}
                                            disabled={disabled}
                                            active={activeTab}
                                        />
                                        {isAuto && (
                                            <SwitchTab
                                                onChange={setSubActiveTab}
                                                disabled={false}
                                                active={subActiveTab}
                                                options={["Controls", "Leaderboard"]}
                                                type={"sub"}
                                            />
                                        )}
                                        {(!isAuto || subActiveTab !== 1) && (
                                            <>
                                                <AmountInput
                                                    disabled={disabled}
                                                    value={betAmount}
                                                    onChange={setBetAmount}
                                                    className={`${!amountInputFlag ? "animate-bounding2" : ""
                                                        }`}
                                                />
                                                <MultiPlierInput
                                                    disabled={disabled}
                                                    value={target}
                                                    onChange={onTargetChange}
                                                />
                                            </>
                                        )}

                                        {isAuto && subActiveTab === 1 && (
                                            <CurrentBets bets={players} />
                                        )}
                                        {isAuto && subActiveTab !== 1 && (
                                            <>
                                                <BetNumberInput
                                                    disabled={disabled}
                                                    value={autoBetCount}
                                                    onChange={setAutoCount}
                                                    Icon={<InfinitySvg />}
                                                />
                                                <StopProfitAmount
                                                    disabled={disabled}
                                                    Label={"Stop on Profit"}
                                                    onChange={setStopPorfitA}
                                                    value={stopProfitA}
                                                    Icon={<SelectedPaymentIcon currency={currency} />}
                                                />
                                                <StopProfitAmount
                                                    disabled={disabled}
                                                    Label={"Loss on Profit"}
                                                    onChange={setStopLossA}
                                                    value={stopLossA}
                                                    Icon={<SelectedPaymentIcon currency={currency} />}
                                                />
                                            </>
                                        )}
                                        <ProfitAmount
                                            disabled={true}
                                            profit={payout * (savebetAmount || betAmount)}
                                            multiplier={payout}
                                            icon={<SelectedPaymentIcon currency={currency} />}
                                        />

                                        {isAuto ? (
                                            <Button className="bg-black hover:bg-gray-900 text-white font-bold uppercase rounded-xl py-3.5 shadow-lg hover:shadow-xl transition-all duration-200"
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
                                                className="bg-black hover:bg-gray-900 text-white font-bold uppercase rounded-xl py-3.5 shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer"
                                                style={{ pointerEvents: loading ? 'none' : 'auto' }}
                                                disabled={loading}
                                                onClick={async (e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();

                                                    // Use ref to get CURRENT payout value (not stale closure value)
                                                    const currentPayout = payoutRef.current;
                                                    console.log("=== CASHOUT BUTTON CLICKED ===", {
                                                        currentPayout,
                                                        payoutState: payout,
                                                        betting,
                                                        gameState,
                                                        cashedOut,
                                                        loading,
                                                        betAmount,
                                                        address
                                                    });

                                                    if (loading) {
                                                        console.log("✗ Loading, please wait...");
                                                        return;
                                                    }

                                                    // ALWAYS allow cashout if payout > 1 - user sees it on screen!
                                                    if (currentPayout > 1) {
                                                        console.log("🚀 CASHOUT NOW! Payout:", currentPayout);
                                                        await clickCashout();
                                                    } else {
                                                        console.log("📍 Placing bet, payout is:", currentPayout);
                                                        clickBet();
                                                    }
                                                }}
                                            >
                                                {!betting
                                                    ? loading
                                                        ? "BETTING..."
                                                        : gameState === GAME_STATES.Starting
                                                            ? "STARTING..."
                                                            : "BET"
                                                    : cashedOut
                                                        ? "CASHED OUT"
                                                        : "CASHOUT"}
                                            </Button>
                                        )}

                                        {!isAuto && <CurrentBets bets={players} />}
                                    </div>
                                </div>
                            )} */}
                            {isMobile && (
                                <div className="w-11/12 bg-gray-300 border border-gray-200 rounded-2xl p-5 shadow-lg">
                                    {address && <GameBalanceDisplay />}
                                    <div className="w-full flex h-fit py-2 items-center justify-center">
                                        {isAuto ? (
                                            <Button
                                                className="bg-black hover:bg-gray-900 text-white font-bold uppercase rounded-xl py-3.5  shadow-lg transition-all duration-200"
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
                                                className="bg-black hover:bg-gray-900 text-white font-bold uppercase rounded-xl py-3.5 shadow-lg transition-all duration-200"
                                                disabled={loading}
                                                onClick={async (e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();

                                                    // Use ref to get CURRENT payout value (not stale closure value)
                                                    const currentPayout = payoutRef.current;
                                                    console.log("=== MOBILE BUTTON CLICKED ===", {
                                                        currentPayout,
                                                        payoutState: payout,
                                                        betting,
                                                        gameState,
                                                        cashedOut,
                                                        loading,
                                                        betAmount
                                                    });

                                                    if (loading) {
                                                        console.log("✗ Loading, please wait...");
                                                        return;
                                                    }

                                                    // ALWAYS allow cashout if payout > 1 - user sees it on screen!
                                                    if (currentPayout > 1) {
                                                        console.log("🚀 CASHOUT NOW (mobile)! Payout:", currentPayout);
                                                        await clickCashout();
                                                    } else {
                                                        console.log("📍 Placing bet (mobile), payout is:", currentPayout);
                                                        clickBet();
                                                    }
                                                }}
                                            >
                                                {!betting
                                                    ? joining
                                                        ? "BETTING..."
                                                        : plannedBet
                                                            ? "CANCEL BET"
                                                            : "Place Bet (next round)"
                                                    : cashedOut
                                                        ? "CASHED OUT"
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
                                                Icon={<SelectedPaymentIcon currency={currency} />}
                                            />
                                            <StopProfitAmount
                                                disabled={disabled}
                                                Label={"Stop on Profit"}
                                                onChange={setStopPorfitA}
                                                value={stopProfitA}
                                                Icon={<SelectedPaymentIcon currency={currency} />}
                                            />
                                            <StopProfitAmount
                                                disabled={disabled}
                                                Label={"Loss on Profit"}
                                                onChange={setStopLossA}
                                                value={stopLossA}
                                                Icon={<SelectedPaymentIcon currency={currency} />}
                                            />
                                        </>
                                    )}
                                    <ProfitAmount
                                        multiplier={payout}
                                        disabled={true}
                                        profit={payout * savebetAmount}
                                        icon={<SelectedPaymentIcon currency={currency} />}
                                    />
                                    <SwitchTab
                                        onChange={setActiveTab}
                                        disabled={disabled}
                                        active={activeTab}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                <VerifyModal
                    Label={"crash"}
                    gameId={verifyId}
                    setGameId={() => setGameVerifyId("")}
                />
            </div>
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
