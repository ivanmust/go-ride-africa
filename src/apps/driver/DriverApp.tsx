/**
 * Driver app: own UI, routing, state, and auth.
 * Driver sessions never grant access to Passenger or Admin.
 */
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { setApiStorageKey } from "@/shared";
import { DriverAuthProvider, useDriverAuth } from "./auth/DriverAuthContext";
import { DriverProtectedRoute } from "./ProtectedRoute";
import { DriverLayout } from "./DriverLayout";
import DrivePage from "./pages/DrivePage";
import DriverEarningsPage from "./pages/DriverEarningsPage";
import DriverPerformancePage from "./pages/DriverPerformancePage";
import WalletPage from "./pages/WalletPage";
import DriverHelpSupportPage from "./pages/HelpSupportPage";
import DriverSettingsPage from "./pages/SettingsPage";
import DriverSafetyPage from "./pages/SafetyPage";
import ReferralPage from "./pages/ReferralPage";
import DriverNotificationsPage from "./pages/NotificationsPage";
import DriverRideHistoryPage from "./pages/DriverRideHistoryPage";
import DriverProfilePage from "./pages/DriverProfilePage";
import { DriverLoginPage } from "./pages/DriverLoginPage";
import NotFound from "@/pages/NotFound";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { GoogleMapsProvider } from "@/components/maps/GoogleMapsProvider";

const queryClient = new QueryClient();

function RoleErrorBanner() {
  const { roleError } = useDriverAuth();
  if (!roleError) return null;
  return (
    <Alert variant="destructive" className="rounded-none">
      <AlertDescription>{roleError}</AlertDescription>
    </Alert>
  );
}

// Use separate token storage so driver auth doesn't clash with passenger (avoids 403 on driver-only endpoints).
setApiStorageKey("goride_api_token_driver");

export function DriverApp() {
  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <GoogleMapsProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter basename="/index-driver.html" future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <DriverAuthProvider>
              <RoleErrorBanner />
              <Routes>
                <Route path="/login" element={<DriverLoginPage />} />
                <Route path="/auth" element={<Navigate to="/login" replace />} />
                <Route element={<DriverLayout />}>
                  <Route path="/" element={<DrivePage />} />
                  <Route path="/drive" element={<DrivePage />} />
                  <Route path="/profile" element={<DriverProtectedRoute><DriverProfilePage /></DriverProtectedRoute>} />
                  <Route path="/earnings" element={<DriverProtectedRoute><DriverEarningsPage /></DriverProtectedRoute>} />
                  <Route path="/performance" element={<DriverProtectedRoute><DriverPerformancePage /></DriverProtectedRoute>} />
                  <Route path="/wallet" element={<DriverProtectedRoute><WalletPage /></DriverProtectedRoute>} />
                  <Route path="/driver-help" element={<DriverHelpSupportPage />} />
                  <Route path="/driver-settings" element={<DriverProtectedRoute><DriverSettingsPage /></DriverProtectedRoute>} />
                  <Route path="/driver-safety" element={<DriverSafetyPage />} />
                  <Route path="/referral" element={<DriverProtectedRoute><ReferralPage /></DriverProtectedRoute>} />
                  <Route path="/driver-notifications" element={<DriverProtectedRoute><DriverNotificationsPage /></DriverProtectedRoute>} />
                  <Route path="/history" element={<DriverProtectedRoute><DriverRideHistoryPage /></DriverProtectedRoute>} />
                </Route>
                <Route path="*" element={<NotFound />} />
              </Routes>
            </DriverAuthProvider>
          </BrowserRouter>
        </TooltipProvider>
        </GoogleMapsProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
}
