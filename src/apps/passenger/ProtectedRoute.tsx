import { Navigate, useLocation } from "react-router-dom";
import { usePassengerAuth } from "./auth/PassengerAuthContext";
import { Loader2 } from "lucide-react";

export function PassengerProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = usePassengerAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
