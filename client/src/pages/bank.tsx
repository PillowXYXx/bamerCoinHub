import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Building2, 
  PiggyBank, 
  TrendingUp, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  Coins,
  Shield,
  Star,
  ChevronRight,
  Home
} from "lucide-react";
import { format } from "date-fns";

interface BankAccount {
  id: number;
  userId: number;
  balance: string;
  interestRate: string;
  lastInterestCalculation: string;
  createdAt: string;
}

interface BankTransaction {
  id: number;
  userId: number;
  type: string;
  amount: string;
  description: string;
  createdAt: string;
}

// NAPASSIST Bank Logo Component
const NapassistLogo = ({ size = "w-8 h-8" }: { size?: string }) => (
  <div className={`${size} relative`}>
    <svg viewBox="0 0 100 100" className="w-full h-full">
      {/* Main circle with gradient */}
      <defs>
        <linearGradient id="bankGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1e40af" />
          <stop offset="50%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#60a5fa" />
        </linearGradient>
        <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="50%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#d97706" />
        </linearGradient>
      </defs>
      
      {/* Outer ring */}
      <circle cx="50" cy="50" r="48" fill="url(#bankGradient)" stroke="#1e40af" strokeWidth="2"/>
      
      {/* Inner building symbol */}
      <rect x="30" y="35" width="40" height="30" fill="url(#goldGradient)" rx="2"/>
      <rect x="35" y="40" width="6" height="20" fill="white"/>
      <rect x="45" y="40" width="6" height="20" fill="white"/>
      <rect x="55" y="40" width="6" height="20" fill="white"/>
      
      {/* Top triangle (roof) */}
      <polygon points="25,35 50,20 75,35" fill="url(#goldGradient)"/>
      
      {/* N A P text */}
      <text x="50" y="80" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">NAP</text>
    </svg>
  </div>
);

export default function Bank() {
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ["/api/user"],
  });

  const { data: account, isLoading: accountLoading } = useQuery<BankAccount>({
    queryKey: ["/api/bank/account"],
  });

  const { data: transactions = [], isLoading: transactionsLoading } = useQuery<BankTransaction[]>({
    queryKey: ["/api/bank/transactions"],
  });

  const depositMutation = useMutation({
    mutationFn: async (amount: string) => {
      const res = await apiRequest("POST", "/api/bank/deposit", { amount });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bank/account"] });
      queryClient.invalidateQueries({ queryKey: ["/api/bank/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      setDepositAmount("");
      setShowDepositModal(false);
      toast({
        title: "Deposit Successful",
        description: "Your P COINS have been deposited to NAPASSIST Bank",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Deposit Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const withdrawMutation = useMutation({
    mutationFn: async (amount: string) => {
      const res = await apiRequest("POST", "/api/bank/withdraw", { amount });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bank/account"] });
      queryClient.invalidateQueries({ queryKey: ["/api/bank/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      setWithdrawAmount("");
      setShowWithdrawModal(false);
      toast({
        title: "Withdrawal Successful",
        description: "Your P COINS have been withdrawn from NAPASSIST Bank",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Withdrawal Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "deposit":
        return <ArrowUpCircle className="w-4 h-4 text-green-500" />;
      case "withdrawal":
        return <ArrowDownCircle className="w-4 h-4 text-red-500" />;
      case "interest":
        return <TrendingUp className="w-4 h-4 text-blue-500" />;
      default:
        return <Coins className="w-4 h-4 text-gray-500" />;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case "deposit":
        return "text-green-400";
      case "withdrawal":
        return "text-red-400";
      case "interest":
        return "text-blue-400";
      default:
        return "text-gray-400";
    }
  };

  if (accountLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <NapassistLogo size="w-16 h-16" />
          <p className="text-gray-400 mt-4">Loading NAPASSIST Bank...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {/* Header */}
      <Card className="bg-gradient-to-br from-blue-900/50 to-blue-800/50 border-blue-500/30 mb-6">
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
            
            <div className="flex items-center gap-4">
              <NapassistLogo size="w-12 h-12" />
              <div>
                <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                  NAPASSIST BANK
                </CardTitle>
                <CardDescription className="text-blue-200/80 text-lg">
                  Your trusted P COIN banking partner
                </CardDescription>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Shield className="w-6 h-6 text-blue-400" />
              <span className="text-blue-200 font-semibold">FDIC Insured</span>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Account Summary */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-blue-500/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-400">
                <PiggyBank className="w-6 h-6" />
                Account Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Current Balance */}
                <div className="p-6 bg-gradient-to-r from-blue-600/20 to-cyan-600/20 rounded-lg border border-blue-500/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-blue-200">Bank Balance</span>
                    <Building2 className="w-5 h-5 text-blue-400" />
                  </div>
                  <div className="text-3xl font-bold text-white">
                    {account ? parseFloat(account.balance).toFixed(0) : "0"} P COINS
                  </div>
                  <div className="text-sm text-blue-300 mt-1">
                    Earning {account ? (parseFloat(account.interestRate) * 100).toFixed(2) : "5.00"}% APY
                  </div>
                </div>

                {/* Wallet Balance */}
                <div className="p-6 bg-gradient-to-r from-yellow-600/20 to-orange-600/20 rounded-lg border border-yellow-500/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-yellow-200">Wallet Balance</span>
                    <Coins className="w-5 h-5 text-yellow-400" />
                  </div>
                  <div className="text-3xl font-bold text-white">
                    {user ? parseFloat(user.pCoinBalance).toFixed(0) : "0"} P COINS
                  </div>
                  <div className="text-sm text-yellow-300 mt-1">
                    Available for deposit
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-4">
                <Dialog open={showDepositModal} onOpenChange={setShowDepositModal}>
                  <DialogTrigger asChild>
                    <Button className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700">
                      <ArrowUpCircle className="w-4 h-4 mr-2" />
                      Deposit
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-slate-900 border-slate-700">
                    <DialogHeader>
                      <DialogTitle className="text-green-400">Deposit P COINS</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="depositAmount">Amount to Deposit</Label>
                        <Input
                          id="depositAmount"
                          type="number"
                          value={depositAmount}
                          onChange={(e) => setDepositAmount(e.target.value)}
                          placeholder="Enter amount"
                          className="bg-slate-800 border-slate-600 text-white"
                        />
                        <div className="text-sm text-gray-400 mt-1">
                          Available: {user ? parseFloat(user.pCoinBalance).toFixed(0) : "0"} P COINS
                        </div>
                      </div>
                      <Button
                        onClick={() => depositMutation.mutate(depositAmount)}
                        disabled={!depositAmount || depositMutation.isPending}
                        className="w-full bg-green-600 hover:bg-green-700"
                      >
                        {depositMutation.isPending ? "Processing..." : "Deposit"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                <Dialog open={showWithdrawModal} onOpenChange={setShowWithdrawModal}>
                  <DialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      className="flex-1 border-red-500/50 text-red-400 hover:bg-red-500/20"
                      disabled={!account || parseFloat(account.balance) <= 0}
                    >
                      <ArrowDownCircle className="w-4 h-4 mr-2" />
                      Withdraw
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-slate-900 border-slate-700">
                    <DialogHeader>
                      <DialogTitle className="text-red-400">Withdraw P COINS</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="withdrawAmount">Amount to Withdraw</Label>
                        <Input
                          id="withdrawAmount"
                          type="number"
                          value={withdrawAmount}
                          onChange={(e) => setWithdrawAmount(e.target.value)}
                          placeholder="Enter amount"
                          className="bg-slate-800 border-slate-600 text-white"
                        />
                        <div className="text-sm text-gray-400 mt-1">
                          Available: {account ? parseFloat(account.balance).toFixed(0) : "0"} P COINS
                        </div>
                      </div>
                      <Button
                        onClick={() => withdrawMutation.mutate(withdrawAmount)}
                        disabled={!withdrawAmount || withdrawMutation.isPending}
                        className="w-full bg-red-600 hover:bg-red-700"
                      >
                        {withdrawMutation.isPending ? "Processing..." : "Withdraw"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>

          {/* Transaction History */}
          <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-blue-500/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-400">
                <TrendingUp className="w-6 h-6" />
                Transaction History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                {transactionsLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-gray-400">Loading transactions...</p>
                  </div>
                ) : transactions.length === 0 ? (
                  <div className="text-center py-8">
                    <Coins className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                    <p className="text-gray-500">No transactions yet</p>
                    <p className="text-gray-400 text-sm">Make your first deposit to get started</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {transactions.map((transaction) => (
                      <div
                        key={transaction.id}
                        className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg border border-slate-700"
                      >
                        <div className="flex items-center gap-3">
                          {getTransactionIcon(transaction.type)}
                          <div>
                            <div className="font-medium text-white capitalize">
                              {transaction.type}
                            </div>
                            <div className="text-sm text-gray-400">
                              {transaction.description}
                            </div>
                            <div className="text-xs text-gray-500">
                              {format(new Date(transaction.createdAt), "MMM dd, yyyy HH:mm")}
                            </div>
                          </div>
                        </div>
                        <div className={`font-bold ${getTransactionColor(transaction.type)}`}>
                          {transaction.type === "withdrawal" ? "-" : "+"}
                          {parseFloat(transaction.amount).toFixed(0)} P
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Bank Features */}
        <div className="space-y-6">
          <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-blue-500/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-400">
                <Star className="w-6 h-6" />
                Bank Features
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-blue-600/10 rounded-lg border border-blue-500/30">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-5 h-5 text-blue-400" />
                  <span className="font-semibold text-blue-200">Daily Interest</span>
                </div>
                <p className="text-sm text-gray-300">
                  Earn 5% annual interest (0.0137% daily) on your deposited P COINS
                </p>
              </div>

              <div className="p-4 bg-green-600/10 rounded-lg border border-green-500/30">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="w-5 h-5 text-green-400" />
                  <span className="font-semibold text-green-200">FDIC Insured</span>
                </div>
                <p className="text-sm text-gray-300">
                  Your deposits are protected and insured up to 250,000 P COINS
                </p>
              </div>

              <div className="p-4 bg-purple-600/10 rounded-lg border border-purple-500/30">
                <div className="flex items-center gap-2 mb-2">
                  <Building2 className="w-5 h-5 text-purple-400" />
                  <span className="font-semibold text-purple-200">Instant Transfers</span>
                </div>
                <p className="text-sm text-gray-300">
                  Instant deposits and withdrawals between your wallet and bank account
                </p>
              </div>

              {account && (
                <div className="p-4 bg-yellow-600/10 rounded-lg border border-yellow-500/30">
                  <div className="flex items-center gap-2 mb-2">
                    <Coins className="w-5 h-5 text-yellow-400" />
                    <span className="font-semibold text-yellow-200">Account Info</span>
                  </div>
                  <div className="text-sm text-gray-300 space-y-1">
                    <div>Account opened: {format(new Date(account.createdAt), "MMM dd, yyyy")}</div>
                    <div>Last interest: {format(new Date(account.lastInterestCalculation), "MMM dd, yyyy")}</div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}