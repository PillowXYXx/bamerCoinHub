import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Ban, Crown } from "lucide-react";

interface BannedPageProps {
  reason?: string;
}

export default function BannedPage({ reason }: BannedPageProps) {
  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-red-900 flex items-center justify-center p-4">
      <Card className="glass-effect border-red-500 bg-black/80 max-w-md w-full text-center">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <Ban className="w-20 h-20 text-red-500 animate-pulse" />
          </div>
          <CardTitle className="text-3xl font-bold text-red-400 mb-4">
            ACCOUNT BANNED
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-red-500/20 border border-red-500 rounded-lg p-4">
            <h2 className="text-xl font-bold text-red-300 mb-2">
              USER IS BANNED
            </h2>
            <p className="text-red-200">
              Please find the owner to appeal
            </p>
          </div>

          {reason && (
            <div className="bg-gray-800/50 border border-gray-600 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-300 mb-2">
                Reason:
              </h3>
              <p className="text-gray-400 italic">
                "{reason}"
              </p>
            </div>
          )}

          <div className="bg-yellow-500/20 border border-yellow-500 rounded-lg p-4">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Crown className="w-5 h-5 text-yellow-400" />
              <h3 className="text-lg font-semibold text-yellow-300">
                Appeal Process
              </h3>
            </div>
            <p className="text-yellow-200 text-sm">
              Contact the platform owner to discuss your account status and submit an appeal.
            </p>
          </div>

          <Button
            onClick={handleLogout}
            variant="outline"
            className="w-full bg-gray-700 text-gray-300 border-gray-500 hover:bg-gray-600 hover:text-white"
          >
            Logout
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}