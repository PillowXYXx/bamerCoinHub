import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Ticket, 
  MessageCircle, 
  Plus, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  User,
  Home,
  Send
} from "lucide-react";
import { format } from "date-fns";
import type { Ticket as TicketType, TicketMessage } from "@shared/schema";
import { ReturnHomeButton } from "@/components/ui/return-home-button";
import { useSoundEffects } from "@/hooks/use-sound";

export default function TicketsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { playClickSound } = useSoundEffects();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<TicketType | null>(null);
  const [newMessage, setNewMessage] = useState("");
  
  // Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [priority, setPriority] = useState("normal");

  // Fetch user's tickets
  const { data: tickets = [], isLoading } = useQuery<TicketType[]>({
    queryKey: ["/api/tickets"],
    retry: false,
  });

  // Fetch messages for selected ticket
  const { data: messages = [] } = useQuery<(TicketMessage & { username: string })[]>({
    queryKey: ["/api/tickets", selectedTicket?.id, "messages"],
    enabled: !!selectedTicket?.id,
    retry: false,
  });

  // Create ticket mutation
  const createTicketMutation = useMutation({
    mutationFn: async (ticketData: { title: string; description: string; category: string; priority: string }) => {
      const res = await apiRequest("POST", "/api/tickets", ticketData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tickets"] });
      setShowCreateModal(false);
      setTitle("");
      setDescription("");
      setCategory("");
      setPriority("normal");
      toast({
        title: "Ticket Created",
        description: "Your support ticket has been submitted successfully.",
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

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({ ticketId, message }: { ticketId: number; message: string }) => {
      const res = await apiRequest("POST", `/api/tickets/${ticketId}/messages`, { message });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tickets", selectedTicket?.id, "messages"] });
      setNewMessage("");
      toast({
        title: "Message Sent",
        description: "Your message has been added to the ticket.",
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

  // Delete ticket mutation
  const deleteTicketMutation = useMutation({
    mutationFn: async (ticketId: number) => {
      const res = await apiRequest("DELETE", `/api/tickets/${ticketId}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tickets"] });
      setSelectedTicket(null);
      toast({
        title: "Ticket Deleted",
        description: "The ticket has been successfully deleted.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: "Failed to delete ticket. Please try again.",
        variant: "destructive",
      });
    },
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "open":
        return <Clock className="w-4 h-4 text-blue-500" />;
      case "in_progress":
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case "resolved":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "closed":
        return <XCircle className="w-4 h-4 text-gray-500" />;
      default:
        return <Clock className="w-4 h-4 text-blue-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-blue-500/20 text-blue-400 border-blue-500/50";
      case "in_progress":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/50";
      case "resolved":
        return "bg-green-500/20 text-green-400 border-green-500/50";
      case "closed":
        return "bg-gray-500/20 text-gray-400 border-gray-500/50";
      default:
        return "bg-blue-500/20 text-blue-400 border-blue-500/50";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "low":
        return "bg-green-500/20 text-green-400";
      case "normal":
        return "bg-blue-500/20 text-blue-400";
      case "high":
        return "bg-orange-500/20 text-orange-400";
      case "urgent":
        return "bg-red-500/20 text-red-400";
      default:
        return "bg-blue-500/20 text-blue-400";
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <Ticket className="w-16 h-16 text-cyan-400 mx-auto mb-4" />
          <p className="text-gray-400">Loading tickets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden futuristic-bg">
      <div className="container mx-auto p-6 max-w-6xl">
        {/* Header */}
        <Card className="glass-effect border-none bg-black/40 mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.href = '/'}
                className="bg-cyan-500/20 text-cyan-400 border-cyan-500 hover:bg-cyan-500 hover:text-white transition-colors"
              >
                <Home className="w-4 h-4 mr-2" />
                Return to Menu
              </Button>
              
              <div className="flex items-center space-x-3">
                <Ticket className="w-8 h-8 text-cyan-400" />
                <div>
                  <CardTitle className="text-3xl font-bold neon-blue-text">Support Center</CardTitle>
                  <CardDescription className="text-gray-400">Get help and submit feedback</CardDescription>
                </div>
              </div>
              
              <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
                <DialogTrigger asChild>
                  <Button className="bg-cyan-500 hover:bg-cyan-600 text-white">
                    <Plus className="w-4 h-4 mr-2" />
                    New Ticket
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md bg-gray-900 border-gray-700">
                  <DialogHeader>
                    <DialogTitle className="text-white">Create Support Ticket</DialogTitle>
                    <DialogDescription className="text-gray-400">
                      Describe your issue or feedback in detail.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="title" className="text-white">Title</Label>
                      <Input
                        id="title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Brief description of your issue"
                        className="bg-black/40 border-gray-600 text-white"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="category" className="text-white">Category</Label>
                      <Select value={category} onValueChange={setCategory}>
                        <SelectTrigger className="bg-black/40 border-gray-600 text-white">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 border-gray-600">
                          <SelectItem value="bug">Bug Report</SelectItem>
                          <SelectItem value="feature">Feature Request</SelectItem>
                          <SelectItem value="support">General Support</SelectItem>
                          <SelectItem value="account">Account Issues</SelectItem>
                          <SelectItem value="payment">Payment/Coins</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="priority" className="text-white">Priority</Label>
                      <Select value={priority} onValueChange={setPriority}>
                        <SelectTrigger className="bg-black/40 border-gray-600 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 border-gray-600">
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="normal">Normal</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="urgent">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="description" className="text-white">Description</Label>
                      <Textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Provide detailed information about your issue..."
                        rows={4}
                        className="bg-black/40 border-gray-600 text-white"
                      />
                    </div>
                    
                    <Button
                      onClick={() => createTicketMutation.mutate({ title, description, category, priority })}
                      disabled={!title || !description || !category || createTicketMutation.isPending}
                      className="w-full bg-cyan-500 hover:bg-cyan-600"
                    >
                      {createTicketMutation.isPending ? "Creating..." : "Create Ticket"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
        </Card>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Tickets List */}
          <div className="lg:col-span-2">
            <Card className="glass-effect border-none bg-black/40">
              <CardHeader>
                <CardTitle className="text-cyan-400 flex items-center space-x-2">
                  <MessageCircle className="w-5 h-5" />
                  <span>Your Tickets</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  {tickets.length === 0 ? (
                    <div className="text-center py-8">
                      <Ticket className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                      <p className="text-gray-400">No tickets yet. Create your first support ticket!</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {tickets.map((ticket) => (
                        <Card
                          key={ticket.id}
                          className={`cursor-pointer transition-colors border-gray-700 bg-gray-800/50 hover:bg-gray-700/50 ${
                            selectedTicket?.id === ticket.id ? 'ring-2 ring-cyan-500' : ''
                          }`}
                          onClick={() => setSelectedTicket(ticket)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-2">
                              <h3 className="font-semibold text-white truncate flex-1 mr-2">
                                {ticket.title}
                              </h3>
                              <div className="flex items-center space-x-2">
                                <Badge className={getPriorityColor(ticket.priority)}>
                                  {ticket.priority}
                                </Badge>
                                <Badge className={getStatusColor(ticket.status)}>
                                  {getStatusIcon(ticket.status)}
                                  <span className="ml-1">{ticket.status}</span>
                                </Badge>
                              </div>
                            </div>
                            <p className="text-gray-400 text-sm mb-2 line-clamp-2">
                              {ticket.description}
                            </p>
                            <div className="flex items-center justify-between text-xs text-gray-500">
                              <span className="bg-purple-500/20 text-purple-400 px-2 py-1 rounded">
                                {ticket.category}
                              </span>
                              <span>{format(new Date(ticket.createdAt), 'MMM dd, yyyy')}</span>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Ticket Messages */}
          <div>
            {selectedTicket ? (
              <Card className="glass-effect border-none bg-black/40">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-cyan-400 flex items-center space-x-2">
                        <MessageCircle className="w-5 h-5" />
                        <span>Messages</span>
                      </CardTitle>
                      <div className="flex items-center space-x-2 mt-2">
                        <Badge className={getStatusColor(selectedTicket.status)}>
                          {getStatusIcon(selectedTicket.status)}
                          <span className="ml-1">{selectedTicket.status}</span>
                        </Badge>
                        <Badge className={getPriorityColor(selectedTicket.priority)}>
                          {selectedTicket.priority}
                        </Badge>
                      </div>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        playClickSound();
                        if (window.confirm("Are you sure you want to delete this ticket? This action cannot be undone.")) {
                          deleteTicketMutation.mutate(selectedTicket.id);
                        }
                      }}
                      disabled={deleteTicketMutation.isPending}
                      className="bg-red-500 hover:bg-red-600"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-64 mb-4">
                    <div className="space-y-3">
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={`p-3 rounded-lg ${
                            message.isStaff
                              ? 'bg-blue-500/20 border-l-4 border-blue-500'
                              : 'bg-gray-700/50'
                          }`}
                        >
                          <div className="flex items-center space-x-2 mb-1">
                            <User className="w-4 h-4" />
                            <span className="font-semibold text-sm text-cyan-400">
                              {message.username} {message.isStaff && '(Staff)'}
                            </span>
                            <span className="text-xs text-gray-500">
                              {format(new Date(message.createdAt), 'MMM dd, HH:mm')}
                            </span>
                          </div>
                          <p className="text-gray-300 text-sm">{message.message}</p>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                  
                  {selectedTicket.status !== 'closed' && (
                    <div className="space-y-2">
                      <Textarea
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type your message..."
                        rows={3}
                        className="bg-black/40 border-gray-600 text-white"
                      />
                      <Button
                        onClick={() => sendMessageMutation.mutate({ 
                          ticketId: selectedTicket.id, 
                          message: newMessage 
                        })}
                        disabled={!newMessage.trim() || sendMessageMutation.isPending}
                        className="w-full bg-cyan-500 hover:bg-cyan-600"
                        size="sm"
                      >
                        <Send className="w-4 h-4 mr-2" />
                        {sendMessageMutation.isPending ? "Sending..." : "Send Message"}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card className="glass-effect border-none bg-black/40">
                <CardContent className="p-8 text-center">
                  <MessageCircle className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                  <p className="text-gray-400">Select a ticket to view messages</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}