import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GoRideLogo } from "@/components/icons/GoRideLogo";
import { toast } from "sonner";
import { Loader2, ArrowLeft } from "lucide-react";
import { api } from "@/shared";
import { Helmet } from "react-helmet-async";

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      toast.error("Missing reset link. Request a new one from the forgot password page.");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords do not match");
      return;
    }
    setLoading(true);
    const { error } = await api.post("/auth/reset-password", { token, new_password: password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setSuccess(true);
    toast.success("Password updated. Use your new password to sign in.");
    navigate("/auth?passwordReset=1", { replace: true });
  };

  if (!token && !success) {
    return (
      <>
        <Helmet>
          <title>Reset password | GoRide</title>
        </Helmet>
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-muted/30">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <GoRideLogo className="h-8 mx-auto mb-2" />
              <CardTitle>Invalid reset link</CardTitle>
              <CardDescription>
                This link is missing or invalid. Please request a new password reset from the login page.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link to="/forgot-password">Request new link</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  if (success) {
    return (
      <>
        <Helmet>
          <title>Password reset | GoRide</title>
        </Helmet>
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-muted/30">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <GoRideLogo className="h-8 mx-auto mb-2" />
              <CardTitle>Password updated</CardTitle>
              <CardDescription>Redirecting to login… Use the new password you just set.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link to="/auth?passwordReset=1">Log in</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Reset password | GoRide</title>
      </Helmet>
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-muted/30">
        <Link to="/auth" className="absolute top-4 left-4 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Back to login
        </Link>
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <GoRideLogo className="h-8 mx-auto mb-2" />
            <CardTitle>Set new password</CardTitle>
            <CardDescription>Enter your new password below.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">New password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={6}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm">Confirm password</Label>
                <Input
                  id="confirm"
                  type="password"
                  placeholder="••••••••"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  minLength={6}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update password"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default ResetPasswordPage;
