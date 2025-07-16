import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, DollarSign, TrendingUp, TrendingDown } from 'lucide-react';

interface SlideGameProps {
  userBalance: number;
  onGameEnd: () => void;
}

export default function SlideGame({ userBalance, onGameEnd }: SlideGameProps) {
  const [betAmount, setBetAmount] = useState('10');
  const [prediction, setPrediction] = useState<'higher' | 'lower'>('higher');
  const [targetValue, setTargetValue] = useState([50]);
  const [gameResult, setGameResult] = useState<{ actualValue: number; won: boolean; winAmount: number; multiplier: number } | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [animatedValue, setAnimatedValue] = useState(0);
  const { toast } = useToast();

  const calculateMultiplier = () => {
    const target = targetValue[0];
    if (prediction === 'higher') {
      return target >= 95 ? 20 : (100 - target) / 50;
    } else {
      return target <= 5 ? 20 : target / 50;
    }
  };

  const playGameMutation = useMutation({
    mutationFn: async (amount: string) => {
      const res = await apiRequest('POST', '/api/games/play', {
        gameType: 'slide',
        betAmount: amount,
        gameData: { 
          prediction,
          targetValue: targetValue[0],
          multiplier: calculateMultiplier()
        }
      });
      return await res.json();
    },
    onSuccess: (data) => {
      // Animate the slider to the result
      animateToResult(data.actualValue);
      
      setGameResult({
        actualValue: data.actualValue,
        won: data.winAmount > 0,
        winAmount: data.winAmount || 0,
        multiplier: data.multiplier || 0
      });
      
      setTimeout(() => {
        setIsPlaying(false);
        
        if (data.winAmount > 0) {
          toast({
            title: "Winner!",
            description: `Result: ${data.actualValue}! You won ${data.winAmount} P COINS! (${data.multiplier}x)`,
          });
        } else {
          toast({
            title: "You Lost",
            description: `Result: ${data.actualValue}. Better luck next time!`,
            variant: "destructive",
          });
        }
        
        onGameEnd();
      }, 2000);
    },
    onError: (error) => {
      console.error('Game error:', error);
      setIsPlaying(false);
      toast({
        title: "Error",
        description: "Failed to play game. Please try again.",
        variant: "destructive",
      });
    },
  });

  const animateToResult = (result: number) => {
    let current = animatedValue;
    const increment = (result - current) / 50;
    
    const animate = () => {
      current += increment;
      setAnimatedValue(current);
      
      if (Math.abs(current - result) > 1) {
        requestAnimationFrame(animate);
      } else {
        setAnimatedValue(result);
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
    setAnimatedValue(0);
    playGameMutation.mutate(betAmount);
  };

  const renderSlider = () => {
    const target = targetValue[0];
    const current = isPlaying ? animatedValue : target;
    
    return (
      <div className="relative w-full h-20 bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 rounded-lg overflow-hidden">
        {/* Target line */}
        <div 
          className="absolute top-0 h-full w-1 bg-white shadow-lg z-10"
          style={{ left: `${target}%` }}
        >
          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-white text-xs font-bold">
            {target}
          </div>
        </div>
        
        {/* Current value indicator */}
        <div 
          className="absolute top-0 h-full w-2 bg-black shadow-lg z-20 transition-all duration-100"
          style={{ left: `${current}%` }}
        >
          <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-white text-xs font-bold">
            {Math.round(current)}
          </div>
        </div>
        
        {/* Prediction zones */}
        {prediction === 'higher' && (
          <div 
            className="absolute top-0 h-full bg-green-400/30 border-2 border-green-400"
            style={{ left: `${target}%`, width: `${100 - target}%` }}
          >
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white font-bold">
              WIN ZONE
            </div>
          </div>
        )}
        
        {prediction === 'lower' && (
          <div 
            className="absolute top-0 h-full bg-red-400/30 border-2 border-red-400"
            style={{ left: '0%', width: `${target}%` }}
          >
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white font-bold">
              WIN ZONE
            </div>
          </div>
        )}
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
              <CardTitle className="text-casino-gold text-2xl">Slide</CardTitle>
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
          <div className="max-w-2xl mx-auto space-y-6">
            {/* Game Instructions */}
            <div className="text-center">
              <p className="text-gray-300 mb-2">
                Predict if the slider will land higher or lower than your target!
              </p>
              <p className="text-gray-400 text-sm">
                The closer to the edge, the higher the multiplier
              </p>
            </div>

            {/* Betting Controls */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              
              <div>
                <Label className="text-white mb-2 block">Prediction</Label>
                <div className="flex space-x-2">
                  <Button
                    variant={prediction === 'higher' ? 'default' : 'outline'}
                    onClick={() => setPrediction('higher')}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Higher
                  </Button>
                  <Button
                    variant={prediction === 'lower' ? 'default' : 'outline'}
                    onClick={() => setPrediction('lower')}
                    className="flex-1 bg-red-600 hover:bg-red-700"
                  >
                    <TrendingDown className="w-4 h-4 mr-2" />
                    Lower
                  </Button>
                </div>
              </div>
            </div>

            {/* Target Slider */}
            <div>
              <Label className="text-white mb-4 block">
                Target Value: {targetValue[0]} (Multiplier: {calculateMultiplier().toFixed(2)}x)
              </Label>
              <Slider
                value={targetValue}
                onValueChange={setTargetValue}
                max={100}
                min={0}
                step={1}
                className="w-full"
                disabled={isPlaying}
              />
            </div>

            {/* Game Board */}
            <div className="bg-black/50 rounded-lg p-6 border border-gray-700">
              <h3 className="text-white font-semibold mb-4 text-center">Game Board</h3>
              {renderSlider()}
            </div>

            {/* Play Button */}
            <Button
              onClick={handlePlay}
              disabled={isPlaying || playGameMutation.isPending}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white font-bold py-3"
            >
              {isPlaying ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Playing...</span>
                </div>
              ) : (
                'Play'
              )}
            </Button>

            {/* Game Result */}
            {gameResult && (
              <div className="mt-4 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                <h3 className="text-casino-gold font-semibold mb-2">Game Result</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Result:</span>
                    <span className="text-white font-semibold">{gameResult.actualValue}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Prediction:</span>
                    <span className={`font-semibold ${gameResult.won ? 'text-green-400' : 'text-red-400'}`}>
                      {gameResult.won ? 'Correct' : 'Wrong'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Win Amount:</span>
                    <span className="text-yellow-400 font-semibold">
                      {gameResult.winAmount.toFixed(2)} P COINS
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}