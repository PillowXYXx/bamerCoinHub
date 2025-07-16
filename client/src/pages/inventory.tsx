import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Package, Star, Image } from "lucide-react";
import { ReturnHomeButton } from "@/components/ui/return-home-button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useSoundEffects } from "@/hooks/use-sound";

interface InventoryItem {
  id: number;
  userId: number;
  itemId: number;
  quantity: number;
  isActive: boolean;
  createdAt: string;
}

interface ShopItem {
  id: number;
  name: string;
  description: string;
  price: string;
  type: string;
  imageUrl: string;
  isActive: boolean;
}

export default function Inventory() {
  const { data: inventory = [], isLoading: inventoryLoading } = useQuery<InventoryItem[]>({
    queryKey: ["/api/inventory"],
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { playClickSound } = useSoundEffects();

  const { data: shopItems = [] } = useQuery<ShopItem[]>({
    queryKey: ["/api/shop/items"],
  });

  // Create a map of shop items for quick lookup
  const shopItemsMap = shopItems.reduce((acc, item) => {
    acc[item.id] = item;
    return acc;
  }, {} as Record<number, ShopItem>);

  // Get inventory items with their shop details
  const inventoryWithDetails = inventory.map(invItem => ({
    ...invItem,
    shopItem: shopItemsMap[invItem.itemId]
  })).filter(item => item.shopItem);

  // Banner usage mutation
  const useBannerMutation = useMutation({
    mutationFn: async (bannerUrl: string) => {
      const res = await apiRequest("POST", "/api/banners/set-active", { bannerUrl });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "Banner Updated",
        description: "Your active banner has been changed successfully.",
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

  if (inventoryLoading) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading inventory...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-cyan-500/30">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent flex items-center justify-center gap-3">
            <Package className="w-8 h-8 text-cyan-400" />
            My Inventory
          </CardTitle>
          <CardDescription className="text-gray-400 text-lg">
            Your collected banners and items
          </CardDescription>
        </CardHeader>
        <CardContent>
          {inventoryWithDetails.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-500 text-lg mb-4">Your inventory is empty</p>
              <p className="text-gray-400 mb-6">Visit the shop to purchase banners and other items</p>
              <Button 
                onClick={() => window.location.href = '/shop'}
                className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
              >
                Visit Shop
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {inventoryWithDetails.map((item) => (
                <Card key={item.id} className="bg-gradient-to-br from-slate-800 to-slate-700 border-slate-600 hover:border-cyan-500/50 transition-all">
                  <CardContent className="p-4">
                    <div className="aspect-video bg-slate-600 rounded-lg mb-4 overflow-hidden">
                      {item.shopItem.imageUrl ? (
                        <img 
                          src={item.shopItem.imageUrl} 
                          alt={item.shopItem.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Image className="w-12 h-12 text-gray-400" />
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-white">{item.shopItem.name}</h3>
                        <Badge variant="secondary" className="bg-cyan-500/20 text-cyan-400">
                          x{item.quantity}
                        </Badge>
                      </div>
                      
                      <p className="text-gray-400 text-sm line-clamp-2">
                        {item.shopItem.description}
                      </p>
                      
                      <div className="flex items-center justify-between pt-2">
                        <Badge variant="outline" className="text-green-400 border-green-500/50">
                          {item.shopItem.type}
                        </Badge>
                        {item.isActive && (
                          <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/50">
                            <Star className="w-3 h-3 mr-1" />
                            Active
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex gap-2 pt-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="flex-1 border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/20"
                        >
                          Trade
                        </Button>
                        {item.shopItem.type === 'banner' && (
                          <Button 
                            size="sm"
                            onClick={() => {
                              playClickSound();
                              useBannerMutation.mutate(item.shopItem.imageUrl);
                            }}
                            disabled={useBannerMutation.isPending || item.isActive}
                            className="flex-1 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700"
                          >
                            {item.isActive ? "Active" : "Set Active"}
                          </Button>
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