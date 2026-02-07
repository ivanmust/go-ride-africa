import { Navigate, useLocation } from "react-router-dom";
import { useAdminAuth } from "./auth/AdminAuthContext";
import { Loader2 } from "lucide-react";

export function AdminProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAdminAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
