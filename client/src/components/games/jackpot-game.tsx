import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, DollarSign, Crown, Zap } from 'lucide-react';

interface JackpotGameProps {
  userBalance: number;
  onGameEnd: () => void;
}

export default function JackpotGame({ userBalance, onGameEnd }: JackpotGameProps) {
  const [betAmount, setBetAmount] = useState('10');
  const [jackpotAmount, setJackpotAmount] = useState(1000);
  const [currentMultiplier, setCurrentMultiplier] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameResult, setGameResult] = useState<{ won: boolean; winAmount: number; jackpot: boolean } | null>(null);
  const [animationPhase, setAnimationPhase] = useState<'spinning' | 'revealing' | 'finished'>('finished');
  const [slotValues, setSlotValues] = useState(['🍋', '🍎', '🍇']);
  const { toast } = useToast();

  const symbols = ['🍋', '🍎', '🍇', '🍊', '🍒', '💎', '⭐', '👑'];
  const jackpotSymbol = '👑';

  // Simulate growing jackpot
  useEffect(() => {
    const interval = setInterval(() => {
      setJackpotAmount(prev => prev + Math.random() * 5);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const playGameMutation = useMutation({
    mutationFn: async (amount: string) => {
      const res = await apiRequest('POST', '/api/games/play', {
        gameType: 'jackpot',
        betAmount: amount,
        gameData: { jackpotAmount }
      });
      return await res.json();
    },
    onSuccess: (data) => {
      // Animate slot machine
      setAnimationPhase('spinning');
      animateSlots(data.symbols || ['🍋', '🍎', '🍇']);
      
      setTimeout(() => {
        setAnimationPhase('revealing');
        setSlotValues(data.symbols || ['🍋', '🍎', '🍇']);
        
        setTimeout(() => {
          setAnimationPhase('finished');
          setIsPlaying(false);
          
          setGameResult({
            won: data.winAmount > 0,
            winAmount: data.winAmount || 0,
            jackpot: data.jackpot || false
          });
          
          if (data.jackpot) {
            setJackpotAmount(500); // Reset jackpot
            toast({
              title: "🎉 JACKPOT! 🎉",
              description: `INCREDIBLE! You won the jackpot of ${data.winAmount} P COINS!`,
            });
          } else if (data.winAmount > 0) {
            toast({
              title: "Winner!",
              description: `You won ${data.winAmount} P COINS!`,
            });
          } else {
            toast({
              title: "Try Again",
              description: "Better luck next time!",
              variant: "destructive",
            });
          }
          
          onGameEnd();
        }, 1000);
      }, 2000);
    },
    onError: (error) => {
      console.error('Game error:', error);
      setIsPlaying(false);
      setAnimationPhase('finished');
      toast({
        title: "Error",
        description: "Failed to play game. Please try again.",
        variant: "destructive",
      });
    },
  });

  const animateSlots = (finalSymbols: string[]) => {
    let iterations = 0;
    const maxIterations = 20;
    
    const animate = () => {
      if (iterations < maxIterations) {
        setSlotValues([
          symbols[Math.floor(Math.random() * symbols.length)],
          symbols[Math.floor(Math.random() * symbols.length)],
          symbols[Math.floor(Math.random() * symbols.length)]
        ]);
        iterations++;
        setTimeout(animate, 100);
      } else {
        setSlotValues(finalSymbols);
      }
    };
    
    animate();
  };

  const handlePlay = () => {
    const amount = parseFloat(betAmount);
    if (amount <= 0 || amount > userBalance) {
      toast({
        title: "Invalid Bet",
        description: "Please enter a valid bet amount.",
        variant: "destructive",
      });
      return;
    }
    
    setIsPlaying(true);
    setGameResult(null);
    setAnimationPhase('spinning');
    playGameMutation.mutate(betAmount);
  };

  const calculateWinChance = () => {
    const bet = parseFloat(betAmount);
    if (bet <= 0) return 0;
    
    // Higher bets = slightly better odds
    const baseChance = 15; // 15% base win chance
    const bonusChance = Math.min(bet / 100, 5); // Up to 5% bonus
    return Math.min(baseChance + bonusChance, 25); // Max 25% win chance
  };

  const renderSlotMachine = () => {
    return (
      <div className="bg-gradient-to-br from-yellow-600 to-yellow-800 p-8 rounded-xl border-4 border-yellow-400 shadow-2xl">
        <div className="bg-black rounded-lg p-6 border-2 border-yellow-400">
          <div className="grid grid-cols-3 gap-4">
            {slotValues.map((symbol, index) => (
              <div
                key={index}
                className={`w-20 h-20 bg-white rounded-lg flex items-center justify-center text-4xl border-2 border-gray-300 ${
                  animationPhase === 'spinning' ? 'animate-bounce' : ''
                }`}
              >
                {symbol}
              </div>
            ))}
          </div>
          
          {/* Jackpot display */}
          <div className="mt-4 text-center">
            <div className="text-yellow-400 font-bold text-lg mb-2">
              🎰 JACKPOT 🎰
            </div>
            <div className="text-white text-2xl font-bold">
              {jackpotAmount.toFixed(0)} P COINS
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderPaytable = () => {
    return (
      <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
        <h3 className="text-casino-gold font-semibold mb-3">Paytable</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>👑 👑 👑</span>
            <span className="text-yellow-400">JACKPOT!</span>
          </div>
          <div className="flex justify-between">
            <span>💎 💎 💎</span>
            <span className="text-purple-400">50x</span>
          </div>
          <div className="flex justify-between">
            <span>⭐ ⭐ ⭐</span>
            <span className="text-blue-400">25x</span>
          </div>
          <div className="flex justify-between">
            <span>🍒 🍒 🍒</span>
            <span className="text-red-400">10x</span>
          </div>
          <div className="flex justify-between">
            <span>🍋 🍋 🍋</span>
            <span className="text-yellow-400">5x</span>
          </div>
          <div className="flex justify-between">
            <span>🍎 🍎 🍎</span>
            <span className="text-green-400">3x</span>
          </div>
          <div className="flex justify-between">
            <span>Any 2 match</span>
            <span className="text-gray-400">1.5x</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card className="glass-effect border-none bg-black/40">
        <CardHeader className="border-b border-gray-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={onGameEnd}
                className="text-gray-400 hover:text-white"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Games
              </Button>
              <CardTitle className="text-casino-gold text-2xl">
                <Crown className="w-6 h-6 inline mr-2" />
                Jackpot
              </CardTitle>
            </div>
            <div className="flex items-center space-x-2">
              <DollarSign className="w-5 h-5 text-yellow-400" />
              <span className="text-yellow-400 font-semibold">
                {userBalance.toFixed(2)} P COINS
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Game Controls */}
            <div className="space-y-6">
              <div>
                <Label className="text-white">Bet Amount</Label>
                <Input
                  type="number"
                  value={betAmount}
                  onChange={(e) => setBetAmount(e.target.value)}
                  className="bg-black/60 border-gray-700 text-white mt-2"
                  placeholder="Enter bet amount"
                />
              </div>
              
              {/* Win Chance */}
              <div>
                <Label className="text-white mb-2 block">Win Chance</Label>
                <div className="bg-gray-700 rounded-full h-4 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-green-500 to-yellow-500 h-full transition-all duration-300"
                    style={{ width: `${calculateWinChance()}%` }}
                  />
                </div>
                <div className="text-center text-sm text-gray-400 mt-1">
                  {calculateWinChance().toFixed(1)}%
                </div>
              </div>
              
              <Button
                onClick={handlePlay}
                disabled={isPlaying || playGameMutation.isPending}
                className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-white font-bold py-3"
              >
                {isPlaying ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Spinning...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Zap className="w-4 h-4" />
                    <span>Spin</span>
                  </div>
                )}
              </Button>
              
              {/* Paytable */}
              {renderPaytable()}
            </div>

            {/* Slot Machine */}
            <div className="lg:col-span-2">
              <div className="text-center mb-6">
                <h3 className="text-casino-gold font-semibold mb-2">Slot Machine</h3>
                <p className="text-gray-400 text-sm">
                  Match 3 symbols to win! 👑👑👑 wins the jackpot!
                </p>
              </div>
              
              {renderSlotMachine()}
              
              {/* Game Result */}
              {gameResult && animationPhase === 'finished' && (
                <div className="mt-6 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                  <h3 className="text-casino-gold font-semibold mb-2">
                    {gameResult.jackpot ? '🎉 JACKPOT! 🎉' : 'Result'}
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Symbols:</span>
                      <span className="text-white font-semibold">
                        {slotValues.join(' ')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Win Amount:</span>
                      <span className={`font-semibold ${gameResult.jackpot ? 'text-yellow-400 text-lg' : 'text-yellow-400'}`}>
                        {gameResult.winAmount.toFixed(2)} P COINS
                      </span>
                    </div>
                    {gameResult.jackpot && (
                      <div className="text-center text-yellow-400 font-bold text-lg animate-pulse">
                        🎰 JACKPOT WINNER! 🎰
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}