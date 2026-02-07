import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Shield, Share2, AlertCircle } from "lucide-react";
import { Helmet } from "react-helmet-async";

export const SafetyPage = () => (
  <>
    <Helmet>
      <title>Safety | GoRide</title>
    </Helmet>
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      <Link to="/ride">
        <Button variant="ghost" size="sm" className="gap-2 mb-4">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
      </Link>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Safety
          </CardTitle>
          <CardDescription>Your safety is our priority.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
            <Share2 className="h-5 w-5 mt-0.5 text-primary" />
            <div>
              <p className="font-medium">Share trip</p>
              <p className="text-sm text-muted-foreground">Share your live trip with trusted contacts.</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
            <AlertCircle className="h-5 w-5 mt-0.5 text-primary" />
            <div>
              <p className="font-medium">Emergency assistance</p>
              <p className="text-sm text-muted-foreground">Quick access to emergency services.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  </>
);

export default SafetyPage;
