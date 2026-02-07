import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link, useSearchParams } from 'react-router-dom';
import { usePassengerAuth } from "@/apps/passenger/auth/PassengerAuthContext";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { GoRideLogo } from '@/components/icons/GoRideLogo';
import { toast } from 'sonner';
import { Loader2, Phone, Mail, ArrowLeft } from 'lucide-react';
import { z } from 'zod';

const emailSchema = z.string().email('Please enter a valid email address');
const passwordSchema = z.string().min(6, 'Password must be at least 6 characters');
const phoneSchema = z.string().regex(/^\+?[1-9]\d{8,14}$/, 'Please enter a valid phone number');

type AuthMode = 'select' | 'email-login' | 'email-signup' | 'phone' | 'otp';

const AuthPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { user, loading, roleError, signInWithEmail, signUpWithEmail, signInWithPhone, verifyOtp } = usePassengerAuth();
  const justResetPassword = searchParams.get('passwordReset') === '1';

  const [mode, setMode] = useState<AuthMode>(() => (justResetPassword ? 'email-login' : 'select'));
  const [formLoading, setFormLoading] = useState(false);
  
  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');

  const from = (location.state as { from?: Location })?.from?.pathname || '/';

  // Redirect only after auth is fully ready; defer to next tick to avoid navigation during state update (prevents refresh)
  useEffect(() => {
    if (loading || !user || roleError) return;
    const tid = requestAnimationFrame(() => {
      navigate(from, { replace: true });
    });
    return () => cancelAnimationFrame(tid);
  }, [loading, user, roleError, navigate, from]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      emailSchema.parse(email);
      passwordSchema.parse(password);
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast.error(err.errors[0].message);
        return;
      }
    }

    setFormLoading(true);
    const { error } = await signInWithEmail(email, password);
    setFormLoading(false);

    if (error) {
      const msg = error.message || "Login failed";
      if (msg.includes("No role assigned")) {
        toast.error(
          "Your account has no role yet. Ask an admin to run: node scripts/fix-user-login.mjs " + email,
          { duration: 8000 }
        );
      } else if (msg.includes("Invalid email or password") || msg.includes("Invalid login credentials") || (error as { code?: string }).code === "invalid_credentials") {
        const hint = justResetPassword ? " Use the new password you just set and the same email." : "";
        toast.error("Invalid email or password." + hint + (justResetPassword ? "" : " Don't have an account? Use Sign up first."));
      } else if (msg.includes("drivers") && msg.toLowerCase().includes("driver")) {
        toast.error("This account is for drivers. Use the GoRide Driver app to sign in.");
      } else {
        toast.error(msg);
      }
    } else {
      toast.success('Welcome back!');
    }
  };

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      emailSchema.parse(email);
      passwordSchema.parse(password);
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast.error(err.errors[0].message);
        return;
      }
    }

    setFormLoading(true);
    const { error } = await signUpWithEmail(email, password, fullName);
    setFormLoading(false);

    if (error) {
      if (error.message.includes('already registered')) {
        toast.error('This email is already registered. Try logging in instead.');
      } else {
        toast.error(error.message);
      }
    } else {
      toast.success('Account created successfully!');
    }
  };

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      phoneSchema.parse(phone);
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast.error(err.errors[0].message);
        return;
      }
    }

    setFormLoading(true);
    const { error } = await signInWithPhone(phone);
    setFormLoading(false);

    if (error) {
      toast.error(error.message);
    } else {
      setMode('otp');
      toast.success('OTP sent to your phone');
    }
  };

  const handleOtpVerify = async () => {
    if (otp.length !== 6) {
      toast.error('Please enter the 6-digit code');
      return;
    }

    setFormLoading(true);
    const { error } = await verifyOtp(phone, otp);
    setFormLoading(false);

    if (error) {
      toast.error('Invalid or expired code');
    } else {
      toast.success('Welcome!');
    }
  };

  const renderContent = () => {
    switch (mode) {
      case 'select':
        return (
          <div className="space-y-4">
            <Button
              variant="outline"
              className="w-full h-14 text-lg justify-start gap-4"
              onClick={() => setMode('phone')}
            >
              <Phone className="h-5 w-5" />
              Continue with Phone
            </Button>
            <Button
              variant="outline"
              className="w-full h-14 text-lg justify-start gap-4"
              onClick={() => setMode('email-login')}
            >
              <Mail className="h-5 w-5" />
              Continue with Email
            </Button>
          </div>
        );

      case 'email-login':
      case 'email-signup':
        return (
          <Tabs value={mode === 'email-login' ? 'login' : 'signup'} onValueChange={(v) => setMode(v === 'login' ? 'email-login' : 'email-signup')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login" className="mt-6">
              {justResetPassword && (
                <p className="text-sm text-primary mb-4 rounded-md bg-primary/10 p-3">
                  Use the new password you just set to sign in.
                </p>
              )}
              <form onSubmit={handleEmailLogin} className="space-y-4">
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
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <div className="flex justify-end">
                    <Link to="/forgot-password" className="text-sm text-muted-foreground hover:text-primary">
                      Forgot password?
                    </Link>
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={formLoading}>
                  {formLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Login'}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup" className="mt-6">
              <form onSubmit={handleEmailSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="John Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signupEmail">Email</Label>
                  <Input
                    id="signupEmail"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signupPassword">Password</Label>
                  <Input
                    id="signupPassword"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={formLoading}>
                  {formLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create Account'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        );

      case 'phone':
        return (
          <form onSubmit={handlePhoneSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+250 788 123 456"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
              <p className="text-sm text-muted-foreground">
                Include your country code (e.g., +250 for Rwanda)
              </p>
            </div>
            <Button type="submit" className="w-full" disabled={formLoading}>
              {formLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Send Code'}
            </Button>
          </form>
        );

      case 'otp':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <p className="text-muted-foreground">
                Enter the 6-digit code sent to
              </p>
              <p className="font-medium">{phone}</p>
            </div>
            <div className="flex justify-center">
              <InputOTP
                maxLength={6}
                value={otp}
                onChange={setOtp}
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>
            <Button onClick={handleOtpVerify} className="w-full" disabled={formLoading || otp.length !== 6}>
              {formLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Verify'}
            </Button>
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => {
                setOtp('');
                setMode('phone');
              }}
            >
              Didn't receive code? Resend
            </Button>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <GoRideLogo className="h-12 w-auto" />
          </div>
          <CardTitle className="text-2xl">
            {mode === 'select' && 'Welcome to GoRide'}
            {mode === 'email-login' && 'Sign in to your account'}
            {mode === 'email-signup' && 'Create your account'}
            {mode === 'phone' && 'Enter your phone number'}
            {mode === 'otp' && 'Verify your phone'}
          </CardTitle>
          <CardDescription>
            {mode === 'select' && 'Choose how you want to continue'}
            {mode === 'email-login' && 'Enter your email and password'}
            {mode === 'email-signup' && 'Fill in your details to get started'}
            {mode === 'phone' && 'We\'ll send you a verification code'}
            {mode === 'otp' && 'Enter the code we sent you'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {mode !== 'select' && (
            <Button
              variant="ghost"
              size="sm"
              className="mb-4"
              onClick={() => setMode('select')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          )}
          {renderContent()}
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthPage;
