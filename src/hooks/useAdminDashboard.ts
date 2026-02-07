import { useState, useEffect, useCallback } from "react";
import { api } from "@/shared";

export interface AdminDashboardStats {
  totalUsers: number;
  totalDrivers: number;
  approvedDrivers: number;
  pendingDriverApprovals: number;
  pendingDocuments: number;
  totalRideRequests: number;
  pendingRideRequests: number;
  completedRides: number;
}

export interface PendingDriverApproval {
  id: string;
  email: string | null;
  fullName: string | null;
  phone: string | null;
  createdAt: string;
}

export interface PendingDocument {
  id: string;
  userId: string;
  documentType: string;
  fileName: string;
  status: string;
  uploadedAt: string;
  fullName?: string | null;
}

export interface RecentRideRequest {
  id: string;
  pickupAddress: string;
  dropoffAddress: string;
  status: string;
  vehicleType: string;
  createdAt: string;
  email?: string | null;
}

export interface RecentRide {
  id: string;
  pickupAddress: string;
  dropoffAddress: string;
  fareAmount: number;
  status: string;
  createdAt: string;
}

export function useAdminDashboard() {
  const [stats, setStats] = useState<AdminDashboardStats>({
    totalUsers: 0,
    totalDrivers: 0,
    approvedDrivers: 0,
    pendingDriverApprovals: 0,
    pendingDocuments: 0,
    totalRideRequests: 0,
    pendingRideRequests: 0,
    completedRides: 0,
  });
  const [pendingApprovals, setPendingApprovals] = useState<PendingDriverApproval[]>([]);
  const [pendingDocs, setPendingDocs] = useState<PendingDocument[]>([]);
  const [recentRequests, setRecentRequests] = useState<RecentRideRequest[]>([]);
  const [recentRides, setRecentRides] = useState<RecentRide[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const approveDriver = useCallback(async (profileId: string) => {
    const { error: updError } = await api.patch(`/admin/profiles/${profileId}`, { is_driver_approved: true });
    if (updError) throw new Error(updError.message);
    await refresh();
  }, []);

  const refresh = useCallback(async () => {
    setError(null);
    setIsLoading(true);
    try {
      const { data, error: apiErr } = await api.get<{
          profiles: Array<{ id: string; email: string | null; full_name: string | null; phone: string | null; created_at: string; is_driver_approved: boolean }>;
          user_roles: Array<{ user_id: string; role: string }>;
          driver_documents: Array<{ id: string; user_id: string; document_type: string; file_name: string; status: string; uploaded_at: string }>;
          ride_requests: Array<{ id: string; pickup_address: string; dropoff_address: string; status: string; vehicle_type: string; created_at: string; user_id: string }>;
          ride_history: Array<{ id: string; pickup_address: string; dropoff_address: string; fare_amount: number; status: string; created_at: string }>;
          counts: {
            pending_requests: number;
            total_requests: number;
            total_rides: number;
            completed_rides?: number;
            total_users?: number;
            total_drivers?: number;
            approved_drivers?: number;
            pending_driver_approvals?: number;
          };
        }>("/admin/dashboard");
        if (apiErr) throw new Error(apiErr.message);
        if (!data) throw new Error("No data");

        const roles = data.user_roles ?? [];
        const profiles = data.profiles ?? [];
        const docs = data.driver_documents ?? [];
        const requests = data.ride_requests ?? [];
        const history = data.ride_history ?? [];
        const driverUserIds = new Set(roles.filter((r) => r.role === "driver").map((r) => r.user_id));
        const profileMap = new Map(profiles.map((p) => [p.id, p]));
        const c = data.counts ?? {};

        const num = (v: number | undefined, fallback: number) => (typeof v === "number" && !Number.isNaN(v) ? v : fallback);

        setPendingApprovals(
          profiles
            .filter((p) => driverUserIds.has(p.id) && !p.is_driver_approved)
            .map((p) => ({ id: p.id, email: p.email, fullName: p.full_name, phone: p.phone, createdAt: p.created_at }))
        );
        setPendingDocs(
          docs.map((d) => ({
            id: d.id,
            userId: d.user_id,
            documentType: d.document_type,
            fileName: d.file_name,
            status: d.status,
            uploadedAt: d.uploaded_at,
            fullName: (profileMap.get(d.user_id) as { full_name?: string | null } | undefined)?.full_name ?? null,
          }))
        );
        setRecentRequests(
          requests.map((r) => ({
            id: r.id,
            pickupAddress: r.pickup_address,
            dropoffAddress: r.dropoff_address,
            status: r.status,
            vehicleType: r.vehicle_type,
            createdAt: r.created_at,
            email: (profileMap.get(r.user_id) as { email?: string | null } | undefined)?.email ?? null,
          }))
        );
        setRecentRides(
          history.map((h) => ({
            id: h.id,
            pickupAddress: h.pickup_address,
            dropoffAddress: h.dropoff_address,
            fareAmount: Number(h.fare_amount),
            status: h.status,
            createdAt: h.created_at,
          }))
        );
        setStats({
          totalUsers: num(c.total_users, new Set(roles.map((r) => r.user_id)).size),
          totalDrivers: num(c.total_drivers, driverUserIds.size),
          approvedDrivers: num(c.approved_drivers, profiles.filter((p) => p.is_driver_approved === true).length),
          pendingDriverApprovals: num(c.pending_driver_approvals, profiles.filter((p) => driverUserIds.has(p.id) && !p.is_driver_approved).length),
          pendingDocuments: docs.length,
          totalRideRequests: num(c.total_requests, 0),
          pendingRideRequests: num(c.pending_requests, 0),
          completedRides: num(c.completed_rides, num(c.total_rides, 0)),
        });
        setIsLoading(false);
    } catch (e) {
      console.error("Admin dashboard fetch error:", e);
      setError(e instanceof Error ? e.message : "Failed to load dashboard");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    stats,
    pendingApprovals,
    pendingDocs,
    recentRequests,
    recentRides,
    isLoading,
    error,
    refresh,
    approveDriver,
  };
}
