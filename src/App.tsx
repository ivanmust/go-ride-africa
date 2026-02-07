import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { GoogleMapsProvider } from "@/components/maps/GoogleMapsProvider";
import { PassengerLayout } from "@/apps/passenger/PassengerLayout";
import { DriverLayout } from "@/apps/driver/DriverLayout";
import Index from "./pages/Index";
import WelcomePage from "./pages/WelcomePage";
import OnboardingPage from "./pages/OnboardingPage";
import RidePage from "@/apps/passenger/pages/RidePage";
import DrivePage from "@/apps/driver/pages/DrivePage";
import DriverEarningsPage from "@/apps/driver/pages/DriverEarningsPage";
import DriverPerformancePage from "@/apps/driver/pages/DriverPerformancePage";
import AuthPage from "@/apps/passenger/pages/AuthPage";
import ProfilePage from "@/apps/passenger/pages/ProfilePage";
import RideHistoryPage from "@/apps/passenger/pages/RideHistoryPage";
import PaymentMethodsPage from "@/apps/passenger/pages/PaymentMethodsPage";
import PromosPage from "@/apps/passenger/pages/PromosPage";
import HelpSupportPage from "@/apps/passenger/pages/HelpSupportPage";
import SettingsPage from "@/apps/passenger/pages/SettingsPage";
import SafetyPage from "@/apps/passenger/pages/SafetyPage";
import NotificationsPage from "@/apps/passenger/pages/NotificationsPage";
import ScheduledRidesPage from "@/apps/passenger/pages/ScheduledRidesPage";
import WalletPage from "@/apps/driver/pages/WalletPage";
import DriverHelpSupportPage from "@/apps/driver/pages/HelpSupportPage";
import DriverSettingsPage from "@/apps/driver/pages/SettingsPage";
import DriverSafetyPage from "@/apps/driver/pages/SafetyPage";
import ReferralPage from "@/apps/driver/pages/ReferralPage";
import DriverNotificationsPage from "@/apps/driver/pages/NotificationsPage";
import NotFound from "./pages/NotFound";
import TermsPage from "./pages/TermsPage";
import AboutPage from "./pages/AboutPage";

const queryClient = new QueryClient();

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <GoogleMapsProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <AuthProvider>
              <Routes>
                {/* Shared: marketing landing */}
                <Route path="/" element={<Index />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/terms" element={<TermsPage />} />
                {/* Shared initial flow (blueprint): Welcome → branch to Passenger or Driver */}
                <Route path="/welcome" element={<WelcomePage />} />
                <Route path="/onboarding" element={<OnboardingPage />} />

                {/* CLIENT / PASSENGER app (blueprint): Home → Where to → Choose Ride → Confirm → Looking for Driver → Driver Found → Current Ride → Rate Trip */}
                <Route element={<PassengerLayout />}>
                  <Route path="/ride" element={<RidePage />} />
                  <Route path="/auth" element={<AuthPage />} />
                  <Route path="/history" element={<ProtectedRoute><RideHistoryPage /></ProtectedRoute>} />
                  <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
                  <Route path="/payment-methods" element={<ProtectedRoute><PaymentMethodsPage /></ProtectedRoute>} />
                  <Route path="/promos" element={<ProtectedRoute><PromosPage /></ProtectedRoute>} />
                  <Route path="/scheduled-rides" element={<ProtectedRoute><ScheduledRidesPage /></ProtectedRoute>} />
                  <Route path="/help" element={<HelpSupportPage />} />
                  <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
                  <Route path="/safety" element={<SafetyPage />} />
                  <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
                </Route>

                {/* DRIVER / PARTNER app (blueprint): Home → Online Status → Looking for Ride → Ride Request → Arriving → Pickup → Ongoing Trip → Complete → Rate Passenger */}
                <Route element={<DriverLayout />}>
                  <Route path="/drive" element={<DrivePage />} />
                  <Route path="/earnings" element={<ProtectedRoute><DriverEarningsPage /></ProtectedRoute>} />
                  <Route path="/performance" element={<ProtectedRoute><DriverPerformancePage /></ProtectedRoute>} />
                  <Route path="/wallet" element={<ProtectedRoute><WalletPage /></ProtectedRoute>} />
                  <Route path="/driver-help" element={<DriverHelpSupportPage />} />
                  <Route path="/driver-settings" element={<ProtectedRoute><DriverSettingsPage /></ProtectedRoute>} />
                  <Route path="/driver-safety" element={<DriverSafetyPage />} />
                  <Route path="/referral" element={<ProtectedRoute><ReferralPage /></ProtectedRoute>} />
                  <Route path="/driver-notifications" element={<ProtectedRoute><DriverNotificationsPage /></ProtectedRoute>} />
                </Route>

                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </GoogleMapsProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
