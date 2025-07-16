import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { CoinDisplay } from "@/components/ui/coin-display";
import { Spade, Heart, Diamond, Club, Play, RotateCcw } from "lucide-react";

interface PokerGameProps {
  userBalance: number;
  onGameEnd: () => void;
}

interface Card {
  suit: 'spades' | 'hearts' | 'diamonds' | 'clubs';
  rank: string;
  value: number;
}

const SUITS = {
  spades: { icon: Spade, color: 'text-gray-300' },
  hearts: { icon: Heart, color: 'text-red-500' },
  diamonds: { icon: Diamond, color: 'text-red-500' },
  clubs: { icon: Club, color: 'text-gray-300' }
};

const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

export default function PokerGame({ userBalance, onGameEnd }: PokerGameProps) {
  const { toast } = useToast();
  const [betAmount, setBetAmount] = useState(5);
  const [gameStarted, setGameStarted] = useState(false);
  const [playerCards, setPlayerCards] = useState<Card[]>([]);
  const [dealerCards, setDealerCards] = useState<Card[]>([]);
  const [communityCards, setCommunityCards] = useState<Card[]>([]);
  const [gamePhase, setGamePhase] = useState<'betting' | 'flop' | 'turn' | 'river' | 'showdown'>('betting');
  const [gameResult, setGameResult] = useState<string | null>(null);
  const [winAmount, setWinAmount] = useState(0);

  const createDeck = (): Card[] => {
    const deck: Card[] = [];
    for (const suit of ['spades', 'hearts', 'diamonds', 'clubs'] as const) {
      for (let i = 0; i < RANKS.length; i++) {
        deck.push({
          suit,
          rank: RANKS[i],
          value: i + 2 > 14 ? 14 : i + 2 // Ace high
        });
      }
    }
    return deck.sort(() => Math.random() - 0.5);
  };

  const evaluateHand = (cards: Card[]): { score: number; name: string } => {
    // Simplified poker hand evaluation
    const ranks = cards.map(c => c.value).sort((a, b) => b - a);
    const suits = cards.map(c => c.suit);
    
    // Check for flush
    const isFlush = suits.every(suit => suit === suits[0]);
    
    // Check for straight
    let isStraight = false;
    for (let i = 0; i < ranks.length - 1; i++) {
      if (ranks[i] - ranks[i + 1] !== 1) break;
      if (i === ranks.length - 2) isStraight = true;
    }
    
    // Count ranks
    const rankCounts: { [key: number]: number } = {};
    ranks.forEach(rank => rankCounts[rank] = (rankCounts[rank] || 0) + 1);
    const counts = Object.values(rankCounts).sort((a, b) => b - a);
    
    if (isFlush && isStraight) return { score: 8, name: "Straight Flush" };
    if (counts[0] === 4) return { score: 7, name: "Four of a Kind" };
    if (counts[0] === 3 && counts[1] === 2) return { score: 6, name: "Full House" };
    if (isFlush) return { score: 5, name: "Flush" };
    if (isStraight) return { score: 4, name: "Straight" };
    if (counts[0] === 3) return { score: 3, name: "Three of a Kind" };
    if (counts[0] === 2 && counts[1] === 2) return { score: 2, name: "Two Pair" };
    if (counts[0] === 2) return { score: 1, name: "Pair" };
    return { score: 0, name: "High Card" };
  };

  const playGameMutation = useMutation({
    mutationFn: async () => {
      const deck = createDeck();
      const playerHand = [deck.pop()!, deck.pop()!];
      const dealerHand = [deck.pop()!, deck.pop()!];
      const community = [deck.pop()!, deck.pop()!, deck.pop()!, deck.pop()!, deck.pop()!];
      
      const playerBest = evaluateHand([...playerHand, ...community]);
      const dealerBest = evaluateHand([...dealerHand, ...community]);
      
      let result = 'lose';
      let payout = 0;
      
      if (playerBest.score > dealerBest.score) {
        result = 'win';
        payout = betAmount * 2;
      } else if (playerBest.score === dealerBest.score) {
        result = 'draw';
        payout = betAmount;
      }
      
      const res = await apiRequest("POST", "/api/games/play", {
        gameType: 'poker',
        betAmount: betAmount.toString(),
        winAmount: payout.toString(),
        gameData: { playerHand, dealerHand, community, playerBest, dealerBest },
        result
      });
      
      return {
        result,
        payout,
        playerCards: playerHand,
        dealerCards: dealerHand,
        communityCards: community,
        playerHand: playerBest,
        dealerHand: dealerBest
      };
    },
    onSuccess: (data) => {
      setPlayerCards(data.playerCards);
      setDealerCards(data.dealerCards);
      setCommunityCards(data.communityCards);
      setGameResult(data.result);
      setWinAmount(data.payout);
      setGameStarted(true);
      
      if (data.result === 'win') {
        toast({
          title: "You Won!",
          description: `You won ${data.payout} P COINs with ${data.playerHand.name}!`,
        });
      } else if (data.result === 'draw') {
        toast({
          title: "It's a Draw!",
          description: "Your bet has been returned.",
        });
      } else {
        toast({
          title: "You Lost",
          description: `Dealer won with ${data.dealerHand.name}.`,
          variant: "destructive",
        });
      }
      
      onGameEnd();
    },
    onError: (error: Error) => {
      toast({
        title: "Game Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resetGame = () => {
    setGameStarted(false);
    setPlayerCards([]);
    setDealerCards([]);
    setCommunityCards([]);
    setGameResult(null);
    setWinAmount(0);
    setGamePhase('betting');
  };

  const CardComponent = ({ card, hidden = false }: { card: Card; hidden?: boolean }) => {
    if (hidden) {
      return (
        <div className="w-16 h-24 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg border-2 border-cyan-400 flex items-center justify-center">
          <div className="text-cyan-400 text-xs">🂠</div>
        </div>
      );
    }

    const SuitIcon = SUITS[card.suit].icon;
    return (
      <div className="w-16 h-24 bg-white rounded-lg border-2 border-gray-300 flex flex-col items-center justify-center relative">
        <span className={`text-lg font-bold ${SUITS[card.suit].color}`}>{card.rank}</span>
        <SuitIcon className={`w-4 h-4 ${SUITS[card.suit].color}`} />
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <Card className="glass-effect border-none bg-transparent">
        <CardHeader>
          <CardTitle className="flex items-center space-x-3">
            <Spade className="w-8 h-8 text-gray-300" />
            <span className="text-2xl neon-blue-text">Texas Hold'em Poker</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {!gameStarted ? (
            <div className="text-center space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-center space-x-4">
                  <label className="text-white font-medium">Bet Amount:</label>
                  <Input
                    type="number"
                    value={betAmount}
                    onChange={(e) => setBetAmount(Math.max(1, Math.min(userBalance, parseInt(e.target.value) || 0)))}
                    min={1}
                    max={userBalance}
                    className="w-32 bg-black/50 border-cyan-500 text-white"
                  />
                  <CoinDisplay value="P" size="sm" />
                </div>
                <p className="text-gray-400">
                  Available Balance: <span className="text-cyan-400">{userBalance} P COINS</span>
                </p>
              </div>
              
              <Button
                onClick={() => playGameMutation.mutate()}
                disabled={playGameMutation.isPending || betAmount > userBalance || betAmount < 1}
                className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-8 py-3"
              >
                <Play className="w-4 h-4 mr-2" />
                {playGameMutation.isPending ? "Dealing..." : "Deal Cards"}
              </Button>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Dealer Cards */}
              <div className="text-center">
                <h3 className="text-lg font-bold text-red-400 mb-4">Dealer</h3>
                <div className="flex justify-center space-x-2">
                  {dealerCards.map((card, index) => (
                    <CardComponent key={index} card={card} />
                  ))}
                </div>
              </div>

              {/* Community Cards */}
              <div className="text-center">
                <h3 className="text-lg font-bold text-yellow-400 mb-4">Community Cards</h3>
                <div className="flex justify-center space-x-2">
                  {communityCards.map((card, index) => (
                    <CardComponent key={index} card={card} />
                  ))}
                </div>
              </div>

              {/* Player Cards */}
              <div className="text-center">
                <h3 className="text-lg font-bold text-cyan-400 mb-4">Your Cards</h3>
                <div className="flex justify-center space-x-2">
                  {playerCards.map((card, index) => (
                    <CardComponent key={index} card={card} />
                  ))}
                </div>
              </div>

              {/* Game Result */}
              {gameResult && (
                <div className="text-center space-y-4">
                  <Badge 
                    variant="outline" 
                    className={`text-lg px-4 py-2 ${
                      gameResult === 'win' ? 'bg-green-500/20 text-green-400 border-green-500' :
                      gameResult === 'draw' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500' :
                      'bg-red-500/20 text-red-400 border-red-500'
                    }`}
                  >
                    {gameResult === 'win' ? '🎉 You Won!' : 
                     gameResult === 'draw' ? '🤝 Draw!' : 
                     '💸 You Lost'}
                  </Badge>
                  
                  {winAmount > 0 && (
                    <div className="flex items-center justify-center space-x-2">
                      <span className="text-green-400 font-bold">+{winAmount}</span>
                      <CoinDisplay value="P" size="sm" />
                    </div>
                  )}
                  
                  <Button
                    onClick={resetGame}
                    className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Play Again
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}