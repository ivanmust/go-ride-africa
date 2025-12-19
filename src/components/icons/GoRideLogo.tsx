import { cn } from "@/lib/utils";

interface GoRideLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}

export const GoRideLogo = ({ className, size = "md", showText = true }: GoRideLogoProps) => {
  const sizes = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-14 h-14",
  };

  const textSizes = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-2xl",
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className={cn("relative", sizes[size])}>
        {/* Logo circle with gradient */}
        <div className="absolute inset-0 bg-primary rounded-xl rotate-3 shadow-lg" />
        <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center">
          {/* Stylized G with road/path */}
          <svg
            viewBox="0 0 40 40"
            fill="none"
            className="w-3/4 h-3/4"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Road path */}
            <path
              d="M8 20C8 13.373 13.373 8 20 8C26.627 8 32 13.373 32 20"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              className="text-primary-foreground"
            />
            <path
              d="M32 20V22C32 24 30 26 28 26H20"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              className="text-primary-foreground"
            />
            {/* Car dot */}
            <circle
              cx="20"
              cy="26"
              r="3"
              className="fill-accent"
            />
          </svg>
        </div>
      </div>
      {showText && (
        <span className={cn("font-bold text-foreground tracking-tight", textSizes[size])}>
          Go<span className="text-primary">Ride</span>
        </span>
      )}
    </div>
  );
};
