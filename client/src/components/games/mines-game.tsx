import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CoinDisplay } from "@/components/ui/coin-display";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Bomb, Gem, RotateCcw } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface MinesGameProps {
  userBalance: number;
  onGameEnd: () => void;
}

export default function MinesGame({ userBalance, onGameEnd }: MinesGameProps) {
  const [betAmount, setBetAmount] = useState(5);
  const [mineCount, setMineCount] = useState(3);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameBoard, setGameBoard] = useState<Array<Array<{ revealed: boolean; isMine: boolean; isGem: boolean }>>>([]);
  const [currentMultiplier, setCurrentMultiplier] = useState(1.0);
  const [gemsFound, setGemsFound] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [playerWon, setPlayerWon] = useState(false);
  const { toast } = useToast();

  const gridSize = 5;

  // Create new game board
  const createBoard = () => {
    const board = Array(gridSize).fill(null).map(() =>
      Array(gridSize).fill(null).map(() => ({
        revealed: false,
        isMine: false,
        isGem: false
      }))
    );

    // Randomly place mines
    let minesPlaced = 0;
    while (minesPlaced < mineCount) {
      const row = Math.floor(Math.random() * gridSize);
      const col = Math.floor(Math.random() * gridSize);
      
      if (!board[row][col].isMine) {
        board[row][col].isMine = true;
        minesPlaced++;
      }
    }

    // Mark remaining cells as gems
    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        if (!board[i][j].isMine) {
          board[i][j].isGem = true;
        }
      }
    }

    return board;
  };

  const startGame = () => {
    if (betAmount > userBalance) {
      toast({
        title: "Insufficient Balance",
        description: "You don't have enough P COINs to place this bet.",
        variant: "destructive",
      });
      return;
    }

    setGameBoard(createBoard());
    setGameStarted(true);
    setGameOver(false);
    setPlayerWon(false);
    setCurrentMultiplier(1.0);
    setGemsFound(0);
  };

  const revealCell = (row: number, col: number) => {
    if (gameOver || gameBoard[row][col].revealed) return;

    const newBoard = [...gameBoard];
    newBoard[row][col].revealed = true;
    setGameBoard(newBoard);

    if (newBoard[row][col].isMine) {
      // Hit a mine - game over
      setGameOver(true);
      setPlayerWon(false);
      toast({
        title: "BOOM! 💣",
        description: "You hit a mine! Better luck next time.",
        variant: "destructive",
      });
      
      // Reveal all mines
      for (let i = 0; i < gridSize; i++) {
        for (let j = 0; j < gridSize; j++) {
          if (newBoard[i][j].isMine) {
            newBoard[i][j].revealed = true;
          }
        }
      }
      setGameBoard([...newBoard]);
      
      // Process the loss
      playGameMutation.mutate({
        gameType: 'mines',
        betAmount: betAmount.toString(),
        winAmount: '0',
        gameData: { gemsFound, mineCount },
        result: 'loss'
      });
    } else {
      // Found a gem
      const newGemsFound = gemsFound + 1;
      setGemsFound(newGemsFound);
      
      // Calculate multiplier based on gems found and mine count
      const totalSafeSpots = (gridSize * gridSize) - mineCount;
      const baseMultiplier = 1.2; // Base multiplier per gem
      const riskMultiplier = 1 + (mineCount * 0.1); // Higher risk = higher multiplier
      const newMultiplier = Math.pow(baseMultiplier, newGemsFound) * riskMultiplier;
      setCurrentMultiplier(newMultiplier);

      toast({
        title: "💎 Gem Found!",
        description: `Multiplier: ${newMultiplier.toFixed(2)}x`,
        variant: "default",
      });
    }
  };

  const cashOut = () => {
    if (!gameStarted || gameOver || gemsFound === 0) return;

    setGameOver(true);
    setPlayerWon(true);
    
    const winAmount = betAmount * currentMultiplier;
    
    toast({
      title: "Cashed Out! 💰",
      description: `You won ${winAmount.toFixed(2)} P COINs with ${gemsFound} gems!`,
      variant: "default",
    });

    // Process the win
    playGameMutation.mutate({
      gameType: 'mines',
      betAmount: betAmount.toString(),
      winAmount: winAmount.toString(),
      gameData: { gemsFound, mineCount, multiplier: currentMultiplier },
      result: 'win'
    });
  };

  const resetGame = () => {
    setGameStarted(false);
    setGameBoard([]);
    setGameOver(false);
    setPlayerWon(false);
    setCurrentMultiplier(1.0);
    setGemsFound(0);
  };

  const playGameMutation = useMutation({
    mutationFn: async (gameData: {
      gameType: string;
      betAmount: string;
      winAmount: string;
      gameData: any;
      result: string;
    }) => {
      const res = await apiRequest("POST", "/api/games/play", gameData);
      return await res.json();
    },
    onSuccess: () => {
      onGameEnd();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: "Failed to process game result. Please try again.",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card className="glass-effect border-none bg-transparent">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Bomb className="w-8 h-8 text-orange-500" />
              <span className="text-2xl neon-blue-text">Mines</span>
            </div>
            <div className="flex items-center space-x-2">
              <CoinDisplay value="P" size="md" />
              <span className="font-semibold neon-blue-text">
                {Math.floor(userBalance)}
              </span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {!gameStarted ? (
            <div className="grid md:grid-cols-2 gap-8">
              {/* Game Settings */}
              <div className="space-y-6">
                <div>
                  <Label className="text-gray-300">Bet Amount</Label>
                  <Input
                    type="number"
                    value={betAmount}
                    onChange={(e) => setBetAmount(Number(e.target.value))}
                    min={1}
                    max={userBalance}
                    className="bg-black/50 border-cyan-500 text-white"
                  />
                </div>

                <div>
                  <Label className="text-gray-300">Number of Mines</Label>
                  <div className="grid grid-cols-6 gap-2 mt-2">
                    {[1, 3, 5, 10, 15, 20].map((count) => (
                      <Button
                        key={count}
                        onClick={() => setMineCount(count)}
                        variant={mineCount === count ? "default" : "outline"}
                        className={`h-8 text-xs ${
                          mineCount === count 
                            ? "bg-orange-500 text-white" 
                            : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                        }`}
                      >
                        {count}
                      </Button>
                    ))}
                  </div>
                </div>
                
                <div className="glass-effect rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-yellow-400 mb-2">How to Play</h3>
                  <ul className="text-gray-300 text-sm space-y-1">
                    <li>• Click tiles to reveal gems 💎</li>
                    <li>• Avoid mines 💣 at all costs!</li>
                    <li>• Each gem increases your multiplier</li>
                    <li>• More mines = higher risk & reward</li>
                    <li>• Cash out anytime to secure winnings</li>
                    <li>• Hit a mine and lose everything!</li>
                  </ul>
                </div>

                <Button
                  onClick={startGame}
                  disabled={betAmount > userBalance || betAmount < 1}
                  className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
                >
                  Start Game - Bet {betAmount} P COINS
                </Button>
              </div>

              {/* Game Preview */}
              <div className="flex flex-col items-center justify-center space-y-4">
                <div className="text-center">
                  <p className="text-gray-400 mb-2">Game Grid (5x5)</p>
                  <p className="text-yellow-400">Mines: {mineCount} | Safe spots: {25 - mineCount}</p>
                </div>
                <div className="grid grid-cols-5 gap-2 p-4 bg-gray-800/50 rounded-lg">
                  {Array(25).fill(null).map((_, i) => (
                    <div
                      key={i}
                      className="w-12 h-12 bg-gray-700 rounded border border-gray-600 flex items-center justify-center"
                    >
                      <span className="text-gray-500">?</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Game Stats */}
              <div className="grid grid-cols-4 gap-4">
                <div className="glass-effect rounded-lg p-4 text-center">
                  <p className="text-gray-400">Bet Amount</p>
                  <p className="text-xl font-bold text-yellow-400">{betAmount}</p>
                </div>
                <div className="glass-effect rounded-lg p-4 text-center">
                  <p className="text-gray-400">Mines</p>
                  <p className="text-xl font-bold text-orange-400">{mineCount}</p>
                </div>
                <div className="glass-effect rounded-lg p-4 text-center">
                  <p className="text-gray-400">Multiplier</p>
                  <p className="text-xl font-bold text-green-400">{currentMultiplier.toFixed(2)}x</p>
                </div>
                <div className="glass-effect rounded-lg p-4 text-center">
                  <p className="text-gray-400">Potential Win</p>
                  <p className="text-xl font-bold text-cyan-400">
                    {(betAmount * currentMultiplier).toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Game Board */}
              <div className="flex justify-center">
                <div className="grid grid-cols-5 gap-2 p-4 bg-gray-800/50 rounded-lg">
                  {gameBoard.map((row, rowIndex) =>
                    row.map((cell, colIndex) => (
                      <button
                        key={`${rowIndex}-${colIndex}`}
                        onClick={() => revealCell(rowIndex, colIndex)}
                        disabled={gameOver || cell.revealed}
                        className={`w-16 h-16 rounded border-2 flex items-center justify-center text-2xl transition-all transform hover:scale-105 ${
                          cell.revealed
                            ? cell.isMine
                              ? "bg-red-500 border-red-400 animate-pulse"
                              : "bg-green-500 border-green-400"
                            : "bg-gray-700 border-gray-600 hover:bg-gray-600 hover:border-gray-500 cursor-pointer"
                        }`}
                      >
                        {cell.revealed ? (
                          cell.isMine ? "💣" : "💎"
                        ) : (
                          ""
                        )}
                      </button>
                    ))
                  )}
                </div>
              </div>

              {/* Game Controls */}
              <div className="flex justify-center space-x-4">
                {!gameOver && gemsFound > 0 && (
                  <Button
                    onClick={cashOut}
                    className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-8 py-3 text-lg font-bold"
                  >
                    💰 Cash Out - {(betAmount * currentMultiplier).toFixed(2)} P COINS
                  </Button>
                )}
                
                <Button
                  onClick={resetGame}
                  variant="outline"
                  className="bg-gray-500/20 text-gray-300 border-gray-500 hover:bg-gray-500 hover:text-white px-6"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  New Game
                </Button>
              </div>

              {gameOver && (
                <div className="text-center p-6 glass-effect rounded-lg">
                  {playerWon ? (
                    <div>
                      <h3 className="text-3xl font-bold text-green-400 mb-2">🎉 You Won!</h3>
                      <p className="text-gray-300 text-lg">
                        You found {gemsFound} gems and won {(betAmount * currentMultiplier).toFixed(2)} P COINs!
                      </p>
                      <p className="text-green-400 text-sm mt-2">
                        Final Multiplier: {currentMultiplier.toFixed(2)}x
                      </p>
                    </div>
                  ) : (
                    <div>
                      <h3 className="text-3xl font-bold text-red-400 mb-2">💥 Game Over!</h3>
                      <p className="text-gray-300 text-lg">
                        You hit a mine and lost {betAmount} P COINs!
                      </p>
                      <p className="text-gray-400 text-sm mt-2">
                        You found {gemsFound} gems before hitting the mine
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}