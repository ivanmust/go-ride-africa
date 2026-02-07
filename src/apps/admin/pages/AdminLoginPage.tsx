import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAdminAuth } from "../auth/AdminAuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GoRideLogo } from "@/components/icons/GoRideLogo";
import { toast } from "sonner";
import { Loader2, Shield } from "lucide-react";

export function AdminLoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading, signInWithEmail, roleError } = useAdminAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || "/";

  // Redirect only after auth is fully ready; defer to next tick to avoid navigation during state update (prevents refresh)
  useEffect(() => {
    if (loading || !user || roleError) return;
    const tid = requestAnimationFrame(() => {
      navigate(from, { replace: true });
    });
    return () => cancelAnimationFrame(tid);
  }, [loading, user, roleError, navigate, from]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const { error } = await signInWithEmail(email, password);
    setSubmitting(false);
    if (error) {
      const isAccessDenied = error.message.includes("Access denied");
      const isInvalidCreds = error.message.includes("Invalid login credentials") || (error as { code?: string }).code === "invalid_credentials";
      if (isAccessDenied) toast.error("Not an admin account");
      else if (isInvalidCreds) toast.error("Invalid email or password. Create the user in Supabase (Authentication → Users) or sign up on the main app, then add admin role.");
      else toast.error(error.message);
    } else {
      toast.success("Signed in");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2">
            <GoRideLogo size="md" />
          </div>
          <CardTitle className="flex items-center justify-center gap-2">
            <Shield className="h-5 w-5" />
            Admin Portal
          </CardTitle>
          <CardDescription>Sign in with your admin account</CardDescription>
          {roleError && (
            <p className="text-sm text-destructive mt-2 font-medium">{roleError}</p>
          )}
          <p className="text-xs text-muted-foreground mt-2">
            Admin access: create an admin user with{" "}
            <code className="bg-muted px-1 rounded">npm run create-admin-postgres -- your@email.com YourPassword</code>.
            Then sign in here with that email and password.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="mt-1"
              />
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sign in
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
