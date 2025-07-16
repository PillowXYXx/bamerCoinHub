import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Play, DollarSign, Target, TrendingUp } from 'lucide-react';

interface Ball {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  active: boolean;
}

interface PlinkoGameProps {
  userBalance: number;
  onGameEnd: () => void;
}

export default function PlinkoGame({ userBalance, onGameEnd }: PlinkoGameProps) {
  const [betAmount, setBetAmount] = useState('25');
  const [difficulty, setDifficulty] = useState<'easy' | 'normal' | 'hard'>('easy');
  const [rows, setRows] = useState(10);
  const [gameResult, setGameResult] = useState<{ multiplier: number; winAmount: number; ballPath: number[] } | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [balls, setBalls] = useState<Ball[]>([]);
  const [ballCount, setBallCount] = useState(1);
  const { toast } = useToast();

  // Plinko multipliers based on difficulty and rows
  const getMultipliers = () => {
    if (difficulty === 'easy') {
      return [5.7, 2.3, 1.2, 1, 0.5, 1, 1, 1.2, 2.3, 5.7];
    } else if (difficulty === 'normal') {
      return [110, 41, 10, 5, 3, 1.5, 1, 0.5, 1, 1.5, 3, 5, 10, 41, 110];
    } else {
      return [1000, 130, 26, 9, 4, 2, 0.2, 0.2, 0.2, 0.2, 0.2, 2, 4, 9, 26, 130, 1000];
    }
  };

  const playGameMutation = useMutation({
    mutationFn: async (amount: string) => {
      return await apiRequest('POST', '/api/games/play', {
        gameType: 'plinko',
        betAmount: amount,
        gameData: { 
          difficulty,
          rows,
          multipliers: getMultipliers()
        }
      });
    },
    onSuccess: (data) => {
      if (data && typeof data === 'object') {
        setGameResult({
          multiplier: data.multiplier || 0,
          winAmount: data.winAmount || 0,
          ballPath: data.ballPath || []
        });
        
        if (data.winAmount > 0) {
          toast({
            title: "Winner!",
            description: `You won ${data.winAmount} P COINS! (${data.multiplier}x)`,
          });
        } else {
          toast({
            title: "Try Again",
            description: "Better luck next time!",
            variant: "destructive",
          });
        }
        
        onGameEnd();
      } else {
        console.error("Invalid game response:", data);
        setIsPlaying(false);
        toast({
          title: "Error",
          description: "Invalid game response. Please try again.",
          variant: "destructive",
        });
      }
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

  // Enhanced physics simulation with anti-lag optimizations
  const simulatePhysics = () => {
    const boardWidth = 400;
    const boardHeight = 500;
    const pegRadius = 5;
    const ballRadius = 7;
    
    // Create optimized pegs layout
    const pegs: { x: number; y: number }[] = [];
    for (let row = 0; row < rows; row++) {
      const pegCount = row + 3;
      const spacing = boardWidth / (pegCount + 1);
      for (let col = 0; col < pegCount; col++) {
        pegs.push({
          x: spacing * (col + 1),
          y: 50 + row * 35
        });
      }
    }

    let lastTime = performance.now();
    const targetFPS = 50; // Reduced for smoother performance
    const frameTime = 1000 / targetFPS;
    const maxBalls = 3; // Limit concurrent balls to prevent lag

    const animationFrame = (ballList: Ball[]) => {
      const currentTime = performance.now();
      const deltaTime = currentTime - lastTime;

      // Skip frame if running too fast (prevents lag)
      if (deltaTime < frameTime) {
        requestAnimationFrame(() => animationFrame(ballList));
        return;
      }

      lastTime = currentTime;
      const timeScale = Math.min(deltaTime / 16.67, 2); // Cap time scale to prevent jumps

      const newBalls = ballList.map(ball => {
        if (!ball.active) return ball;

        // Enhanced physics with proper time scaling
        let newVx = ball.vx * 0.995; // Air resistance
        let newVy = ball.vy + (0.4 * timeScale); // Gravity with time scaling
        let newX = ball.x + (newVx * timeScale);
        let newY = ball.y + (newVy * timeScale);

        // Optimized collision detection
        let hasCollided = false;
        for (const peg of pegs) {
          const dx = newX - peg.x;
          const dy = newY - peg.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < pegRadius + ballRadius && !hasCollided) {
            hasCollided = true;
            // More realistic bounce physics
            const angle = Math.atan2(dy, dx);
            const speed = Math.sqrt(newVx * newVx + newVy * newVy) * 0.8;
            
            newVx = Math.cos(angle) * speed + (Math.random() - 0.5) * 1.5;
            newVy = Math.abs(Math.sin(angle) * speed) + Math.random() * 1;
            
            // Move ball away from peg to prevent sticking
            newX = peg.x + Math.cos(angle) * (pegRadius + ballRadius + 2);
            newY = peg.y + Math.sin(angle) * (pegRadius + ballRadius + 2);
            break; // Only process one collision per frame
          }
        }

        // Enhanced boundary handling
        if (newX < ballRadius) {
          newVx = Math.abs(newVx) * 0.7;
          newX = ballRadius;
        } else if (newX > boardWidth - ballRadius) {
          newVx = -Math.abs(newVx) * 0.7;
          newX = boardWidth - ballRadius;
        }

        // Velocity limits to prevent excessive speed
        newVx = Math.max(-6, Math.min(6, newVx));
        newVy = Math.min(8, newVy);

        // Bottom boundary
        if (newY > boardHeight - ballRadius) {
          return { ...ball, active: false, y: boardHeight - ballRadius };
        }

        return {
          ...ball,
          x: newX,
          y: newY,
          vx: newVx,
          vy: newVy
        };
      });

      setBalls(newBalls);

      // Continue animation if any balls are active
      if (newBalls.some(ball => ball.active)) {
        requestAnimationFrame(() => animationFrame(newBalls));
      } else {
        setIsPlaying(false);
        setTimeout(() => setBalls([]), 1500);
      }
    };

    // Start animation
    requestAnimationFrame(() => animationFrame(balls));
  };

  const dropBalls = () => {
    const boardWidth = 400;
    const newBalls: Ball[] = [];
    
    for (let i = 0; i < ballCount; i++) {
      newBalls.push({
        id: i,
        x: boardWidth / 2 + (Math.random() - 0.5) * 20,
        y: 20,
        vx: (Math.random() - 0.5) * 2,
        vy: 0,
        active: true
      });
    }
    
    setBalls(newBalls);
    setIsPlaying(true);
  };

  useEffect(() => {
    if (balls.length > 0 && isPlaying) {
      simulatePhysics();
    }
  }, [balls.length]);

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
    
    setGameResult(null);
    dropBalls();
    playGameMutation.mutate(betAmount);
  };

  const renderPlinkoBoard = () => {
    const multipliers = getMultipliers();
    const boardWidth = 400;
    const boardHeight = 500;
    
    // Create pegs layout for rendering
    const pegs = [];
    for (let row = 0; row < rows; row++) {
      const pegCount = row + 3;
      const spacing = boardWidth / (pegCount + 1);
      for (let col = 0; col < pegCount; col++) {
        pegs.push({
          x: spacing * (col + 1),
          y: 50 + row * 35,
          key: `${row}-${col}`
        });
      }
    }
    
    return (
      <div className="relative bg-gradient-to-b from-gray-900 to-black rounded-lg border-2 border-cyan-500/30 p-4">
        <div 
          className="relative mx-auto bg-gradient-to-b from-gray-800 to-gray-900 rounded-lg border border-cyan-500/20"
          style={{ width: `${boardWidth}px`, height: `${boardHeight}px` }}
        >
          {/* Pegs */}
          {pegs.map(peg => (
            <div
              key={peg.key}
              className="absolute w-2 h-2 bg-cyan-400 rounded-full shadow-lg shadow-cyan-400/50"
              style={{
                left: `${peg.x - 4}px`,
                top: `${peg.y - 4}px`
              }}
            />
          ))}
          
          {/* Balls */}
          {balls.map(ball => (
            <div
              key={ball.id}
              className="absolute w-3 h-3 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full shadow-lg shadow-yellow-400/50 transition-all duration-75"
              style={{
                left: `${ball.x - 6}px`,
                top: `${ball.y - 6}px`,
                opacity: ball.active ? 1 : 0.7
              }}
            />
          ))}
          
          {/* Multiplier buckets at bottom */}
          <div className="absolute bottom-2 left-2 right-2 flex justify-between">
            {multipliers.map((mult, index) => (
              <div
                key={index}
                className={`flex-1 mx-0.5 p-1 text-center text-xs font-bold rounded ${
                  mult >= 10 
                    ? 'bg-gradient-to-t from-yellow-600 to-yellow-400 text-black' 
                    : mult >= 2 
                    ? 'bg-gradient-to-t from-green-600 to-green-400 text-white'
                    : 'bg-gradient-to-t from-red-600 to-red-400 text-white'
                }`}
              >
                {mult}x
              </div>
            ))}
          </div>
        </div>
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
              <CardTitle className="text-casino-gold text-2xl">Plinko</CardTitle>
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
                <Label className="text-white mb-2 block">Difficulty</Label>
                <div className="flex space-x-2">
                  <Button
                    variant={difficulty === 'easy' ? 'default' : 'outline'}
                    onClick={() => setDifficulty('easy')}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    Easy
                  </Button>
                  <Button
                    variant={difficulty === 'normal' ? 'default' : 'outline'}
                    onClick={() => setDifficulty('normal')}
                    className="flex-1 bg-yellow-600 hover:bg-yellow-700"
                  >
                    Normal
                  </Button>
                  <Button
                    variant={difficulty === 'hard' ? 'default' : 'outline'}
                    onClick={() => setDifficulty('hard')}
                    className="flex-1 bg-red-600 hover:bg-red-700"
                  >
                    Hard
                  </Button>
                </div>
              </div>
              
              <div>
                <Label className="text-white">Play amount</Label>
                <div className="flex mt-2">
                  <Input
                    type="number"
                    value={betAmount}
                    onChange={(e) => setBetAmount(e.target.value)}
                    className="bg-black/60 border-gray-700 text-white"
                    placeholder="Enter bet amount"
                  />
                  <Button
                    onClick={() => setBetAmount((parseFloat(betAmount) / 2).toString())}
                    className="ml-2 bg-gray-700 hover:bg-gray-600"
                  >
                    1/2
                  </Button>
                  <Button
                    onClick={() => setBetAmount((parseFloat(betAmount) * 2).toString())}
                    className="ml-2 bg-gray-700 hover:bg-gray-600"
                  >
                    2x
                  </Button>
                </div>
              </div>
              
              <div>
                <Label className="text-white">Amount of rows</Label>
                <div className="flex space-x-2 mt-2">
                  {[8, 10, 12, 14, 16].map((rowCount) => (
                    <Button
                      key={rowCount}
                      variant={rows === rowCount ? 'default' : 'outline'}
                      onClick={() => setRows(rowCount)}
                      size="sm"
                      className="flex-1"
                    >
                      {rowCount}
                    </Button>
                  ))}
                </div>
              </div>
              
              <div>
                <Label className="text-white">Number of balls</Label>
                <div className="flex space-x-2 mt-2">
                  {[1, 3, 5, 10].map((count) => (
                    <Button
                      key={count}
                      variant={ballCount === count ? 'default' : 'outline'}
                      onClick={() => setBallCount(count)}
                      size="sm"
                      className="flex-1"
                    >
                      {count}
                    </Button>
                  ))}
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
                    <span>Dropping Ball...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Play className="w-4 h-4" />
                    <span>Start new game</span>
                  </div>
                )}
              </Button>
              
              {gameResult && (
                <div className="mt-4 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                  <h3 className="text-casino-gold font-semibold mb-2">Game Result</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Multiplier:</span>
                      <span className="text-white font-semibold">{gameResult.multiplier}x</span>
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

            {/* Plinko Board */}
            <div className="lg:col-span-2">
              {renderPlinkoBoard()}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}