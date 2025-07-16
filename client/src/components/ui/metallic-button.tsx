import { forwardRef } from "react";
import { Button, ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface MetallicButtonProps extends ButtonProps {
  variant?: "blue" | "green";
}

const MetallicButton = forwardRef<HTMLButtonElement, MetallicButtonProps>(
  ({ className, variant = "blue", children, ...props }, ref) => {
    const variantClasses = {
      blue: "metallic-button text-white",
      green: "metallic-green text-white",
    };

    return (
      <Button
        className={cn(
          "transition-all duration-300 hover:scale-105 hover:shadow-2xl font-semibold",
          variantClasses[variant],
          className
        )}
        ref={ref}
        {...props}
      >
        {children}
      </Button>
    );
  }
);

MetallicButton.displayName = "MetallicButton";

export { MetallicButton };
