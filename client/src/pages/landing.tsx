import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CoinDisplay } from "@/components/ui/coin-display";
import { MetallicButton } from "@/components/ui/metallic-button";
import { Dice1, Spade, Gem, Star, Gamepad2, Trophy } from "lucide-react";

export default function Landing() {
  const [isSigningUp, setIsSigningUp] = useState(false);

  const handleSignUp = () => {
    setIsSigningUp(true);
    setTimeout(() => {
      window.location.href = "/auth";
    }, 500);
  };

  const handleSignIn = () => {
    window.location.href = "/auth";
  };

  return (
    <div className="min-h-screen bg-black relative overflow-hidden futuristic-bg page-transition">
      {/* Header */}
      <header className="relative overflow-hidden z-10">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <CoinDisplay value="P" size="lg" />
              <h1 className="text-3xl font-bold">
                <span className="neon-dark-blue-text">PillowGaming</span>
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="glass-effect rounded-lg px-4 py-2 flex items-center space-x-2">
                <CoinDisplay value="0" size="sm" />
                <span className="font-semibold neon-gold-text">P COIN</span>
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary to-casino-green flex items-center justify-center">
                <Gamepad2 className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="text-center mb-12">
          <h2 className="text-5xl font-bold mb-4 neon-blue-text">
            Welcome to the Ultimate Gaming Experience
          </h2>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Join thousands of players and start your journey with{" "}
            <span className="neon-gold-text font-bold">10 FREE P COINS</span> upon registration!
          </p>
        </div>

        {/* Authentication Section */}
        <div className="max-w-md mx-auto mb-16">
          <Card className="glass-effect rounded-2xl shadow-2xl border-none bg-transparent">
            <CardContent className="p-8">
              <div className="text-center mb-6">
                <CoinDisplay value="P" size="xl" className="mx-auto mb-4" />
                <h3 className="text-2xl font-bold mb-2">Get Started</h3>
                <p className="text-gray-400">Sign up now and receive your welcome bonus!</p>
              </div>
              
              <div className="space-y-4">
                <MetallicButton
                  variant="green"
                  size="lg"
                  onClick={handleSignUp}
                  disabled={isSigningUp}
                  className="w-full"
                >
                  <div className="flex items-center justify-center space-x-2">
                    <span>{isSigningUp ? "Creating Account..." : "Sign Up & Get"}</span>
                    {!isSigningUp && <CoinDisplay value="10" size="sm" />}
                    {!isSigningUp && <span className="neon-gold-text">P COINS FREE!</span>}
                  </div>
                </MetallicButton>
                
                <MetallicButton
                  variant="blue"
                  onClick={handleSignIn}
                  className="w-full"
                >
                  Already have an account? Sign In
                </MetallicButton>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <Card className="glass-effect rounded-2xl border-none bg-transparent hover:scale-105 transition-transform duration-300">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-primary to-blue-600 rounded-full flex items-center justify-center">
                <Gamepad2 className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2">Multiple Games</h3>
              <p className="text-gray-400">Access a variety of exciting casino-style games and challenges</p>
            </CardContent>
          </Card>
          
          <Card className="glass-effect rounded-2xl border-none bg-transparent hover:scale-105 transition-transform duration-300">
            <CardContent className="p-6 text-center">
              <CoinDisplay value="P" size="lg" className="mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">P COIN Rewards</h3>
              <p className="text-gray-400">Earn P COINS through gameplay and daily bonuses</p>
            </CardContent>
          </Card>
          
          <Card className="glass-effect rounded-2xl border-none bg-transparent hover:scale-105 transition-transform duration-300">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-casino-green to-green-600 rounded-full flex items-center justify-center">
                <Trophy className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2">Leaderboards</h3>
              <p className="text-gray-400">Compete with players worldwide and climb the rankings</p>
            </CardContent>
          </Card>
        </div>

        {/* Games Coming Soon Section */}
        <Card className="glass-effect rounded-2xl border-none bg-transparent">
          <CardContent className="p-8">
            <h3 className="text-3xl font-bold text-center mb-8 bg-gradient-to-r from-primary to-casino-green bg-clip-text text-transparent">
              Games Coming Soon
            </h3>
            
            <div className="grid md:grid-cols-4 gap-6">
              <div className="bg-gray-800 rounded-xl p-4 text-center hover:bg-gray-700 transition-colors">
                <div className="w-full h-32 bg-gradient-to-br from-primary to-blue-800 rounded-lg mb-3 flex items-center justify-center">
                  <Dice1 className="w-12 h-12 text-white" />
                </div>
                <h4 className="font-semibold mb-1">Casino Dice</h4>
                <p className="text-sm text-gray-400">Roll and win</p>
              </div>
              
              <div className="bg-gray-800 rounded-xl p-4 text-center hover:bg-gray-700 transition-colors">
                <div className="w-full h-32 bg-gradient-to-br from-casino-green to-green-800 rounded-lg mb-3 flex items-center justify-center">
                  <Spade className="w-12 h-12 text-white" />
                </div>
                <h4 className="font-semibold mb-1">Card Master</h4>
                <p className="text-sm text-gray-400">Strategy game</p>
              </div>
              
              <div className="bg-gray-800 rounded-xl p-4 text-center hover:bg-gray-700 transition-colors">
                <div className="w-full h-32 bg-gradient-to-br from-casino-gold to-yellow-800 rounded-lg mb-3 flex items-center justify-center">
                  <Gem className="w-12 h-12 text-white" />
                </div>
                <h4 className="font-semibold mb-1">Gem Hunt</h4>
                <p className="text-sm text-gray-400">Treasure finder</p>
              </div>
              
              <div className="bg-gray-800 rounded-xl p-4 text-center hover:bg-gray-700 transition-colors">
                <div className="w-full h-32 bg-gradient-to-br from-purple-600 to-purple-800 rounded-lg mb-3 flex items-center justify-center">
                  <Star className="w-12 h-12 text-white" />
                </div>
                <h4 className="font-semibold mb-1">Lucky Stars</h4>
                <p className="text-sm text-gray-400">Cosmic adventure</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <CoinDisplay value="P" size="sm" />
              <span className="text-lg font-semibold">PillowGaming</span>
            </div>
            <p className="text-gray-400 text-sm mb-4">The ultimate destination for casino-style gaming</p>
            <div className="flex justify-center space-x-6 text-sm text-gray-500">
              <a href="#" className="hover:text-primary transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-primary transition-colors">Support</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
