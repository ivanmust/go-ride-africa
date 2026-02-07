import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MapPin, Car, Shield } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { GoRideLogo } from "@/components/icons/GoRideLogo";

export const AboutPage = () => (
  <>
    <Helmet>
      <title>About Us | GoRide</title>
      <meta name="description" content="Learn about GoRide – reliable ride-sharing across Rwanda and Africa." />
    </Helmet>
    <div className="min-h-screen bg-background">
      <div className="container max-w-3xl mx-auto px-4 py-8">
        <Link to="/">
          <Button variant="ghost" size="sm" className="gap-2 mb-6">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </Link>
        <div className="flex items-center gap-3 mb-8">
          <GoRideLogo size="lg" />
          <div>
            <h1 className="text-3xl font-bold text-foreground">About GoRide</h1>
            <p className="text-muted-foreground">Your reliable ride in Africa</p>
          </div>
        </div>

        <div className="space-y-6 text-foreground">
          <p className="text-muted-foreground leading-relaxed">
            GoRide is a ride-sharing platform built for Rwanda and expanding across Africa. We connect riders with verified drivers for safe, affordable trips.
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex gap-3 p-4 rounded-xl bg-secondary">
              <MapPin className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-foreground">Where we operate</h3>
                <p className="text-sm text-muted-foreground">Starting in Kigali with plans to expand across Rwanda and the region.</p>
              </div>
            </div>
            <div className="flex gap-3 p-4 rounded-xl bg-secondary">
              <Car className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-foreground">Riders & drivers</h3>
                <p className="text-sm text-muted-foreground">Request a ride or earn by driving. One app for both.</p>
              </div>
            </div>
            <div className="flex gap-3 p-4 rounded-xl bg-secondary sm:col-span-2">
              <Shield className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-foreground">Safety first</h3>
                <p className="text-sm text-muted-foreground">Verified drivers, transparent fares, and in-app support so you can ride with confidence.</p>
              </div>
            </div>
          </div>

          <p className="text-muted-foreground text-sm pt-4">
            For support or partnership inquiries, use Help & Support in the app or reach out at support@goride.rw.
          </p>
        </div>
      </div>
    </div>
  </>
);

export default AboutPage;
