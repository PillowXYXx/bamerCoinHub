import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { CoinDisplay } from "@/components/ui/coin-display";
import { Heart, Spade, Diamond, Club, Play, RotateCcw, Plus, Minus } from "lucide-react";

interface BlackjackGameProps {
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

export default function BlackjackGame({ userBalance, onGameEnd }: BlackjackGameProps) {
  const { toast } = useToast();
  const [betAmount, setBetAmount] = useState(5);
  const [gameStarted, setGameStarted] = useState(false);
  const [playerCards, setPlayerCards] = useState<Card[]>([]);
  const [dealerCards, setDealerCards] = useState<Card[]>([]);
  const [gameOver, setGameOver] = useState(false);
  const [gameResult, setGameResult] = useState<string | null>(null);
  const [winAmount, setWinAmount] = useState(0);
  const [canHit, setCanHit] = useState(true);

  const createDeck = (): Card[] => {
    const deck: Card[] = [];
    const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
    
    for (const suit of ['spades', 'hearts', 'diamonds', 'clubs'] as const) {
      for (const rank of ranks) {
        let value = parseInt(rank);
        if (rank === 'A') value = 11;
        else if (['J', 'Q', 'K'].includes(rank)) value = 10;
        
        deck.push({ suit, rank, value });
      }
    }
    return deck.sort(() => Math.random() - 0.5);
  };

  const calculateHandValue = (cards: Card[]): number => {
    let value = 0;
    let aces = 0;
    
    for (const card of cards) {
      if (card.rank === 'A') {
        aces++;
        value += 11;
      } else {
        value += card.value;
      }
    }
    
    // Adjust for aces
    while (value > 21 && aces > 0) {
      value -= 10;
      aces--;
    }
    
    return value;
  };

  const startGameMutation = useMutation({
    mutationFn: async () => {
      const deck = createDeck();
      const playerHand = [deck.pop()!, deck.pop()!];
      const dealerHand = [deck.pop()!, deck.pop()!];
      
      return { playerHand, dealerHand, deck };
    },
    onSuccess: (data) => {
      setPlayerCards(data.playerHand);
      setDealerCards(data.dealerHand);
      setGameStarted(true);
      setGameOver(false);
      setCanHit(true);
      
      // Check for blackjack
      const playerValue = calculateHandValue(data.playerHand);
      if (playerValue === 21) {
        stand(data.playerHand, data.dealerHand);
      }
    },
  });

  const hit = () => {
    const deck = createDeck();
    const newCard = deck.pop()!;
    const newPlayerCards = [...playerCards, newCard];
    setPlayerCards(newPlayerCards);
    
    const playerValue = calculateHandValue(newPlayerCards);
    if (playerValue >= 21) {
      stand(newPlayerCards, dealerCards);
    }
  };

  const stand = async (finalPlayerCards: Card[], currentDealerCards: Card[]) => {
    setCanHit(false);
    
    // Dealer draws until 17 or higher
    let finalDealerCards = [...currentDealerCards];
    let dealerValue = calculateHandValue(finalDealerCards);
    
    while (dealerValue < 17) {
      const deck = createDeck();
      const newCard = deck.pop()!;
      finalDealerCards.push(newCard);
      dealerValue = calculateHandValue(finalDealerCards);
    }
    
    setDealerCards(finalDealerCards);
    
    const playerValue = calculateHandValue(finalPlayerCards);
    
    let result = 'lose';
    let payout = 0;
    
    if (playerValue > 21) {
      result = 'lose'; // Player busts
    } else if (dealerValue > 21) {
      result = 'win'; // Dealer busts
      payout = betAmount * 2;
    } else if (playerValue > dealerValue) {
      result = 'win';
      payout = betAmount * 2;
    } else if (playerValue === dealerValue) {
      result = 'draw';
      payout = betAmount;
    } else {
      result = 'lose';
    }
    
    // Special case for blackjack
    if (finalPlayerCards.length === 2 && playerValue === 21) {
      payout = Math.floor(betAmount * 2.5);
      result = 'win';
    }
    
    try {
      await apiRequest("POST", "/api/games/play", {
        gameType: 'blackjack',
        betAmount: betAmount.toString(),
        winAmount: payout.toString(),
        gameData: { playerCards: finalPlayerCards, dealerCards: finalDealerCards, playerValue, dealerValue },
        result
      });
      
      setGameResult(result);
      setWinAmount(payout);
      setGameOver(true);
      
      if (result === 'win') {
        toast({
          title: "You Won!",
          description: `You won ${payout} P COINs!`,
        });
      } else if (result === 'draw') {
        toast({
          title: "It's a Push!",
          description: "Your bet has been returned.",
        });
      } else {
        toast({
          title: "You Lost",
          description: `Better luck next time!`,
          variant: "destructive",
        });
      }
      
      onGameEnd();
    } catch (error: any) {
      toast({
        title: "Game Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const resetGame = () => {
    setGameStarted(false);
    setPlayerCards([]);
    setDealerCards([]);
    setGameOver(false);
    setGameResult(null);
    setWinAmount(0);
    setCanHit(true);
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
        <span className={`text-sm font-bold ${SUITS[card.suit].color}`}>{card.rank}</span>
        <SuitIcon className={`w-4 h-4 ${SUITS[card.suit].color}`} />
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card className="glass-effect border-none bg-transparent">
        <CardHeader>
          <CardTitle className="flex items-center space-x-3">
            <Heart className="w-8 h-8 text-red-500" />
            <span className="text-2xl neon-blue-text">Blackjack</span>
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
                onClick={() => startGameMutation.mutate()}
                disabled={startGameMutation.isPending || betAmount > userBalance || betAmount < 1}
                className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-8 py-3"
              >
                <Play className="w-4 h-4 mr-2" />
                {startGameMutation.isPending ? "Dealing..." : "Deal Cards"}
              </Button>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Dealer Cards */}
              <div className="text-center">
                <h3 className="text-lg font-bold text-red-400 mb-2">Dealer</h3>
                <div className="flex justify-center space-x-2 mb-2">
                  {dealerCards.map((card, index) => (
                    <CardComponent 
                      key={index} 
                      card={card} 
                      hidden={index === 1 && !gameOver} 
                    />
                  ))}
                </div>
                <p className="text-gray-300">
                  Value: {gameOver ? calculateHandValue(dealerCards) : '?'}
                </p>
              </div>

              {/* Player Cards */}
              <div className="text-center">
                <h3 className="text-lg font-bold text-cyan-400 mb-2">Your Cards</h3>
                <div className="flex justify-center space-x-2 mb-2">
                  {playerCards.map((card, index) => (
                    <CardComponent key={index} card={card} />
                  ))}
                </div>
                <p className="text-gray-300">
                  Value: {calculateHandValue(playerCards)}
                </p>
              </div>

              {/* Game Controls */}
              {!gameOver && (
                <div className="flex justify-center space-x-4">
                  <Button
                    onClick={hit}
                    disabled={!canHit}
                    className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Hit
                  </Button>
                  <Button
                    onClick={() => stand(playerCards, dealerCards)}
                    disabled={!canHit}
                    className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
                  >
                    <Minus className="w-4 h-4 mr-2" />
                    Stand
                  </Button>
                </div>
              )}

              {/* Game Result */}
              {gameOver && gameResult && (
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
                     gameResult === 'draw' ? '🤝 Push!' : 
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