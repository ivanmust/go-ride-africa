/**
 * Admin app: own UI, routing, state, and auth.
 * Only admin role can access; no role-sharing with Passenger or Driver.
 */
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { setApiStorageKey } from "@/shared";
import { AdminAuthProvider, useAdminAuth } from "./auth/AdminAuthContext";
import { AdminProtectedRoute } from "./ProtectedRoute";
import { AdminLoginPage } from "./pages/AdminLoginPage";
import { AdminDashboardPage } from "./pages/AdminDashboardPage";

setApiStorageKey("goride_api_token_admin");

function AdminRoutes() {
  const { user, loading } = useAdminAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-muted/50">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent" />
        <p className="text-muted-foreground text-sm">Loading…</p>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <AdminLoginPage />} />
      <Route path="/auth" element={<Navigate to="/login" replace />} />
      <Route path="/" element={<AdminProtectedRoute><AdminDashboardPage /></AdminProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export function AdminApp() {
  return (
    <HelmetProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter basename="/index-admin.html" future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AdminAuthProvider>
          <AdminRoutes />
        </AdminAuthProvider>
      </BrowserRouter>
    </HelmetProvider>
  );
}
