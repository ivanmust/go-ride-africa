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
      <title>Notifications | GoRide Driver</title>
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
            <Bell className="h-5 w-5" />
            Notifications
          </CardTitle>
          <CardDescription>Ride requests and account alerts.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <Label htmlFor="ride-requests">Ride requests</Label>
            <Switch id="ride-requests" defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="earnings">Earnings updates</Label>
            <Switch id="earnings" defaultChecked />
          </div>
        </CardContent>
      </Card>
    </div>
  </>
);

export default NotificationsPage;
