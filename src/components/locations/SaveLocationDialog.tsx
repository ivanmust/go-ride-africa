import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Home, Briefcase, Dumbbell, GraduationCap, MapPin } from "lucide-react";

interface SaveLocationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  address: string;
  coordinates: { lat: number; lng: number };
  onSave: (location: {
    name: string;
    address: string;
    label: string;
    latitude: number;
    longitude: number;
  }) => void;
}

const labelOptions = [
  { id: "home", label: "Home", icon: Home },
  { id: "work", label: "Work", icon: Briefcase },
  { id: "gym", label: "Gym", icon: Dumbbell },
  { id: "school", label: "School", icon: GraduationCap },
  { id: "other", label: "Other", icon: MapPin },
];

export const SaveLocationDialog = ({
  open,
  onOpenChange,
  address,
  coordinates,
  onSave,
}: SaveLocationDialogProps) => {
  const [name, setName] = useState("");
  const [selectedLabel, setSelectedLabel] = useState("other");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) return;

    setIsSaving(true);
    await onSave({
      name: name.trim(),
      address,
      label: selectedLabel,
      latitude: coordinates.lat,
      longitude: coordinates.lng,
    });
    setIsSaving(false);
    setName("");
    setSelectedLabel("other");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Save Location</DialogTitle>
          <DialogDescription>
            Save this address for quick access later
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Address Preview */}
          <div className="p-3 bg-secondary rounded-lg">
            <p className="text-sm text-muted-foreground">Address</p>
            <p className="font-medium text-foreground truncate">{address}</p>
          </div>

          {/* Name Input */}
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              placeholder="e.g., Mom's House, Favorite Cafe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={50}
            />
          </div>

          {/* Label Selection */}
          <div className="space-y-2">
            <Label>Label</Label>
            <div className="grid grid-cols-5 gap-2">
              {labelOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setSelectedLabel(option.id)}
                  className={cn(
                    "flex flex-col items-center gap-1 p-3 rounded-xl transition-all",
                    selectedLabel === option.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary hover:bg-secondary/80 text-foreground"
                  )}
                >
                  <option.icon className="w-5 h-5" />
                  <span className="text-xs">{option.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            variant="goride"
            className="flex-1"
            onClick={handleSave}
            disabled={!name.trim() || isSaving}
          >
            {isSaving ? "Saving..." : "Save Location"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
