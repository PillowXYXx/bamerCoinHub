import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
  message?: string;
  className?: string;
}

export function LoadingSpinner({ 
  message = "Loading...", 
  className = "min-h-screen" 
}: LoadingSpinnerProps) {
  return (
    <div className={`bg-black flex items-center justify-center ${className}`}>
      <div className="text-center space-y-4">
        <div className="relative">
          <div className="w-12 h-12 mx-auto">
            <Loader2 className="h-12 w-12 animate-spin text-cyan-400" />
          </div>
          <div className="absolute inset-0 w-12 h-12 mx-auto">
            <div className="w-full h-full rounded-full border-2 border-cyan-400/20 animate-pulse"></div>
          </div>
        </div>
        <p className="text-gray-300 text-lg">{message}</p>
      </div>
    </div>
  );
}