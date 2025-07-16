import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Crown, Shield, UserX, UserPlus, ArrowLeft, Ticket, Plus, Ban, DollarSign, Edit } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useEffect, useState } from "react";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface User {
  id: number;
  username: string;
  role: string;
  pCoinBalance: string;
  isBanned?: boolean;
  bannedReason?: string;
  createdAt: string;
}

export default function OwnerPanel() {
  const { toast } = useToast();
  const { user, isLoading } = useAuth();
  const [codeAmount, setCodeAmount] = useState("");
  const [usageLimit, setUsageLimit] = useState("1");
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [newCoinAmount, setNewCoinAmount] = useState("");
  const [coinReason, setCoinReason] = useState("");
  const [banningUser, setBanningUser] = useState<User | null>(null);
  const [banReason, setBanReason] = useState("");

  // Redirect to home if not owner
  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'owner')) {
      toast({
        title: "Access Denied",
        description: "You need owner privileges to access this page.",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/";
      }, 1000);
      return;
    }
  }, [user, isLoading, toast]);

  // Get admin users
  const { data: admins, isLoading: adminsLoading } = useQuery({
    queryKey: ["/api/owner/admins"],
    enabled: user?.role === 'owner',
  });

  // Get all users for promotion
  const { data: allUsers, isLoading: usersLoading } = useQuery({
    queryKey: ["/api/admin/users"],
    enabled: user?.role === 'owner',
  });

  // Get redeem codes
  const { data: redeemCodes } = useQuery({
    queryKey: ["/api/owner/codes"],
    enabled: user?.role === 'owner',
  });

  // Generate redeem code mutation
  const generateCodeMutation = useMutation({
    mutationFn: async (data: { amount: string; usageLimit: string }) => {
      const res = await apiRequest("POST", "/api/owner/generate-code", data);
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/owner/codes"] });
      setCodeAmount("");
      setUsageLimit("1");
      toast({
        title: "Code Generated",
        description: `Code ${data.code.code} generated for ${data.code.amount} P COIN (${data.code.usageLimit} uses)`,
      });
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

  // Remove admin role mutation
  const removeAdminMutation = useMutation({
    mutationFn: async (userId: number) => {
      const res = await apiRequest("POST", "/api/owner/remove-admin", { userId });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/owner/admins"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Success",
        description: "Admin role removed successfully",
      });
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

  // Promote to admin mutation
  const promoteAdminMutation = useMutation({
    mutationFn: async (userId: number) => {
      const res = await apiRequest("POST", "/api/owner/promote-admin", { userId });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/owner/admins"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Success",
        description: "User promoted to admin successfully",
      });
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

  // Ban user mutation
  const banUserMutation = useMutation({
    mutationFn: async ({ userId, reason }: { userId: number; reason: string }) => {
      const res = await apiRequest("POST", "/api/owner/ban-user", { userId, reason });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setBanningUser(null);
      setBanReason("");
      toast({
        title: "User Banned",
        description: "User has been banned successfully",
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

  // Unban user mutation
  const unbanUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      const res = await apiRequest("POST", "/api/owner/unban-user", { userId });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "User Unbanned",
        description: "User has been unbanned successfully",
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

  // Enhanced update user coins mutation (works for all users including admins and owner)
  const updateCoinsMutation = useMutation({
    mutationFn: async ({ userId, amount, reason }: { userId: number; amount: string; reason: string }) => {
      const res = await apiRequest("POST", "/api/owner/update-coins", { userId, amount, reason });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/owner/admins"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setEditingUser(null);
      setNewCoinAmount("");
      setCoinReason("");
      toast({
        title: "Coins Updated",
        description: "User coins have been updated successfully",
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

  if (isLoading || !user || user.role !== 'owner') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <Crown className="w-16 h-16 mx-auto mb-4 text-casino-gold animate-pulse" />
          <p className="text-gray-400">Checking permissions...</p>
        </div>
      </div>
    );
  }

  const regularUsers = allUsers?.filter((u: User) => u.role === 'user') || [];
  
  // Make sure we have the regularUsers available for stats
  const actualRegularUsers = regularUsers;

  return (
    <div className="min-h-screen bg-black text-white page-transition">
      {/* Header */}
      <div className="bg-gradient-to-r from-casino-gold/10 to-purple-500/10 border-b border-casino-gold/20">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Crown className="w-8 h-8 text-casino-gold" />
              <div>
                <h1 className="text-3xl font-bold text-casino-gold">Owner Panel</h1>
                <p className="text-gray-400">Manage admin privileges and roles</p>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={() => window.location.href = '/'}
                className="bg-cyan-500/20 text-cyan-400 border-cyan-500 hover:bg-cyan-500 hover:text-white"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
              <Button
                variant="outline"
                onClick={() => window.location.href = '/admin'}
                className="bg-purple-500/20 text-purple-400 border-purple-500 hover:bg-purple-500 hover:text-white"
              >
                <Shield className="w-4 h-4 mr-2" />
                Admin Panel
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Owner Coin Management */}
        <Card className="glass-effect border-casino-gold/50 bg-gradient-to-br from-casino-gold/10 to-yellow-600/10 shadow-2xl shadow-casino-gold/20">
          <CardHeader className="bg-gradient-to-r from-casino-gold/20 to-yellow-600/20 border-b border-casino-gold/30">
            <CardTitle className="flex items-center space-x-3 text-transparent bg-gradient-to-r from-casino-gold to-yellow-400 bg-clip-text text-xl font-bold">
              <div className="p-2 bg-gradient-to-r from-casino-gold to-yellow-600 rounded-lg shadow-lg">
                <Crown className="w-6 h-6 text-white" />
              </div>
              <span>Owner Coin Management</span>
            </CardTitle>
            <CardDescription className="text-yellow-200/80 text-sm mt-2">
              Manage your own and administrator coin balances directly
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid md:grid-cols-2 gap-4">
              {/* Owner Balance */}
              <div className="p-4 rounded-lg bg-gradient-to-r from-casino-gold/20 to-yellow-600/20 border border-casino-gold/30">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <Crown className="w-5 h-5 text-casino-gold" />
                    <span className="font-semibold text-white">Your Balance</span>
                  </div>
                  <Badge className="bg-casino-gold/20 text-casino-gold border-casino-gold/50">Owner</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-casino-gold">
                    {isNaN(parseFloat(user?.pCoinBalance || "0")) ? 0 : parseFloat(user?.pCoinBalance || "0").toFixed(0)} P COINS
                  </span>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        size="sm"
                        className="bg-gradient-to-r from-casino-gold to-yellow-600 hover:from-yellow-400 hover:to-casino-gold text-white border-0"
                        onClick={() => {
                          setEditingUser(user as User);
                          setNewCoinAmount(user?.pCoinBalance || "0");
                        }}
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-gray-900 border-gray-700">
                      <DialogHeader>
                        <DialogTitle className="text-white">Edit Your Coins</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label className="text-gray-300">New Balance</Label>
                          <Input
                            type="number"
                            value={newCoinAmount}
                            onChange={(e) => setNewCoinAmount(e.target.value)}
                            className="bg-black/50 border-gray-600 text-white"
                            placeholder="Enter new balance"
                          />
                        </div>
                        <div>
                          <Label className="text-gray-300">Reason</Label>
                          <Textarea
                            value={coinReason}
                            onChange={(e) => setCoinReason(e.target.value)}
                            className="bg-black/50 border-gray-600 text-white"
                            placeholder="Reason for adjustment..."
                            rows={3}
                          />
                        </div>
                        <Button
                          onClick={() => {
                            if (editingUser && newCoinAmount && coinReason) {
                              updateCoinsMutation.mutate({
                                userId: editingUser.id,
                                amount: newCoinAmount,
                                reason: coinReason
                              });
                            }
                          }}
                          disabled={updateCoinsMutation.isPending}
                          className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-400 hover:to-green-500"
                        >
                          {updateCoinsMutation.isPending ? "Updating..." : "Update Coins"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
              
              {/* Quick Admin Stats */}
              <div className="p-4 rounded-lg bg-gradient-to-r from-purple-500/20 to-blue-600/20 border border-purple-500/30">
                <div className="flex items-center space-x-2 mb-3">
                  <Shield className="w-5 h-5 text-purple-400" />
                  <span className="font-semibold text-white">Admin Stats</span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total Admins:</span>
                    <span className="text-purple-400 font-semibold">{admins?.length || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total Users:</span>
                    <span className="text-blue-400 font-semibold">{actualRegularUsers?.length || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Current Admins */}
        <Card className="glass-effect border-none bg-transparent">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-casino-gold">
              <Shield className="w-5 h-5" />
              <span>Current Administrators</span>
            </CardTitle>
            <CardDescription className="text-gray-400">
              Manage existing admin users and their permissions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {adminsLoading ? (
              <div className="text-center py-8">
                <Shield className="w-8 h-8 mx-auto mb-4 text-casino-gold animate-pulse" />
                <p className="text-gray-400">Loading administrators...</p>
              </div>
            ) : admins && admins.length > 0 ? (
              <div className="space-y-4">
                {admins.map((admin: User) => (
                  <div
                    key={admin.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-gray-800/30 border border-gray-700/50"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                        <span className="text-white font-bold">
                          {admin.username[0].toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">{admin.username}</h3>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className="bg-purple-500/20 text-purple-400 border-purple-500">
                            <Shield className="w-3 h-3 mr-1" />
                            Admin
                          </Badge>
                          <div className="flex items-center space-x-1">
                            <span className="text-sm text-gray-400">
                              {isNaN(parseFloat(admin.pCoinBalance)) ? 0 : parseFloat(admin.pCoinBalance).toFixed(0)} P COINS
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-white border-0"
                            onClick={() => {
                              setEditingUser(admin);
                              setNewCoinAmount(admin.pCoinBalance);
                            }}
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            Edit Coins
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-gray-900 border-gray-700">
                          <DialogHeader>
                            <DialogTitle className="text-white">Edit Admin Coins</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label className="text-gray-300">New Balance</Label>
                              <Input
                                type="number"
                                value={newCoinAmount}
                                onChange={(e) => setNewCoinAmount(e.target.value)}
                                className="bg-black/50 border-gray-600 text-white"
                                placeholder="Enter new balance"
                              />
                            </div>
                            <div>
                              <Label className="text-gray-300">Reason</Label>
                              <Textarea
                                value={coinReason}
                                onChange={(e) => setCoinReason(e.target.value)}
                                className="bg-black/50 border-gray-600 text-white"
                                placeholder="Reason for adjustment..."
                                rows={3}
                              />
                            </div>
                            <Button
                              onClick={() => {
                                if (editingUser && newCoinAmount && coinReason) {
                                  updateCoinsMutation.mutate({
                                    userId: editingUser.id,
                                    amount: newCoinAmount,
                                    reason: coinReason
                                  });
                                }
                              }}
                              disabled={updateCoinsMutation.isPending}
                              className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-400 hover:to-green-500"
                            >
                              {updateCoinsMutation.isPending ? "Updating..." : "Update Coins"}
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeAdminMutation.mutate(admin.id)}
                        disabled={removeAdminMutation.isPending}
                        className="bg-red-500/20 text-red-400 border-red-500 hover:bg-red-500 hover:text-white"
                      >
                        <UserX className="w-4 h-4 mr-2" />
                        Remove Admin
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Shield className="w-12 h-12 mx-auto mb-4 text-gray-600" />
                <p className="text-gray-400">No administrators found</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* User Management */}
        <Card className="glass-effect border-cyan-500/50 bg-gradient-to-br from-cyan-500/10 to-blue-600/10 shadow-2xl shadow-cyan-500/20">
          <CardHeader className="bg-gradient-to-r from-cyan-500/20 to-blue-600/20 border-b border-cyan-500/30">
            <CardTitle className="flex items-center space-x-3 text-transparent bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-xl font-bold">
              <div className="p-2 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg shadow-lg">
                <UserPlus className="w-6 h-6 text-white" />
              </div>
              <span>User Management Center</span>
            </CardTitle>
            <CardDescription className="text-cyan-200/80 text-sm mt-2">
              Complete control over user accounts with advanced management tools
            </CardDescription>
            <div className="flex flex-wrap gap-2 mt-3">
              <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/50">
                <Edit className="w-3 h-3 mr-1" />
                Edit Coins
              </Badge>
              <Badge className="bg-red-500/20 text-red-300 border-red-500/50">
                <Ban className="w-3 h-3 mr-1" />
                Ban/Unban
              </Badge>
              <Badge className="bg-green-500/20 text-green-300 border-green-500/50">
                <UserPlus className="w-3 h-3 mr-1" />
                Promote Admin
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {usersLoading ? (
              <div className="text-center py-8">
                <UserPlus className="w-8 h-8 mx-auto mb-4 text-casino-gold animate-pulse" />
                <p className="text-gray-400">Loading users...</p>
              </div>
            ) : regularUsers.length > 0 ? (
              <div className="space-y-4">
                {regularUsers.map((regularUser: User) => (
                  <div
                    key={regularUser.id}
                    className="flex items-center justify-between p-6 rounded-xl bg-gradient-to-r from-gray-800/40 to-gray-700/40 border border-cyan-500/30 hover:border-cyan-400/50 transition-all duration-300 shadow-lg hover:shadow-cyan-500/20"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
                        <span className="text-white font-bold text-lg">
                          {regularUser.username[0].toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center space-x-3">
                          <h3 className="font-bold text-white text-lg">{regularUser.username}</h3>
                          {regularUser.isBanned && (
                            <Badge variant="destructive" className="text-xs bg-red-500/30 border-red-500 animate-pulse">
                              <Ban className="w-3 h-3 mr-1" />
                              BANNED
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center space-x-3 mt-1">
                          <Badge variant="outline" className="bg-cyan-500/20 text-cyan-300 border-cyan-500/50">
                            <Crown className="w-3 h-3 mr-1" />
                            User
                          </Badge>
                          <div className="flex items-center space-x-1">
                            <DollarSign className="w-4 h-4 text-yellow-400" />
                            <span className="text-yellow-300 font-semibold">
                              {isNaN(parseFloat(regularUser.pCoinBalance)) ? 0 : parseFloat(regularUser.pCoinBalance).toFixed(0)} P COINS
                            </span>
                          </div>
                        </div>
                        {regularUser.isBanned && regularUser.bannedReason && (
                          <p className="text-xs text-red-400 mt-1">
                            Reason: {regularUser.bannedReason}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex space-x-3">
                      {!regularUser.isBanned ? (
                        <>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-white border-0 shadow-lg hover:shadow-yellow-500/30 transition-all duration-300"
                                onClick={() => {
                                  setEditingUser(regularUser);
                                  setNewCoinAmount(regularUser.pCoinBalance);
                                }}
                              >
                                <Edit className="w-4 h-4 mr-1" />
                                Edit Coins
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="bg-gray-900 border-gray-700">
                              <DialogHeader>
                                <DialogTitle className="text-white">Edit User Coins</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label className="text-gray-300">New Balance</Label>
                                  <Input
                                    type="number"
                                    value={newCoinAmount}
                                    onChange={(e) => setNewCoinAmount(e.target.value)}
                                    className="bg-black/50 border-gray-600 text-white"
                                    placeholder="Enter new balance"
                                  />
                                </div>
                                <div>
                                  <Label className="text-gray-300">Reason</Label>
                                  <Textarea
                                    value={coinReason}
                                    onChange={(e) => setCoinReason(e.target.value)}
                                    className="bg-black/50 border-gray-600 text-white"
                                    placeholder="Reason for adjustment..."
                                    rows={3}
                                  />
                                </div>
                                <Button
                                  onClick={() => {
                                    if (editingUser) {
                                      updateCoinsMutation.mutate({
                                        userId: editingUser.id,
                                        amount: newCoinAmount,
                                        reason: coinReason || "Owner adjustment"
                                      });
                                    }
                                  }}
                                  disabled={updateCoinsMutation.isPending}
                                  className="w-full bg-yellow-600 hover:bg-yellow-700 text-white"
                                >
                                  <DollarSign className="w-4 h-4 mr-2" />
                                  Update Balance
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>

                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-400 hover:to-red-500 text-white border-0 shadow-lg hover:shadow-red-500/30 transition-all duration-300"
                                onClick={() => setBanningUser(regularUser)}
                              >
                                <Ban className="w-4 h-4 mr-1" />
                                Ban User
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="bg-gray-900 border-gray-700">
                              <DialogHeader>
                                <DialogTitle className="text-white">Ban User</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <p className="text-gray-300">
                                  Are you sure you want to ban <strong>{banningUser?.username}</strong>?
                                  This will immediately terminate their session.
                                </p>
                                <div>
                                  <Label className="text-gray-300">Ban Reason</Label>
                                  <Textarea
                                    value={banReason}
                                    onChange={(e) => setBanReason(e.target.value)}
                                    className="bg-black/50 border-gray-600 text-white"
                                    placeholder="Reason for ban..."
                                    rows={3}
                                  />
                                </div>
                                <Button
                                  onClick={() => {
                                    if (banningUser) {
                                      banUserMutation.mutate({
                                        userId: banningUser.id,
                                        reason: banReason || "No reason provided"
                                      });
                                    }
                                  }}
                                  disabled={banUserMutation.isPending}
                                  variant="destructive"
                                  className="w-full"
                                >
                                  <Ban className="w-4 h-4 mr-2" />
                                  Ban User
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>

                          <Button
                            onClick={() => promoteAdminMutation.mutate(regularUser.id)}
                            disabled={promoteAdminMutation.isPending}
                            size="sm"
                            className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-white border-0 shadow-lg hover:shadow-green-500/30 transition-all duration-300"
                          >
                            <UserPlus className="w-4 h-4 mr-1" />
                            Promote
                          </Button>
                        </>
                      ) : (
                        <Button
                          onClick={() => unbanUserMutation.mutate(regularUser.id)}
                          disabled={unbanUserMutation.isPending}
                          size="sm"
                          className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-white border-0 shadow-lg hover:shadow-green-500/30 transition-all duration-300 animate-pulse"
                        >
                          <Shield className="w-4 h-4 mr-2" />
                          Unban User
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg shadow-cyan-500/30">
                  <UserPlus className="w-10 h-10 text-white" />
                </div>
                <p className="text-cyan-200 text-lg font-medium">No users available for management</p>
                <p className="text-cyan-300/60 text-sm mt-2">New users will appear here automatically</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Redeem Code Management */}
        <Card className="glass-effect border-none bg-transparent">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-casino-gold">
              <Ticket className="w-5 h-5" />
              <span>Redeem Code Management</span>
            </CardTitle>
            <CardDescription className="text-gray-300">
              Generate and manage redeem codes for P COIN distribution
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Generate New Code */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-cyan-400 flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Generate New Code
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="codeAmount" className="text-gray-300">P COIN Amount</Label>
                  <Input
                    id="codeAmount"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Enter amount..."
                    value={codeAmount}
                    onChange={(e) => setCodeAmount(e.target.value)}
                    className="bg-black/40 border-cyan-400/30 text-white placeholder-gray-400 focus:border-cyan-400"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="usageLimit" className="text-gray-300">How many uses?</Label>
                  <Input
                    id="usageLimit"
                    type="number"
                    min="1"
                    placeholder="Enter uses..."
                    value={usageLimit}
                    onChange={(e) => setUsageLimit(e.target.value)}
                    className="bg-black/40 border-cyan-400/30 text-white placeholder-gray-400 focus:border-cyan-400"
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    onClick={() => {
                      if (codeAmount && parseFloat(codeAmount) > 0 && usageLimit && parseInt(usageLimit) > 0) {
                        generateCodeMutation.mutate({ amount: codeAmount, usageLimit });
                      }
                    }}
                    disabled={generateCodeMutation.isPending || !codeAmount || parseFloat(codeAmount) <= 0 || !usageLimit || parseInt(usageLimit) <= 0}
                    className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white w-full"
                  >
                    {generateCodeMutation.isPending ? "Generating..." : "Generate Code"}
                  </Button>
                </div>
              </div>
            </div>

            {/* Existing Codes */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-cyan-400">Generated Codes</h3>
              {redeemCodes && redeemCodes.length > 0 ? (
                <div className="space-y-2">
                  {redeemCodes.map((code: any) => (
                    <div
                      key={code.id}
                      className="p-4 bg-black/40 rounded-lg border border-cyan-400/20 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="font-mono text-lg text-cyan-400">{code.code}</div>
                          <div className="text-gray-300">{code.amount} P COIN</div>
                          <div className="text-sm text-blue-400">
                            Uses: {code.redemptions?.length || 0}/{code.usageLimit || 1}
                          </div>
                          <div className={`px-2 py-1 rounded text-xs ${
                            (code.redemptions?.length || 0) >= (code.usageLimit || 1)
                              ? 'bg-red-500/20 text-red-400' 
                              : 'bg-green-500/20 text-green-400'
                          }`}>
                            {(code.redemptions?.length || 0) >= (code.usageLimit || 1) ? 'Exhausted' : 'Active'}
                          </div>
                        </div>
                        <div className="text-xs text-gray-400">
                          Created: {new Date(code.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      
                      {code.redemptions && code.redemptions.length > 0 && (
                        <div className="border-t border-gray-600 pt-3">
                          <div className="text-sm font-medium text-gray-300 mb-2">Redeemed by:</div>
                          <div className="space-y-1 max-h-24 overflow-y-auto">
                            {code.redemptions.map((r: any, index: number) => (
                              <div key={index} className="flex justify-between items-center text-xs bg-black/30 rounded px-2 py-1">
                                <span className="text-cyan-400 font-medium">{r.username}</span>
                                <span className="text-gray-500">
                                  {new Date(r.redeemedAt).toLocaleDateString()} {new Date(r.redeemedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <Ticket className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No codes generated yet</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}