import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { CoinDisplay } from "@/components/ui/coin-display";
import { Package, Play, RotateCcw, Gift } from "lucide-react";

interface CasesGameProps {
  userBalance: number;
  onGameEnd: () => void;
}

interface CaseReward {
  name: string;
  value: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  icon: string;
}

const CASE_REWARDS: CaseReward[] = [
  { name: "Small Coin Bag", value: 5, rarity: 'common', icon: '💰' },
  { name: "Medium Coin Bag", value: 10, rarity: 'common', icon: '💰' },
  { name: "Large Coin Bag", value: 20, rarity: 'rare', icon: '💎' },
  { name: "Treasure Chest", value: 50, rarity: 'epic', icon: '🎁' },
  { name: "Jackpot", value: 100, rarity: 'legendary', icon: '👑' },
  { name: "Mega Jackpot", value: 200, rarity: 'legendary', icon: '💸' },
];

const CASE_TYPES = [
  { id: 'bronze', name: 'Bronze Case', cost: 5, multiplier: 1 },
  { id: 'silver', name: 'Silver Case', cost: 15, multiplier: 2 },
  { id: 'gold', name: 'Gold Case', cost: 25, multiplier: 3 },
  { id: 'diamond', name: 'Diamond Case', cost: 50, multiplier: 5 },
];

export default function CasesGame({ userBalance, onGameEnd }: CasesGameProps) {
  const { toast } = useToast();
  const [selectedCase, setSelectedCase] = useState(CASE_TYPES[0]);
  const [gameStarted, setGameStarted] = useState(false);
  const [opening, setOpening] = useState(false);
  const [reward, setReward] = useState<CaseReward | null>(null);
  const [gameResult, setGameResult] = useState<string | null>(null);

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'text-gray-400 border-gray-400';
      case 'rare': return 'text-blue-400 border-blue-400';
      case 'epic': return 'text-purple-400 border-purple-400';
      case 'legendary': return 'text-yellow-400 border-yellow-400';
      default: return 'text-gray-400 border-gray-400';
    }
  };

  const getCaseColor = (caseId: string) => {
    switch (caseId) {
      case 'bronze': return 'from-orange-600 to-orange-800';
      case 'silver': return 'from-gray-400 to-gray-600';
      case 'gold': return 'from-yellow-400 to-yellow-600';
      case 'diamond': return 'from-cyan-400 to-blue-600';
      default: return 'from-gray-400 to-gray-600';
    }
  };

  const getRandomReward = (multiplier: number): CaseReward => {
    const random = Math.random();
    let selectedReward: CaseReward;

    if (random < 0.5) {
      selectedReward = CASE_REWARDS[0]; // Small bag - 50%
    } else if (random < 0.75) {
      selectedReward = CASE_REWARDS[1]; // Medium bag - 25%
    } else if (random < 0.9) {
      selectedReward = CASE_REWARDS[2]; // Large bag - 15%
    } else if (random < 0.97) {
      selectedReward = CASE_REWARDS[3]; // Treasure - 7%
    } else if (random < 0.995) {
      selectedReward = CASE_REWARDS[4]; // Jackpot - 2.5%
    } else {
      selectedReward = CASE_REWARDS[5]; // Mega Jackpot - 0.5%
    }

    return {
      ...selectedReward,
      value: Math.floor(selectedReward.value * multiplier)
    };
  };

  const openCaseMutation = useMutation({
    mutationFn: async () => {
      const finalReward = getRandomReward(selectedCase.multiplier);
      const result = finalReward.value >= selectedCase.cost ? 'win' : 'lose';
      
      const res = await apiRequest("POST", "/api/games/play", {
        gameType: 'cases',
        betAmount: selectedCase.cost.toString(),
        winAmount: finalReward.value.toString(),
        gameData: { caseType: selectedCase.id, reward: finalReward },
        result
      });

      return { reward: finalReward, result };
    },
    onSuccess: (data) => {
      setOpening(true);
      
      // Simulate case opening animation
      setTimeout(() => {
        setReward(data.reward);
        setGameResult(data.result);
        setGameStarted(true);
        setOpening(false);
        
        if (data.result === 'win') {
          toast({
            title: "Case Opened!",
            description: `You got ${data.reward.name} worth ${data.reward.value} P COINs!`,
          });
        } else {
          toast({
            title: "Case Opened!",
            description: `You got ${data.reward.name} worth ${data.reward.value} P COINs!`,
          });
        }
        
        onGameEnd();
      }, 2000);
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
    setReward(null);
    setGameResult(null);
    setOpening(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card className="glass-effect border-none bg-transparent">
        <CardHeader>
          <CardTitle className="flex items-center space-x-3">
            <Package className="w-8 h-8 text-blue-500" />
            <span className="text-2xl neon-blue-text">Mystery Cases</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {!gameStarted ? (
            <div className="space-y-8">
              {/* Case Selection */}
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-cyan-400">Choose Your Case</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {CASE_TYPES.map((caseType) => (
                    <Card
                      key={caseType.id}
                      className={`cursor-pointer transition-all ${
                        selectedCase.id === caseType.id 
                          ? 'ring-2 ring-cyan-400 glass-effect' 
                          : 'glass-effect opacity-70 hover:opacity-100'
                      }`}
                      onClick={() => setSelectedCase(caseType)}
                    >
                      <CardContent className="p-4 text-center">
                        <div className={`w-16 h-16 mx-auto mb-3 rounded-lg bg-gradient-to-br ${getCaseColor(caseType.id)} flex items-center justify-center`}>
                          <Package className="w-8 h-8 text-white" />
                        </div>
                        <h4 className="font-bold text-white mb-1">{caseType.name}</h4>
                        <p className="text-sm text-gray-400 mb-2">{caseType.multiplier}x Multiplier</p>
                        <Badge variant="outline" className="bg-cyan-500/20 text-cyan-400 border-cyan-500">
                          {caseType.cost} P COINS
                        </Badge>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Case Preview */}
              <div className="text-center space-y-6">
                <div className={`w-32 h-32 mx-auto rounded-2xl bg-gradient-to-br ${getCaseColor(selectedCase.id)} flex items-center justify-center ${opening ? 'animate-bounce' : ''}`}>
                  {opening ? (
                    <div className="text-white text-4xl animate-spin">⭐</div>
                  ) : (
                    <Package className="w-16 h-16 text-white" />
                  )}
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-white">{selectedCase.name}</h3>
                  <p className="text-gray-400">Cost: {selectedCase.cost} P COINS</p>
                  <p className="text-cyan-400">Multiplier: {selectedCase.multiplier}x</p>
                </div>

                {opening && (
                  <div className="text-yellow-400 font-bold animate-pulse">
                    🎁 Opening case...
                  </div>
                )}

                <div className="space-y-4">
                  <p className="text-gray-400">
                    Available Balance: <span className="text-cyan-400">{userBalance} P COINS</span>
                  </p>
                  
                  <Button
                    onClick={() => openCaseMutation.mutate()}
                    disabled={openCaseMutation.isPending || selectedCase.cost > userBalance || opening}
                    className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white px-8 py-3"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    {opening ? "Opening..." : `Open Case (${selectedCase.cost} P)`}
                  </Button>
                </div>
              </div>

              {/* Possible Rewards */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-cyan-400">Possible Rewards</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {CASE_REWARDS.map((reward, index) => (
                    <div key={index} className="bg-black/30 p-3 rounded-lg text-center">
                      <div className="text-2xl mb-1">{reward.icon}</div>
                      <p className="text-sm text-white font-medium">{reward.name}</p>
                      <p className={`text-xs ${getRarityColor(reward.rarity)} capitalize`}>
                        {reward.rarity}
                      </p>
                      <p className="text-cyan-400 font-bold">
                        {Math.floor(reward.value * selectedCase.multiplier)} P
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center space-y-6">
              {/* Opened Case Result */}
              <div className="space-y-4">
                <div className={`w-32 h-32 mx-auto rounded-2xl bg-gradient-to-br ${getCaseColor(selectedCase.id)} flex items-center justify-center opacity-50`}>
                  <Package className="w-16 h-16 text-white" />
                </div>
                
                <div className="text-6xl">{reward?.icon}</div>
                
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-white">{reward?.name}</h3>
                  <Badge 
                    variant="outline" 
                    className={`text-lg px-4 py-2 ${getRarityColor(reward?.rarity || 'common')}`}
                  >
                    {reward?.rarity} Reward
                  </Badge>
                </div>

                <div className="flex items-center justify-center space-x-2">
                  <span className="text-green-400 font-bold text-2xl">+{reward?.value}</span>
                  <CoinDisplay value="P" size="md" />
                </div>

                <Badge 
                  variant="outline" 
                  className={`text-lg px-4 py-2 ${
                    gameResult === 'win' ? 'bg-green-500/20 text-green-400 border-green-500' :
                    'bg-yellow-500/20 text-yellow-400 border-yellow-500'
                  }`}
                >
                  {gameResult === 'win' ? '🎉 Profit!' : '📦 Opened!'}
                </Badge>
                
                <Button
                  onClick={resetGame}
                  className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Open Another Case
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}