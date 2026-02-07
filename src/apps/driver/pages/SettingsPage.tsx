import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Settings } from "lucide-react";
import { Helmet } from "react-helmet-async";

export const SettingsPage = () => (
  <>
    <Helmet>
      <title>Settings | GoRide Driver</title>
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
            <Settings className="h-5 w-5" />
            Settings
          </CardTitle>
          <CardDescription>Manage your driver app preferences.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <Label htmlFor="notifications">Push notifications</Label>
            <Switch id="notifications" defaultChecked />
          </div>
        </CardContent>
      </Card>
    </div>
  </>
);

export default SettingsPage;
