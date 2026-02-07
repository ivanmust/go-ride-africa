import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Bell } from "lucide-react";
import { Helmet } from "react-helmet-async";

export const NotificationsPage = () => (
  <>
    <Helmet>
      <title>Notifications | GoRide</title>
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
            <Bell className="h-5 w-5" />
            Notifications
          </CardTitle>
          <CardDescription>Choose what you want to be notified about.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <Label htmlFor="ride-updates">Ride updates</Label>
            <Switch id="ride-updates" defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="promos">Promos & offers</Label>
            <Switch id="promos" defaultChecked />
          </div>
        </CardContent>
      </Card>
    </div>
  </>
);

export default NotificationsPage;
