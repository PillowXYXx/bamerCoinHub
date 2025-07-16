import { cn } from "@/lib/utils";

interface CoinDisplayProps {
  value?: string | number;
  amount?: string | number;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

export function CoinDisplay({ value, amount, size = "md", className }: CoinDisplayProps) {
  const sizeClasses = {
    sm: "w-6 h-6 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-16 h-16 text-xl",
    xl: "w-20 h-20 text-2xl",
  };

  // Handle both value and amount props, with proper null checking
  const displayValue = value !== undefined ? value : amount;
  const safeDisplayValue = typeof displayValue === 'string' && displayValue !== '' 
    ? (displayValue === 'P' ? 'P' : Math.floor(parseFloat(displayValue)).toString())
    : typeof displayValue === 'number' 
    ? Math.floor(displayValue).toString()
    : displayValue || 'P';

  return (
    <div
      className={cn(
        "coin-shine rounded-full flex items-center justify-center font-bold",
        sizeClasses[size],
        className
      )}
    >
      {safeDisplayValue}
    </div>
  );
}
