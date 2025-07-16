import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { LoadingSpinner } from "@/components/loading-spinner";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Home from "@/pages/home";
import AuthPage from "@/pages/auth-page";
import AdminPanel from "@/pages/admin";
import OwnerPanel from "@/pages/owner";
import TradingPage from "@/pages/trading";
import StockChart from "@/pages/stock-chart";
import ChatPage from "@/pages/chat";
import GamesPage from "@/pages/games";
import BannedPage from "@/pages/banned";
import ShopPage from "@/pages/shop";
import Profile from "./pages/profile";
import LeaderboardPage from "@/pages/leaderboard";
import InventoryPage from "@/pages/inventory";
import BannerTradingPage from "@/pages/banner-trading";
import Bank from "./pages/bank";
import TicketsPage from "./pages/tickets";

function Router() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner message="Loading your account..." />;
  }

  return (
    <div className="min-h-screen bg-black transition-all duration-300 ease-in-out">
      <Switch>
        {!user ? (
          <>
            <Route path="/" component={Landing} />
            <Route path="/auth" component={AuthPage} />
          </>
        ) : (
        <>
          <Route path="/" component={Home} />
          <Route path="/auth" component={AuthPage} />
          <Route path="/banned">
            {() => {
              const params = new URLSearchParams(window.location.search);
              const reason = params.get('reason') || "No reason provided";
              return <BannedPage reason={reason} />;
            }}
          </Route>
          <Route path="/admin">
            {(user.role === 'admin' || user.role === 'owner') ? (
              <AdminPanel />
            ) : (
              <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="text-center">
                  <h1 className="text-2xl font-bold text-red-400 mb-4">Access Denied</h1>
                  <p className="text-gray-400 mb-4">You need admin privileges to access this page.</p>
                  <a href="/" className="text-cyan-400 hover:text-cyan-300">Return to Home</a>
                </div>
              </div>
            )}
          </Route>
          <Route path="/trading" component={TradingPage} />
          <Route path="/stock-chart" component={StockChart} />
          <Route path="/games" component={GamesPage} />
          <Route path="/shop" component={ShopPage} />
          <Route path="/profile" component={Profile} />
          <Route path="/chat" component={ChatPage} />
          <Route path="/leaderboard" component={LeaderboardPage} />
          <Route path="/inventory" component={InventoryPage} />
          <Route path="/banner-trading" component={BannerTradingPage} />
          <Route path="/bank" component={Bank} />
          <Route path="/tickets" component={TicketsPage} />
          <Route path="/owner">
            {user.role === 'owner' ? (
              <OwnerPanel />
            ) : (
              <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="text-center">
                  <h1 className="text-2xl font-bold text-red-400 mb-4">Access Denied</h1>
                  <p className="text-gray-400 mb-4">You need owner privileges to access this page.</p>
                  <a href="/" className="text-cyan-400 hover:text-cyan-300">Return to Home</a>
                </div>
              </div>
            )}
          </Route>
        </>
        )}
        <Route component={NotFound} />
      </Switch>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Router />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
