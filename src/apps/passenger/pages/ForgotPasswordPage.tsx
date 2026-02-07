import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GoRideLogo } from "@/components/icons/GoRideLogo";
import { toast } from "sonner";
import { Loader2, ArrowLeft } from "lucide-react";
import { api } from "@/shared";
import { Helmet } from "react-helmet-async";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [resetLink, setResetLink] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Please enter your email");
      return;
    }
    setLoading(true);
    setResetLink(null);
    const { data, error } = await api.post<{ message: string; reset_link?: string }>(
      "/auth/forgot-password",
      { email: email.trim().toLowerCase() }
    );
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setSent(true);
    if (data?.reset_link) setResetLink(data.reset_link);
    toast.success(data?.reset_link ? "Use the link below to reset your password." : "No account found for that email.");
  };

  return (
    <>
      <Helmet>
        <title>Forgot password | GoRide</title>
      </Helmet>
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-muted/30">
        <Link to="/auth" className="absolute top-4 left-4 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Back to login
        </Link>
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <GoRideLogo className="h-8 mx-auto mb-2" />
            <CardTitle>Forgot password</CardTitle>
            <CardDescription>
              Enter your email and we’ll send you a link to reset your password.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!sent ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send reset link"}
                </Button>
              </form>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  If an account exists for that email, we’ve sent instructions. Check your inbox, or use the link below (for development):
                </p>
                {resetLink ? (
                  <>
                    <p className="text-sm font-medium text-foreground">
                      No email is sent in this setup. Use the link below to reset your password:
                    </p>
                    <div className="rounded-lg border-2 border-primary/30 bg-primary/5 p-4">
                      <p className="text-xs text-muted-foreground mb-2">Click to open and set a new password:</p>
                      <a
                        href={resetLink}
                        className="text-sm font-medium text-primary break-all hover:underline block"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {resetLink}
                      </a>
                      <Button asChild size="sm" className="mt-3">
                        <a href={resetLink} target="_blank" rel="noopener noreferrer">
                          Open reset page
                        </a>
                      </Button>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No account found for that email. Try another address or create an account.
                  </p>
                )}
                <Button asChild variant="outline" className="w-full">
                  <Link to="/auth">Back to login</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default ForgotPasswordPage;
