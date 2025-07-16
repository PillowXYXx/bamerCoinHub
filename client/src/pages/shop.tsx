import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CoinDisplay } from "@/components/ui/coin-display";
import { MetallicButton } from "@/components/ui/metallic-button";
import { Skeleton } from "@/components/ui/skeleton";
import { ShoppingBag, Star, Sparkles, ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import type { ShopItem, UserPurchase } from "@shared/schema";
import karinaBannerPath from "@assets/2c18f8c8a2d9fd775a2ff7bf024c4695_1752662254140.jpg";

export default function ShopPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch shop items
  const { data: shopItems, isLoading: itemsLoading } = useQuery<ShopItem[]>({
    queryKey: ["/api/shop/items"],
  });

  // Fetch user purchases
  const { data: userPurchases, isLoading: purchasesLoading } = useQuery<UserPurchase[]>({
    queryKey: ["/api/shop/purchases"],
  });

  // Purchase item mutation
  const purchaseMutation = useMutation({
    mutationFn: async (itemId: number) => {
      const res = await apiRequest("POST", "/api/shop/purchase", { itemId });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Purchase Successful!",
        description: "Item has been added to your collection",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/shop/purchases"] });
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
        title: "Purchase Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const isItemOwned = (itemId: number) => {
    return userPurchases?.some(purchase => purchase.itemId === itemId) || false;
  };

  const getItemImage = (item: ShopItem) => {
    if (item.name === "Karina Banner") {
      return karinaBannerPath;
    }
    
    // Use the image_url from the database if available
    if (item.imageUrl) {
      // If it's one of our attached assets, use the proper path
      if (item.imageUrl.includes('image_')) {
        return `attached_assets/${item.imageUrl}`;
      }
      return item.imageUrl;
    }
    
    return "";
  };

  if (itemsLoading || purchasesLoading) {
    return (
      <div className="min-h-screen bg-black relative overflow-hidden futuristic-bg">
        <div className="container mx-auto px-4 py-8 relative z-10">
          <div className="mb-8">
            <Skeleton className="h-12 w-64 mb-4" />
            <Skeleton className="h-6 w-96" />
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-80" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden futuristic-bg">
      <div className="container mx-auto px-4 py-8 relative z-10">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.href = '/'}
              className="bg-cyan-500/20 text-cyan-400 border-cyan-500 hover:bg-cyan-500 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
            <div className="p-3 rounded-xl bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/30">
              <ShoppingBag className="h-8 w-8 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                P COIN Shop
              </h1>
              <p className="text-gray-400 mt-1">
                Customize your profile with exclusive items
              </p>
            </div>
          </div>

          {/* User Balance - Mobile Optimized */}
          <div className="glass-panel p-3 sm:p-4 rounded-xl border border-cyan-500/30">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
              <span className="text-gray-300 text-sm sm:text-base">Your Balance:</span>
              <div className="flex items-center gap-1">
                <CoinDisplay value="P" size="sm" />
                <span className="text-cyan-400 font-bold text-lg">
                  {isNaN(parseFloat(user?.pCoinBalance || "0")) ? 0 : Math.floor(parseFloat(user?.pCoinBalance || "0"))}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Shop Items - Mobile Optimized Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {shopItems?.map((item) => {
            const owned = isItemOwned(item.id);
            const canAfford = parseFloat(user?.pCoinBalance || "0") >= parseFloat(item.price);

            return (
              <Card key={item.id} className="glass-panel border-cyan-500/30 hover:border-cyan-400/50 transition-all duration-300 relative overflow-hidden">
                {/* Sale Badge */}
                {parseFloat(item.price || "0") < 1000 && (
                  <div className="absolute top-2 left-2 z-10 bg-gradient-to-r from-red-500 to-orange-500 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                    <Sparkles className="h-3 w-3" />
                    SALE
                  </div>
                )}
                
                <CardHeader className="pb-2">
                  <div className="relative">
                    {/* Item Image */}
                    <div className="w-full h-40 sm:h-48 rounded-lg overflow-hidden bg-gradient-to-br from-cyan-500/10 to-blue-500/10 mb-4">
                      <img
                        src={getItemImage(item)}
                        alt={item.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const parent = target.parentElement;
                          if (parent) {
                            // Create better colored banners based on item name
                            let bannerColor = 'from-purple-600 to-blue-600';
                            if (item.name.includes('Karina')) {
                              bannerColor = 'from-pink-500 via-purple-500 to-indigo-600';
                            } else if (item.name.includes('VIP')) {
                              bannerColor = 'from-yellow-400 via-orange-500 to-red-500';
                            } else if (item.name.includes('Diamond')) {
                              bannerColor = 'from-cyan-400 via-blue-500 to-purple-600';
                            }
                            
                            parent.innerHTML = `
                              <div class="w-full h-full flex items-center justify-center bg-gradient-to-br ${bannerColor} shadow-2xl">
                                <div class="text-center">
                                  <div class="text-white font-bold text-sm sm:text-lg mb-1">${item.name}</div>
                                  <div class="text-white/80 text-xs">Premium Banner</div>
                                </div>
                              </div>
                            `;
                          }
                        }}
                      />
                      {owned && (
                        <div className="absolute top-2 right-2 bg-green-500/90 backdrop-blur-sm rounded-full p-2">
                          <Star className="h-4 w-4 text-white fill-white" />
                        </div>
                      )}
                    </div>

                    <CardTitle className="text-lg sm:text-xl text-white flex items-center gap-2 mb-2">
                      {item.name}
                      {item.name.includes("Karina") && (
                        <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-pink-400" />
                      )}
                      {item.name.includes("VIP") && (
                        <Star className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-400" />
                      )}
                    </CardTitle>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3 sm:space-y-4">
                  <p className="text-gray-400 text-xs sm:text-sm line-clamp-2">
                    {item.description}
                  </p>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-300 text-sm">Price:</span>
                      <div className="flex items-center gap-1">
                        <CoinDisplay value="P" size="sm" />
                        <span className="text-cyan-400 font-bold text-lg">{isNaN(parseFloat(item.price || "0")) ? 0 : Math.floor(parseFloat(item.price || "0"))}</span>
                      </div>
                    </div>
                    <span className="text-xs text-cyan-400 bg-cyan-500/20 px-2 py-1 rounded-full">
                      {item.type}
                    </span>
                  </div>

                  {owned ? (
                    <Button 
                      disabled 
                      className="w-full bg-green-600/50 text-green-200 border border-green-500/50"
                    >
                      <Star className="h-4 w-4 mr-2 fill-current" />
                      Owned
                    </Button>
                  ) : (
                    <MetallicButton
                      onClick={() => purchaseMutation.mutate(item.id)}
                      disabled={!canAfford || purchaseMutation.isPending}
                      className={`w-full ${!canAfford ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {purchaseMutation.isPending ? (
                        "Purchasing..."
                      ) : !canAfford ? (
                        "Insufficient P COINS"
                      ) : (
                        <>
                          <ShoppingBag className="h-4 w-4 mr-2" />
                          Purchase
                        </>
                      )}
                    </MetallicButton>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {shopItems?.length === 0 && (
          <div className="text-center py-12">
            <ShoppingBag className="h-16 w-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl text-gray-400 mb-2">No Items Available</h3>
            <p className="text-gray-500">
              Check back later for new items!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}