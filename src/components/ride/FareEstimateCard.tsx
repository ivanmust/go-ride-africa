import { MapPin, Clock, Navigation } from "lucide-react";
import { cn } from "@/lib/utils";

interface FareEstimateCardProps {
  distance: number;
  duration: number;
  baseFare: number;
  discountedFare?: number;
  currency: string;
  isLoading?: boolean;
  className?: string;
}

export const FareEstimateCard = ({
  distance,
  duration,
  baseFare,
  discountedFare,
  currency,
  isLoading,
  className,
}: FareEstimateCardProps) => {
  const formatFare = (amount: number) => `${currency} ${amount.toLocaleString()}`;

  if (isLoading) {
    return (
      <div className={cn("bg-secondary rounded-xl p-4 animate-pulse", className)}>
        <div className="h-6 bg-muted rounded w-1/2 mb-2" />
        <div className="h-4 bg-muted rounded w-2/3" />
      </div>
    );
  }

  return (
    <div className={cn("bg-secondary rounded-xl p-4", className)}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-muted-foreground">Estimated fare</span>
        <div className="text-right">
          {discountedFare ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground line-through">
                {formatFare(baseFare)}
              </span>
              <span className="text-lg font-bold text-primary">
                {formatFare(discountedFare)}
              </span>
            </div>
          ) : (
            <span className="text-lg font-bold text-foreground">
              {formatFare(baseFare)}
            </span>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <Navigation className="w-4 h-4" />
          <span>{distance} km</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock className="w-4 h-4" />
          <span>~{duration} min</span>
        </div>
      </div>

      {discountedFare && (
        <div className="mt-3 pt-3 border-t border-border">
          <div className="flex items-center gap-2 text-sm text-primary">
            <span className="bg-primary/10 px-2 py-0.5 rounded-full text-xs font-medium">
              30% OFF
            </span>
            <span>Ride sharing discount applied</span>
          </div>
        </div>
      )}
    </div>
  );
};
