import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";
import { useSoundEffects } from "@/hooks/use-sound";
import { useLocation } from "wouter";

interface ReturnHomeButtonProps {
  className?: string;
  size?: "sm" | "default" | "lg";
}

export function ReturnHomeButton({ className = "", size = "sm" }: ReturnHomeButtonProps) {
  const { playNavigationSound } = useSoundEffects();
  const [, setLocation] = useLocation();

  const handleClick = () => {
    playNavigationSound();
    setLocation('/');
  };

  return (
    <Button
      variant="outline"
      size={size}
      onClick={handleClick}
      className={`bg-cyan-500/20 text-cyan-400 border-cyan-500 hover:bg-cyan-500 hover:text-white transition-colors ${className}`}
    >
      <Home className="w-4 h-4 mr-2" />
      Return Home
    </Button>
  );
}