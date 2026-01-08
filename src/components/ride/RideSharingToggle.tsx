import { Users } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

interface RideSharingToggleProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  discountPercent?: number;
}

export const RideSharingToggle = ({ 
  enabled, 
  onToggle, 
  discountPercent = 30 
}: RideSharingToggleProps) => {
  return (
    <div
      className={cn(
        "flex items-center gap-4 p-4 rounded-xl transition-all border-2",
        enabled
          ? "border-primary bg-goride-green-light"
          : "border-transparent bg-secondary"
      )}
    >
      <div className={cn(
        "w-10 h-10 rounded-xl flex items-center justify-center",
        enabled ? "bg-primary text-primary-foreground" : "bg-background"
      )}>
        <Users className="w-5 h-5" />
      </div>
      
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium text-foreground">Share ride</span>
          <span className="px-2 py-0.5 text-xs font-semibold bg-primary/20 text-primary rounded-full">
            Save {discountPercent}%
          </span>
        </div>
        <p className="text-sm text-muted-foreground">
          Share with others going your way
        </p>
      </div>
      
      <Switch
        checked={enabled}
        onCheckedChange={onToggle}
        className="data-[state=checked]:bg-primary"
      />
    </div>
  );
};
