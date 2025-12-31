'use client'
import AmountInput from "@/components/shared/AmountInput";
import ResultModal from "@/components/shared/ResultModal";

import Layout from "@/layout/layout";
import axiosServices from "@/util/axios";
import formatAmount from "@/util/formatAmount";
import { Button } from "@/components/ui/button";
import { useEffect, useRef, useState } from "react";
import { GameBalanceDisplay } from "@/components/shared/GameBalanceDisplay";
import { useAccount } from "wagmi";
import { useUserBalance } from "@/hooks/useUserBalance";
import { placeBet as placeBetBalance, cashout as cashoutBalance, hasSufficientBalance } from "@/lib/game-balance";

type Suit = 'Hearts' | 'Diamonds' | 'Clubs' | 'Spades';
type Card = {
    rank: string;
    suit: 'Hearts' | 'Diamonds' | 'Clubs' | 'Spades' | string;
} | undefined;

const suits = {
    "Hearts": {
        color: "#e9113c",
        icon: <svg fill="currentColor" viewBox="0 0 64 64"><title></title><path fillRule="evenodd" clipRule="evenodd" d="M30.907 55.396.457 24.946v.002A1.554 1.554 0 0 1 0 23.843c0-.432.174-.82.458-1.104l14.13-14.13a1.554 1.554 0 0 1 1.104-.458c.432 0 .821.175 1.104.458l14.111 14.13c.272.272.645.443 1.058.453l.1-.013h.004a1.551 1.551 0 0 0 1.045-.452l14.09-14.09a1.554 1.554 0 0 1 1.104-.457c.432 0 .82.174 1.104.457l14.13 14.121a1.557 1.557 0 0 1 0 2.209L33.114 55.396v-.002c-.27.268-.637.438-1.046.452v.001h.003a.712.712 0 0 1-.04.002h-.029c-.427 0-.815-.173-1.095-.453Z"></path></svg>
    },
    "Diamonds": {
        color: "#e9113c",
        icon: <svg fill="currentColor" viewBox="0 0 64 64"><title></title><path fillRule="evenodd" clipRule="evenodd" d="m37.036 2.1 24.875 24.865a7.098 7.098 0 0 1 2.09 5.04c0 1.969-.799 3.75-2.09 5.04L37.034 61.909a7.076 7.076 0 0 1-5.018 2.078c-.086 0-.174 0-.25-.004v.004h-.01a7.067 7.067 0 0 1-4.79-2.072L2.089 37.05A7.098 7.098 0 0 1 0 32.009c0-1.97.798-3.75 2.09-5.04L26.965 2.102v.002A7.07 7.07 0 0 1 31.754.02l.002-.004h-.012c.088-.002.176-.004.264-.004A7.08 7.08 0 0 1 37.036 2.1Z"></path></svg>
    },
    "Clubs": {
        color: "#1a2c38",
        icon: <svg fill="currentColor" viewBox="0 0 64 64"><title></title><path fillRule="evenodd" clipRule="evenodd" d="M63.256 30.626 33.082.452A1.526 1.526 0 0 0 31.994 0c-.024 0-.048 0-.072.002h.004v.002a1.53 1.53 0 0 0-1.034.45V.452L.741 30.604a1.54 1.54 0 0 0-.45 1.09c0 .426.172.81.45 1.09l14.002 14.002c.28.278.663.45 1.09.45.426 0 .81-.172 1.09-.45l13.97-13.97a1.53 1.53 0 0 1 1.031-.45h.002l.027-.001.031-.001c.424 0 .81.172 1.088.452l14.002 14.002c.28.278.664.45 1.09.45.426 0 .81-.172 1.09-.45l14.002-14.002a1.546 1.546 0 0 0 0-2.192v.002ZM45.663 64H18.185a.982.982 0 0 1-.692-1.678L31.23 48.587h-.002a.986.986 0 0 1 .694-.285h.002v.047l.01-.047a.98.98 0 0 1 .686.285l13.736 13.736A.982.982 0 0 1 45.663 64Z"></path></svg>
    },
    "Spades": {
        color: "#1a2c38",
        icon: <svg fill="currentColor" viewBox="0 0 64 64"><title></title><path d="M14.022 50.698.398 36.438A1.47 1.47 0 0 1 0 35.427c0-.395.152-.751.398-1.012l13.624-14.268c.249-.257.59-.417.967-.417.378 0 .718.16.967.417l13.625 14.268c.245.26.397.617.397 1.012 0 .396-.152.752-.397 1.013L15.957 50.698c-.25.257-.59.416-.968.416s-.718-.16-.967-.416Zm34.022 0L34.41 36.438a1.471 1.471 0 0 1-.398-1.012c0-.395.152-.751.398-1.012l13.633-14.268c.248-.257.589-.417.967-.417s.718.16.967.417l13.624 14.268c.246.26.398.617.398 1.012 0 .396-.152.752-.398 1.013L49.978 50.698c-.249.257-.59.416-.967.416-.378 0-.719-.16-.968-.416ZM44.541 62h.01c.685 0 1.239-.58 1.239-1.296 0-.36-.14-.686-.367-.92L32.871 46.657a1.206 1.206 0 0 0-.871-.375h-.04L27.335 62h17.207ZM32.963 32.965l13.624-14.25a1.47 1.47 0 0 0 .398-1.012 1.47 1.47 0 0 0-.398-1.013L32.963 2.422a1.334 1.334 0 0 0-.97-.422h-.03L26.51 16.229l5.455 17.156h.03c.38 0 .72-.16.968-.42Z"></path><path d="M31.028 2.424 17.404 16.683c-.245.26-.397.616-.397 1.012s.152.752.397 1.012l13.624 14.26c.24.253.568.412.934.421L31.963 2a1.33 1.33 0 0 0-.935.424Zm-12.45 57.36c-.228.234-.368.56-.368.92 0 .717.554 1.296 1.238 1.296h12.515l-.002-15.718c-.33.008-.625.15-.841.375L18.576 59.784Z"></path></svg>
    }
}

const payouts = [
    { id: "royal_flush", multiplier: 800, name: "Royal Flush" },
    { id: "straight_flush", multiplier: 60, name: "Straight Flush" },
    { id: "4_of_a_kind", multiplier: 22, name: "4 of a Kind" },
    { id: "full_house", multiplier: 9, name: "Full House" },
    { id: "flush", multiplier: 6, name: "Flush" },
    { id: "straight", multiplier: 4, name: "Straight" },
    { id: "3_of_a_kind", multiplier: 3, name: "3 of a Kind" },
    { id: "2_pair", multiplier: 2, name: "2 Pair" },
    { id: "pair", multiplier: 1, name: "Pair of Jacks" },
];

const SUITS = ['Hearts', 'Diamonds', 'Clubs', 'Spades'];
const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

const VideoPoker = () => {
    const { address } = useAccount();
    const { balance, isLoading: isLoadingBalance } = useUserBalance();
    const [betAmount, setBetAmount] = useState<number>(0);
    const [dealing, setDealing] = useState(false);
    const [cards, setCards] = useState<Card[]>([undefined, undefined, undefined, undefined, undefined]);
    const [holds, setHolds] = useState<number[]>([]);
    const [gamestart, setStart] = useState(false);
    const [loading, setLoading] = useState(false);

    const [privateHash, setPrivateHash] = useState("");
    const [privateSeed, setPrivateSeed] = useState("");
    const [publicSeed, setPublicSeed] = useState("");

    const betAudioRef = useRef<HTMLAudioElement | null>(null);
    const dealingAudioRef = useRef<HTMLAudioElement | null>(null);

    const handleDeal = async () => {
        if (!address) {
            alert("Please connect your wallet first");
            return;
        }

        if (!hasSufficientBalance(balance, betAmount)) {
            alert("Insufficient balance");
            return;
        }

        setLoading(true);
        playAudio("bet");

        if (!dealing) {
            const betResult = await placeBetBalance(address, betAmount);
            if (!betResult.success) {
                alert(betResult.error || "Failed to place bet");
                setLoading(false);
                return;
            }

            try {
                const { data } = await axiosServices.post("/video-poker/init", { betAmount, currencyId: "" })
                setStart(true);
                setHolds([]);
                setCards(Array(5).fill(undefined));
                setPrivateHash(data.privateSeedHash);
                setPublicSeed(data.publicSeed);
                setTimeout(() => {
                    setCards(data.hand);
                    setLoading(false);
                    playAudio("dealing");
                }, 400)
            } catch (error) {
                setLoading(false);
            }
        } else {
            try {
                const { data } = await axiosServices.post("/video-poker/draw", { holdIndexes: holds })
                const result = data.result;
                const payout = data.payout;
                setPrivateSeed(data.privateSeed);

                if (payout && payout > 0 && address) {
                    await cashoutBalance(address, betAmount, payout);
                }

                let c = 0;
                for (let i = 0; i < data.hand.length + 1; i++) {
                    setTimeout(() => {
                        setCards(data.hand.map((card: Card, index: number) => {
                            if (index < i || holds.includes(index)) {
                                return card;
                            }
                            return undefined;
                        }));

                        if (i == data.hand.length) {
                            setHolds([]);
                            setStart(false);
                            setLoading(false);
                        }
                        playAudio("dealing");
                    }, 300 * c)
                    if (!holds.includes(i)) {
                        c++;
                    }
                }
            } catch (error) {
                setHolds([]);
                setStart(false);
                setLoading(false);
            }
        }
        setDealing(!dealing);
    };

    const handleHolder = (index: number) => {
        const i = holds.findIndex((i) => i === index);
        if (i === -1) {
            setHolds([...holds, index])
        } else {
            setHolds([...holds.filter((h) => h !== index)])
        }
    }

    const { ranking, winningCards } = evaluateHand(cards);
    const disabled = dealing || loading;

    useEffect(() => {
        const fetchDatas = async () => {
            setLoading(true);
            try {
                const { data } = await axiosServices.post("/video-poker/fetchgame")
                setStart(true);
                setHolds([]);
                setCards(Array(5).fill(undefined));
                setTimeout(() => {
                    setCards(data.hand);
                    setLoading(false);
                }, 400)
            } catch (error) {
                setLoading(false);
            }
        }
        fetchDatas();
    }, [])

    useEffect(() => {
        betAudioRef.current = new Audio("/assets/audio/bet.DUx2OBl3.mp3");
        dealingAudioRef.current = new Audio("/assets/audio/flip.xdzctLJY.mp3");
    }, []);

    let currentpayout = payouts.find((payout, index) => {
        return !dealing && payout.id === ranking;
    })

    const playAudio = (key: string) => {
        try {
            if (key === "bet") {
                if (betAudioRef.current) {
                    betAudioRef.current.play().catch(() => { });
                }
            } else if (key === "dealing") {
                const audio = new Audio("/assets/audio/flip.xdzctLJY.mp3");
                audio.play().catch(() => { });
            }
        } catch (error) {
        }
    };

    return (
        <Layout>
            <div className="w-full min-h-[calc(100vh-80px)] px-2 sm:px-4 lg:px-6 py-4 md:py-6">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col lg:flex-row gap-4 bg-gradient-to-br from-gray-50 to-white rounded-2xl overflow-hidden shadow-2xl border border-gray-200">
                        {/* Game Area */}
                        <div className="flex-1 flex items-center justify-center p-4 md:p-6">
                            <div className="w-full max-w-4xl flex flex-col">
                                <PayoutTable ranking={ranking} betAmount={betAmount} dealing={dealing} />
                                <div className="flex justify-center my-4">
                                    <Button
                                        onClick={handleDeal}
                                        disabled={loading}
                                        className="py-3 px-8 bg-gradient-to-r from-gray-900 to-black hover:from-black hover:to-gray-900 text-white rounded-xl font-bold transition-all duration-200 shadow-lg hover:shadow-xl"
                                    >
                                        {dealing ? "Deal" : "Bet Again"}
                                    </Button>
                                </div>
                                <VideoPokerGameScreen
                                    cards={cards}
                                    holds={holds}
                                    onSelect={handleHolder}
                                    dealing={dealing}
                                    gamestart={gamestart}
                                    winningCards={winningCards}
                                />
                            </div>
                            <ResultModal
                                visible={!gamestart && winningCards.length > 0 && ranking !== ""}
                                data={{
                                    odds: currentpayout?.multiplier || 0,
                                    profit: (currentpayout?.multiplier || 0) * betAmount,
                                    coin: ""
                                }}
                                Currency={""}
                            />
                        </div>

                        {/* Control Panel */}
                        <div className="w-full lg:w-[380px] bg-white border-t lg:border-t-0 lg:border-l border-gray-200 rounded-t-2xl lg:rounded-t-none p-5 lg:p-6">
                            {address && (
                                <div className="mb-4 pb-4 border-b border-gray-100">
                                    <GameBalanceDisplay />
                                </div>
                            )}

                            <div className="flex flex-col space-y-4">
                                <AmountInput value={betAmount} onChange={setBetAmount} disabled={disabled} />
                                <Button
                                    disabled={disabled}
                                    onClick={handleDeal}
                                    className="bg-gradient-to-r from-gray-900 to-black hover:from-black hover:to-gray-900 text-white rounded-xl uppercase font-bold py-4 shadow-lg hover:shadow-xl transition-all duration-200"
                                >
                                    Bet
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    )
}

export default VideoPoker;

const PayoutTable = ({ ranking, betAmount, dealing }: { ranking: string, betAmount: number, dealing: boolean }) => {
    return (
        <div className="mx-auto border border-gray-200 text-gray-900 shadow-md rounded-xl overflow-hidden">
            <div className="p-4">
                <div className="min-w-full">
                    {payouts.map((payout, index) => {
                        let iswinning = !dealing && payout.id === ranking;
                        return (
                            <div key={index} className="mt-1 items-center grid uppercase font-bold grid-cols-[5fr_2fr] sm:grid-cols-[5fr_2fr_1fr_2fr]">
                                <div className={`py-2 px-4 text-sm ${iswinning ? "bg-black text-white" : "bg-gray-100 text-gray-900"} rounded-l-lg`}>{payout.name}</div>
                                <div className={`py-2 px-4 text-center text-sm rounded-r-lg sm:rounded-none ${iswinning ? "bg-black text-white" : "bg-gray-200 text-gray-900"}`}>{payout.multiplier}x</div>
                                <div className="hidden sm:flex justify-center">
                                    {iswinning && <div className="w-5 h-5 text-black">
                                        <svg fill="currentColor" viewBox="0 0 64 64"><title></title><path fillRule="evenodd" clipRule="evenodd" d="m37.036 2.1 24.875 24.865a7.098 7.098 0 0 1 2.09 5.04c0 1.969-.799 3.75-2.09 5.04L37.034 61.909a7.076 7.076 0 0 1-5.018 2.078c-.086 0-.174  0-.25-.004v.004h-.01a7.067 7.067 0 0 1-4.79-2.072L2.089 37.05A7.098 7.098 0 0 1 0 32.009c0-1.97.798-3.75 2.09-5.04L26.965 2.102v.002A7.07 7.07 0 0 1 31.754.02l.002-.004h-.012c.088-.002.176-.004.264-.004A7.08 7.08 0 0 1 37.036 2.1Z"></path></svg>
                                    </div>}
                                </div>
                                <div className={`hidden sm:block py-2 px-4 text-right text-sm ${iswinning ? "bg-black text-white" : "bg-gray-100 text-gray-900"} rounded-lg`}>{formatAmount(betAmount * payout.multiplier)} <span className="text-gray-600">💰</span></div>
                            </div>)
                    })}
                </div>
            </div>
        </div>
    );
};

const VideoPokerGameScreen = ({ dealing, cards, holds, onSelect, gamestart, winningCards }: { dealing: boolean, cards: Card[], holds: number[], onSelect: (index: number) => void, gamestart: boolean, winningCards: Card[] }) => {
    return (
        <div className="flex justify-between my-4">
            {cards.map((card, index) => {
                let isHold = false;
                let isHide = true;
                let Icon: any = "";
                let Color = "";
                if (card) {
                    isHide = false;
                    Icon = suits[card.suit as Suit]?.icon;
                    Color = suits[card.suit as Suit]?.color;
                }
                if (holds.findIndex((i) => i == index) !== -1) isHold = true;
                const isWinningCard = !dealing && winningCards.some(winningCard => winningCard?.rank === card?.rank && winningCard?.suit === card?.suit);
                return (
                    <div
                        key={index}
                        className="relative w-[15%] mx-1 cursor-pointer"
                        onClick={() => dealing && onSelect(index)}
                        style={{
                            transformStyle: 'preserve-3d',
                            perspective: '1000px',
                            aspectRatio: '2 / 3',
                        }}
                    >
                        <div
                            className={`w-full h-full flex items-center justify-center rounded-lg shadow-md transition-transform duration-500 ease-in-out ${isHide ? 'transform rotate-y-180' : ''}`}
                            style={{ position: 'relative', transformStyle: 'preserve-3d' }}
                        >
                            <div
                                className={`absolute inset-0 flex items-center justify-center ${!isWinningCard && !dealing && !gamestart ? "opacity-65" : ""} bg-white rounded-lg shadow-md backface-hidden transition-all duration-500`}
                                style={{
                                    backfaceVisibility: 'hidden',
                                    transform: isHide ? 'rotateY(180deg)' : 'rotateY(0deg)',
                                    boxShadow: isWinningCard ? "0 0 0 .3em #000" : isHold ? "0 0 0 .3em #6b7280" : ""
                                }}
                            >
                                <div className="flex-col h-full w-full md:p-2 p-1" style={{ color: Color }}>
                                    <span className="font-bold md:text-[2.2em]">{card?.rank}</span>
                                    <div className="w-1/2">
                                        {Icon}
                                    </div>
                                </div>

                                {isHold && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2"><div className="px-2 py-1 rounded-lg bg-gray-700 text-xs text-white font-semibold animate-zoomIn">HOLD</div></div>}
                            </div>

                            <div
                                className="absolute inset-0 w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-600 to-gray-800 rounded-lg shadow-md transition-transform duration-500 border-2 border-gray-700"
                                style={{
                                    backfaceVisibility: 'hidden',
                                    transform: isHide ? 'rotateY(0deg)' : 'rotateY(180deg)',
                                }}
                            ></div>
                        </div>
                    </div>
                )
            })}
        </div>
    );
};

function createDeck() {
    let deck = [];
    for (let suit of SUITS) {
        for (let rank of RANKS) {
            deck.push({ rank, suit });
        }
    }
    return deck;
}

function evaluateHand(_hand: Card[]) {
    const hand: Card[] = _hand.filter((h) => h);
    const rankCounts = getRankCounts(hand);
    const suitCounts = getSuitCounts(hand);

    let ranking = '';
    let winningCards: any[] = [];

    const isFlush = Object.values(suitCounts).some(count => count === 5);
    const isStraight = checkStraight(rankCounts);

    const pairs: any[] = [];
    let threeOfAKind: any = null;
    let fourOfAKind: any = null;

    for (const [rank, count] of Object.entries(rankCounts)) {
        if (count === 2) {
            pairs.push(rank);
        } else if (count === 3) {
            threeOfAKind = rank;
        } else if (count === 4) {
            fourOfAKind = rank;
        }
    }

    const hasRoyalFlushRanks = ['10', 'J', 'Q', 'K', 'A'].every(rank => rankCounts[rank]);
    if (isFlush && hasRoyalFlushRanks) {
        ranking = 'royal_flush';
        winningCards = hand;
    } else if (isFlush && isStraight) {
        ranking = 'straight_flush';
        winningCards = hand;
    } else if (fourOfAKind) {
        ranking = '4_of_a_kind';
        winningCards = hand.filter((card: Card) => card && card.rank === fourOfAKind);
    } else if (threeOfAKind && pairs.length > 0) {
        ranking = 'full_house';
        winningCards = hand.filter((card: Card) => card && card.rank === threeOfAKind || card && card.rank === pairs[0]);
    } else if (isFlush) {
        ranking = 'flush';
        winningCards = hand;
    } else if (isStraight) {
        ranking = 'straight';
        winningCards = hand;
    } else if (threeOfAKind) {
        ranking = '3_of_a_kind';
        winningCards = hand.filter((card: Card) => card && card.rank === threeOfAKind);
    } else if (pairs.length === 2) {
        ranking = '2_pair';
        winningCards = hand.filter((card: Card) => card && card.rank === pairs[0] || card && card.rank === pairs[1]);
    } else if (pairs.length === 1) {
        const pairRank = rankOrder(pairs[0]);
        if (pairRank >= rankOrder('J')) {
            ranking = 'pair';
            winningCards = hand.filter((card: Card) => card && card.rank === pairs[0]);
        }
    } else {
        ranking = '';
    }

    return { ranking, winningCards };
}

function checkStraight(rankCounts: any) {
    const sortedRanks = Object.keys(rankCounts)
        .map(rank => rankOrder(rank))
        .sort((a, b) => a - b);

    if (sortedRanks.length !== 5) return false;

    const isRegularStraight = sortedRanks[4] - sortedRanks[0] === 4 && sortedRanks.every((rank, index) => {
        if (index === 0) return true;
        return rank === sortedRanks[index - 1] + 1;
    });

    const isAceLowStraight = sortedRanks[4] === 14 && sortedRanks[0] === 2 &&
        sortedRanks[1] === 3 && sortedRanks[2] === 4 && sortedRanks[3] === 5;

    return isRegularStraight || isAceLowStraight;
}

function getRankCounts(hand: Card[]) {
    const counts: { [key: string]: number } = {};
    for (let card of hand) {
        if (card) {
            counts[card.rank] = (counts[card.rank] || 0) + 1;
        }
    }
    return counts;
}

function getSuitCounts(hand: Card[]) {
    const counts: { [key: string]: number } = {};
    for (let card of hand) {
        if (card) {
            counts[card.suit] = (counts[card.suit] || 0) + 1;
        }
    }
    return counts;
}

function rankOrder(rank: string) {
    const order: { [key: string]: number } = {
        '2': 2, '3': 3, '4': 4, '5': 5, '6': 6,
        '7': 7, '8': 8, '9': 9, '10': 10, 'J': 11,
        'Q': 12, 'K': 13, 'A': 14
    };
    return order[rank] || 2;
}
