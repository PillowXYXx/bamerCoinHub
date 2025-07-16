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
import { Textarea } from "@/components/ui/textarea";
import { 
  Send, 
  Inbox, 
  History, 
  ArrowRight,
  Check,
  X,
  Clock,
  DollarSign
} from "lucide-react";
import type { User, Trade, Transaction } from "@shared/schema";

export default function TradingPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [recipientUsername, setRecipientUsername] = useState("");
  const [tradeAmount, setTradeAmount] = useState("");
  const [tradeMessage, setTradeMessage] = useState("");

  // Fetch user data
  const { data: userData, isLoading: userLoading } = useQuery<User>({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  // Fetch sent trades
  const { data: sentTrades, isLoading: sentTradesLoading } = useQuery<Trade[]>({
    queryKey: ["/api/trades/sent"],
    retry: false,
  });

  // Fetch received trades
  const { data: receivedTrades, isLoading: receivedTradesLoading } = useQuery<Trade[]>({
    queryKey: ["/api/trades/received"],
    retry: false,
  });

  // Fetch all users for username validation
  const { data: allUsers } = useQuery<User[]>({
    queryKey: ["/api/users"],
    retry: false,
  });

  // Send trade mutation
  const sendTradeMutation = useMutation({
    mutationFn: async (data: { recipientUsername: string; amount: string; message: string }) => {
      await apiRequest("POST", "/api/trades/send", data);
    },
    onSuccess: () => {
      toast({
        title: "Trade Sent",
        description: "P COINS deducted from your balance and trade request sent",
      });
      setRecipientUsername("");
      setTradeAmount("");
      setTradeMessage("");
      queryClient.invalidateQueries({ queryKey: ["/api/trades/sent"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "Please log in to send trades",
          variant: "destructive",
        });
        return;
      }
      toast({
        title: "Error",
        description: "Failed to send trade request",
        variant: "destructive",
      });
    },
  });

  // Accept trade mutation
  const acceptTradeMutation = useMutation({
    mutationFn: async (tradeId: number) => {
      await apiRequest("POST", `/api/trades/${tradeId}/accept`);
    },
    onSuccess: () => {
      toast({
        title: "Trade Accepted",
        description: "P COINS added to your balance",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/trades/received"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to accept trade",
        variant: "destructive",
      });
    },
  });

  // Cancel trade mutation
  const cancelTradeMutation = useMutation({
    mutationFn: async (tradeId: number) => {
      await apiRequest("POST", `/api/trades/${tradeId}/cancel`);
    },
    onSuccess: () => {
      toast({
        title: "Trade Cancelled",
        description: "P COINS refunded to your balance",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/trades/sent"] });
      queryClient.invalidateQueries({ queryKey: ["/api/trades/received"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to cancel trade",
        variant: "destructive",
      });
    },
  });

  const handleSendTrade = () => {
    if (!recipientUsername || !tradeAmount) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const amount = parseFloat(tradeAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount",
        variant: "destructive",
      });
      return;
    }

    const userBalance = parseFloat(userData?.pCoinBalance || "0");
    if (amount > userBalance) {
      toast({
        title: "Insufficient Balance",
        description: "You don't have enough P COINS for this trade",
        variant: "destructive",
      });
      return;
    }

    sendTradeMutation.mutate({
      recipientUsername,
      amount: tradeAmount,
      message: tradeMessage,
    });
  };

  const getUsernameFromId = (userId: number): string => {
    const user = allUsers?.find(u => u.id === userId);
    return user?.username || `User ${userId}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500/20 text-green-400 border-green-500";
      case "cancelled":
        return "bg-red-500/20 text-red-400 border-red-500";
      case "pending":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500";
    }
  };

  if (userLoading) {
    return (
      <div className="min-h-screen bg-black relative overflow-hidden futuristic-bg">
        <div className="container mx-auto px-4 py-8 relative z-10">
          <Skeleton className="h-16 w-full mb-8" />
          <div className="grid md:grid-cols-2 gap-6">
            <Skeleton className="h-96" />
            <Skeleton className="h-96" />
          </div>
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
            <div className="flex items-center space-x-3">
              <Send className="w-8 h-8 text-cyan-400" />
              <h1 className="text-3xl font-bold">
                <span className="neon-blue-text">P COIN Trading</span>
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="glass-effect rounded-lg px-4 py-2 flex items-center space-x-2">
                <CoinDisplay value="P" size="md" />
                <span className="font-semibold neon-blue-text">
                  {isNaN(parseFloat(userData?.pCoinBalance || "0")) ? 0 : Math.floor(parseFloat(userData?.pCoinBalance || "0"))}
                </span>
              </div>
              <Button
                variant="outline"
                onClick={() => window.location.href = '/'}
                className="border-cyan-500 text-cyan-400 hover:bg-cyan-500/20"
              >
                Back to Home
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 relative z-10">
        {/* Welcome Message */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4 neon-glow">
            Trade P COINS with Other Players
          </h2>
          <p className="text-xl text-gray-300">
            Send and receive P COINS securely with other users
          </p>
        </div>

        {/* Trading Tabs */}
        <Tabs defaultValue="send" className="w-full">
          <TabsList className="grid w-full grid-cols-3 glass-effect">
            <TabsTrigger value="send" className="neon-blue-text">
              <Send className="w-4 h-4 mr-2" />
              Send Trade
            </TabsTrigger>
            <TabsTrigger value="inbox" className="neon-purple-text">
              <Inbox className="w-4 h-4 mr-2" />
              Inbox ({receivedTrades?.filter(t => t.status === "pending").length || 0})
            </TabsTrigger>
            <TabsTrigger value="history" className="neon-gold-text">
              <History className="w-4 h-4 mr-2" />
              History
            </TabsTrigger>
          </TabsList>

          {/* Send Trade Tab */}
          <TabsContent value="send" className="space-y-4">
            <Card className="glass-effect rounded-2xl border-none bg-transparent">
              <CardHeader>
                <CardTitle className="neon-blue-text">Send P COINS</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label className="neon-blue-text">Recipient Username</Label>
                      <Input
                        placeholder="Enter username"
                        value={recipientUsername}
                        onChange={(e) => setRecipientUsername(e.target.value)}
                        className="glass-effect text-white placeholder-gray-400"
                      />
                    </div>
                    <div>
                      <Label className="neon-blue-text">Amount</Label>
                      <Input
                        type="number"
                        placeholder="Enter amount"
                        value={tradeAmount}
                        onChange={(e) => setTradeAmount(e.target.value)}
                        className="glass-effect text-white placeholder-gray-400"
                      />
                    </div>
                    <div>
                      <Label className="neon-blue-text">Message (Optional)</Label>
                      <Textarea
                        placeholder="Add a message..."
                        value={tradeMessage}
                        onChange={(e) => setTradeMessage(e.target.value)}
                        className="glass-effect text-white placeholder-gray-400"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full flex items-center justify-center">
                        <Send className="w-12 h-12 text-white" />
                      </div>
                      <p className="text-gray-300 mb-4">
                        Your Balance: <span className="neon-gold-text font-bold">
                          {isNaN(parseFloat(userData?.pCoinBalance || "0")) ? 0 : Math.floor(parseFloat(userData?.pCoinBalance || "0"))} P COINS
                        </span>
                      </p>
                      <Button
                        onClick={handleSendTrade}
                        disabled={sendTradeMutation.isPending}
                        className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white"
                      >
                        {sendTradeMutation.isPending ? "Sending..." : "Send Trade"}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Inbox Tab */}
          <TabsContent value="inbox" className="space-y-4">
            <Card className="glass-effect rounded-2xl border-none bg-transparent">
              <CardHeader>
                <CardTitle className="neon-purple-text">Incoming Trade Requests</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {receivedTrades?.filter(t => t.status === "pending").map((trade) => (
                    <div
                      key={trade.id}
                      className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                          <DollarSign className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <p className="font-semibold neon-blue-text">
                            {getUsernameFromId(trade.senderUserId)}
                          </p>
                          <p className="text-sm neon-blue-text">
                            {new Date(trade.createdAt!).toLocaleDateString()}
                          </p>
                          {trade.message && (
                            <p className="text-sm text-gray-400 mt-1">
                              "{trade.message}"
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <div className="flex items-center space-x-2">
                            <span className="text-2xl font-bold neon-gold-text">
                              {isNaN(parseFloat(trade.amount)) ? 0 : Math.floor(parseFloat(trade.amount))}
                            </span>
                            <CoinDisplay value="P" size="sm" />
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            onClick={() => acceptTradeMutation.mutate(trade.id)}
                            className="bg-green-500 hover:bg-green-600 text-white"
                          >
                            <Check className="w-4 h-4 mr-1" />
                            Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => cancelTradeMutation.mutate(trade.id)}
                            className="border-red-500 text-red-400 hover:bg-red-500/20"
                          >
                            <X className="w-4 h-4 mr-1" />
                            Decline
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {receivedTrades?.filter(t => t.status === "pending").length === 0 && (
                    <div className="text-center py-8">
                      <Inbox className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                      <h4 className="text-xl font-bold mb-2 text-gray-400">
                        No Pending Trades
                      </h4>
                      <p className="text-gray-500">
                        You don't have any pending trade requests
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-4">
            <Card className="glass-effect rounded-2xl border-none bg-transparent">
              <CardHeader>
                <CardTitle className="neon-gold-text">Trade History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {sentTrades?.map((trade) => (
                    <div
                      key={trade.id}
                      className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center">
                          <ArrowRight className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <p className="font-semibold neon-blue-text">
                            To: {getUsernameFromId(trade.receiverUserId)}
                          </p>
                          <p className="text-sm neon-blue-text">
                            {new Date(trade.createdAt!).toLocaleDateString()}
                          </p>
                          {trade.message && (
                            <p className="text-sm text-gray-400 mt-1">
                              "{trade.message}"
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <div className="flex items-center space-x-2">
                            <span className="text-xl font-bold neon-gold-text">
                              {isNaN(parseFloat(trade.amount)) ? 0 : Math.floor(parseFloat(trade.amount))}
                            </span>
                            <CoinDisplay value="P" size="sm" />
                          </div>
                        </div>
                        <Badge className={getStatusColor(trade.status)}>
                          {trade.status === "pending" && <Clock className="w-3 h-3 mr-1" />}
                          {trade.status === "completed" && <Check className="w-3 h-3 mr-1" />}
                          {trade.status === "cancelled" && <X className="w-3 h-3 mr-1" />}
                          {trade.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  {sentTrades?.length === 0 && (
                    <div className="text-center py-8">
                      <History className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                      <h4 className="text-xl font-bold mb-2 text-gray-400">
                        No Trade History
                      </h4>
                      <p className="text-gray-500">
                        You haven't sent any trades yet
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}