import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CoinDisplay } from "@/components/ui/coin-display";
import { MetallicButton } from "@/components/ui/metallic-button";
import { Skeleton } from "@/components/ui/skeleton";
import { Gamepad2, Trophy, TrendingUp, LogOut, Gift, Shield, Send, Crown, Ticket, ShoppingBag, User, MessageCircle, Package, ArrowLeftRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { User as UserType } from "@shared/schema";

export default function Home() {
  const { user, isLoading: authLoading, logoutMutation } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showWelcomeBonus, setShowWelcomeBonus] = useState(false);
  const [redeemCode, setRedeemCode] = useState("");

  // Fetch user data
  const { data: userData, isLoading: userLoading } = useQuery<UserType>({
    queryKey: ["/api/auth/user"],
    retry: false,
  });



  // Check if user needs welcome bonus
  useEffect(() => {
    if (userData && userData.hasReceivedWelcomeBonus === 0) {
      setShowWelcomeBonus(true);
    }
  }, [userData]);

  // Claim welcome bonus mutation
  const claimBonusMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/claim-welcome-bonus");
    },
    onSuccess: () => {
      toast({
        title: "Welcome Bonus Claimed!",
        description: "You've received 10 P COINS. Welcome to the gaming hub!",
        variant: "default",
      });
      setShowWelcomeBonus(false);
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to claim welcome bonus. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Redeem code mutation
  const redeemCodeMutation = useMutation({
    mutationFn: async (code: string) => {
      const res = await apiRequest("POST", "/api/redeem", { code });
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Code Redeemed!",
        description: `You received ${data.amount} P COINS`,
      });
      setRedeemCode("");
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  if (authLoading || userLoading) {
    return (
      <div className="min-h-screen bg-black relative overflow-hidden futuristic-bg">
        <div className="container mx-auto px-4 py-8 relative z-10">
          <Skeleton className="h-16 w-full mb-8" />
          <div className="grid md:grid-cols-3 gap-6">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden futuristic-bg page-transition">
      {/* Header */}
      <header className="relative overflow-hidden z-10">
        <div className="container mx-auto px-4 py-4 sm:py-6">
          <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <div className="flex items-center space-x-3">
              <CoinDisplay value="P" size="lg" />
              <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
                <span className="neon-blue-text">PillowGaming</span>
                {userData?.role === 'owner' && <Crown className="w-6 h-6 text-purple-400" />}
                {userData?.role === 'admin' && <Shield className="w-6 h-6 text-red-400" />}
                {userData?.isVip && userData?.role === 'user' && <Crown className="w-6 h-6 text-yellow-400" />}
              </h1>
            </div>
            
            <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-4">
              <div className="flex items-center space-x-3">
                <div className="glass-effect rounded-lg px-3 py-2 flex items-center w-fit">
                  <CoinDisplay value="P" size="md" />
                  <span className="font-semibold neon-blue-text ml-1">
                    {isNaN(parseFloat(userData?.pCoinBalance || "0")) ? "0" : Math.floor(parseFloat(userData?.pCoinBalance || "0")).toString()}
                  </span>
                </div>
                
                {userData?.profileImageUrl ? (
                  <img
                    src={userData.profileImageUrl}
                    alt="Profile"
                    className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 flex items-center justify-center">
                    <span className="text-white font-bold text-sm sm:text-base">
                      {userData?.username?.[0]?.toUpperCase() || "U"}
                    </span>
                  </div>
                )}
              </div>
              
              <div className="flex space-x-2">
                {(userData?.role === 'admin' || userData?.role === 'owner') && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.location.href = '/admin'}
                    className="bg-purple-500/20 text-purple-400 border-purple-500 hover:bg-purple-500 hover:text-white transition-colors text-xs sm:text-sm"
                  >
                    <Shield className="w-4 h-4 mr-1 sm:mr-2" />
                    Admin
                  </Button>
                )}
                {userData?.role === 'owner' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.location.href = '/owner'}
                    className="bg-yellow-500/20 text-yellow-400 border-yellow-500 hover:bg-yellow-500 hover:text-black transition-colors text-xs sm:text-sm"
                  >
                    <Crown className="w-4 h-4 mr-1 sm:mr-2" />
                    Owner
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.location.href = '/profile'}
                  className="bg-orange-500/20 text-orange-400 border-orange-500 hover:bg-orange-500 hover:text-white transition-colors text-xs sm:text-sm"
                >
                  <User className="w-4 h-4 mr-1 sm:mr-2" />
                  Profile
                </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleLogout}
                    disabled={logoutMutation.isPending}
                    className="bg-red-500/20 text-red-400 border-red-500 hover:bg-red-500 hover:text-white transition-colors w-full sm:w-auto text-xs sm:text-sm"
                  >
                    <LogOut className="w-4 h-4 mr-1 sm:mr-2" />
                    {logoutMutation.isPending ? "Logging out..." : "Logout"}
                  </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Welcome Bonus Modal */}
      {showWelcomeBonus && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="glass-effect border-none bg-transparent max-w-md w-full">
            <CardContent className="p-8 text-center">
              <Gift className="w-16 h-16 mx-auto mb-4 text-casino-gold" />
              <h2 className="text-2xl font-bold mb-4 text-casino-gold">Welcome Bonus!</h2>
              <p className="text-gray-300 mb-6">
                Congratulations! You're eligible for a{" "}
                <span className="text-casino-gold font-bold">10 P COIN</span> welcome bonus!
              </p>
              
              <MetallicButton
                variant="green"
                size="lg"
                onClick={() => claimBonusMutation.mutate()}
                disabled={claimBonusMutation.isPending}
                className="w-full"
              >
                {claimBonusMutation.isPending ? "Claiming..." : "Claim 10 P COINS"}
              </MetallicButton>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 relative z-10">
        {/* Welcome Message */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4 neon-glow">
            Welcome back, {userData?.username || "Player"}!
          </h2>
          <p className="text-xl text-gray-300">
            Ready to play and earn more P COINS?
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <Card className="glass-effect rounded-2xl border-none bg-transparent">
            <CardContent className="p-6 text-center">
              <CoinDisplay amount={isNaN(parseFloat(userData?.pCoinBalance || "0")) ? "0" : userData?.pCoinBalance || "0"} />
              <h3 className="text-xl font-bold mb-2 neon-gold-text">Your Balance</h3>
              <p className="text-gray-400"><span className="neon-gold-text">P COINS</span> available</p>
            </CardContent>
          </Card>
          
          <Card className="glass-effect rounded-2xl border-none bg-transparent cursor-pointer hover:bg-white/5 transition-all duration-300" onClick={() => window.location.href = '/shop'}>
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
                <ShoppingBag className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2 neon-purple-text">P COIN Shop</h3>
              <p className="text-gray-400">Customize your profile</p>
            </CardContent>
          </Card>
          
          <Card className="glass-effect rounded-2xl border-none bg-transparent">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full flex items-center justify-center">
                <Ticket className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2 neon-gold-text">Redeem Code</h3>
              <div className="space-y-4">
                <Input
                  type="text"
                  placeholder="6-digit code"
                  value={redeemCode}
                  onChange={(e) => setRedeemCode(e.target.value.toUpperCase())}
                  maxLength={6}
                  className="bg-black/40 border-cyan-400/30 text-white placeholder-gray-400 focus:border-cyan-400 text-center text-lg font-mono"
                />
                <MetallicButton
                  variant="blue"
                  size="sm"
                  onClick={() => {
                    if (redeemCode && redeemCode.length === 6) {
                      redeemCodeMutation.mutate(redeemCode);
                    }
                  }}
                  disabled={redeemCodeMutation.isPending || !redeemCode || redeemCode.length !== 6}
                  className="w-full"
                >
                  {redeemCodeMutation.isPending ? "Redeeming..." : "Redeem"}
                </MetallicButton>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Navigation Grid */}
        <Card className="glass-effect rounded-2xl border-none bg-transparent">
          <CardHeader>
            <CardTitle className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center">
                <div className="w-4 h-4 bg-white rounded-sm"></div>
              </div>
              <span className="text-2xl neon-blue-text">Quick Navigation</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <Button
                variant="outline"
                onClick={() => window.location.href = '/games'}
                className="bg-green-500/20 text-green-400 border-green-500/50 hover:bg-green-500 hover:text-white transition-colors h-20 flex flex-col items-center justify-center space-y-2"
              >
                <Gamepad2 className="w-6 h-6" />
                <span className="text-xs">Games</span>
              </Button>
              
              <Button
                variant="outline"
                onClick={() => window.location.href = '/trading'}
                className="bg-cyan-500/20 text-cyan-400 border-cyan-500/50 hover:bg-cyan-500 hover:text-white transition-colors h-20 flex flex-col items-center justify-center space-y-2"
              >
                <Send className="w-6 h-6" />
                <span className="text-xs">Trading</span>
              </Button>
              
              <Button
                variant="outline"
                onClick={() => window.location.href = '/stock-chart'}
                className="bg-blue-500/20 text-blue-400 border-blue-500/50 hover:bg-blue-500 hover:text-white transition-colors h-20 flex flex-col items-center justify-center space-y-2"
              >
                <TrendingUp className="w-6 h-6" />
                <span className="text-xs">Chart</span>
              </Button>
              
              <Button
                variant="outline"
                onClick={() => window.location.href = '/leaderboard'}
                className="bg-yellow-500/20 text-yellow-400 border-yellow-500/50 hover:bg-yellow-500 hover:text-white transition-colors h-20 flex flex-col items-center justify-center space-y-2"
              >
                <Trophy className="w-6 h-6" />
                <span className="text-xs">Leaderboard</span>
              </Button>
              
              <Button
                variant="outline"
                onClick={() => window.location.href = '/inventory'}
                className="bg-indigo-500/20 text-indigo-400 border-indigo-500/50 hover:bg-indigo-500 hover:text-white transition-colors h-20 flex flex-col items-center justify-center space-y-2"
              >
                <Package className="w-6 h-6" />
                <span className="text-xs">Inventory</span>
              </Button>
              
              <Button
                variant="outline"
                onClick={() => window.location.href = '/banner-trading'}
                className="bg-orange-500/20 text-orange-400 border-orange-500/50 hover:bg-orange-500 hover:text-white transition-colors h-20 flex flex-col items-center justify-center space-y-2"
              >
                <ArrowLeftRight className="w-6 h-6" />
                <span className="text-xs">Banner Trading</span>
              </Button>
              
              <Button
                variant="outline"
                onClick={() => window.location.href = '/chat'}
                className="bg-blue-500/20 text-blue-400 border-blue-500/50 hover:bg-blue-500 hover:text-white transition-colors h-20 flex flex-col items-center justify-center space-y-2"
              >
                <MessageCircle className="w-6 h-6" />
                <span className="text-xs">Chat</span>
              </Button>
              
              <Button
                variant="outline"
                onClick={() => window.location.href = '/bank'}
                className="bg-indigo-500/20 text-indigo-400 border-indigo-500/50 hover:bg-indigo-500 hover:text-white transition-colors h-20 flex flex-col items-center justify-center space-y-2"
              >
                <TrendingUp className="w-6 h-6" />
                <span className="text-xs">NAPASSIST Bank</span>
              </Button>
              
              <Button
                variant="outline"
                onClick={() => window.location.href = '/tickets'}
                className="bg-red-500/20 text-red-400 border-red-500/50 hover:bg-red-500 hover:text-white transition-colors h-20 flex flex-col items-center justify-center space-y-2"
              >
                <Ticket className="w-6 h-6" />
                <span className="text-xs">Support</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Casino Games Section */}
        <Card className="glass-effect rounded-2xl border-none bg-transparent">
          <CardHeader>
            <CardTitle className="flex items-center space-x-3">
              <Gamepad2 className="w-8 h-8 text-green-500" />
              <span className="text-2xl neon-blue-text">Casino Games</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {/* Poker */}
              <Button
                onClick={() => window.location.href = '/games?game=poker'}
                className="bg-gradient-to-br from-red-500/20 to-pink-500/20 border border-red-500/30 hover:bg-red-500/30 text-white h-20 flex flex-col items-center justify-center space-y-1"
              >
                <div className="text-2xl">♠️</div>
                <span className="text-xs">Poker</span>
              </Button>

              {/* Blackjack */}
              <Button
                onClick={() => window.location.href = '/games?game=blackjack'}
                className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30 hover:bg-green-500/30 text-white h-20 flex flex-col items-center justify-center space-y-1"
              >
                <div className="text-2xl">♥️</div>
                <span className="text-xs">Blackjack</span>
              </Button>

              {/* Roulette */}
              <Button
                onClick={() => window.location.href = '/games?game=roulette'}
                className="bg-gradient-to-br from-pink-500/20 to-rose-500/20 border border-pink-500/30 hover:bg-pink-500/30 text-white h-20 flex flex-col items-center justify-center space-y-1"
              >
                <div className="text-2xl">🎰</div>
                <span className="text-xs">Roulette</span>
              </Button>

              {/* Cases */}
              <Button
                onClick={() => window.location.href = '/games?game=cases'}
                className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30 hover:bg-blue-500/30 text-white h-20 flex flex-col items-center justify-center space-y-1"
              >
                <div className="text-2xl">📦</div>
                <span className="text-xs">Cases</span>
              </Button>

              {/* Mines */}
              <Button
                onClick={() => window.location.href = '/games?game=mines'}
                className="bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-500/30 hover:bg-orange-500/30 text-white h-20 flex flex-col items-center justify-center space-y-1"
              >
                <div className="text-2xl">💎</div>
                <span className="text-xs">Mines</span>
              </Button>

              {/* Towers */}
              <Button
                onClick={() => window.location.href = '/games?game=towers'}
                className="bg-gradient-to-br from-purple-500/20 to-violet-500/20 border border-purple-500/30 hover:bg-purple-500/30 text-white h-20 flex flex-col items-center justify-center space-y-1"
              >
                <div className="text-2xl">🏗️</div>
                <span className="text-xs">Towers</span>
              </Button>

              {/* Cups */}
              <Button
                onClick={() => window.location.href = '/games?game=cups'}
                className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 hover:bg-yellow-500/30 text-white h-20 flex flex-col items-center justify-center space-y-1"
              >
                <div className="text-2xl">🥤</div>
                <span className="text-xs">Cups</span>
              </Button>

              {/* Slide */}
              <Button
                onClick={() => window.location.href = '/games?game=slide'}
                className="bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 hover:bg-cyan-500/30 text-white h-20 flex flex-col items-center justify-center space-y-1"
              >
                <div className="text-2xl">🎯</div>
                <span className="text-xs">Slide</span>
              </Button>

              {/* Plinko */}
              <Button
                onClick={() => window.location.href = '/games?game=plinko'}
                className="bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 hover:bg-indigo-500/30 text-white h-20 flex flex-col items-center justify-center space-y-1"
              >
                <div className="text-2xl">🏀</div>
                <span className="text-xs">Plinko</span>
              </Button>

              {/* Jackpot */}
              <Button
                onClick={() => window.location.href = '/games?game=jackpot'}
                className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 border border-yellow-500/30 hover:bg-yellow-500/30 text-white h-20 flex flex-col items-center justify-center space-y-1"
              >
                <div className="text-2xl">💰</div>
                <span className="text-xs">Jackpot</span>
              </Button>
            </div>

            <div className="text-center mt-6">
              <Button
                onClick={() => window.location.href = '/games'}
                className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-8 py-3"
              >
                <Gamepad2 className="w-4 h-4 mr-2" />
                View All Games
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
