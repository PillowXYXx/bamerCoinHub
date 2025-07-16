import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-black relative overflow-hidden futuristic-bg flex items-center justify-center p-4 page-transition">
      <Card className="glass-effect border-none bg-transparent max-w-md w-full">
        <CardContent className="p-8 text-center">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-400" />
          <h1 className="text-3xl font-bold mb-4 neon-blue-text">404 - Page Not Found</h1>
          <p className="text-gray-300 mb-6">
            The page you're looking for doesn't exist or has been moved.
          </p>
          <Button
            onClick={() => window.location.href = '/'}
            className="bg-cyan-500/20 text-cyan-400 border-cyan-500 hover:bg-cyan-500 hover:text-white transition-colors"
          >
            <Home className="w-4 h-4 mr-2" />
            Return Home
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
