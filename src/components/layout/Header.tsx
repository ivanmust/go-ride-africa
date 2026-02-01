import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { GoRideLogo } from "@/components/icons/GoRideLogo";
import { Button } from "@/components/ui/button";
import { Menu, X, ChevronDown, User, History, LogOut, Car, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";

const navItems = [
  { label: "Ride", href: "/ride" },
  { label: "Drive", href: "/drive" },
  { label: "Business", href: "/business" },
  { label: "About", href: "/about" },
];

export const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, userRole, isDriver, signOut, switchRole } = useAuth();
  const [isSwitching, setIsSwitching] = useState(false);

  const getInitials = (name: string | null) => {
    if (!name) return "U";
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const handleSwitchRole = async () => {
    if (isSwitching) return;
    setIsSwitching(true);
    const newRole = isDriver ? 'passenger' : 'driver';
    const { error } = await switchRole(newRole);
    setIsSwitching(false);
    
    if (error) {
      toast.error("Failed to switch role");
    } else {
      toast.success(`Switched to ${newRole} mode`);
      navigate(newRole === 'driver' ? '/drive' : '/ride');
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
      <nav className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center">
          <GoRideLogo size="md" />
        </Link>

        <div className="hidden md:flex items-center gap-1">
          {navItems.map((item) => (
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
          <Button variant="goride-ghost" size="sm">
            Help
          </Button>
          
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
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                  Current mode: {isDriver ? 'Driver' : 'Passenger'}
                </div>
                <DropdownMenuItem onClick={handleSwitchRole} disabled={isSwitching}>
                  {isDriver ? (
                    <>
                      <Users className="mr-2 h-4 w-4" />
                      Switch to Passenger
                    </>
                  ) : (
                    <>
                      <Car className="mr-2 h-4 w-4" />
                      Switch to Driver
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/profile")}>
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/history")}>
                  <History className="mr-2 h-4 w-4" />
                  Ride History
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
            {navItems.map((item) => (
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
            <div className="border-t border-border my-2" />
            {user ? (
              <>
                <div className="px-4 py-2 text-sm text-muted-foreground">
                  Current mode: {isDriver ? 'Driver' : 'Passenger'}
                </div>
                <Button 
                  variant="goride-outline" 
                  className="w-full" 
                  onClick={() => {
                    handleSwitchRole();
                    setMobileMenuOpen(false);
                  }}
                  disabled={isSwitching}
                >
                  {isDriver ? (
                    <><Users className="mr-2 h-4 w-4" /> Switch to Passenger</>
                  ) : (
                    <><Car className="mr-2 h-4 w-4" /> Switch to Driver</>
                  )}
                </Button>
                <Link to="/profile" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="goride-outline" className="w-full">Profile</Button>
                </Link>
                <Link to="/history" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="goride-outline" className="w-full">Ride History</Button>
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
