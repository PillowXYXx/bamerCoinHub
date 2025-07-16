import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, Crown, Medal, Star } from "lucide-react";
import { format } from "date-fns";

interface LeaderboardEntry {
  userId: number;
  username: string;
  totalWinnings: string;
  totalGamesPlayed: number;
  biggestWin: string;
  winRate: string;
  updatedAt: string;
}

export default function Leaderboard() {
  const { data: leaderboard = [], isLoading } = useQuery<LeaderboardEntry[]>({
    queryKey: ["/api/leaderboard"],
  });

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Crown className="w-8 h-8 text-yellow-500" />;
      case 1:
        return <Medal className="w-7 h-7 text-gray-400" />;
      case 2:
        return <Medal className="w-6 h-6 text-amber-600" />;
      default:
        return <Star className="w-5 h-5 text-blue-500" />;
    }
  };

  const getRankStyling = (index: number) => {
    switch (index) {
      case 0:
        return "bg-gradient-to-r from-yellow-400/20 to-yellow-600/20 border-yellow-500/50";
      case 1:
        return "bg-gradient-to-r from-gray-300/20 to-gray-500/20 border-gray-400/50";
      case 2:
        return "bg-gradient-to-r from-amber-400/20 to-amber-600/20 border-amber-500/50";
      default:
        return "bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border-blue-400/30";
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading leaderboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-cyan-500/30">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent flex items-center justify-center gap-3">
            <Trophy className="w-8 h-8 text-yellow-500" />
            Player Leaderboard
            <Trophy className="w-8 h-8 text-yellow-500" />
          </CardTitle>
          <CardDescription className="text-gray-400 text-lg">
            Top players ranked by total winnings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {leaderboard.length === 0 ? (
            <div className="text-center py-12">
              <Trophy className="w-16 h-16 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No rankings yet. Start playing to get on the board!</p>
            </div>
          ) : (
            leaderboard.map((entry, index) => (
              <Card key={entry.userId} className={`${getRankStyling(index)} transition-all hover:scale-105`}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        {getRankIcon(index)}
                        <span className="text-2xl font-bold text-white">#{index + 1}</span>
                      </div>
                      <div>
                        <h3 className="font-bold text-xl text-white">{entry.username}</h3>
                        <p className="text-gray-400">
                          Games played: {entry.totalGamesPlayed} • Win rate: {parseFloat(entry.winRate).toFixed(1)}%
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-cyan-400">
                        {parseFloat(entry.totalWinnings).toFixed(2)} P
                      </p>
                      <p className="text-sm text-gray-400">
                        Biggest win: {parseFloat(entry.biggestWin).toFixed(2)} P
                      </p>
                      <p className="text-xs text-gray-500">
                        Last updated: {format(new Date(entry.updatedAt), "MMM dd, yyyy")}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}