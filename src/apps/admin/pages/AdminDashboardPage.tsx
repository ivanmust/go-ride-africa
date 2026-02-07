import { useAdminAuth } from "../auth/AdminAuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Shield, LogOut, Users, Car, FileCheck, FileText, MapPin, History, RefreshCw, Wallet, Check, X } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAdminDashboard, type PendingDocument } from "@/hooks/useAdminDashboard";
import { useAdminPayouts, type AdminPayout } from "@/hooks/useAdminPayouts";
import { api } from "@/shared";
import { formatFare } from "@/shared";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";

function StatCard({
  title,
  value,
  icon: Icon,
  description,
}: {
  title: string;
  value: number | string;
  icon: React.ElementType;
  description?: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
      </CardContent>
    </Card>
  );
}

function PendingDocRow({
  doc,
  onApprove,
  onReject,
}: {
  doc: PendingDocument;
  onApprove: () => void;
  onReject: (reason?: string) => void;
}) {
  const [loading, setLoading] = useState(false);

  const handleApprove = async () => {
    setLoading(true);
    await onApprove();
    setLoading(false);
  };

  const handleReject = async () => {
    const reason = window.prompt("Rejection reason (optional):");
    setLoading(true);
    await onReject(reason ?? undefined);
    setLoading(false);
  };

  return (
    <TableRow>
      <TableCell className="font-medium">{doc.fullName ?? doc.userId}</TableCell>
      <TableCell>
        <Badge variant="secondary">{doc.documentType.replace(/_/g, " ")}</Badge>
      </TableCell>
      <TableCell className="text-muted-foreground">{doc.fileName}</TableCell>
      <TableCell>{formatDistanceToNow(new Date(doc.uploadedAt), { addSuffix: true })}</TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-2">
          <Button size="sm" variant="default" onClick={handleApprove} disabled={loading} className="gap-1">
            <Check className="h-3.5 w-3.5" />
            Approve
          </Button>
          <Button size="sm" variant="outline" onClick={handleReject} disabled={loading} className="gap-1 text-destructive hover:text-destructive">
            <X className="h-3.5 w-3.5" />
            Reject
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

function PendingPayoutRow({
  payout,
  onApprove,
  onReject,
}: {
  payout: AdminPayout;
  onApprove: (id: string) => Promise<{ error?: string }>;
  onReject: (id: string) => Promise<{ error?: string }>;
}) {
  const [loading, setLoading] = useState(false);

  const handleApprove = async () => {
    setLoading(true);
    const { error } = await onApprove(payout.id);
    setLoading(false);
    if (error) toast.error(error);
    else toast.success("Payout approved and marked as completed.");
  };

  const handleReject = async () => {
    setLoading(true);
    const { error } = await onReject(payout.id);
    setLoading(false);
    if (error) toast.error(error);
    else toast.success("Payout rejected.");
  };

  return (
    <TableRow>
      <TableCell className="font-medium">
        {payout.driverName || "Driver"}
        {payout.driverEmail && (
          <span className="ml-1 text-xs text-muted-foreground">({payout.driverEmail})</span>
        )}
      </TableCell>
      <TableCell>RWF {Number(payout.amount).toLocaleString()}</TableCell>
      <TableCell className="capitalize">{payout.payout_method || "mobile_money"}</TableCell>
      <TableCell className="text-sm text-muted-foreground">
        {payout.requested_at ? new Date(payout.requested_at).toLocaleString() : "—"}
      </TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-2">
          <Button
            size="sm"
            variant="default"
            onClick={handleApprove}
            disabled={loading}
            className="gap-1"
          >
            <Check className="h-3.5 w-3.5" />
            Approve
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleReject}
            disabled={loading}
            className="gap-1 text-destructive hover:text-destructive"
          >
            <X className="h-3.5 w-3.5" />
            Reject
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

export function AdminDashboardPage() {
  const { user, profile, signOut } = useAdminAuth();
  const navigate = useNavigate();
  const {
    stats,
    pendingApprovals,
    pendingDocs,
    recentRequests,
    recentRides,
    isLoading,
    error,
    refresh,
    approveDriver,
  } = useAdminDashboard();
  const {
    payouts: pendingPayouts,
    isLoading: isLoadingPayouts,
    approvePayout,
    rejectPayout,
  } = useAdminPayouts("pending");

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  const handleApproveDriver = async (profileId: string) => {
    try {
      await approveDriver(profileId);
      toast.success("Driver approved successfully");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to approve driver");
    }
  };

  const handleDocumentReview = async (
    documentId: string,
    status: "approved" | "rejected",
    rejectionReason?: string
  ) => {
    const { error } = await api.patch(`/admin/documents/${documentId}`, {
      status,
      rejection_reason: rejectionReason || undefined,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(status === "approved" ? "Document approved" : "Document rejected");
    refresh();
  };

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b bg-card">
          <div className="container mx-auto px-4 h-14 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              <span className="font-semibold">GoRide Admin</span>
            </div>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </Button>
          </div>
        </header>
        <main className="container mx-auto px-4 py-8">
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle>Error</CardTitle>
              <CardDescription>{error}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Make sure you&apos;ve run the latest migration so admins can view profiles and driver documents.
              </p>
              <Button onClick={refresh}>Retry</Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <span className="font-semibold">GoRide Admin</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={refresh} disabled={isLoading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </Button>
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8 space-y-8">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Signed in as {profile?.email ?? user?.email}
          </p>
        </div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="h-[120px]" />
            ))}
          </div>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <StatCard
                title="Total Users"
                value={Number.isFinite(stats.totalUsers) ? stats.totalUsers : 0}
                icon={Users}
              />
              <StatCard
                title="Drivers"
                value={`${Number.isFinite(stats.approvedDrivers) ? stats.approvedDrivers : 0} / ${Number.isFinite(stats.totalDrivers) ? stats.totalDrivers : 0}`}
                icon={Car}
                description="Approved / Total"
              />
              <StatCard
                title="Pending Approvals"
                value={Number.isFinite(stats.pendingDriverApprovals) ? stats.pendingDriverApprovals : 0}
                icon={FileCheck}
              />
              <StatCard
                title="Pending Documents"
                value={Number.isFinite(stats.pendingDocuments) ? stats.pendingDocuments : 0}
                icon={FileText}
              />
              <StatCard
                title="Ride Requests"
                value={Number.isFinite(stats.totalRideRequests) ? stats.totalRideRequests : 0}
                icon={MapPin}
              />
              <StatCard
                title="Pending Requests"
                value={Number.isFinite(stats.pendingRideRequests) ? stats.pendingRideRequests : 0}
                icon={MapPin}
              />
              <StatCard
                title="Completed Rides"
                value={Number.isFinite(stats.completedRides) ? stats.completedRides : 0}
                icon={History}
              />
            </div>

            {pendingApprovals.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Pending Driver Approvals</CardTitle>
                  <CardDescription>
                    Drivers waiting for admin approval. Review and approve to allow them on the platform.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Joined</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingApprovals.map((d) => (
                        <TableRow key={d.id}>
                          <TableCell className="font-medium">{d.fullName ?? "—"}</TableCell>
                          <TableCell>{d.email ?? "—"}</TableCell>
                          <TableCell>{d.phone ?? "—"}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {formatDistanceToNow(new Date(d.createdAt), { addSuffix: true })}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button size="sm" onClick={() => handleApproveDriver(d.id)}>
                              Approve
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            {pendingDocs.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Pending Document Reviews</CardTitle>
                  <CardDescription>
                    Review and approve or reject driver documents.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Driver</TableHead>
                        <TableHead>Document Type</TableHead>
                        <TableHead>File</TableHead>
                        <TableHead>Uploaded</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingDocs.map((d) => (
                        <PendingDocRow
                          key={d.id}
                          doc={d}
                          onApprove={() => handleDocumentReview(d.id, "approved")}
                          onReject={(reason) => handleDocumentReview(d.id, "rejected", reason)}
                        />
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            {pendingPayouts.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wallet className="h-4 w-4 text-primary" />
                    Pending Driver Payouts
                  </CardTitle>
                  <CardDescription>
                    Withdrawal requests submitted by drivers. Approve after sending payment via mobile money.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingPayouts ? (
                    <p className="text-sm text-muted-foreground py-2">Loading payouts…</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Driver</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Method</TableHead>
                          <TableHead>Requested</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pendingPayouts.map((p) => (
                          <PendingPayoutRow
                            key={p.id}
                            payout={p}
                            onApprove={approvePayout}
                            onReject={rejectPayout}
                          />
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            )}

            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Ride Requests</CardTitle>
                  <CardDescription>Latest ride requests across the platform</CardDescription>
                </CardHeader>
                <CardContent>
                  {recentRequests.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4">No ride requests yet</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Route</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Requested</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {recentRequests.map((r) => (
                          <TableRow key={r.id}>
                            <TableCell>
                              <div className="text-sm">
                                <div>{r.pickupAddress}</div>
                                <div className="text-muted-foreground">→ {r.dropoffAddress}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={r.status === "pending" ? "secondary" : "default"}>
                                {r.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                              {formatDistanceToNow(new Date(r.createdAt), { addSuffix: true })}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Completed Rides</CardTitle>
                  <CardDescription>Latest completed rides</CardDescription>
                </CardHeader>
                <CardContent>
                  {recentRides.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4">No completed rides yet</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Route</TableHead>
                          <TableHead>Fare</TableHead>
                          <TableHead>Completed</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {recentRides.map((r) => (
                          <TableRow key={r.id}>
                            <TableCell>
                              <div className="text-sm">
                                <div>{r.pickupAddress}</div>
                                <div className="text-muted-foreground">→ {r.dropoffAddress}</div>
                              </div>
                            </TableCell>
                            <TableCell className="font-medium">
                              {formatFare(r.fareAmount)}
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                              {formatDistanceToNow(new Date(r.createdAt), { addSuffix: true })}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
