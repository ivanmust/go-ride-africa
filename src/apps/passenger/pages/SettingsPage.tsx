import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ArrowLeft, Settings, AlertTriangle } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { usePassengerAuth } from "@/apps/passenger/auth/PassengerAuthContext";
import { api } from "@/shared";
import { toast } from "sonner";

export const SettingsPage = () => {
  const navigate = useNavigate();
  const { signOut } = usePassengerAuth();
  const [deactivating, setDeactivating] = useState(false);

  const handleDeactivate = async () => {
    setDeactivating(true);
    const { error } = await api.post("/auth/deactivate");
    setDeactivating(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Account deactivated.");
    await signOut();
    navigate("/", { replace: true });
  };

  return (
    <>
      <Helmet>
        <title>Settings | GoRide</title>
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
              <Settings className="h-5 w-5" />
              Settings
            </CardTitle>
            <CardDescription>Manage your app preferences.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <Label htmlFor="notifications">Push notifications</Label>
              <Switch id="notifications" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="location">Share location</Label>
              <Switch id="location" defaultChecked />
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6 border-destructive/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Danger zone
            </CardTitle>
            <CardDescription>
              Deactivating your account will log you out and prevent future logins. Contact support to reactivate.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="border-destructive text-destructive hover:bg-destructive/10">
                  Deactivate account
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Deactivate account?</AlertDialogTitle>
                  <AlertDialogDescription>
                    You will be logged out and will not be able to sign in again until your account is reactivated by support. This does not delete your data.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeactivate}
                    disabled={deactivating}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {deactivating ? "Deactivating…" : "Deactivate"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default SettingsPage;
