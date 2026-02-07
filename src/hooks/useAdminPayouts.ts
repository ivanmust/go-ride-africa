import { useEffect, useState, useCallback } from "react";
import { api } from "@/shared";

export interface AdminPayout {
  id: string;
  driver_id: string;
  amount: number;
  payout_method: string | null;
  mobile_money_provider: string | null;
  mobile_money_number: string | null;
  status: string;
  requested_at: string;
  driverName?: string | null;
  driverEmail?: string | null;
}

export const useAdminPayouts = (status: string = "pending") => {
  const [payouts, setPayouts] = useState<AdminPayout[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPayouts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error } = await api.get<AdminPayout[]>(`/admin/payouts?status=${status}`);
      if (error) throw new Error(error.message);
      setPayouts(data || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load payouts");
    } finally {
      setIsLoading(false);
    }
  }, [status]);

  useEffect(() => {
    fetchPayouts();
  }, [fetchPayouts]);

  const updatePayoutStatus = useCallback(
    async (payoutId: string, newStatus: "completed" | "rejected", options?: { transaction_reference?: string; notes?: string }) => {
      const { error } = await api.patch(`/admin/payouts/${payoutId}`, {
        status: newStatus,
        transaction_reference: options?.transaction_reference,
        notes: options?.notes,
      });
      if (!error) await fetchPayouts();
      return { error: error?.message };
    },
    [fetchPayouts]
  );

  const approvePayout = useCallback(
    (payoutId: string, options?: { transaction_reference?: string; notes?: string }) =>
      updatePayoutStatus(payoutId, "completed", options),
    [updatePayoutStatus]
  );

  const rejectPayout = useCallback(
    (payoutId: string, options?: { notes?: string }) =>
      updatePayoutStatus(payoutId, "rejected", options),
    [updatePayoutStatus]
  );

  return { payouts, isLoading, error, refresh: fetchPayouts, approvePayout, rejectPayout };
};

