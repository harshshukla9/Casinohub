"use client"
import { useCallback, useEffect, useRef, useState } from "react";
import axiosServices from "@/util/axios";
import SwitchTab from "@/components/shared/SwitchTab";
import AmountInput from "@/components/shared/AmountInput";
import { Button } from "@/components/ui/button";
import MultiPlierInput from "@/components/shared/MultiplierInput";
import Slider, { findTile } from "@/components/games/Slide/Slider";
import Layout from "@/layout/layout";
import { useAccount } from "wagmi";
import { useUserBalance } from "@/hooks/useUserBalance";
import { placeBet as placeBetBalance, cashout as cashoutBalance, hasSufficientBalance } from "@/lib/game-balance";
import { GameBalanceDisplay } from "@/components/shared/GameBalanceDisplay";
import Marquee from "react-fast-marquee";
import { MarqueeEdge } from "@/components/ui/marquee";
import { motion } from "framer-motion";
import Image from "next/image";


const SLIDE_API = "/api/slide";

enum STATUS {
    WAITTING,
    STARTING,
    BETTING,
    PLAYING
}

type Player = {
    playerId: string,
    betAmount: number;
    currencyId: string;
    target: number;
    status: string;
}

const useAudio = () => {
    const betAudioRef = useRef<HTMLAudioElement | null>(null);
    const slidingAudioRef = useRef<HTMLAudioElement | null>(null);
    const audioInitialized = useRef<boolean>(false);

    useEffect(() => {
        if (typeof window === "undefined" || audioInitialized.current) return;

        try {
            const betAudio = new Audio("/assets/audio/bet.DUx2OBl3.mp3");
            const slidingAudio = new Audio("/assets/audio/sliding.pgFKr6A8.mp3");

            betAudio.preload = "auto";
            slidingAudio.preload = "auto";

            betAudio.addEventListener("error", () => { });
            slidingAudio.addEventListener("error", () => { });

            betAudioRef.current = betAudio;
            slidingAudioRef.current = slidingAudio;
            audioInitialized.current = true;
        } catch (error) {
        }
    }, []);

    const playAudio = (key: string) => {
        const audio = key === "bet" ? betAudioRef.current : slidingAudioRef.current;
        if (!audio) return;

        try {
            if (audio.readyState >= 2) {
                audio.muted = true;
                audio.play().then(() => {
                    setTimeout(() => {
                        if (audio) {
                            audio.muted = false;
                        }
                    }, 1000);
                }).catch(() => { });
            }
        } catch (error) {
        }
    };

    return { playAudio };
};

const SlideGame = () => {
    const { address } = useAccount();
    const { balance, isLoading: isLoadingBalance } = useUserBalance();

    const [activeTab, setActiveTab] = useState<number>(0);
    const [betAmount, setBetAmount] = useState<number>(0);
    const [target, setTarget] = useState<number>(2);
    const betCount = useRef<number>(0);
    const [autobet, setAutobet] = useState<boolean>(false);
    const [bets, setBets] = useState<any[]>([]);

    const [history, setHistory] = useState<any[]>([]);

    const [result, setResult] = useState({
        numbers: [0.0, 1.95, 0.5, 2.16, 0.3, 1.49, 0.8, 21.75, 0.0, 4.86, 1.37, 0.15, 1.03, 1.79, 0.0, 1.34, 0.65, 1, 1.75, 0.45, 1.91, 4.86, 0.0, 1.24, 17.43, 0.28, 1.61, 9.88, 0.55, 1.05, 0.0, 1.32, 1.9, 0.89, 1.28, 0.0, 11.54, 1.35, 4.63, 0.75, 2.65, 0.0, 4.92, 1.31, 0.4, 1.51, 0.0, 5.8],
        multiplier: 1
    });

    const savedBet = useRef<any | undefined>(null);
    const elapsedTime = 5;
    const inputDisable = useRef<boolean>(false);

    const [privateHash, setPriviateHash] = useState<string>("");
    const [publichSeed, setPublicSeed] = useState<string>("");

    const [status, setStatus] = useState(STATUS.WAITTING);
    const [betting, setBetting] = useState(false);
    const [planedbet, setPlanedBet] = useState<boolean>(false);
    const [betcount, setBetCount] = useState(0);

    const [stopProfitA, setStopPorfitA] = useState<number>(0);
    const [stopLossA, setStopLossA] = useState<number>(0);
    const [amountInputFlag, setAmountInputFlag] = useState(true);

    const stopOnProfit = useRef(0);
    const stopOnLoss = useRef(0);
    const { playAudio } = useAudio();

    const createbet = async () => {
        if (!address) {
            alert("Please connect your wallet first");
            return;
        }

        if (Number(betAmount) <= 0) {
            setAmountInputFlag(false);
            alert("Please input your bet amount!");
            return;
        }

        if (!target || target <= 0) {
            alert("Please select a target multiplier! (e.g., 2x, 3x, 5x)");
            return;
        }

        if (!hasSufficientBalance(balance, betAmount)) {
            alert("Insufficient balance");
            return;
        }

        setBetting(true);
        inputDisable.current = true;

        const betResult = await placeBetBalance(address, betAmount);

        if (!betResult.success) {
            alert(betResult.error || "Failed to place bet");
            setBetting(false);
            inputDisable.current = false;
            return;
        }

        try {
            const response = await axiosServices.post(`${SLIDE_API}/create`, {
                walletAddress: address,
                betAmount,
                target: target || 0,
            });

            if (response.data && response.data.success) {
                const gameNumbers = response.data.numbers;
                const chosenMultiplier = response.data.chosenMultiplier;
                const chosenIndex = response.data.chosenIndex;
                const gameTarget = target || 0;

                setResult({ numbers: gameNumbers, multiplier: 1 });
                setStatus(STATUS.STARTING);
                setBetting(false);
                inputDisable.current = true;

                try {
                    playAudio("bet");
                } catch (e) { }

                savedBet.current = {
                    target: gameTarget,
                    betAmount: Number(betAmount),
                    currencyId: "",
                    infinity: false,
                    chosenMultiplier: chosenMultiplier,
                    chosenIndex: chosenIndex
                };

                const gameTimeout = setTimeout(() => {
                    setStatus(STATUS.PLAYING);

                    try {
                        playAudio("sliding");
                    } catch (e) { }

                    setResult({ numbers: gameNumbers, multiplier: chosenMultiplier });

                    setTimeout(() => {
                        endGame(chosenMultiplier, gameTarget);
                    }, 5000);
                }, 3000);

                (window as any).slideGameTimeout = gameTimeout;
            } else {
                alert(response.data?.error || "Failed to create game");
                setBetting(false);
                inputDisable.current = false;
            }
        } catch (error: any) {
            alert(error?.response?.data?.error || "Failed to create game");
            setBetting(false);
            inputDisable.current = false;
        }
    }

    const startBetting = async () => {
        if (autobet) {
            if (planedbet) {
                if (stopProfitA !== 0 && stopOnProfit.current <= 0) {
                    setPlanedBet(false)
                    return;
                }

                if (stopLossA !== 0 && stopOnLoss.current <= 0 && Math.abs(stopOnLoss.current) > Math.abs(stopOnProfit.current)) {
                    setPlanedBet(false)
                    return;
                }

                if (savedBet.current.infinity && betCount.current > 0) {
                    betCount.current--;
                    setBetCount(betCount.current);
                    await createbet();
                } else if (!savedBet.current.infinity) {
                    await createbet();
                } else {
                    savedBet.current = undefined;
                    setPlanedBet(false);
                }
            }
        } else {
            if (planedbet) {
                await createbet();
                savedBet.current = undefined;
                setPlanedBet(false);
            }
        }
    }

    const startSlideAnimation = (numbers: number[], chosenIndex: number, target: number) => {
        const chosenMultiplier = numbers[chosenIndex];
        setResult({ numbers, multiplier: chosenMultiplier });
    }

    const endGame = async (chosenMultiplier: number, target: number) => {
        setStatus(STATUS.WAITTING);

        const chosenMultiplierNum = Number(chosenMultiplier);
        const targetNum = Number(target);

        const won = targetNum > 0 && chosenMultiplierNum >= targetNum;

        if (address && savedBet.current) {
            if (won) {
                const payoutMultiplier = targetNum;
                const betAmountNum = Number(savedBet.current.betAmount);

                const cashoutResult = await cashoutBalance(address, betAmountNum, payoutMultiplier);

                if (!cashoutResult.success) {
                    alert("Failed to process winnings: " + cashoutResult.error);
                }
            }
        }

        addGameToHistory({
            _id: `game_${Date.now()}`,
            resultpoint: chosenMultiplier
        });

        setResult({ numbers: result.numbers, multiplier: chosenMultiplier });
        inputDisable.current = false;
        setBetting(false);

        savedBet.current = undefined;
    }

    const addGameToHistory = (game: any) => {
        setHistory((state) =>
            state.length >= 6
                ? [...state.slice(1, state.length), game]
                : [...state, game]
        );
    };

    const getButtonContent = () => {
        if (betting)
            return "Betting..."

        if (status === STATUS.PLAYING) {
            if (planedbet) {
                if (autobet)
                    return "Stop Autobet";
                else
                    return "Cancel Bet"
            } else {
                if (autobet)
                    return "Start Autobet";
                return "Bet (Next Round)"
            }
        } else if (status === STATUS.BETTING) {
            if (autobet) {
                if (inputDisable.current)
                    return "Waiting..."
                if (planedbet)
                    return "Stop Autobet";
                return "Start Autobet";
            }
            if (planedbet)
                return "Cancel Bet";
            if (inputDisable.current)
                return "Waiting.."
            return "Bet"
        } else if (status === STATUS.STARTING) {
            return "Starting..."
        }

        return "Bet"
    }

    const disable = inputDisable.current || planedbet;

    useEffect(() => {
        setAutobet(activeTab == 1)
    }, [activeTab])

    return (
        <Layout>
            <div className="w-full min-h-[calc(100vh-80px)] px-2 sm:px-4 lg:px-6 py-4 md:py-6">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col lg:flex-row gap-4 ">
                        <div className="flex-1 flex items-center justify-center py-2">
                            <div className="w-full">
                                {(status === STATUS.STARTING || status === STATUS.PLAYING) && savedBet.current && (
                                    <motion.div
                                        initial={{ y: "-100%" }}
                                        animate={{ y: 0 }}
                                        transition={{ duration: 0.6, ease: "easeOut" }}
                                        className="absolute h-[10vh] top-0 left-0 right-0 z-50 bg-white shadow-lg"
                                    >
                                        <div className="h-full flex items-center justify-between px-6">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] text-gray-600 font-medium uppercase tracking-wider">Bet</span>
                                                <div className="flex items-center gap-1.5">
                                                    <Image src="/impAssets/Chip.webp" alt="coin" width={18} height={18} />
                                                    <span className="text-base font-bold text-gray-900">{(Number(savedBet.current.betAmount) || 0).toFixed(2)}</span>
                                                </div>
                                            </div>

                                            <div className="flex flex-col items-center">
                                                <span className="text-[10px] text-gray-600 font-medium uppercase tracking-wider">
                                                    {status === STATUS.PLAYING ? "Result" : "Target"}
                                                </span>
                                                <motion.div
                                                    animate={{
                                                        scale: status === STATUS.PLAYING ? [1, 1.08, 1] : 1,
                                                        color: status === STATUS.PLAYING ? "#10b981" : "#000000"
                                                    }}
                                                    transition={{ duration: 0.4, repeat: status === STATUS.PLAYING ? Infinity : 0 }}
                                                    className="text-3xl font-black"
                                                >
                                                    {status === STATUS.PLAYING
                                                        ? `${result.multiplier.toFixed(2)}x`
                                                        : `${savedBet.current.target.toFixed(2)}x`
                                                    }
                                                </motion.div>
                                            </div>

                                            <div className="flex flex-col items-end">
                                                <span className="text-[10px] text-gray-600 font-medium uppercase tracking-wider">
                                                    Potential
                                                </span>
                                                <div className="flex items-center gap-1.5">
                                                    <motion.span
                                                        animate={{
                                                            scale: status === STATUS.PLAYING ? [1, 1.05, 1] : 1
                                                        }}
                                                        transition={{ duration: 0.3, repeat: status === STATUS.PLAYING ? Infinity : 0 }}
                                                        className="text-base font-bold text-blue-600"
                                                    >
                                                        +{((savedBet.current.betAmount || 0) * savedBet.current.target).toFixed(2)}
                                                    </motion.span>
                                                    <Image src="/impAssets/Chip.webp" alt="coin" width={18} height={18} />
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                                <div className="relative min-h-[350px] md:min-h-[450px] lg:min-h-[500px] overflow-hidden flex items-center justify-center rounded-xl">

                                    <MarqueeEdge color="black" size="sm" side="left" className="w-1/6 h-full top-0 left-0" />
                                    <MarqueeEdge color="black" size="sm" side="right" className="w-1/6 h-full top-0 right-0" />

                                    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 w-full max-w-[90%] md:max-w-md px-2">
                                        <div className="flex gap-1 overflow-x-auto scrollbar-hide">
                                            {history.slice(history.length - 10, history.length).map((h: any, index) => (
                                                <Button
                                                    key={index}
                                                    onClick={() => { }}
                                                    className="p-2 min-w-[40px] text-xs font-semibold rounded-lg shadow-md shrink-0"
                                                    style={{
                                                        background: findTile(h.resultpoint).color,
                                                        color: findTile(h.resultpoint).text
                                                    }}
                                                >
                                                    {h.resultpoint}x
                                                </Button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="w-full h-full flex items-center">
                                        <Slider multiplier={result.multiplier} elapsedTime={elapsedTime} numbers={result.numbers} />
                                    </div>

                                    <div className="absolute bottom-4 left-4 z-20">
                                        <div className="flex items-center gap-2 bg-white/95 backdrop-blur-sm px-4 py-2 rounded-lg shadow-lg border border-gray-200">
                                            <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
                                            <span className="text-gray-900 text-sm font-semibold">Bets: {bets.length}</span>
                                        </div>
                                    </div>

                                    <div className="w-full absolute bottom-0 z-20">
                                        <StatusBar status={status} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="w-full lg:w-[380px] bg-white border-t lg:border-t-0 lg:border-l border-gray-200 rounded-2xl p-5 lg:p-6">

                            <div className="flex flex-col space-y-3">
                                {/* <SwitchTab onChange={setActiveTab} active={activeTab} disabled={disable} /> */}
                                <AmountInput onChange={setBetAmount} value={betAmount} disabled={disable} />
                                <MultiPlierInput onChange={setTarget} value={target} disabled={disable} required={true} label="Target Multiplier *" />

                                <Button
                                    className="p-6 bg-sky-400 w-full hover:bg-sky-500 text-white rounded-3xl text-lg flex items-center gap-3 transition-colors"
                                    disabled={disable || status === STATUS.STARTING}
                                    onClick={() => {
                                        if (betting || inputDisable.current || status === STATUS.STARTING)
                                            return;
                                        if (status === STATUS.PLAYING) {
                                            if (planedbet) {
                                                savedBet.current = undefined;
                                                setPlanedBet(false);
                                            } else {
                                                createbet();
                                            }
                                        } else if (status === STATUS.BETTING) {
                                            createbet();
                                        } else if (status === STATUS.WAITTING) {
                                            createbet();
                                        }
                                    }}
                                >
                                    {getButtonContent()}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Layout >
    )
}

export default SlideGame;

const StatusBar = ({ status }: { status: STATUS }) => {
    const time = useRef<number>(-1);
    const [statustime, setstatustime] = useState(0);

    useEffect(() => {
        let interval: any;
        switch (status) {
            case STATUS.BETTING:
                time.current = 2000;
                setstatustime(2000);
                interval = setInterval(() => {
                    if (time.current > 0) {
                        time.current--;
                        setstatustime(time.current);
                    }
                }, 10)
                break;
            case STATUS.PLAYING:
                time.current = -1;
                setstatustime(-1);
                break;
            case STATUS.STARTING:
                break;
            case STATUS.WAITTING:
                break;
        }
        return () => {
            if (interval) {
                clearInterval(interval)
            }
        }
    }, [status])

    return <></>
}