import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { useLocation, Redirect } from "wouter";
import { Loader2, Coins } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const { user, isLoading, loginMutation, registerMutation } = useAuth();
  const { toast } = useToast();
  
  const [loginData, setLoginData] = useState({ username: "", password: "" });
  const [registerData, setRegisterData] = useState({ username: "", password: "", confirmPassword: "" });

  // Redirect if already logged in
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-yellow-400" />
      </div>
    );
  }

  if (user) {
    return <Redirect to="/" />;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await loginMutation.mutateAsync(loginData);
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!registerData.username.trim()) {
      toast({
        title: "Validation Error",
        description: "Username is required",
        variant: "destructive",
      });
      return;
    }
    
    if (!registerData.password.trim()) {
      toast({
        title: "Validation Error", 
        description: "Password is required",
        variant: "destructive",
      });
      return;
    }
    
    if (registerData.password !== registerData.confirmPassword) {
      toast({
        title: "Validation Error",
        description: "Passwords don't match!",
        variant: "destructive",
      });
      return;
    }
    
    try {
      await registerMutation.mutateAsync({
        username: registerData.username.trim(),
        password: registerData.password,
      });
    } catch (error) {
      console.error("Registration failed:", error);
    }
  };

  return (
    <div className="min-h-screen bg-black relative overflow-hidden futuristic-bg flex items-center justify-center p-4 page-transition">
      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 gap-8 relative z-10">
        {/* Auth Form */}
        <Card className="glass-effect rounded-2xl border-none bg-transparent neon-border">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold">
              <span className="neon-blue-text">Welcome to</span> <span className="neon-blue-text">PillowGaming</span>
            </CardTitle>
            <CardDescription className="text-gray-300">
              Join the ultimate gaming experience
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 glass-effect">
                <TabsTrigger value="login" className="text-white data-[state=active]:neon-blue-text data-[state=active]:bg-black/50">
                  Login
                </TabsTrigger>
                <TabsTrigger value="register" className="text-white data-[state=active]:neon-purple-text data-[state=active]:bg-black/50">
                  Sign Up
                </TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="space-y-4">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-username" className="neon-blue-text">Username</Label>
                    <Input
                      id="login-username"
                      type="text"
                      placeholder="Enter your username"
                      value={loginData.username}
                      onChange={(e) => setLoginData({...loginData, username: e.target.value})}
                      className="glass-effect text-white placeholder-gray-400 neon-border"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password" className="neon-blue-text">Password</Label>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="Enter your password"
                      value={loginData.password}
                      onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                      className="glass-effect text-white placeholder-gray-400 neon-border"
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full glass-effect neon-border-purple text-white font-bold hover:bg-purple-500/20"
                    disabled={loginMutation.isPending}
                  >
                    {loginMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Signing In...
                      </>
                    ) : (
                      "Sign In"
                    )}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="register" className="space-y-4">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="register-username" className="neon-purple-text">Username</Label>
                    <Input
                      id="register-username"
                      type="text"
                      placeholder="Choose a unique username"
                      value={registerData.username}
                      onChange={(e) => setRegisterData({...registerData, username: e.target.value})}
                      className="glass-effect text-white placeholder-gray-400 neon-border"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-password" className="neon-purple-text">Password</Label>
                    <Input
                      id="register-password"
                      type="password"
                      placeholder="Create a password"
                      value={registerData.password}
                      onChange={(e) => setRegisterData({...registerData, password: e.target.value})}
                      className="glass-effect text-white placeholder-gray-400 neon-border"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password" className="text-yellow-400">Confirm Password</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      placeholder="Confirm your password"
                      value={registerData.confirmPassword}
                      onChange={(e) => setRegisterData({...registerData, confirmPassword: e.target.value})}
                      className="bg-blue-900/30 border-yellow-400/30 text-white placeholder-gray-400"
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-green-400 to-green-500 hover:from-green-500 hover:to-green-600 text-black font-bold"
                    disabled={registerMutation.isPending}
                  >
                    {registerMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating Account...
                      </>
                    ) : (
                      <>
                        <Coins className="mr-2 h-4 w-4" />
                        Sign Up & Get 10 P COINS FREE!
                      </>
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Hero Section */}
        <div className="flex flex-col justify-center space-y-6 text-center lg:text-left">
          <div className="space-y-4">
            <h1 className="text-4xl lg:text-5xl font-bold neon-dark-blue-text break-words">
              PillowGaming
            </h1>
            <p className="text-xl text-gray-300">
              Experience the thrill of casino gaming with our exciting <span className="neon-gold-text">P COIN</span> system
            </p>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-center lg:justify-start space-x-2">
              <Coins className="h-6 w-6 text-yellow-400" />
              <span className="text-lg neon-gold-text font-semibold">10 P COINS Welcome Bonus</span>
            </div>
            <div className="text-gray-400">
              <p>• Play exciting casino games</p>
              <p>• Earn <span className="neon-gold-text">P COINS</span> through gameplay</p>
              <p>• Track your progress and achievements</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}