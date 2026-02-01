import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { GoogleMapsProvider } from "@/components/maps/GoogleMapsProvider";
import Index from "./pages/Index";
import RidePage from "./pages/RidePage";
import DrivePage from "./pages/DrivePage";
import DriverEarningsPage from "./pages/DriverEarningsPage";
import AuthPage from "./pages/AuthPage";
import ProfilePage from "./pages/ProfilePage";
import RideHistoryPage from "./pages/RideHistoryPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <GoogleMapsProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AuthProvider>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/ride" element={<RidePage />} />
                <Route path="/drive" element={<DrivePage />} />
                <Route
                  path="/earnings"
                  element={
                    <ProtectedRoute>
                      <DriverEarningsPage />
                    </ProtectedRoute>
                  }
                />
                <Route path="/auth" element={<AuthPage />} />
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <ProfilePage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/history"
                  element={
                    <ProtectedRoute>
                      <RideHistoryPage />
                    </ProtectedRoute>
                  }
                />
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
