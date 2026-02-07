import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, HelpCircle, Mail, MessageCircle } from "lucide-react";
import { Helmet } from "react-helmet-async";

export const HelpSupportPage = () => (
  <>
    <Helmet>
      <title>Help & Support | GoRide Driver</title>
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
            <HelpCircle className="h-5 w-5" />
            Help & Support
          </CardTitle>
          <CardDescription>Driver support and resources.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button variant="outline" className="w-full justify-start gap-2">
            <MessageCircle className="h-4 w-4" />
            Chat with support
          </Button>
          <Button variant="outline" className="w-full justify-start gap-2">
            <Mail className="h-4 w-4" />
            drivers@goride.rw
          </Button>
        </CardContent>
      </Card>
    </div>
  </>
);

export default HelpSupportPage;
