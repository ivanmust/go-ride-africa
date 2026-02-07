import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, User, FileCheck, ChevronRight } from "lucide-react";
import { Helmet } from "react-helmet-async";

type OnboardingStep = "profile" | "location" | "terms";

/**
 * Shared Onboarding (Signup: Profile → Location → Terms) per blueprint.
 */
export const OnboardingPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<OnboardingStep>("profile");
  const [fullName, setFullName] = useState("");
  const [address, setAddress] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const handleNext = () => {
    if (step === "profile") setStep("location");
    else if (step === "location") setStep("terms");
    else navigate("/welcome");
  }

  return (
    <>
      <Helmet>
        <title>Complete your profile | GoRide</title>
      </Helmet>
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {step === "profile" && <User className="h-5 w-5" />}
              {step === "location" && <MapPin className="h-5 w-5" />}
              {step === "terms" && <FileCheck className="h-5 w-5" />}
              {step === "profile" && "Your profile"}
              {step === "location" && "Your location"}
              {step === "terms" && "Terms & conditions"}
            </CardTitle>
            <CardDescription>
              {step === "profile" && "Tell us your name."}
              {step === "location" && "Set your default location (optional)."}
              {step === "terms" && "Please read and accept our terms to continue."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {step === "profile" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full name</Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Jean Pierre"
                  />
                </div>
              </>
            )}
            {step === "location" && (
              <div className="space-y-2">
                <Label htmlFor="address">Default address (optional)</Label>
                <Input
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. Kigali, Rwanda"
                />
              </div>
            )}
            {step === "terms" && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  By continuing you agree to our Terms of Service and Privacy Policy.
                </p>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm">I accept the terms</span>
                </label>
              </div>
            )}
            <Button onClick={handleNext} className="w-full gap-2" disabled={step === "terms" && !acceptedTerms}>
              {step === "terms" ? "Finish" : "Next"}
              <ChevronRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default OnboardingPage;
