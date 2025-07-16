import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { CoinDisplay } from "@/components/ui/coin-display";
import { 
  Gamepad2, 
  ArrowLeft, 
  Spade, 
  Package, 
  Bomb, 
  Heart, 
  Building, 
  Coffee, 
  Disc3, 
  TrendingUp, 
  Crown,
  Trophy,
  Play,
  Coins
} from "lucide-react";

// Game components
import PokerGame from "@/components/games/poker-game";
import CasesGame from "@/components/games/cases-game";
import MinesGame from "@/components/games/mines-game";
import BlackjackGame from "@/components/games/blackjack-game";
import TowersGame from "@/components/games/towers-game";
import CupsGame from "@/components/games/cups-game";
import RouletteGame from "@/components/games/roulette-game";
import SlideGame from "@/components/games/slide-game";
import PlinkoGame from "@/components/games/plinko-game";
import JackpotGame from "@/components/games/jackpot-game";

const GAMES = [
  {
    id: 'poker',
    name: 'Poker',
    description: 'Classic Texas Hold\'em poker',
    icon: Spade,
    color: 'from-red-500 to-pink-500',
    minBet: 1,
    maxBet: 100,
    component: PokerGame
  },
  {
    id: 'cases',
    name: 'Cases',
    description: 'Open mystery cases for rewards',
    icon: Package,
    color: 'from-blue-500 to-cyan-500',
    minBet: 5,
    maxBet: 50,
    component: CasesGame
  },
  {
    id: 'mines',
    name: 'Mines',
    description: 'Find gems, avoid mines',
    icon: Bomb,
    color: 'from-orange-500 to-red-500',
    minBet: 2,
    maxBet: 75,
    component: MinesGame
  },
  {
    id: 'blackjack',
    name: 'Blackjack',
    description: 'Get 21 without going over',
    icon: Heart,
    color: 'from-green-500 to-emerald-500',
    minBet: 1,
    maxBet: 200,
    component: BlackjackGame
  },
  {
    id: 'towers',
    name: 'Towers',
    description: 'Climb the tower for bigger wins',
    icon: Building,
    color: 'from-purple-500 to-violet-500',
    minBet: 3,
    maxBet: 60,
    component: TowersGame
  },
  {
    id: 'cups',
    name: 'Cups',
    description: 'Find the ball under the cup',
    icon: Coffee,
    color: 'from-yellow-500 to-orange-500',
    minBet: 1,
    maxBet: 30,
    component: CupsGame
  },
  {
    id: 'roulette',
    name: 'Roulette',
    description: 'Spin the wheel of fortune',
    icon: Disc3,
    color: 'from-pink-500 to-rose-500',
    minBet: 1,
    maxBet: 500,
    component: RouletteGame
  },
  {
    id: 'slide',
    name: 'Slide',
    description: 'Slide to the perfect multiplier',
    icon: TrendingUp,
    color: 'from-cyan-500 to-blue-500',
    minBet: 2,
    maxBet: 40,
    component: SlideGame
  },
  {
    id: 'plinko',
    name: 'Plinko',
    description: 'Drop balls for random rewards',
    icon: Disc3,
    color: 'from-indigo-500 to-purple-500',
    minBet: 1,
    maxBet: 100,
    component: PlinkoGame
  },
  {
    id: 'jackpot',
    name: 'Jackpot',
    description: 'Win the ultimate prize',
    icon: Crown,
    color: 'from-yellow-500 to-yellow-600',
    minBet: 10,
    maxBet: 1000,
    component: JackpotGame
  }
];

export default function GamesPage() {
  const { user, isLoading: userLoading } = useAuth();
  const { toast } = useToast();
  
  // Check for game parameter in URL
  const urlParams = new URLSearchParams(window.location.search);
  const gameParam = urlParams.get('game');
  const [selectedGame, setSelectedGame] = useState<string | null>(gameParam);

  // Fetch user data for P COIN balance
  const { data: userData, isLoading: userDataLoading } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  // Fetch game stats
  const { data: gameStats } = useQuery({
    queryKey: ["/api/games/stats"],
    retry: false,
  });

  // Fetch recent games
  const { data: recentGames } = useQuery({
    queryKey: ["/api/games/recent"],
    retry: false,
  });

  const selectedGameData = GAMES.find(game => game.id === selectedGame);
  const GameComponent = selectedGameData?.component;

  if (userLoading || userDataLoading) {
    return (
      <div className="min-h-screen bg-black relative overflow-hidden futuristic-bg page-transition">
        <div className="container mx-auto px-4 py-8 relative z-10">
          <div className="animate-pulse space-y-6">
            <div className="h-16 bg-gray-700 rounded-lg"></div>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="h-48 bg-gray-700 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (selectedGame && GameComponent) {
    return (
      <div className="min-h-screen bg-black relative overflow-hidden futuristic-bg page-transition">
        <div className="container mx-auto px-4 py-8 relative z-10">
          <div className="mb-6">
            <Button
              variant="outline"
              onClick={() => setSelectedGame(null)}
              className="bg-cyan-500/20 text-cyan-400 border-cyan-500 hover:bg-cyan-500 hover:text-white"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Games
            </Button>
          </div>
          <GameComponent 
            userBalance={parseFloat(userData?.pCoinBalance || "0")}
            onGameEnd={() => {
              queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
              queryClient.invalidateQueries({ queryKey: ["/api/games/stats"] });
              queryClient.invalidateQueries({ queryKey: ["/api/games/recent"] });
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden futuristic-bg page-transition">
      {/* Header */}
      <header className="relative overflow-hidden z-10">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Gamepad2 className="w-8 h-8 text-cyan-400" />
              <div>
                <h1 className="text-3xl font-bold neon-blue-text">Casino Games</h1>
                <p className="text-gray-400">Play, win, and earn P COINs</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="glass-effect rounded-lg px-4 py-2 flex items-center">
                <CoinDisplay value="P" size="md" />
                <span className="font-semibold neon-blue-text ml-1">
                  {Math.floor(parseFloat(userData?.pCoinBalance || "0")).toString()}
                </span>
              </div>
              <Button
                variant="outline"
                onClick={() => window.location.href = '/'}
                className="bg-cyan-500/20 text-cyan-400 border-cyan-500 hover:bg-cyan-500 hover:text-white"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 relative z-10 space-y-8">
        {/* Game Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="glass-effect border-none bg-transparent">
            <CardContent className="p-4 text-center">
              <Trophy className="w-8 h-8 mx-auto mb-2 text-yellow-400" />
              <p className="text-sm text-gray-400">Total Wins</p>
              <p className="text-xl font-bold text-yellow-400">
                {gameStats?.totalWins || 0}
              </p>
            </CardContent>
          </Card>

          <Card className="glass-effect border-none bg-transparent">
            <CardContent className="p-4 text-center">
              <Coins className="w-8 h-8 mx-auto mb-2 text-green-400" />
              <p className="text-sm text-gray-400">Total Winnings</p>
              <p className="text-xl font-bold text-green-400">
                {parseFloat(gameStats?.totalWinnings || "0").toFixed(0)} P
              </p>
            </CardContent>
          </Card>

          <Card className="glass-effect border-none bg-transparent">
            <CardContent className="p-4 text-center">
              <Gamepad2 className="w-8 h-8 mx-auto mb-2 text-blue-400" />
              <p className="text-sm text-gray-400">Games Played</p>
              <p className="text-xl font-bold text-blue-400">
                {gameStats?.gamesPlayed || 0}
              </p>
            </CardContent>
          </Card>

          <Card className="glass-effect border-none bg-transparent">
            <CardContent className="p-4 text-center">
              <Crown className="w-8 h-8 mx-auto mb-2 text-purple-400" />
              <p className="text-sm text-gray-400">Biggest Win</p>
              <p className="text-xl font-bold text-purple-400">
                {parseFloat(gameStats?.biggestWin || "0").toFixed(0)} P
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Game Selection Grid */}
        <div>
          <h2 className="text-2xl font-bold text-cyan-400 mb-6">Choose Your Game</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {GAMES.map((game) => {
              const IconComponent = game.icon;
              return (
                <Card
                  key={game.id}
                  className="glass-effect border-none bg-transparent hover:scale-105 transition-transform cursor-pointer group"
                  onClick={() => setSelectedGame(game.id)}
                >
                  <CardContent className="p-6 text-center">
                    <div className={`w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r ${game.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                      <IconComponent className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">{game.name}</h3>
                    <p className="text-xs text-gray-400 mb-3">{game.description}</p>
                    <div className="space-y-2">
                      <Badge variant="outline" className="bg-cyan-500/20 text-cyan-400 border-cyan-500">
                        {game.minBet} - {game.maxBet} P COINS
                      </Badge>
                      <Button
                        size="sm"
                        className={`w-full bg-gradient-to-r ${game.color} hover:opacity-90 text-white border-none`}
                      >
                        <Play className="w-4 h-4 mr-2" />
                        Play Now
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Recent Games */}
        {recentGames && recentGames.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-cyan-400 mb-6">Recent Games</h2>
            <Card className="glass-effect border-none bg-transparent">
              <CardContent className="p-6">
                <div className="space-y-3">
                  {recentGames.slice(0, 5).map((game: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-black/30 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-full ${
                          game.result === 'win' ? 'bg-green-500' : 
                          game.result === 'lose' ? 'bg-red-500' : 'bg-yellow-500'
                        } flex items-center justify-center`}>
                          {game.result === 'win' ? '💰' : game.result === 'lose' ? '💸' : '🎯'}
                        </div>
                        <div>
                          <p className="font-medium text-white capitalize">{game.gameType}</p>
                          <p className="text-xs text-gray-400">
                            {new Date(game.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${
                          game.result === 'win' ? 'text-green-400' : 
                          game.result === 'lose' ? 'text-red-400' : 'text-yellow-400'
                        }`}>
                          {game.result === 'win' ? '+' : '-'}{parseFloat(game.winAmount || game.betAmount).toFixed(0)} P
                        </p>
                        <p className="text-xs text-gray-400">
                          Bet: {parseFloat(game.betAmount).toFixed(0)} P
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}