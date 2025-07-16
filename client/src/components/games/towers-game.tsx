import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building } from "lucide-react";

interface TowersGameProps {
  userBalance: number;
  onGameEnd: () => void;
}

export default function TowersGame({ userBalance, onGameEnd }: TowersGameProps) {
  return (
    <div className="max-w-4xl mx-auto">
      <Card className="glass-effect border-none bg-transparent">
        <CardHeader>
          <CardTitle className="flex items-center space-x-3">
            <Building className="w-8 h-8 text-purple-500" />
            <span className="text-2xl neon-blue-text">Towers</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 text-center">
          <p className="text-gray-400 mb-4">Coming Soon!</p>
          <div className="text-6xl mb-4">🏗️</div>
          <p className="text-cyan-400">Climb the tower for bigger rewards!</p>
        </CardContent>
      </Card>
    </div>
  );
}