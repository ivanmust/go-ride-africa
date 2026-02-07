import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useDriverAuth } from "../auth/DriverAuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GoRideLogo } from "@/components/icons/GoRideLogo";
import { toast } from "sonner";
import { Loader2, Mail, ArrowLeft, Car } from "lucide-react";

export function DriverLoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading, signInWithEmail, signUpWithEmail, roleError } = useDriverAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || "/";

  // Redirect only after auth is fully ready; defer to next tick to avoid navigation during state update (prevents refresh)
  useEffect(() => {
    if (loading || !user || roleError) return;
    const isOnLoginPage = location.pathname === "/login";
    if (!isOnLoginPage) return;
    const tid = requestAnimationFrame(() => {
      navigate(from, { replace: true });
    });
    return () => cancelAnimationFrame(tid);
  }, [loading, user, roleError, navigate, from, location.pathname]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setSubmitting(true);
    const { error } = await signInWithEmail(email, password);
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Signed in");
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim() || !password) return;
    setSubmitting(true);
    const { error } = await signUpWithEmail(email, password, fullName);
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Driver account created");
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
            <Car className="h-5 w-5" />
            Driver sign in
          </CardTitle>
          <CardDescription>Sign in or create your driver account</CardDescription>
          {roleError && <p className="text-sm text-destructive mt-2">{roleError}</p>}
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign up</TabsTrigger>
            </TabsList>
            <TabsContent value="login" className="mt-6">
              <form onSubmit={handleLogin} className="space-y-4">
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
                <Button
                  type="submit"
                  className="w-full"
                  disabled={!email.trim() || !password || submitting}
                >
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Sign in
                </Button>
              </form>
            </TabsContent>
            <TabsContent value="signup" className="mt-6">
              <form onSubmit={handleSignup} className="space-y-4">
                <div>
                  <Label htmlFor="fullName">Full name</Label>
                  <Input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="signupEmail">Email</Label>
                  <Input
                    id="signupEmail"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="signupPassword">Password</Label>
                  <Input
                    id="signupPassword"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="mt-1"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={!fullName.trim() || !email.trim() || !password || submitting}
                >
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create driver account
                </Button>
              </form>
            </TabsContent>
          </Tabs>
          <Button variant="ghost" className="w-full mt-4" onClick={() => navigate("/")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to dashboard
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
