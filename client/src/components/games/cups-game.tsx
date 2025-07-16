import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, DollarSign, Coffee, Eye, EyeOff } from 'lucide-react';

interface CupsGameProps {
  userBalance: number;
  onGameEnd: () => void;
}

export default function CupsGame({ userBalance, onGameEnd }: CupsGameProps) {
  const [betAmount, setBetAmount] = useState('10');
  const [selectedCup, setSelectedCup] = useState<number | null>(null);
  const [ballPosition, setBallPosition] = useState<number | null>(null);
  const [gameResult, setGameResult] = useState<{ won: boolean; winAmount: number } | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [gamePhase, setGamePhase] = useState<'betting' | 'selecting' | 'revealing' | 'finished'>('betting');
  const { toast } = useToast();

  const playGameMutation = useMutation({
    mutationFn: async (amount: string) => {
      const res = await apiRequest('POST', '/api/games/play', {
        gameType: 'cups',
        betAmount: amount,
        gameData: { selectedCup }
      });
      return await res.json();
    },
    onSuccess: (data) => {
      setBallPosition(data.ballPosition);
      setGameResult({
        won: data.winAmount > 0,
        winAmount: data.winAmount || 0
      });
      
      setGamePhase('revealing');
      
      setTimeout(() => {
        setGamePhase('finished');
        setIsPlaying(false);
        
        if (data.winAmount > 0) {
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
      }, 2000);
    },
    onError: (error) => {
      console.error('Game error:', error);
      setIsPlaying(false);
      setGamePhase('betting');
      toast({
        title: "Error",
        description: "Failed to play game. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleStartGame = () => {
    const amount = parseFloat(betAmount);
    if (amount <= 0 || amount > userBalance) {
      toast({
        title: "Invalid Bet",
        description: "Please enter a valid bet amount.",
        variant: "destructive",
      });
      return;
    }
    
    setGamePhase('selecting');
    setSelectedCup(null);
    setBallPosition(null);
    setGameResult(null);
  };

  const handleCupSelect = (cupIndex: number) => {
    if (gamePhase !== 'selecting') return;
    
    setSelectedCup(cupIndex);
    setIsPlaying(true);
    setGamePhase('revealing');
    playGameMutation.mutate(betAmount);
  };

  const handleNewGame = () => {
    setGamePhase('betting');
    setSelectedCup(null);
    setBallPosition(null);
    setGameResult(null);
    setIsPlaying(false);
  };

  const renderCup = (index: number) => {
    const isSelected = selectedCup === index;
    const hasBall = ballPosition === index;
    const isRevealed = gamePhase === 'revealing' || gamePhase === 'finished';
    
    return (
      <div
        key={index}
        className={`relative cursor-pointer transition-all duration-300 ${
          gamePhase === 'selecting' ? 'hover:scale-105' : ''
        }`}
        onClick={() => handleCupSelect(index)}
      >
        <div
          className={`w-24 h-24 rounded-b-full border-4 mx-auto transition-all duration-300 ${
            isSelected
              ? 'border-yellow-400 bg-yellow-400/20'
              : 'border-gray-400 bg-gray-400/20'
          } ${gamePhase === 'selecting' ? 'hover:border-cyan-400' : ''}`}
        >
          <Coffee className="w-16 h-16 mx-auto mt-2 text-amber-500" />
        </div>
        
        {/* Ball underneath */}
        {isRevealed && hasBall && (
          <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
            <div className="w-6 h-6 bg-red-500 rounded-full shadow-lg shadow-red-500/50 animate-bounce" />
          </div>
        )}
        
        {/* Cup number */}
        <div className="text-center mt-2 text-white font-semibold">
          Cup {index + 1}
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
              <CardTitle className="text-casino-gold text-2xl">Cups Game</CardTitle>
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
          <div className="max-w-2xl mx-auto">
            {/* Game Instructions */}
            <div className="text-center mb-6">
              <p className="text-gray-300 mb-2">
                Find the ball under one of the three cups!
              </p>
              <p className="text-gray-400 text-sm">
                Guess correctly to win 3x your bet amount
              </p>
            </div>

            {/* Betting Phase */}
            {gamePhase === 'betting' && (
              <div className="space-y-4 mb-8">
                <div className="max-w-xs mx-auto">
                  <Label className="text-white">Bet Amount</Label>
                  <Input
                    type="number"
                    value={betAmount}
                    onChange={(e) => setBetAmount(e.target.value)}
                    className="bg-black/60 border-gray-700 text-white mt-2"
                    placeholder="Enter bet amount"
                  />
                </div>
                
                <Button
                  onClick={handleStartGame}
                  className="w-full max-w-xs mx-auto block bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-400 hover:to-purple-400 text-white font-bold py-3"
                >
                  Start Game
                </Button>
              </div>
            )}

            {/* Cup Selection */}
            {gamePhase === 'selecting' && (
              <div className="text-center mb-6">
                <p className="text-cyan-400 mb-4">Choose a cup to find the ball!</p>
              </div>
            )}

            {/* Game Board */}
            <div className="grid grid-cols-3 gap-8 mb-8">
              {[0, 1, 2].map(renderCup)}
            </div>

            {/* Game Result */}
            {gameResult && gamePhase === 'finished' && (
              <div className="text-center space-y-4">
                <div className={`text-xl font-bold ${gameResult.won ? 'text-green-400' : 'text-red-400'}`}>
                  {gameResult.won ? 'You Won!' : 'You Lost!'}
                </div>
                
                {gameResult.won && (
                  <div className="text-yellow-400 font-semibold">
                    + {gameResult.winAmount.toFixed(2)} P COINS
                  </div>
                )}
                
                <Button
                  onClick={handleNewGame}
                  className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-400 hover:to-blue-400 text-white font-bold"
                >
                  Play Again
                </Button>
              </div>
            )}

            {/* Loading State */}
            {isPlaying && gamePhase === 'revealing' && (
              <div className="text-center">
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-cyan-400">Revealing...</span>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}