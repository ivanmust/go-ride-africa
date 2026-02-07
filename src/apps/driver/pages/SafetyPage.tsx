import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Shield } from "lucide-react";
import { Helmet } from "react-helmet-async";

export const SafetyPage = () => (
  <>
    <Helmet>
      <title>Safety | GoRide Driver</title>
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
            <Shield className="h-5 w-5" />
            Safety
          </CardTitle>
          <CardDescription>Driver safety guidelines and emergency tools.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Your safety and that of passengers is our priority. Use in-app emergency features when needed.
          </p>
        </CardContent>
      </Card>
    </div>
  </>
);

export default SafetyPage;
