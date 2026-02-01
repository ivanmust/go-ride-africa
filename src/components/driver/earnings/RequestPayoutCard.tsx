import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Wallet, ArrowRight, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface RequestPayoutCardProps {
  availableBalance: number;
  pendingPayout: number;
  onRequestPayout: (amount: number, provider: string, phoneNumber: string) => Promise<{ error: Error | null }>;
}

export const RequestPayoutCard = ({
  availableBalance,
  pendingPayout,
  onRequestPayout,
}: RequestPayoutCardProps) => {
  const { toast } = useToast();
  const [amount, setAmount] = useState("");
  const [provider, setProvider] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const payoutAmount = Number(amount);
    
    if (payoutAmount <= 0) {
      toast({ title: "Invalid amount", variant: "destructive" });
      return;
    }
    
    if (payoutAmount > availableBalance) {
      toast({ title: "Insufficient balance", variant: "destructive" });
      return;
    }

    if (!provider || !phoneNumber) {
      toast({ title: "Please fill all fields", variant: "destructive" });
      return;
    }

    setLoading(true);
    const { error } = await onRequestPayout(payoutAmount, provider, phoneNumber);
    setLoading(false);

    if (error) {
      toast({ title: "Failed to request payout", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Payout requested!", description: "Your payout is being processed." });
      setAmount("");
      setPhoneNumber("");
      setProvider("");
    }
  };

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Wallet className="h-4 w-4" />
          Request Payout
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-green-50 rounded-lg border border-green-200">
            <p className="text-xs text-green-700 font-medium">Available</p>
            <p className="text-lg font-bold text-green-800">
              RWF {availableBalance.toLocaleString()}
            </p>
          </div>
          <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
            <p className="text-xs text-yellow-700 font-medium">Pending</p>
            <p className="text-lg font-bold text-yellow-800">
              RWF {pendingPayout.toLocaleString()}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="amount" className="text-sm">Amount (RWF)</Label>
            <Input
              id="amount"
              type="number"
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="1000"
              max={availableBalance}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="provider" className="text-sm">Mobile Money Provider</Label>
            <Select value={provider} onValueChange={setProvider}>
              <SelectTrigger>
                <SelectValue placeholder="Select provider" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mtn">MTN Mobile Money</SelectItem>
                <SelectItem value="airtel">Airtel Money</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="phone" className="text-sm">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="07X XXX XXXX"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={loading || availableBalance <= 0}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <ArrowRight className="h-4 w-4 mr-2" />
            )}
            Request Payout
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
