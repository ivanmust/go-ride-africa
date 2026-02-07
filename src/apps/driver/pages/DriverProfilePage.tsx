import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useDriverAuth } from "@/apps/driver/auth/DriverAuthContext";
import { api } from "@/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Loader2, Camera, ArrowLeft } from "lucide-react";
import { Helmet } from "react-helmet-async";

export const DriverProfilePage = () => {
  const navigate = useNavigate();
  const { profile, updateProfile, refreshProfile, user } = useDriverAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fullName, setFullName] = useState(profile?.full_name ?? "");
  const [phone, setPhone] = useState(profile?.phone ?? "");
  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await updateProfile({ full_name: fullName || undefined, phone: phone || undefined });
    setLoading(false);
    if (error) toast.error("Failed to update profile");
    else toast.success("Profile updated");
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image");
      return;
    }
    setUploadingAvatar(true);
    const formData = new FormData();
    formData.append("file", file);
    const { data, error } = await api.uploadForm<{ avatar_url: string }>("/profiles/me/avatar", formData);
    setUploadingAvatar(false);
    if (error) {
      toast.error("Failed to upload avatar");
      return;
    }
    if (data?.avatar_url) {
      await updateProfile({ avatar_url: data.avatar_url });
      refreshProfile();
    }
    toast.success("Avatar updated");
  };

  return (
    <>
      <Helmet>
        <title>Profile | GoRide Driver</title>
      </Helmet>
      <div className="container max-w-xl mx-auto px-4 py-6">
        <Button variant="ghost" size="sm" className="gap-2 mb-4" onClick={() => navigate("/")}>
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Your driver account details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col items-center gap-4">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="relative rounded-full"
              >
                <Avatar className="h-24 w-24">
                  <AvatarImage src={profile?.avatar_url ?? undefined} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                    {(profile?.full_name ?? "D").slice(0, 1).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {uploadingAvatar && (
                  <div className="absolute inset-0 rounded-full bg-background/80 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                />
                <span className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                  <Camera className="h-4 w-4" />
                </span>
              </button>
            </div>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <Label htmlFor="fullName">Full name</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" value={profile?.email ?? ""} disabled className="mt-1 bg-muted" />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="mt-1"
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save changes
              </Button>
            </form>
            <Button variant="outline" className="w-full" onClick={() => navigate("/driver-settings")}>
              Settings
            </Button>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default DriverProfilePage;
