import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { GoRideLogo } from "@/components/icons/GoRideLogo";
import { Button } from "@/components/ui/button";
import { Menu, X, ChevronDown, User, History, LogOut, Users, Wallet, HelpCircle, Settings, Shield, Bell, Gift } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDriverAuth } from "./auth/DriverAuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const driverNavItems = [
  { label: "Dashboard", href: "/" },
  { label: "Earnings", href: "/earnings" },
  { label: "Performance", href: "/performance" },
];

export const DriverHeader = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, signOut } = useDriverAuth();

  const getInitials = (name: string | null) => {
    if (!name) return "U";
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
      <nav className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center">
          <GoRideLogo size="md" />
        </Link>

        <div className="hidden md:flex items-center gap-1">
          {driverNavItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                location.pathname === item.href
                  ? "text-primary bg-goride-green-light"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              )}
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          <Button variant="ghost" size="sm">
            EN <ChevronDown className="w-3 h-3 ml-1" />
          </Button>
          <Link to="/driver-help">
            <Button variant="goride-ghost" size="sm">
              Help
            </Button>
          </Link>
          <a href="/">
            <Button variant="ghost" size="sm" className="text-muted-foreground">
              <Users className="mr-2 h-4 w-4" />
              Book a ride
            </Button>
          </a>
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={profile?.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                      {getInitials(profile?.full_name)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 max-h-[80vh] overflow-y-auto">
                <DropdownMenuItem onClick={() => navigate("/profile")}>
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/history")}>
                  <History className="mr-2 h-4 w-4" />
                  Ride History
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/wallet")}>
                  <Wallet className="mr-2 h-4 w-4" />
                  Wallet
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/driver-help")}>
                  <HelpCircle className="mr-2 h-4 w-4" />
                  Help & Support
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/driver-settings")}>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/driver-safety")}>
                  <Shield className="mr-2 h-4 w-4" />
                  Safety
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/referral")}>
                  <Gift className="mr-2 h-4 w-4" />
                  Referral
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/driver-notifications")}>
                  <Bell className="mr-2 h-4 w-4" />
                  Notifications
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button variant="goride-outline" size="sm" onClick={() => navigate("/auth")}>
                Log in
              </Button>
              <Button variant="goride" size="sm" onClick={() => navigate("/auth")}>
                Sign up
              </Button>
            </>
          )}
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
      </nav>

      {mobileMenuOpen && (
        <div className="md:hidden absolute top-16 left-0 right-0 bg-background border-b border-border animate-slide-down">
          <div className="container mx-auto px-4 py-4 flex flex-col gap-2">
            {driverNavItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                  location.pathname === item.href
                    ? "text-primary bg-goride-green-light"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                )}
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <a href="/" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="goride-outline" className="w-full">
                <Users className="mr-2 h-4 w-4" />
                Book a ride
              </Button>
            </a>
            <div className="border-t border-border my-2" />
            {user ? (
              <>
                <Link to="/profile" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="goride-outline" className="w-full">Profile</Button>
                </Link>
                <Link to="/history" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="goride-outline" className="w-full">Ride History</Button>
                </Link>
                <Link to="/wallet" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="goride-outline" className="w-full">Wallet</Button>
                </Link>
                <Link to="/driver-help" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="goride-outline" className="w-full">Help & Support</Button>
                </Link>
                <Link to="/driver-settings" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="goride-outline" className="w-full">Settings</Button>
                </Link>
                <Link to="/driver-safety" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="goride-outline" className="w-full">Safety</Button>
                </Link>
                <Link to="/referral" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="goride-outline" className="w-full">Referral</Button>
                </Link>
                <Link to="/driver-notifications" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="goride-outline" className="w-full">Notifications</Button>
                </Link>
                <Button variant="goride" className="w-full" onClick={handleSignOut}>
                  Log out
                </Button>
              </>
            ) : (
              <>
                <Button variant="goride-outline" className="w-full" onClick={() => navigate("/auth")}>
                  Log in
                </Button>
                <Button variant="goride" className="w-full" onClick={() => navigate("/auth")}>
                  Sign up
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
