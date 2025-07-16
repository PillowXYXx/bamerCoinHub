import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Crown, 
  User, 
  Coins, 
  Star, 
  Trophy, 
  Shield, 
  Edit, 
  Camera,
  Calendar,
  TrendingUp,
  Home
} from "lucide-react";
import { useSoundEffects } from "@/hooks/use-sound";
import { format } from "date-fns";
import { ReturnHomeButton } from "@/components/ui/return-home-button";

interface User {
  id: number;
  username: string;
  pCoinBalance: string;
  role: string;
  isVip: boolean;
  profileImageUrl?: string;
  activeBanner?: string;
  createdAt: string;
  hasReceivedWelcomeBonus: boolean;
}

interface GameStats {
  totalWins: number;
  totalWinnings: string;
  gamesPlayed: number;
  biggestWin: string;
}

export default function Profile() {
  const [editingCoins, setEditingCoins] = useState(false);
  const [newCoinAmount, setNewCoinAmount] = useState("");
  const [coinReason, setCoinReason] = useState("");
  const [newProfileImage, setNewProfileImage] = useState("");

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { playClickSound, playNavigationSound } = useSoundEffects();

  const { data: user, isLoading } = useQuery<User>({
    queryKey: ["/api/user"],
  });

  const { data: gameStats } = useQuery<GameStats>({
    queryKey: ["/api/games/stats"],
  });

  const { data: bankAccount } = useQuery({
    queryKey: ["/api/bank/account"],
  });

  // Owner-specific mutation for editing own coins
  const updateOwnCoinsMutation = useMutation({
    mutationFn: async ({ amount, reason }: { amount: string; reason: string }) => {
      const res = await apiRequest("POST", "/api/owner/update-coins", { 
        userId: user?.id, 
        amount, 
        reason 
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setEditingCoins(false);
      setNewCoinAmount("");
      setCoinReason("");
      toast({
        title: "Coins Updated",
        description: "Your coin balance has been updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleUpdateOwnCoins = () => {
    if (!newCoinAmount || !coinReason) {
      toast({
        title: "Missing Information",
        description: "Please enter both amount and reason",
        variant: "destructive",
      });
      return;
    }

    updateOwnCoinsMutation.mutate({
      amount: newCoinAmount,
      reason: coinReason,
    });
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "owner":
        return <Crown className="w-5 h-5 text-yellow-400" />;
      case "admin":
        return <Shield className="w-5 h-5 text-blue-400" />;
      default:
        return <User className="w-5 h-5 text-gray-400" />;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "owner":
        return "bg-gradient-to-r from-yellow-500 to-orange-500 text-white";
      case "admin":
        return "bg-gradient-to-r from-blue-500 to-cyan-500 text-white";
      default:
        return "bg-gray-600 text-gray-200";
    }
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <User className="w-16 h-16 mx-auto mb-4 text-gray-400 animate-pulse" />
          <p className="text-gray-400">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {/* Return Home Button */}
      <div className="mb-6">
        <ReturnHomeButton />
      </div>
      
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="lg:col-span-1">
          <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-cyan-500/30">
            <CardHeader className="text-center">
              <div className="relative mx-auto w-24 h-24 mb-4">
                <Avatar className="w-24 h-24">
                  <AvatarImage src={user.profileImageUrl} />
                  <AvatarFallback className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-2xl font-bold">
                    {user.username[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {user.role === "owner" && (
                  <div className="absolute -top-2 -right-2">
                    <Crown className="w-8 h-8 text-yellow-400" />
                  </div>
                )}
              </div>
              
              <CardTitle className="text-2xl font-bold text-white">
                {user.username}
              </CardTitle>
              
              <div className="flex items-center justify-center gap-2 mt-2">
                <Badge className={getRoleBadgeColor(user.role)}>
                  {getRoleIcon(user.role)}
                  <span className="ml-1 capitalize">{user.role}</span>
                </Badge>
                {user.isVip && (
                  <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                    <Star className="w-4 h-4 mr-1" />
                    VIP
                  </Badge>
                )}
              </div>
              
              <CardDescription className="text-gray-400 mt-2">
                Member since {format(new Date(user.createdAt), "MMMM yyyy")}
              </CardDescription>
              
              {/* Profile Image Update */}
              <div className="space-y-2 mt-4">
                <Label htmlFor="profileImage" className="text-white text-sm">Update Profile Image</Label>
                <div className="flex space-x-2">
                  <Input
                    id="profileImage"
                    value={newProfileImage}
                    onChange={(e) => setNewProfileImage(e.target.value)}
                    placeholder="Enter image URL"
                    className="bg-slate-800 border-slate-600 text-white"
                  />
                  <Button
                    onClick={() => {
                      playClickSound();
                      if (newProfileImage.trim()) {
                        updateProfileImageMutation.mutate(newProfileImage.trim());
                      }
                    }}
                    disabled={!newProfileImage.trim() || updateProfileImageMutation.isPending}
                    className="bg-cyan-500 hover:bg-cyan-600"
                  >
                    <Camera className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* P COIN Balance */}
              <div className="p-4 bg-gradient-to-r from-yellow-600/20 to-orange-600/20 rounded-lg border border-yellow-500/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Coins className="w-5 h-5 text-yellow-400" />
                    <span className="text-yellow-200">P COINS</span>
                  </div>
                  {user.role === "owner" && (
                    <Dialog open={editingCoins} onOpenChange={setEditingCoins}>
                      <DialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/20"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-slate-900 border-slate-700">
                        <DialogHeader>
                          <DialogTitle className="text-yellow-400">Edit Your Coins</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="newAmount">New Balance</Label>
                            <Input
                              id="newAmount"
                              type="number"
                              value={newCoinAmount}
                              onChange={(e) => setNewCoinAmount(e.target.value)}
                              placeholder="Enter new balance"
                              className="bg-slate-800 border-slate-600 text-white"
                            />
                          </div>
                          <div>
                            <Label htmlFor="reason">Reason</Label>
                            <Textarea
                              id="reason"
                              value={coinReason}
                              onChange={(e) => setCoinReason(e.target.value)}
                              placeholder="Reason for adjustment..."
                              className="bg-slate-800 border-slate-600 text-white"
                              rows={3}
                            />
                          </div>
                          <Button
                            onClick={handleUpdateOwnCoins}
                            disabled={updateOwnCoinsMutation.isPending}
                            className="w-full bg-yellow-600 hover:bg-yellow-700"
                          >
                            {updateOwnCoinsMutation.isPending ? "Updating..." : "Update Balance"}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
                <div className="text-2xl font-bold text-white mt-2">
                  {parseFloat(user.pCoinBalance).toFixed(0)}
                </div>
              </div>

              {/* Bank Balance */}
              {bankAccount && (
                <div className="p-4 bg-gradient-to-r from-blue-600/20 to-cyan-600/20 rounded-lg border border-blue-500/30">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-5 h-5 text-blue-400" />
                    <span className="text-blue-200">Bank Balance</span>
                  </div>
                  <div className="text-2xl font-bold text-white">
                    {parseFloat(bankAccount.balance).toFixed(0)} P COINS
                  </div>
                  <div className="text-sm text-blue-300 mt-1">
                    Earning {(parseFloat(bankAccount.interestRate) * 100).toFixed(2)}% APY
                  </div>
                </div>
              )}

              {/* Account Info */}
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Account ID</span>
                  <span className="text-white font-mono">#{user.id.toString().padStart(6, '0')}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Welcome Bonus</span>
                  <span className={user.hasReceivedWelcomeBonus ? "text-green-400" : "text-yellow-400"}>
                    {user.hasReceivedWelcomeBonus ? "Received" : "Pending"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Joined</span>
                  <span className="text-white">
                    {format(new Date(user.createdAt), "MMM dd, yyyy")}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stats and Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Owner Special Features */}
          {user.role === "owner" && (
            <Card className="bg-gradient-to-br from-yellow-900/50 to-orange-900/50 border-yellow-500/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-yellow-400">
                  <Crown className="w-6 h-6" />
                  Owner Privileges
                </CardTitle>
                <CardDescription className="text-yellow-200/80">
                  Exclusive owner features and capabilities
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 bg-yellow-600/10 rounded-lg border border-yellow-500/30">
                    <div className="flex items-center gap-2 mb-2">
                      <Edit className="w-5 h-5 text-yellow-400" />
                      <span className="font-semibold text-yellow-200">Self Coin Management</span>
                    </div>
                    <p className="text-sm text-gray-300">
                      Edit your own coin balance with custom reasons and full transaction logging
                    </p>
                  </div>
                  
                  <div className="p-4 bg-yellow-600/10 rounded-lg border border-yellow-500/30">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="w-5 h-5 text-yellow-400" />
                      <span className="font-semibold text-yellow-200">Full Admin Control</span>
                    </div>
                    <p className="text-sm text-gray-300">
                      Manage all users, admins, and system settings with unrestricted access
                    </p>
                  </div>

                  <div className="p-4 bg-yellow-600/10 rounded-lg border border-yellow-500/30">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-5 h-5 text-yellow-400" />
                      <span className="font-semibold text-yellow-200">NAPASSIST Bank Access</span>
                    </div>
                    <p className="text-sm text-gray-300">
                      Premium banking features with higher interest rates and exclusive benefits
                    </p>
                  </div>

                  <div className="p-4 bg-yellow-600/10 rounded-lg border border-yellow-500/30">
                    <div className="flex items-center gap-2 mb-2">
                      <Star className="w-5 h-5 text-yellow-400" />
                      <span className="font-semibold text-yellow-200">Unlimited Trading</span>
                    </div>
                    <p className="text-sm text-gray-300">
                      Unrestricted access to all trading features and premium marketplace items
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Gaming Stats */}
          <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-cyan-500/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-cyan-400">
                <Trophy className="w-6 h-6" />
                Gaming Statistics
              </CardTitle>
            </CardHeader>
            <CardContent>
              {gameStats ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-cyan-600/10 rounded-lg border border-cyan-500/30">
                    <div className="text-2xl font-bold text-cyan-400">
                      {gameStats.gamesPlayed}
                    </div>
                    <div className="text-sm text-gray-400">Games Played</div>
                  </div>
                  
                  <div className="text-center p-4 bg-green-600/10 rounded-lg border border-green-500/30">
                    <div className="text-2xl font-bold text-green-400">
                      {gameStats.totalWins}
                    </div>
                    <div className="text-sm text-gray-400">Total Wins</div>
                  </div>
                  
                  <div className="text-center p-4 bg-yellow-600/10 rounded-lg border border-yellow-500/30">
                    <div className="text-2xl font-bold text-yellow-400">
                      {parseFloat(gameStats.totalWinnings).toFixed(0)}
                    </div>
                    <div className="text-sm text-gray-400">Total Winnings</div>
                  </div>
                  
                  <div className="text-center p-4 bg-purple-600/10 rounded-lg border border-purple-500/30">
                    <div className="text-2xl font-bold text-purple-400">
                      {parseFloat(gameStats.biggestWin).toFixed(0)}
                    </div>
                    <div className="text-sm text-gray-400">Biggest Win</div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Trophy className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                  <p className="text-gray-500">No gaming stats available</p>
                  <p className="text-gray-400 text-sm">Play some games to see your statistics</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Profile Actions */}
          <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-cyan-500/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-cyan-400">
                <User className="w-6 h-6" />
                Profile Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <Button 
                  variant="outline" 
                  className="h-20 border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/20"
                  disabled
                >
                  <div className="text-center">
                    <Camera className="w-6 h-6 mx-auto mb-1" />
                    <div className="text-sm">Update Avatar</div>
                    <div className="text-xs text-gray-400">Coming Soon</div>
                  </div>
                </Button>
                
                <Button 
                  variant="outline" 
                  className="h-20 border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/20"
                  disabled
                >
                  <div className="text-center">
                    <Edit className="w-6 h-6 mx-auto mb-1" />
                    <div className="text-sm">Edit Profile</div>
                    <div className="text-xs text-gray-400">Coming Soon</div>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}