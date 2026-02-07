import { useState, useEffect } from "react";
import { usePassengerAuth } from "@/apps/passenger/auth/PassengerAuthContext";
import { api } from "@/shared";

export interface PaymentMethod {
  id: string;
  user_id: string;
  type: string;
  provider: string | null;
  account_number_masked: string | null;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export const usePaymentMethods = () => {
  const { user } = usePassengerAuth();
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMethods = async () => {
    if (!user) {
      setMethods([]);
      setIsLoading(false);
      return;
    }
    try {
      const { data, error } = await api.get<PaymentMethod[]>("/payment-methods");
      if (error) throw new Error(error.message);
      setMethods(data || []);
    } catch (error) {
      console.error("Error fetching payment methods:", error);
      setMethods([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMethods();
  }, [user?.id]);

  const defaultMethod = methods.find((m) => m.is_default) ?? methods[0] ?? null;

  return { methods, isLoading, defaultMethod, refetch: fetchMethods };
};
