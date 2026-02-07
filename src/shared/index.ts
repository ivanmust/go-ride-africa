/**
 * Shared package: API client and types only. Postgres backend via VITE_API_URL.
 */
export {
  getApiBaseUrl,
  usePostgresApi,
  getToken,
  setToken,
  setApiStorageKey,
  api,
} from "./api/client";
export type { AppRole, Profile, AuthUser, AuthSession } from "./types";
export { formatFare, formatCurrency } from "./utils";
