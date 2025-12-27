"use client"
import { useCallback, useEffect, useRef, useState } from "react";
import axiosServices from "@/util/axios";
import useIsMobile from "@/hooks/useIsMobile";
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
    const isMobile = useIsMobile();
    const { address } = useAccount();
    const { balance, isLoading: isLoadingBalance } = useUserBalance();

    const [activeTab, setActiveTab] = useState<number>(0);
    const [betAmount, setBetAmount] = useState<number>(0);
    const [target, setTarget] = useState<number>(0);
    const betCount = useRef<number>(0);
    const [autobet, setAutobet] = useState<boolean>(false);
    const [bets, setBets] = useState<any[]>([]);

    const [history, setHistory] = useState<any[]>([]);

    const [result, setResult] = useState({
        numbers: [1.903584107931594, 7.289733272636531, 1.3637520028046712, 2.1687325855871227, 2.4933819106663493, 1.498308102164589, 1.4985860487052827, 21.750156733109126, 1.0372314374834941, 4.866700181583145, 1.3724955280886675, 6.029560018920336, 1.0303612131867523, 1.790765019475776, 1.0509659303212602, 1.3427846331361688, 1.043602614826846, 1, 1.7554225649186417, 1.9452640717656329, 1.9146219934302606, 4.869526482116821, 1.6029811093702553, 1.2435240630267617, 17.437289699821303, 1.276313397368619, 1.618755824614112, 9.886094186702175, 1.5709471875430103, 1.0521788401854846, 1.3911934025482007, 1.3252738435995668, 1.906647723872426, 1.090347584906667, 1.2848101589784566, 1.007087172210973, 11.548618542693777, 1.3578319475086218, 4.639070394589904, 1.8465654390716766, 2.653733488076682, 4.923510038032103, 4.921580919662703, 1.3178708730473734, 1.7319504108869979, 1.511790731631906, 1.415210820644928, 5.80904104812333, 1.1317336828287066, 1.322065143934753, 7.242526244532375, 2.5955453056761604, 1.168085793132742, 3.2424142021519637, 6.723184381982699, 10.76300946407673, 1.3864677993193353, 1.550989717093865, 1.0660077023468517, 3.363056173638654, 2.679747580002418, 4.034726347339524, 5.715358587221796, 21.046970995887037, 2.593111595629966, 1.3907866095722856, 8.08699725169305, 2.3378138615475215, 1.8070323153254058, 1.9535634982554118, 7.573343939658181, 1.253450763655036, 8.003569610632168, 2.5789112031547177, 2.7480245233718996, 2.2153270662421325, 1.7588492912318467, 1.310647410959055, 2.629692012488445, 1.7299793236036611, 2.671240918732696, 18.872152846456686, 1.0117321367489212, 5.7415093107764905, 5.9960418900001295, 1.8347721783099589, 1.027356841602837, 75.45281444815788, 1.646594016671491, 1.337322225052752],
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
        }

        return "Starting..."
    }

    const disable = inputDisable.current || planedbet;

    useEffect(() => {
        setAutobet(activeTab == 1)
    }, [activeTab])

    return (
        <Layout>
            <div className={`h-full ${isMobile ? "w-full p-2" : "p-4"}`}>
                <div className="flex flex-col lg:flex-row rounded-xl overflow-hidden shadow-lg h-full">
                    <div className="flex-1 flex items-center justify-center">
                        <div className={`gap-2 ${isMobile ? "min-h-[350px]" : "min-h-[400px]"} relative h-full overflow-hidden flex items-center justify-center w-full`}>
                            <div className="flex absolute right-1/2 translate-x-1/2 top-5 z-20 w-full max-w-[300px] px-4 space-x-1 overflow-x-auto">
                                {history.slice(history.length - 10, history.length).map((h: any, index) => {
                                    return <Button
                                        onClick={() => { }}
                                        className="p-[3px] min-w-10 text-xs font-semibold rounded-lg shadow-sm"
                                        key={index}
                                        style={{
                                            background: findTile(h.resultpoint).color,
                                            color: findTile(h.resultpoint).text
                                        }}>
                                        {h.resultpoint}x
                                    </Button>
                                })}
                                {/* <Button onClick={() => { }} className="p-[3px] min-w-10 text-xs font-semibold rounded-lg shadow-sm" style={{ background: "#50e3c2", color: "#000" }}>
                                    Fair
                                </Button> */}
                            </div>
                            <div className="w-full h-full flex items-center">
                                <Slider multiplier={result.multiplier} elapsedTime={elapsedTime} numbers={result.numbers} />
                            </div>
                            <div className="absolute bottom-10 left-5 z-20">
                                <div className="flex space-x-2 items-center bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-lg shadow-sm">
                                    <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
                                    <div className="text-gray-900 text-sm font-medium">Bets: {bets.length}</div>
                                </div>
                            </div>
                            <div className="w-full absolute bottom-0 z-20">
                                <StatusBar status={status} />
                            </div>
                        </div>
                    </div>

                    {isMobile ? (
                        <div className="p-5 bg-white border-t border-gray-200 shadow-sm flex flex-col space-y-3 rounded-xl">
                            {address && <div className="mb-2 pb-4 border-b border-gray-100"><GameBalanceDisplay /></div>}
                            <Button
                                className="bg-black hover:bg-gray-900 text-white font-bold uppercase rounded-xl py-3.5 shadow-md hover:shadow-lg transition-all duration-200"
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
                                }}>
                                {getButtonContent()}
                            </Button>
                            <AmountInput onChange={setBetAmount} value={betAmount} disabled={disable} />
                            <MultiPlierInput onChange={setTarget} value={target} disabled={disable} />
                            <SwitchTab onChange={setActiveTab} active={activeTab} disabled={disable} />
                        </div>
                    ) : (
                        <div className="w-full lg:w-[340px] p-6 bg-white border-l border-gray-200 shadow-sm flex flex-col space-y-3">
                            {address && <div className="mb-4 pb-4 border-b border-gray-100"><GameBalanceDisplay /></div>}
                            <SwitchTab onChange={setActiveTab} active={activeTab} disabled={disable} />
                            <AmountInput onChange={setBetAmount} value={betAmount} disabled={disable} />
                            <MultiPlierInput onChange={setTarget} value={target} disabled={disable} />
                            <Button
                                className="bg-black hover:bg-gray-900 text-white font-bold uppercase rounded-xl py-3.5 shadow-md hover:shadow-lg transition-all duration-200"
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
                                }}>
                                {getButtonContent()}
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </Layout>
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

    return (
        <></>
        // <div className="w-full h-2 flex-col justify-between bg-gray-100">
        //     {statustime === -1 && <></>}
        //     {statustime === 0 && <div className="text-gray-900 text-center py-1 text-sm font-medium">Starting...</div>}
        //     {statustime > 0 && (
        //         <div className="h-2 bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-100" style={{
        //             width: (100 / 2000) * statustime + "%"
        //         }}></div>
        //     )}
        // </div>
    )
}