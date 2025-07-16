import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, DollarSign, RotateCcw } from 'lucide-react';

interface RouletteGameProps {
  userBalance: number;
  onGameEnd: () => void;
}

export default function RouletteGame({ userBalance, onGameEnd }: RouletteGameProps) {
  const [betAmount, setBetAmount] = useState('10');
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
  const [selectedColor, setSelectedColor] = useState<'red' | 'black' | null>(null);
  const [selectedType, setSelectedType] = useState<'even' | 'odd' | null>(null);
  const [gameResult, setGameResult] = useState<{ number: number; winAmount: number; multiplier: number } | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [wheelRotation, setWheelRotation] = useState(0);
  const { toast } = useToast();

  const redNumbers = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
  const blackNumbers = [2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35];

  const playGameMutation = useMutation({
    mutationFn: async (amount: string) => {
      const res = await apiRequest('POST', '/api/games/play', {
        gameType: 'roulette',
        betAmount: amount,
        gameData: { 
          selectedNumbers,
          selectedColor,
          selectedType
        }
      });
      return await res.json();
    },
    onSuccess: (data) => {
      const finalRotation = wheelRotation + 1800 + (data.number * 360 / 37);
      setWheelRotation(finalRotation);
      
      setTimeout(() => {
        setGameResult({
          number: data.number,
          winAmount: data.winAmount || 0,
          multiplier: data.multiplier || 0
        });
        
        setIsSpinning(false);
        
        if (data.winAmount > 0) {
          toast({
            title: "Winner!",
            description: `Number ${data.number}! You won ${data.winAmount} P COINS! (${data.multiplier}x)`,
          });
        } else {
          toast({
            title: "House Wins",
            description: `Number ${data.number}. Better luck next time!`,
            variant: "destructive",
          });
        }
        
        onGameEnd();
      }, 3000);
    },
    onError: (error) => {
      console.error('Game error:', error);
      setIsSpinning(false);
      toast({
        title: "Error",
        description: "Failed to play game. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSpin = () => {
    const amount = parseFloat(betAmount);
    if (amount <= 0 || amount > userBalance) {
      toast({
        title: "Invalid Bet",
        description: "Please enter a valid bet amount.",
        variant: "destructive",
      });
      return;
    }

    if (selectedNumbers.length === 0 && !selectedColor && !selectedType) {
      toast({
        title: "No Bet Selected",
        description: "Please select a number, color, or type to bet on.",
        variant: "destructive",
      });
      return;
    }
    
    setIsSpinning(true);
    setGameResult(null);
    playGameMutation.mutate(betAmount);
  };

  const handleNumberSelect = (number: number) => {
    if (selectedNumbers.includes(number)) {
      setSelectedNumbers(selectedNumbers.filter(n => n !== number));
    } else {
      setSelectedNumbers([...selectedNumbers, number]);
    }
  };

  const getNumberColor = (number: number) => {
    if (number === 0) return 'green';
    return redNumbers.includes(number) ? 'red' : 'black';
  };

  const renderRouletteWheel = () => {
    return (
      <div className="relative w-64 h-64 mx-auto mb-6">
        <div 
          className="w-full h-full rounded-full border-8 border-yellow-400 bg-gradient-to-br from-yellow-600 to-yellow-800 transition-transform duration-3000 ease-out"
          style={{ transform: `rotate(${wheelRotation}deg)` }}
        >
          <div className="absolute inset-4 rounded-full bg-black border-4 border-yellow-300">
            <div className="absolute inset-2 rounded-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
              <div className="w-16 h-16 bg-yellow-400 rounded-full border-4 border-yellow-300 flex items-center justify-center">
                <RotateCcw className="w-8 h-8 text-black" />
              </div>
            </div>
          </div>
        </div>
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-2">
          <div className="w-0 h-0 border-l-4 border-r-4 border-b-8 border-transparent border-b-yellow-400"></div>
        </div>
      </div>
    );
  };

  const renderNumberGrid = () => {
    const numbers = Array.from({ length: 37 }, (_, i) => i);
    
    return (
      <div className="grid grid-cols-13 gap-1 max-w-4xl mx-auto">
        {numbers.map((number) => {
          const color = getNumberColor(number);
          const isSelected = selectedNumbers.includes(number);
          
          return (
            <button
              key={number}
              onClick={() => handleNumberSelect(number)}
              className={`w-8 h-8 text-xs font-bold rounded border-2 transition-all duration-200 ${
                isSelected 
                  ? 'border-yellow-400 scale-110' 
                  : 'border-gray-600 hover:border-gray-400'
              } ${
                color === 'red' 
                  ? 'bg-red-600 text-white' 
                  : color === 'black' 
                  ? 'bg-black text-white' 
                  : 'bg-green-600 text-white'
              }`}
            >
              {number}
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
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
              <CardTitle className="text-casino-gold text-2xl">Roulette</CardTitle>
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
            {/* Betting Controls */}
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
              
              {/* Color Bets */}
              <div>
                <Label className="text-white mb-2 block">Color Bets (2x)</Label>
                <div className="flex space-x-2">
                  <Button
                    variant={selectedColor === 'red' ? 'default' : 'outline'}
                    onClick={() => setSelectedColor(selectedColor === 'red' ? null : 'red')}
                    className="flex-1 bg-red-600 hover:bg-red-700"
                  >
                    Red
                  </Button>
                  <Button
                    variant={selectedColor === 'black' ? 'default' : 'outline'}
                    onClick={() => setSelectedColor(selectedColor === 'black' ? null : 'black')}
                    className="flex-1 bg-black hover:bg-gray-800"
                  >
                    Black
                  </Button>
                </div>
              </div>
              
              {/* Type Bets */}
              <div>
                <Label className="text-white mb-2 block">Type Bets (2x)</Label>
                <div className="flex space-x-2">
                  <Button
                    variant={selectedType === 'even' ? 'default' : 'outline'}
                    onClick={() => setSelectedType(selectedType === 'even' ? null : 'even')}
                    className="flex-1"
                  >
                    Even
                  </Button>
                  <Button
                    variant={selectedType === 'odd' ? 'default' : 'outline'}
                    onClick={() => setSelectedType(selectedType === 'odd' ? null : 'odd')}
                    className="flex-1"
                  >
                    Odd
                  </Button>
                </div>
              </div>
              
              <Button
                onClick={handleSpin}
                disabled={isSpinning || playGameMutation.isPending}
                className="w-full bg-gradient-to-r from-red-500 to-black hover:from-red-400 hover:to-gray-800 text-white font-bold py-3"
              >
                {isSpinning ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Spinning...</span>
                  </div>
                ) : (
                  'Spin Wheel'
                )}
              </Button>
              
              {gameResult && (
                <div className="mt-4 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                  <h3 className="text-casino-gold font-semibold mb-2">Result</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Number:</span>
                      <span className={`font-bold ${
                        getNumberColor(gameResult.number) === 'red' ? 'text-red-400' :
                        getNumberColor(gameResult.number) === 'black' ? 'text-white' :
                        'text-green-400'
                      }`}>
                        {gameResult.number}
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

            {/* Roulette Wheel */}
            <div className="text-center">
              {renderRouletteWheel()}
              <p className="text-gray-400 text-sm">
                {isSpinning ? 'Spinning...' : 'Click spin to play!'}
              </p>
            </div>

            {/* Number Grid */}
            <div>
              <Label className="text-white mb-4 block">Numbers (36x)</Label>
              {renderNumberGrid()}
              <div className="mt-4 text-center">
                <p className="text-gray-400 text-sm">
                  Selected: {selectedNumbers.join(', ') || 'None'}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}