import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, TrendingDown, BarChart3, RotateCcw, DollarSign, ArrowLeft, Activity } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useState } from "react";

export default function StockChart() {
  const { user, isLoading: userLoading } = useAuth();
  const { toast } = useToast();
  const [timeRange, setTimeRange] = useState(24);

  // Fetch price history
  const { data: priceHistory, isLoading: priceLoading } = useQuery({
    queryKey: ["/api/price-history", timeRange],
    queryFn: () => fetch(`/api/price-history?hours=${timeRange}`).then(res => res.json()),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch latest price
  const { data: latestPrice } = useQuery({
    queryKey: ["/api/latest-price"],
    queryFn: () => fetch("/api/latest-price").then(res => res.json()),
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  // Simulate price mutation (owner only)
  const simulatePriceMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/simulate-price");
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/price-history"] });
      queryClient.invalidateQueries({ queryKey: ["/api/latest-price"] });
      toast({
        title: "Price Simulated",
        description: "New price point added to the chart",
        variant: "default",
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

  // Format data for the chart
  const chartData = priceHistory?.map((point: any) => ({
    time: new Date(point.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    price: parseFloat(point.price),
    volume: parseFloat(point.volume),
    change: parseFloat(point.changePercent),
    timestamp: point.timestamp,
  })) || [];

  // Calculate price statistics
  const currentPrice = latestPrice ? parseFloat(latestPrice.price) : 0;
  const priceChange = latestPrice ? parseFloat(latestPrice.changePercent) : 0;
  const volume = latestPrice ? parseFloat(latestPrice.volume) : 0;
  
  const minPrice = Math.min(...chartData.map(d => d.price));
  const maxPrice = Math.max(...chartData.map(d => d.price));
  const avgPrice = chartData.length > 0 ? chartData.reduce((sum, d) => sum + d.price, 0) / chartData.length : 0;

  if (userLoading || priceLoading) {
    return (
      <div className="min-h-screen bg-black relative overflow-hidden futuristic-bg page-transition">
        <div className="container mx-auto px-4 py-8 relative z-10">
          <div className="animate-pulse space-y-6">
            <div className="h-16 bg-gray-700 rounded-lg"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-700 rounded-lg"></div>
              ))}
            </div>
            <div className="h-96 bg-gray-700 rounded-lg"></div>
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
            <div className="flex items-center space-x-4">
              <BarChart3 className="w-8 h-8 text-cyan-400" />
              <div>
                <h1 className="text-3xl font-bold neon-blue-text">P COIN Stock Chart</h1>
                <p className="text-gray-400">Real-time price tracking and market analysis</p>
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
              {user?.role === 'owner' && (
                <Button
                  onClick={() => simulatePriceMutation.mutate()}
                  disabled={simulatePriceMutation.isPending}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                >
                  <Activity className="w-4 h-4 mr-2" />
                  {simulatePriceMutation.isPending ? "Simulating..." : "Simulate Price"}
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 relative z-10 space-y-6">
        {/* Price Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="glass-effect border-none bg-transparent">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <DollarSign className="w-5 h-5 text-green-400" />
                <div>
                  <p className="text-xs text-gray-400">Current Price</p>
                  <p className="text-lg font-bold text-green-400">${currentPrice.toFixed(4)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-effect border-none bg-transparent">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                {priceChange >= 0 ? (
                  <TrendingUp className="w-5 h-5 text-green-400" />
                ) : (
                  <TrendingDown className="w-5 h-5 text-red-400" />
                )}
                <div>
                  <p className="text-xs text-gray-400">24h Change</p>
                  <p className={`text-lg font-bold ${priceChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-effect border-none bg-transparent">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <BarChart3 className="w-5 h-5 text-blue-400" />
                <div>
                  <p className="text-xs text-gray-400">Volume</p>
                  <p className="text-lg font-bold text-blue-400">{volume.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-effect border-none bg-transparent">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Activity className="w-5 h-5 text-purple-400" />
                <div>
                  <p className="text-xs text-gray-400">24h Range</p>
                  <p className="text-lg font-bold text-purple-400">
                    ${minPrice.toFixed(4)} - ${maxPrice.toFixed(4)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Time Range Selector */}
        <div className="flex items-center space-x-2">
          <span className="text-gray-400">Time Range:</span>
          {[1, 6, 24, 168].map((hours) => (
            <Button
              key={hours}
              variant={timeRange === hours ? "default" : "outline"}
              size="sm"
              onClick={() => setTimeRange(hours)}
              className={timeRange === hours 
                ? "bg-cyan-500 text-white" 
                : "bg-transparent text-cyan-400 border-cyan-500 hover:bg-cyan-500 hover:text-white"
              }
            >
              {hours === 1 ? '1H' : hours === 6 ? '6H' : hours === 24 ? '24H' : '7D'}
            </Button>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              queryClient.invalidateQueries({ queryKey: ["/api/price-history"] });
              queryClient.invalidateQueries({ queryKey: ["/api/latest-price"] });
            }}
            className="bg-transparent text-gray-400 border-gray-500 hover:bg-gray-500 hover:text-white"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>

        {/* Price Chart */}
        <Card className="glass-effect border-none bg-transparent">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-cyan-400">
              <BarChart3 className="w-5 h-5" />
              <span>P COIN Price Chart</span>
              <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500">
                Live
              </Badge>
            </CardTitle>
            <CardDescription className="text-gray-300">
              Real-time price movements and market trends
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-96">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis 
                      dataKey="time" 
                      stroke="#9CA3AF"
                      fontSize={12}
                    />
                    <YAxis 
                      stroke="#9CA3AF"
                      fontSize={12}
                      domain={['dataMin - 0.01', 'dataMax + 0.01']}
                      tickFormatter={(value) => `$${value.toFixed(4)}`}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: '#1F2937',
                        border: '1px solid #374151',
                        borderRadius: '8px',
                        color: '#F3F4F6'
                      }}
                      formatter={(value: any, name: string) => [
                        name === 'price' ? `$${value.toFixed(4)}` : value.toLocaleString(),
                        name === 'price' ? 'Price' : 'Volume'
                      ]}
                      labelFormatter={(label) => `Time: ${label}`}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="price" 
                      stroke="#06B6D4" 
                      strokeWidth={2}
                      dot={{ fill: '#06B6D4', strokeWidth: 2, r: 3 }}
                      activeDot={{ r: 5, stroke: '#06B6D4', strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center text-gray-400">
                    <BarChart3 className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>No price data available</p>
                    <p className="text-sm">Price history will appear here once trading begins</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Market Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="glass-effect border-none bg-transparent">
            <CardContent className="p-4">
              <h3 className="text-lg font-semibold text-cyan-400 mb-2">Market Cap</h3>
              <p className="text-2xl font-bold text-white">
                ${(currentPrice * 1000000).toLocaleString()}
              </p>
              <p className="text-xs text-gray-400">Based on 1M total supply</p>
            </CardContent>
          </Card>

          <Card className="glass-effect border-none bg-transparent">
            <CardContent className="p-4">
              <h3 className="text-lg font-semibold text-cyan-400 mb-2">Average Price</h3>
              <p className="text-2xl font-bold text-white">
                ${avgPrice.toFixed(4)}
              </p>
              <p className="text-xs text-gray-400">Last {timeRange} hours</p>
            </CardContent>
          </Card>

          <Card className="glass-effect border-none bg-transparent">
            <CardContent className="p-4">
              <h3 className="text-lg font-semibold text-cyan-400 mb-2">Volatility</h3>
              <p className="text-2xl font-bold text-white">
                {chartData.length > 0 ? 
                  (((maxPrice - minPrice) / avgPrice) * 100).toFixed(2) + '%' : 
                  '0.00%'
                }
              </p>
              <p className="text-xs text-gray-400">Price range variation</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}