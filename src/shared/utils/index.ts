/**
 * Shared pure helpers only. No UI, no React.
 */
export function formatFare(amount: number, currency = "RWF"): string {
  return `${currency} ${amount.toLocaleString()}`;
}

export function formatCurrency(amount: number, currency: string | null): string {
  return `${currency || "RWF"} ${amount.toLocaleString()}`;
}
