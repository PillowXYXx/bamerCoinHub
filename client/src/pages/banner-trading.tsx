import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ArrowLeftRight, CheckCircle, XCircle, Clock, Users, MessageCircle, Send, X } from "lucide-react";
import { format } from "date-fns";
import { ReturnHomeButton } from "@/components/ui/return-home-button";
import { useSoundEffects } from "@/hooks/use-sound";

interface BannerTrade {
  id: number;
  fromUserId: number;
  toUserId: number;
  fromItemId: number;
  toItemId: number;
  fromQuantity: number;
  toQuantity: number;
  status: string;
  fromUserAccepted: boolean;
  toUserAccepted: boolean;
  createdAt: string;
  completedAt?: string;
}

interface User {
  id: number;
  username: string;
}

interface InventoryItem {
  id: number;
  itemId: number;
  quantity: number;
}

interface ShopItem {
  id: number;
  name: string;
  imageUrl: string;
}

interface TradeChatMessage {
  id: number;
  tradeId: number;
  userId: number;
  username: string;
  message: string;
  createdAt: string;
}

export default function BannerTrading() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedToUser, setSelectedToUser] = useState("");
  const [selectedFromItem, setSelectedFromItem] = useState("");
  const [selectedToItem, setSelectedToItem] = useState("");
  const [fromQuantity, setFromQuantity] = useState("1");
  const [toQuantity, setToQuantity] = useState("1");
  const [selectedTradeForChat, setSelectedTradeForChat] = useState<number | null>(null);
  const [chatMessage, setChatMessage] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { playClickSound } = useSoundEffects();

  const { data: trades = [], isLoading: tradesLoading } = useQuery<BannerTrade[]>({
    queryKey: ["/api/banner-trades"],
  });

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
  });

  const { data: inventory = [] } = useQuery<InventoryItem[]>({
    queryKey: ["/api/inventory"],
  });

  const { data: shopItems = [] } = useQuery<ShopItem[]>({
    queryKey: ["/api/shop/items"],
  });

  const { data: user } = useQuery({
    queryKey: ["/api/user"],
  });

  // Trade chat queries
  const { data: chatMessages = [], refetch: refetchChatMessages } = useQuery<TradeChatMessage[]>({
    queryKey: ["/api/trade-chat", selectedTradeForChat],
    enabled: !!selectedTradeForChat,
  });

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const createTradeMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/banner-trades", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/banner-trades"] });
      setIsCreateModalOpen(false);
      toast({ title: "Trade Invitation Sent", description: "Your trade invitation has been sent! They can now accept or decline." });
      // Reset form
      setSelectedToUser("");
      setSelectedFromItem("");
      setSelectedToItem("");
      setFromQuantity("1");
      setToQuantity("1");
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to create trade",
        variant: "destructive" 
      });
    }
  });

  const acceptTradeMutation = useMutation({
    mutationFn: async (tradeId: number) => {
      const res = await apiRequest("POST", `/api/banner-trades/${tradeId}/accept`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/banner-trades"] });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      toast({ title: "Trade Accepted", description: "Trade completed successfully!" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to accept trade",
        variant: "destructive" 
      });
    }
  });

  const cancelTradeMutation = useMutation({
    mutationFn: async (tradeId: number) => {
      const res = await apiRequest("POST", `/api/banner-trades/${tradeId}/cancel`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/banner-trades"] });
      toast({ title: "Trade Cancelled", description: "Trade has been cancelled" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to cancel trade",
        variant: "destructive" 
      });
    }
  });

  const getItemName = (itemId: number) => {
    const item = shopItems.find(item => item.id === itemId);
    return item ? item.name : `Item #${itemId}`;
  };

  const getUserName = (userId: number) => {
    const user = users.find(user => user.id === userId);
    return user ? user.username : `User #${userId}`;
  };

  const getStatusIcon = (trade: BannerTrade) => {
    if (trade.status === "completed") return <CheckCircle className="w-5 h-5 text-green-500" />;
    if (trade.status === "cancelled") return <XCircle className="w-5 h-5 text-red-500" />;
    return <Clock className="w-5 h-5 text-yellow-500" />;
  };

  const getStatusColor = (trade: BannerTrade) => {
    if (trade.status === "completed") return "text-green-400 border-green-500/50";
    if (trade.status === "cancelled") return "text-red-400 border-red-500/50";
    return "text-yellow-400 border-yellow-500/50";
  };

  const handleCreateTrade = () => {
    if (!selectedToUser || !selectedFromItem || !selectedToItem) {
      toast({ 
        title: "Missing Information", 
        description: "Please fill in all required fields",
        variant: "destructive" 
      });
      return;
    }

    createTradeMutation.mutate({
      toUserId: parseInt(selectedToUser),
      fromItemId: parseInt(selectedFromItem),
      toItemId: parseInt(selectedToItem),
      fromQuantity: parseInt(fromQuantity),
      toQuantity: parseInt(toQuantity),
    });
  };

  // Chat mutations
  const sendChatMessageMutation = useMutation({
    mutationFn: async ({ tradeId, message }: { tradeId: number; message: string }) => {
      const res = await apiRequest("POST", `/api/trade-chat/${tradeId}/send`, { message });
      return res.json();
    },
    onSuccess: () => {
      setChatMessage("");
      refetchChatMessages();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = () => {
    if (!selectedTradeForChat || !chatMessage.trim()) return;
    sendChatMessageMutation.mutate({
      tradeId: selectedTradeForChat,
      message: chatMessage.trim(),
    });
  };

  // Filter inventory to only show banner items
  const bannerInventory = inventory.filter(item => {
    const shopItem = shopItems.find(si => si.id === item.itemId);
    return shopItem?.name.includes('Banner');
  });

  if (tradesLoading) return <div className="p-8 text-center text-gray-400">Loading trades...</div>;

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-cyan-500/30">
        <CardHeader>
          <div className="flex items-center justify-between">
            <ReturnHomeButton />
            <div className="text-center">
              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent flex items-center gap-3">
                <ArrowLeftRight className="w-8 h-8 text-cyan-400" />
                Banner Trading
              </CardTitle>
              <CardDescription className="text-gray-400 text-lg">
                Send trade invitations to other players and chat about trades
              </CardDescription>
            </div>
            
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700">
                  <Users className="w-4 h-4 mr-2" />
                  Send Trade Invitation
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-slate-900 border-slate-700">
                <DialogHeader>
                  <DialogTitle className="text-cyan-400">Send Trade Invitation</DialogTitle>
                  <DialogDescription>
                    Create a trade invitation for another player to accept or decline
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="toUser">Trade With</Label>
                    <Select value={selectedToUser} onValueChange={setSelectedToUser}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a player" />
                      </SelectTrigger>
                      <SelectContent>
                        {users.map(user => (
                          <SelectItem key={user.id} value={user.id.toString()}>
                            {user.username}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Your Banner</Label>
                      <Select value={selectedFromItem} onValueChange={setSelectedFromItem}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your banner" />
                        </SelectTrigger>
                        <SelectContent>
                          {bannerInventory.map(item => (
                            <SelectItem key={item.id} value={item.itemId.toString()}>
                              {getItemName(item.itemId)} (x{item.quantity})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        type="number"
                        min="1"
                        value={fromQuantity}
                        onChange={(e) => setFromQuantity(e.target.value)}
                        placeholder="Quantity"
                        className="mt-2"
                      />
                    </div>
                    
                    <div>
                      <Label>Their Banner</Label>
                      <Select value={selectedToItem} onValueChange={setSelectedToItem}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select their banner" />
                        </SelectTrigger>
                        <SelectContent>
                          {shopItems.filter(item => item.name.includes('Banner')).map(item => (
                            <SelectItem key={item.id} value={item.id.toString()}>
                              {item.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        type="number"
                        min="1"
                        value={toQuantity}
                        onChange={(e) => setToQuantity(e.target.value)}
                        placeholder="Quantity"
                        className="mt-2"
                      />
                    </div>
                  </div>
                  
                  <Button 
                    onClick={handleCreateTrade}
                    disabled={createTradeMutation.isPending}
                    className="w-full bg-gradient-to-r from-cyan-500 to-blue-600"
                  >
                    {createTradeMutation.isPending ? "Sending..." : "Send Trade Invitation"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        
        <CardContent>
          {tradesLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-400">Loading trades...</p>
            </div>
          ) : trades.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-500 text-lg mb-4">No trades yet</p>
              <p className="text-gray-400">Send your first trade invitation to get started!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {trades.map((trade) => (
                <Card key={trade.id} className="bg-gradient-to-r from-slate-800 to-slate-700 border-slate-600">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {getStatusIcon(trade)}
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-semibold text-white">{getUserName(trade.fromUserId)}</span>
                            <ArrowLeftRight className="w-4 h-4 text-gray-400" />
                            <span className="font-semibold text-white">{getUserName(trade.toUserId)}</span>
                          </div>
                          <div className="text-sm text-gray-400">
                            {getItemName(trade.fromItemId)} (x{trade.fromQuantity}) ↔ {getItemName(trade.toItemId)} (x{trade.toQuantity})
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            Created: {format(new Date(trade.createdAt), "MMM dd, yyyy HH:mm")}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <Badge className={getStatusColor(trade)}>
                          {trade.status}
                        </Badge>
                        
                        {/* Chat Button (available for all trades) */}
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedTradeForChat(trade.id)}
                              className="border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/20"
                            >
                              <MessageCircle className="w-4 h-4 mr-1" />
                              Chat
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="bg-slate-900 border-slate-700 max-w-md">
                            <DialogHeader>
                              <DialogTitle className="text-cyan-400">Trade Chat</DialogTitle>
                              <DialogDescription>
                                Chat with {getUserName(trade.fromUserId === user?.id ? trade.toUserId : trade.fromUserId)} about this trade
                              </DialogDescription>
                            </DialogHeader>
                            
                            <div className="space-y-4">
                              {/* Chat Messages */}
                              <ScrollArea className="h-64 w-full rounded border border-slate-700 p-4">
                                <div className="space-y-3">
                                  {chatMessages.map((msg) => (
                                    <div
                                      key={msg.id}
                                      className={`flex ${msg.userId === user?.id ? 'justify-end' : 'justify-start'}`}
                                    >
                                      <div
                                        className={`max-w-[80%] rounded-lg p-2 ${
                                          msg.userId === user?.id
                                            ? 'bg-cyan-600 text-white'
                                            : 'bg-slate-700 text-gray-300'
                                        }`}
                                      >
                                        <div className="text-xs opacity-60 mb-1">
                                          {msg.username} • {format(new Date(msg.createdAt), "HH:mm")}
                                        </div>
                                        <div className="text-sm">{msg.message}</div>
                                      </div>
                                    </div>
                                  ))}
                                  <div ref={chatEndRef} />
                                </div>
                              </ScrollArea>
                              
                              {/* Message Input */}
                              <div className="flex gap-2">
                                <Textarea
                                  value={chatMessage}
                                  onChange={(e) => setChatMessage(e.target.value)}
                                  placeholder="Type a message..."
                                  className="bg-slate-800 border-slate-600 text-white resize-none"
                                  rows={2}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                      e.preventDefault();
                                      handleSendMessage();
                                    }
                                  }}
                                />
                                <Button
                                  onClick={handleSendMessage}
                                  disabled={!chatMessage.trim() || sendChatMessageMutation.isPending}
                                  className="bg-cyan-600 hover:bg-cyan-700"
                                >
                                  <Send className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>

                        {trade.status === "pending" && (
                          <div className="flex gap-2">
                            {!trade.fromUserAccepted && !trade.toUserAccepted ? (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => acceptTradeMutation.mutate(trade.id)}
                                  disabled={acceptTradeMutation.isPending}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  Accept
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => cancelTradeMutation.mutate(trade.id)}
                                  disabled={cancelTradeMutation.isPending}
                                  className="border-red-500/50 text-red-400 hover:bg-red-500/20"
                                >
                                  Cancel
                                </Button>
                              </>
                            ) : (
                              <div className="text-sm text-yellow-400">
                                Waiting for both parties to accept...
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}