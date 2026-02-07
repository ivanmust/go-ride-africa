import { useNavigate } from "react-router-dom";
import { GoRideLogo } from "@/components/icons/GoRideLogo";
import { Button } from "@/components/ui/button";
import { Car, Users } from "lucide-react";
import { Helmet } from "react-helmet-async";

/**
 * Shared Welcome screen – branching point to Passenger or Driver app (blueprint).
 */
export const WelcomePage = () => {
  const navigate = useNavigate();

  return (
    <>
      <Helmet>
        <title>Welcome | GoRide</title>
        <meta name="description" content="Choose how you want to use GoRide – get a ride or drive with us." />
      </Helmet>
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
        <GoRideLogo size="lg" className="mb-8" />
        <h1 className="text-2xl font-bold text-center text-foreground mb-2">Welcome to GoRide</h1>
        <p className="text-muted-foreground text-center mb-10 max-w-sm">
          How would you like to use GoRide?
        </p>
        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-xs">
          <Button
            variant="default"
            size="lg"
            className="flex-1 gap-2"
            onClick={() => navigate("/ride")}
          >
            <Users className="h-5 w-5" />
            Get a ride
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="flex-1 gap-2"
            onClick={() => { window.location.href = "/index-driver.html"; }}
          >
            <Car className="h-5 w-5" />
            Drive with us
          </Button>
        </div>
        <Button variant="ghost" className="mt-6" onClick={() => navigate("/auth")}>
          I already have an account
        </Button>
      </div>
    </>
  );
};

export default WelcomePage;
