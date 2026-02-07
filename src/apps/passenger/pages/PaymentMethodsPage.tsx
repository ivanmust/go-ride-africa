import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, CreditCard, Plus, Loader2, Check } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { usePaymentMethods, type PaymentMethod } from "@/hooks/usePaymentMethods";
import { api } from "@/shared";
import { toast } from "sonner";

const PAYMENT_TYPES = [
  { value: "cash", label: "Cash" },
  { value: "mobile_money", label: "Mobile Money" },
  { value: "card", label: "Card" },
  { value: "wallet", label: "Wallet" },
] as const;

function PaymentMethodIcon({ type }: { type: string }) {
  switch (type) {
    case "cash":
      return <span className="text-xl">💵</span>;
    case "mobile_money":
      return <span className="text-xl">📱</span>;
    case "card":
      return <span className="text-xl">💳</span>;
    case "wallet":
      return <span className="text-xl">👛</span>;
    default:
      return <CreditCard className="h-6 w-6 text-muted-foreground" />;
  }
}

export const PaymentMethodsPage = () => {
  const navigate = useNavigate();
  const { methods, isLoading, defaultMethod, refetch } = usePaymentMethods();
  const [addOpen, setAddOpen] = useState(false);
  const [type, setType] = useState<string>("cash");
  const [lastFour, setLastFour] = useState("");
  const [setAsDefault, setSetAsDefault] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [settingDefaultId, setSettingDefaultId] = useState<string | null>(null);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const account_number_masked = lastFour.trim() ? `•••• ${lastFour.trim().slice(-4)}` : null;
      const { data, error } = await api.post<PaymentMethod>("/payment-methods", {
        type,
        account_number_masked,
        is_default: setAsDefault,
      });
      if (error) throw new Error(error.message);
      if (data) {
        toast.success("Payment method added");
        setAddOpen(false);
        setType("cash");
        setLastFour("");
        setSetAsDefault(true);
        refetch();
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add payment method");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSetDefault = async (id: string) => {
    setSettingDefaultId(id);
    try {
      const { error } = await api.patch(`/payment-methods/${id}`, { is_default: true });
      if (error) throw new Error(error.message);
      toast.success("Default payment method updated");
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setSettingDefaultId(null);
    }
  };

  return (
    <>
      <Helmet>
        <title>Payment Methods | GoRide</title>
      </Helmet>
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        <Link to="/ride">
          <Button variant="ghost" size="sm" className="gap-2 mb-4">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </Link>
        <Card>
          <CardHeader>
            <CardTitle>Payment Methods</CardTitle>
            <CardDescription>
              Add a payment method so you can book rides. You’ll choose one when requesting a ride.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Dialog open={addOpen} onOpenChange={setAddOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full gap-2">
                  <Plus className="h-4 w-4" />
                  Add payment method
                </Button>
              </DialogTrigger>
              <DialogContent>
                <form onSubmit={handleAdd}>
                  <DialogHeader>
                    <DialogTitle>Add payment method</DialogTitle>
                    <DialogDescription>
                      Choose how you’ll pay for rides. You can add more later.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="type">Type</Label>
                      <Select value={type} onValueChange={setType}>
                        <SelectTrigger id="type">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          {PAYMENT_TYPES.map((t) => (
                            <SelectItem key={t.value} value={t.value}>
                              {t.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="lastFour">Last 4 digits (optional)</Label>
                      <Input
                        id="lastFour"
                        placeholder="e.g. 4242"
                        maxLength={4}
                        value={lastFour}
                        onChange={(e) => setLastFour(e.target.value.replace(/\D/g, ""))}
                      />
                      <p className="text-xs text-muted-foreground">
                        Shown as •••• XXXX on the ride screen
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="setDefault"
                        checked={setAsDefault}
                        onChange={(e) => setSetAsDefault(e.target.checked)}
                        className="rounded border-input"
                      />
                      <Label htmlFor="setDefault">Set as default</Label>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Add
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>

            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : methods.length === 0 ? (
              <div className="rounded-lg border border-dashed p-8 text-center">
                <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="font-medium text-foreground">No payment methods yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Add one above to book rides. You need at least one to request a ride.
                </p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => setAddOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add payment method
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {methods.map((pm) => (
                  <div
                    key={pm.id}
                    className="flex items-center gap-3 p-4 rounded-lg border bg-muted/30"
                  >
                    <div className="w-10 h-10 rounded-lg bg-background flex items-center justify-center">
                      <PaymentMethodIcon type={pm.type} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium capitalize">
                        {pm.type.replace("_", " ")}
                        {pm.account_number_masked && (
                          <span className="text-muted-foreground font-normal ml-1">
                            {pm.account_number_masked}
                          </span>
                        )}
                      </p>
                      {pm.is_default && (
                        <span className="inline-flex items-center gap-1 text-xs text-primary font-medium mt-0.5">
                          <Check className="h-3 w-3" /> Default
                        </span>
                      )}
                    </div>
                    {!pm.is_default && (
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={settingDefaultId !== null}
                        onClick={() => handleSetDefault(pm.id)}
                      >
                        {settingDefaultId === pm.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          "Set default"
                        )}
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {methods.length > 0 && (
              <Button
                variant="secondary"
                className="w-full mt-4"
                onClick={() => navigate("/ride")}
              >
                Back to ride
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default PaymentMethodsPage;
