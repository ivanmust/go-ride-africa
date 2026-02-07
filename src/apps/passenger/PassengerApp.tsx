/**
 * Passenger app: own UI, routing, state, and auth.
 * Passenger sessions never grant access to Driver or Admin.
 */
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { PassengerAuthProvider, usePassengerAuth } from "./auth/PassengerAuthContext";
import { PassengerProtectedRoute } from "./ProtectedRoute";
import { GoogleMapsProvider } from "@/components/maps/GoogleMapsProvider";
import { PassengerLayout } from "./PassengerLayout";
import Index from "@/pages/Index";
import WelcomePage from "@/pages/WelcomePage";
import OnboardingPage from "@/pages/OnboardingPage";
import RidePage from "./pages/RidePage";
import AuthPage from "./pages/AuthPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import ProfilePage from "./pages/ProfilePage";
import RideHistoryPage from "./pages/RideHistoryPage";
import PaymentMethodsPage from "./pages/PaymentMethodsPage";
import PromosPage from "./pages/PromosPage";
import HelpSupportPage from "./pages/HelpSupportPage";
import SettingsPage from "./pages/SettingsPage";
import SafetyPage from "./pages/SafetyPage";
import NotificationsPage from "./pages/NotificationsPage";
import ScheduledRidesPage from "./pages/ScheduledRidesPage";
import NotFound from "@/pages/NotFound";
import { Alert, AlertDescription } from "@/components/ui/alert";

const queryClient = new QueryClient();

function RoleErrorBanner() {
  const { roleError } = usePassengerAuth();
  if (!roleError) return null;
  return (
    <Alert variant="destructive" className="rounded-none">
      <AlertDescription>{roleError}</AlertDescription>
    </Alert>
  );
}

export function PassengerApp() {
  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <GoogleMapsProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
              <PassengerAuthProvider>
                <RoleErrorBanner />
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/welcome" element={<WelcomePage />} />
                  <Route path="/onboarding" element={<OnboardingPage />} />
                  <Route element={<PassengerLayout />}>
                    <Route path="/ride" element={<PassengerProtectedRoute><RidePage /></PassengerProtectedRoute>} />
                    <Route path="/auth" element={<AuthPage />} />
                    <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                    <Route path="/reset-password" element={<ResetPasswordPage />} />
                    <Route path="/history" element={<PassengerProtectedRoute><RideHistoryPage /></PassengerProtectedRoute>} />
                    <Route path="/profile" element={<PassengerProtectedRoute><ProfilePage /></PassengerProtectedRoute>} />
                    <Route path="/payment-methods" element={<PassengerProtectedRoute><PaymentMethodsPage /></PassengerProtectedRoute>} />
                    <Route path="/promos" element={<PassengerProtectedRoute><PromosPage /></PassengerProtectedRoute>} />
                    <Route path="/scheduled-rides" element={<PassengerProtectedRoute><ScheduledRidesPage /></PassengerProtectedRoute>} />
                    <Route path="/help" element={<HelpSupportPage />} />
                    <Route path="/settings" element={<PassengerProtectedRoute><SettingsPage /></PassengerProtectedRoute>} />
                    <Route path="/safety" element={<SafetyPage />} />
                    <Route path="/notifications" element={<PassengerProtectedRoute><NotificationsPage /></PassengerProtectedRoute>} />
                  </Route>
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </PassengerAuthProvider>
            </BrowserRouter>
          </TooltipProvider>
        </GoogleMapsProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
}
