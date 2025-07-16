import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  MessageCircle, 
  Send, 
  Crown, 
  Star,
  Home,
  Trash2
} from "lucide-react";

interface ChatMessage {
  id: number;
  message: string;
  createdAt: string;
  isVipChat: boolean;
  userId: number;
  username: string;
  role: string;
  isVip: boolean;
}

export default function ChatPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newMessage, setNewMessage] = useState("");
  const [activeTab, setActiveTab] = useState("regular");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const canAccessVipChat = user?.isVip || user?.role === 'admin' || user?.role === 'owner';

  // Fetch regular chat messages
  const { data: regularMessages, isLoading: regularLoading } = useQuery<ChatMessage[]>({
    queryKey: ["/api/chat/messages/regular"],
    refetchInterval: 2000, // Auto-refresh every 2 seconds
  });

  // Fetch VIP chat messages
  const { data: vipMessages, isLoading: vipLoading } = useQuery<ChatMessage[]>({
    queryKey: ["/api/chat/messages/vip"],
    enabled: canAccessVipChat,
    refetchInterval: 2000,
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (data: { message: string; isVipChat: boolean }) => {
      await apiRequest("POST", "/api/chat/send", data);
    },
    onSuccess: () => {
      setNewMessage("");
      queryClient.invalidateQueries({ queryKey: ["/api/chat/messages/regular"] });
      queryClient.invalidateQueries({ queryKey: ["/api/chat/messages/vip"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive",
      });
    },
  });

  // Delete message mutation (admin only)
  const deleteMessageMutation = useMutation({
    mutationFn: async (messageId: number) => {
      await apiRequest("DELETE", `/api/chat/delete/${messageId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chat/messages/regular"] });
      queryClient.invalidateQueries({ queryKey: ["/api/chat/messages/vip"] });
    },
  });

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    
    const isVipChat = activeTab === "vip";
    sendMessageMutation.mutate({ message: newMessage.trim(), isVipChat });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [regularMessages, vipMessages]);

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getRoleColor = (role: string, isVip: boolean) => {
    if (role === 'owner') return 'bg-purple-500/20 text-purple-400 border-purple-500';
    if (role === 'admin') return 'bg-red-500/20 text-red-400 border-red-500';
    if (isVip) return 'bg-yellow-500/20 text-yellow-400 border-yellow-500';
    return 'bg-gray-500/20 text-gray-400 border-gray-500';
  };

  const renderMessages = (messages: ChatMessage[] | undefined) => {
    if (!messages || messages.length === 0) {
      return (
        <div className="flex items-center justify-center h-32">
          <p className="text-gray-500">No messages yet. Start the conversation!</p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {messages.map((message) => (
          <div key={message.id} className="group">
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-white">{message.username}</span>
                  <Badge variant="outline" className={`text-xs ${getRoleColor(message.role, message.isVip)}`}>
                    {message.role === 'owner' && <Crown className="w-3 h-3 mr-1" />}
                    {message.role === 'admin' && <Star className="w-3 h-3 mr-1" />}
                    {message.isVip && message.role === 'user' && <Crown className="w-3 h-3 mr-1" />}
                    {message.role.toUpperCase()}
                    {message.isVip && message.role === 'user' && ' VIP'}
                  </Badge>
                  <span className="text-xs text-gray-500">{formatTime(message.createdAt)}</span>
                  {(user?.role === 'admin' || user?.role === 'owner') && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteMessageMutation.mutate(message.id)}
                      className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0 text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
                <p className="text-gray-300 break-words">{message.message}</p>
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
    );
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-400 mb-4">Access Denied</h1>
          <p className="text-gray-400">Please log in to access the chat.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <MessageCircle className="h-8 w-8 text-cyan-400" />
            <h1 className="text-3xl font-bold text-white">Chat Rooms</h1>
          </div>
          <Button 
            variant="outline" 
            onClick={() => window.location.href = '/'}
            className="bg-black border-cyan-500 text-cyan-400 hover:bg-cyan-500 hover:text-black"
          >
            <Home className="h-4 w-4 mr-2" />
            Return Home
          </Button>
        </div>

        {/* Chat Interface */}
        <Card className="glass-panel border-cyan-500/30">
          <CardHeader>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2 bg-black border border-gray-600">
                <TabsTrigger 
                  value="regular" 
                  className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white"
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  General Chat
                </TabsTrigger>
                <TabsTrigger 
                  value="vip" 
                  disabled={!canAccessVipChat}
                  className="data-[state=active]:bg-yellow-600 data-[state=active]:text-white disabled:opacity-50"
                >
                  <Crown className="h-4 w-4 mr-2" />
                  VIP Chat
                  {!canAccessVipChat && <span className="ml-2 text-xs">(VIP Only)</span>}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="regular" className="mt-4">
                <div className="space-y-4">
                  <div className="bg-black/50 border border-gray-600 rounded-lg p-4">
                    <ScrollArea className="h-96">
                      {regularLoading ? (
                        <div className="flex items-center justify-center h-32">
                          <p className="text-gray-500">Loading messages...</p>
                        </div>
                      ) : (
                        renderMessages(regularMessages)
                      )}
                    </ScrollArea>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="vip" className="mt-4">
                {canAccessVipChat ? (
                  <div className="space-y-4">
                    <div className="bg-black/50 border border-yellow-600 rounded-lg p-4">
                      <ScrollArea className="h-96">
                        {vipLoading ? (
                          <div className="flex items-center justify-center h-32">
                            <p className="text-gray-500">Loading VIP messages...</p>
                          </div>
                        ) : (
                          renderMessages(vipMessages)
                        )}
                      </ScrollArea>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Crown className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-yellow-400 mb-2">VIP Access Required</h3>
                    <p className="text-gray-400">Upgrade to VIP to access premium chat features!</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardHeader>

          <CardContent>
            {/* Message Input */}
            <div className="flex gap-3">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={activeTab === "vip" ? "Send a VIP message..." : "Type your message..."}
                className="flex-1 bg-black border-gray-600 text-white placeholder:text-gray-500"
                maxLength={500}
                disabled={activeTab === "vip" && !canAccessVipChat}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!newMessage.trim() || sendMessageMutation.isPending || (activeTab === "vip" && !canAccessVipChat)}
                className={`px-6 ${
                  activeTab === "vip" 
                    ? "bg-yellow-600 hover:bg-yellow-700 text-white" 
                    : "bg-cyan-600 hover:bg-cyan-700 text-white"
                }`}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
              <span>{newMessage.length}/500 characters</span>
              <span>Press Enter to send</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}