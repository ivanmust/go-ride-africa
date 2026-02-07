import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Users, Copy } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { toast } from "sonner";

export const ReferralPage = () => {
  const referralCode = "GORIDE-REF-XXXX";

  const copyCode = () => {
    navigator.clipboard.writeText(referralCode);
    toast.success("Referral code copied");
  };

  return (
    <>
      <Helmet>
        <title>Referral | GoRide Driver</title>
      </Helmet>
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        <Link to="/drive">
          <Button variant="ghost" size="sm" className="gap-2 mb-4">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Referral
            </CardTitle>
            <CardDescription>Invite other drivers and earn rewards.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input readOnly value={referralCode} className="font-mono" />
              <Button variant="outline" size="icon" onClick={copyCode}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Share your code with new drivers. You both get a bonus when they complete their first trip.
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default ReferralPage;
