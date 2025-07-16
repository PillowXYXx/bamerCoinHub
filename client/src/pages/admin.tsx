import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CoinDisplay } from "@/components/ui/coin-display";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Users, 
  Settings, 
  UserPlus, 
  Coins, 
  Shield,
  TrendingUp,
  Eye,
  Edit,
  Trash2,
  Home,
  Send,
  Ban,
  Gamepad2,
  Crown,
  Star,
  RotateCcw
} from "lucide-react";
import type { User, Transaction } from "@shared/schema";

export default function AdminPanel() {
  const { user: authUser } = useAuth();
  
  // Check if user has admin privileges
  if (!authUser || (authUser.role !== 'admin' && authUser.role !== 'owner')) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-400 mb-4">Access Denied</h1>
          <p className="text-gray-400 mb-4">You need admin privileges to access this page.</p>
          <a href="/" className="text-cyan-400 hover:text-cyan-300">Return to Home</a>
        </div>
      </div>
    );
  }
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [coinAmount, setCoinAmount] = useState("");
  const [coinReason, setCoinReason] = useState("");
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ show: boolean; username: string } | null>(null);
  const [gameBanUser, setGameBanUser] = useState<User | null>(null);
  const [gameBanType, setGameBanType] = useState("");
  const [gameBanReason, setGameBanReason] = useState("");

  // Fetch all users
  const { data: allUsers, isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
    retry: false,
    staleTime: 0,
    cacheTime: 0,
  });

  // Fetch all transactions
  const { data: allTransactions, isLoading: transactionsLoading } = useQuery<Transaction[]>({
    queryKey: ["/api/admin/transactions"],
    retry: false,
    staleTime: 0,
    cacheTime: 0,
  });

  // Fetch admin stats
  const { data: adminStats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/admin/stats"],
    retry: false,
    staleTime: 0,
    cacheTime: 0,
  });

  // Fetch game bans
  const { data: gameBans, isLoading: gameBansLoading } = useQuery({
    queryKey: ["/api/admin/game-bans"],
    retry: false,
    staleTime: 0,
    cacheTime: 0,
  });

  // Add P COINS to user
  const addCoinsMutation = useMutation({
    mutationFn: async (data: { userId: number; amount: string; reason: string }) => {
      await apiRequest("POST", "/api/admin/add-coins", data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "P COINS added successfully",
      });
      setCoinAmount("");
      setCoinReason("");
      setSelectedUser(null);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "Admin access required",
          variant: "destructive",
        });
        return;
      }
      toast({
        title: "Error",
        description: "Failed to add P COINS",
        variant: "destructive",
      });
    },
  });

  // Update role
  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: number; role: string }) => {
      await apiRequest("POST", "/api/admin/update-role", { userId, role });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Role updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You need proper privileges to perform this action",
          variant: "destructive",
        });
        return;
      }
      toast({
        title: "Error",
        description: "Failed to update role",
        variant: "destructive",
      });
    },
  });

  // Delete user
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      await apiRequest("DELETE", "/api/admin/delete-user", { userId });
    },
    onSuccess: () => {
      // Show confirmation dialog instead of auto-refresh
      setDeleteConfirmation({ 
        show: true, 
        username: deleteConfirmation?.username || "User"
      });
      
      // Invalidate queries without clearing cache
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "Admin access required",
          variant: "destructive",
        });
        return;
      }
      toast({
        title: "Error",
        description: "Failed to delete user",
        variant: "destructive",
      });
    },
  });

  const handleAddCoins = () => {
    if (!selectedUser || !coinAmount || !coinReason) {
      toast({
        title: "Validation Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    if (authUser?.role === 'owner') {
      ownerUpdateCoinsMutation.mutate({
        userId: selectedUser.id,
        amount: coinAmount,
        reason: coinReason,
      });
    } else {
      addCoinsMutation.mutate({
        userId: selectedUser.id,
        amount: coinAmount,
        reason: coinReason,
      });
    }
  };

  // Ban user from game mutation
  const banFromGameMutation = useMutation({
    mutationFn: async (data: { userId: number; gameType: string; reason: string }) => {
      await apiRequest("POST", "/api/admin/ban-game", data);
    },
    onSuccess: () => {
      toast({
        title: "User Banned from Game",
        description: "User has been banned from the selected game",
      });
      setGameBanUser(null);
      setGameBanType("");
      setGameBanReason("");
      queryClient.invalidateQueries({ queryKey: ["/api/admin/game-bans"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "Admin access required",
          variant: "destructive",
        });
        return;
      }
      toast({
        title: "Error",
        description: "Failed to ban user from game",
        variant: "destructive",
      });
    },
  });

  // Unban user from game mutation
  const unbanFromGameMutation = useMutation({
    mutationFn: async (data: { userId: number; gameType: string }) => {
      await apiRequest("POST", "/api/admin/unban-game", data);
    },
    onSuccess: () => {
      toast({
        title: "User Unbanned from Game",
        description: "User has been unbanned from the selected game",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/game-bans"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "Admin access required",
          variant: "destructive",
        });
        return;
      }
      toast({
        title: "Error",
        description: "Failed to unban user from game",
        variant: "destructive",
      });
    },
  });

  // Owner coin management mutations
  const ownerUpdateCoinsMutation = useMutation({
    mutationFn: async ({ userId, amount, reason }: { userId: number; amount: string; reason: string }) => {
      return await apiRequest("POST", "/api/owner/edit-coins", { userId, amount, reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Success",
        description: "User coins updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update user coins",
        variant: "destructive",
      });
    }
  });

  const resetCoinsMutation = useMutation({
    mutationFn: async (userId: number) => {
      return await apiRequest("POST", `/api/owner/reset-coins/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Success",
        description: "User coins reset to 0 successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to reset user coins",
        variant: "destructive",
      });
    }
  });

  const setVipMutation = useMutation({
    mutationFn: async ({ userId, isVip, durationDays }: { userId: number; isVip: boolean; durationDays?: number }) => {
      return await apiRequest("POST", `/api/admin/set-vip/${userId}`, { isVip, durationDays });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Success",
        description: "User VIP status updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update VIP status",
        variant: "destructive",
      });
    }
  });

  const handleGameBan = () => {
    if (!gameBanUser || !gameBanType || !gameBanReason.trim()) {
      toast({
        title: "Validation Error",
        description: "Please select a user, game type, and provide a reason",
        variant: "destructive",
      });
      return;
    }

    banFromGameMutation.mutate({
      userId: gameBanUser.id,
      gameType: gameBanType,
      reason: gameBanReason,
    });
  };

  if (usersLoading || statsLoading) {
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
              <Shield className="w-6 h-6 sm:w-8 sm:h-8 text-red-500" />
              <h1 className="text-2xl sm:text-3xl font-bold">
                <span className="neon-blue-text">Admin Panel</span>
              </h1>
            </div>
            
            <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-4">
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.location.href = '/'}
                  className="bg-cyan-500/20 text-cyan-400 border-cyan-500 hover:bg-cyan-500 hover:text-white transition-colors flex-1 sm:flex-none"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Menu
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.location.href = '/trading'}
                  className="bg-green-500/20 text-green-400 border-green-500 hover:bg-green-500 hover:text-white transition-colors flex-1 sm:flex-none"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Trading
                </Button>
              </div>
              <div className="flex items-center justify-between sm:space-x-4">
                <Badge variant="destructive" className="bg-red-500/20 text-red-400 border-red-500 text-xs">
                  Admin Access
                </Badge>
                <span className="neon-blue-text font-semibold text-sm">
                  {authUser?.username}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-4 sm:py-8 relative z-10">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 mb-8 sm:mb-16">
          <Card className="glass-effect rounded-2xl border-none bg-transparent">
            <CardContent className="p-4 sm:p-6 text-center">
              <Users className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 text-cyan-400" />
              <h3 className="text-lg sm:text-xl font-bold mb-2 neon-blue-text">Total Users</h3>
              <p className="text-2xl sm:text-3xl font-bold neon-blue-text">
                {adminStats?.totalUsers || allUsers?.length || 0}
              </p>
            </CardContent>
          </Card>
          
          <Card className="glass-effect rounded-2xl border-none bg-transparent">
            <CardContent className="p-4 sm:p-6 text-center">
              <Coins className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 text-yellow-400" />
              <h3 className="text-lg sm:text-xl font-bold mb-2 neon-gold-text">Total P COINS</h3>
              <p className="text-2xl sm:text-3xl font-bold neon-gold-text">
                {adminStats?.totalCoins || "0"}
              </p>
            </CardContent>
          </Card>
          
          <Card className="glass-effect rounded-2xl border-none bg-transparent">
            <CardContent className="p-4 sm:p-6 text-center">
              <TrendingUp className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 text-green-400" />
              <h3 className="text-lg sm:text-xl font-bold mb-2 neon-purple-text">Total Transactions</h3>
              <p className="text-2xl sm:text-3xl font-bold neon-purple-text">
                {adminStats?.totalTransactions || allTransactions?.length || 0}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Admin Tabs */}
        <Tabs defaultValue="users" className="w-full">
          <TabsList className="grid w-full grid-cols-4 glass-effect h-auto p-1">
            <TabsTrigger value="users" className="neon-blue-text text-xs sm:text-sm py-2 px-2 flex-col sm:flex-row">
              <Users className="w-4 h-4 sm:mr-2 mb-1 sm:mb-0" />
              <span className="hidden sm:inline">Users</span>
              <span className="sm:hidden">Users</span>
            </TabsTrigger>
            <TabsTrigger value="transactions" className="neon-purple-text text-xs sm:text-sm py-2 px-2 flex-col sm:flex-row">
              <TrendingUp className="w-4 h-4 sm:mr-2 mb-1 sm:mb-0" />
              <span className="hidden sm:inline">Transactions</span>
              <span className="sm:hidden">Trans</span>
            </TabsTrigger>
            <TabsTrigger value="game-bans" className="neon-red-text text-xs sm:text-sm py-2 px-2 flex-col sm:flex-row">
              <Ban className="w-4 h-4 sm:mr-2 mb-1 sm:mb-0" />
              <span className="hidden sm:inline">Game Bans</span>
              <span className="sm:hidden">Bans</span>
            </TabsTrigger>
            <TabsTrigger value="tools" className="neon-gold-text text-xs sm:text-sm py-2 px-2 flex-col sm:flex-row">
              <Settings className="w-4 h-4 sm:mr-2 mb-1 sm:mb-0" />
              <span className="hidden sm:inline">Tools</span>
              <span className="sm:hidden">Tools</span>
            </TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-4">
            <Card className="glass-effect rounded-2xl border-none bg-transparent">
              <CardHeader>
                <CardTitle className="neon-blue-text">User Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {allUsers?.map((user) => (
                    <div
                      key={user.id}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 bg-gray-800/50 rounded-lg space-y-3 sm:space-y-0"
                    >
                      <div className="flex items-center space-x-3 sm:space-x-4">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 flex items-center justify-center">
                          <span className="text-white font-bold text-sm sm:text-base">
                            {user.username[0].toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                            <p className="font-semibold neon-blue-text text-sm sm:text-base truncate">
                              {user.username}
                            </p>
                            {user.role === 'owner' && (
                              <Badge variant="destructive" className="bg-purple-500/20 text-purple-400 border-purple-500 text-xs w-fit">
                                Owner
                              </Badge>
                            )}
                            {user.role === 'admin' && (
                              <Badge variant="destructive" className="bg-red-500/20 text-red-400 border-red-500 text-xs w-fit">
                                Admin
                              </Badge>
                            )}
                            {user.role === 'user' && (
                              <Badge variant="outline" className="bg-gray-500/20 text-gray-400 border-gray-500 text-xs w-fit">
                                User
                              </Badge>
                            )}
                            {user.isVip && (
                              <Badge variant="outline" className="bg-yellow-500/20 text-yellow-400 border-yellow-500 text-xs w-fit">
                                <Crown className="w-3 h-3 mr-1" />
                                VIP
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs sm:text-sm neon-blue-text">
                            Joined: {new Date(user.createdAt!).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
                        <div className="flex items-center space-x-2 bg-gray-700/50 px-2 py-1 rounded-full w-fit">
                          <CoinDisplay value="P" size="sm" />
                          <span className="font-bold neon-gold-text text-sm">
                            {Math.floor(parseFloat(user.pCoinBalance || "0"))}
                          </span>
                          {user.isVip && (
                            <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500 text-xs ml-2">
                              VIP
                            </Badge>
                          )}
                        </div>
                        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedUser(user)}
                            className="bg-cyan-500/20 text-cyan-400 border-cyan-500 hover:bg-cyan-500 hover:text-white w-full sm:w-auto text-xs sm:text-sm"
                          >
                            <Coins className="w-4 h-4 mr-1" />
                            {authUser?.role === 'owner' ? 'Edit Coins' : 'Add Coins'}
                          </Button>
                          {/* Owner coin management buttons */}
                          {authUser?.role === 'owner' && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  if (confirm(`Reset ${user.username}'s coins to 0?`)) {
                                    resetCoinsMutation.mutate(user.id);
                                  }
                                }}
                                className="bg-red-500/20 text-red-400 border-red-500 hover:bg-red-500 hover:text-white w-full sm:w-auto text-xs sm:text-sm"
                              >
                                <RotateCcw className="w-4 h-4 mr-1" />
                                Reset
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  const newIsVip = !user.isVip;
                                  setVipMutation.mutate({ 
                                    userId: user.id, 
                                    isVip: newIsVip,
                                    durationDays: newIsVip ? 30 : undefined
                                  });
                                }}
                                className={`w-full sm:w-auto text-xs sm:text-sm ${
                                  user.isVip 
                                    ? "bg-yellow-500/20 text-yellow-400 border-yellow-500 hover:bg-yellow-500 hover:text-black"
                                    : "bg-gray-500/20 text-gray-400 border-gray-500 hover:bg-gray-500 hover:text-white"
                                }`}
                              >
                                <Crown className="w-4 h-4 mr-1" />
                                {user.isVip ? 'Remove VIP' : 'Make VIP'}
                              </Button>
                            </>
                          )}
                          <select
                            value={user.role}
                            onChange={(e) => {
                              if (e.target.value !== user.role) {
                                updateRoleMutation.mutate({
                                  userId: user.id,
                                  role: e.target.value,
                                });
                              }
                            }}
                            disabled={user.id === authUser?.id || (user.role === 'admin' || user.role === 'owner')}
                            className="px-2 py-1 bg-gray-800/50 border border-purple-500 rounded text-purple-400 text-xs sm:text-sm hover:bg-purple-500/20 focus:outline-none focus:ring-2 focus:ring-purple-500 w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                            {authUser?.role === 'owner' && <option value="owner">Owner</option>}
                          </select>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setDeleteConfirmation({ show: false, username: user.username });
                              deleteUserMutation.mutate(user.id);
                            }}
                            disabled={user.role === 'admin' || user.role === 'owner'}
                            className="bg-red-500/20 text-red-400 border-red-500 hover:bg-red-500 hover:text-white w-full sm:w-auto text-xs sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-red-500/20 disabled:hover:text-red-400"
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Transactions Tab */}
          <TabsContent value="transactions" className="space-y-4">
            <Card className="glass-effect rounded-2xl border-none bg-transparent">
              <CardHeader>
                <CardTitle className="neon-purple-text">All Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {allTransactions?.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg"
                    >
                      <div>
                        <p className="font-semibold neon-blue-text">
                          {transaction.description}
                        </p>
                        <p className="text-sm neon-blue-text">
                          User ID: {transaction.userId} | Type: {transaction.type}
                        </p>
                        <p className="text-sm neon-blue-text">
                          {new Date(transaction.createdAt!).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span
                          className={`font-bold ${
                            parseFloat(transaction.amount) > 0
                              ? "text-green-400"
                              : "text-red-400"
                          }`}
                        >
                          {parseFloat(transaction.amount) > 0 ? "+" : ""}
                          {transaction.amount}
                        </span>
                        <CoinDisplay value="P" size="sm" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tools Tab */}
          <TabsContent value="tools" className="space-y-4">
            <Card className="glass-effect rounded-2xl border-none bg-transparent">
              <CardHeader>
                <CardTitle className="neon-gold-text">Admin Tools</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="text-center py-8">
                    <Settings className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                    <h4 className="text-xl font-bold mb-2 text-gray-400">
                      Additional Tools Coming Soon
                    </h4>
                    <p className="text-gray-500">
                      More admin tools will be added here
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Game Bans Tab */}
          <TabsContent value="game-bans" className="space-y-4">
            <Card className="glass-effect rounded-2xl border-none bg-transparent">
              <CardHeader>
                <CardTitle className="neon-red-text flex items-center gap-2">
                  <Ban className="w-5 h-5" />
                  Game-Specific User Bans
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Ban User from Game Form */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white">Ban User from Game</h3>
                    
                    <div>
                      <Label className="text-gray-300">Select User</Label>
                      <select
                        value={gameBanUser?.id || ""}
                        onChange={(e) => {
                          const userId = parseInt(e.target.value);
                          const user = allUsers?.find(u => u.id === userId);
                          setGameBanUser(user || null);
                        }}
                        className="w-full mt-1 bg-black/50 border border-cyan-500/30 rounded-lg px-3 py-2 text-white"
                      >
                        <option value="">Choose a user...</option>
                        {allUsers?.map((user) => (
                          <option key={user.id} value={user.id}>
                            {user.username} ({user.role})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <Label className="text-gray-300">Game Type</Label>
                      <select
                        value={gameBanType}
                        onChange={(e) => setGameBanType(e.target.value)}
                        className="w-full mt-1 bg-black/50 border border-cyan-500/30 rounded-lg px-3 py-2 text-white"
                      >
                        <option value="">Choose a game...</option>
                        <option value="plinko">Plinko</option>
                        <option value="cups">Cups</option>
                        <option value="roulette">Roulette</option>
                        <option value="slide">Slide</option>
                        <option value="jackpot">Jackpot</option>
                        <option value="crash">Crash</option>
                        <option value="mines">Mines</option>
                        <option value="dice">Dice</option>
                        <option value="coin-flip">Coin Flip</option>
                        <option value="wheel">Wheel</option>
                      </select>
                    </div>

                    <div>
                      <Label className="text-gray-300">Ban Reason</Label>
                      <Input
                        placeholder="Enter reason for game ban..."
                        value={gameBanReason}
                        onChange={(e) => setGameBanReason(e.target.value)}
                        className="bg-black/50 border-cyan-500/30 text-white"
                      />
                    </div>

                    <Button
                      onClick={handleGameBan}
                      disabled={banFromGameMutation.isPending || !gameBanUser || !gameBanType || !gameBanReason.trim()}
                      className="w-full bg-red-600 hover:bg-red-700 text-white"
                    >
                      {banFromGameMutation.isPending ? "Banning..." : "Ban from Game"}
                    </Button>
                  </div>

                  {/* Current Game Bans List */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white">Active Game Bans</h3>
                    <div className="max-h-96 overflow-y-auto space-y-2">
                      {gameBans && gameBans.length > 0 ? (
                        gameBans.map((ban: any) => (
                          <div
                            key={`${ban.userId}-${ban.gameType}`}
                            className="p-3 bg-gray-800/50 rounded-lg border border-red-500/30"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-semibold text-white">
                                  {allUsers?.find(u => u.id === ban.userId)?.username || "Unknown User"}
                                </p>
                                <p className="text-sm text-gray-400 capitalize">
                                  Game: {ban.gameType}
                                </p>
                                <p className="text-xs text-gray-500">
                                  Reason: {ban.reason}
                                </p>
                                <p className="text-xs text-gray-500">
                                  Banned: {new Date(ban.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                              <Button
                                size="sm"
                                onClick={() => unbanFromGameMutation.mutate({ 
                                  userId: ban.userId, 
                                  gameType: ban.gameType 
                                })}
                                disabled={unbanFromGameMutation.isPending}
                                className="bg-green-600 hover:bg-green-700 text-white"
                              >
                                Unban
                              </Button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8">
                          <Gamepad2 className="h-12 w-12 text-gray-600 mx-auto mb-3" />
                          <p className="text-gray-400">No active game bans</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Add Coins Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="glass-effect border-none bg-transparent max-w-md w-full">
            <CardHeader>
              <CardTitle className="neon-gold-text">
                {authUser?.role === 'owner' ? 'Edit' : 'Add'} P COINS
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="neon-blue-text">User</Label>
                <Input
                  value={selectedUser.username}
                  disabled
                  className="glass-effect text-white"
                />
              </div>
              <div>
                <Label className="neon-blue-text">
                  {authUser?.role === 'owner' ? 'New Balance' : 'Amount to Add'}
                </Label>
                <Input
                  type="number"
                  placeholder={authUser?.role === 'owner' ? 'Enter new balance' : 'Enter amount'}
                  value={coinAmount}
                  onChange={(e) => setCoinAmount(e.target.value)}
                  className="glass-effect text-white placeholder-gray-400"
                />
              </div>
              <div>
                <Label className="neon-blue-text">Reason</Label>
                <Input
                  placeholder="Enter reason"
                  value={coinReason}
                  onChange={(e) => setCoinReason(e.target.value)}
                  className="glass-effect text-white placeholder-gray-400"
                />
              </div>
              <div className="flex space-x-2">
                <Button
                  onClick={handleAddCoins}
                  disabled={addCoinsMutation.isPending || ownerUpdateCoinsMutation.isPending}
                  variant="outline"
                  className="flex-1 bg-green-500/20 text-green-400 border-green-500 hover:bg-green-500 hover:text-white"
                >
                  {(addCoinsMutation.isPending || ownerUpdateCoinsMutation.isPending) ? 
                    "Processing..." : 
                    authUser?.role === 'owner' ? "Update Balance" : "Add Coins"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setSelectedUser(null)}
                  className="flex-1 bg-red-500/20 text-red-400 border-red-500 hover:bg-red-500 hover:text-white"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmation?.show && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="glass-effect border-none bg-transparent max-w-md w-full">
            <CardHeader>
              <CardTitle className="text-green-400">Success!</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-green-500/20 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-green-400 mb-2">User Deleted Successfully</h3>
                <p className="text-gray-300">
                  User <span className="font-bold text-red-400">{deleteConfirmation.username}</span> has been permanently removed from the system.
                </p>
              </div>
              <Button
                onClick={() => setDeleteConfirmation(null)}
                variant="outline"
                className="w-full bg-green-500/20 text-green-400 border-green-500 hover:bg-green-500 hover:text-white"
              >
                OK
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}