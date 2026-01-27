import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/home/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { DriverDashboard } from "@/components/driver/DriverDashboard";
import { DriverDocumentsSection } from "@/components/driver/DriverDocumentsSection";
import { DriverHeroSection } from "@/components/driver/DriverHeroSection";
import { DriverSignupForm } from "@/components/driver/DriverSignupForm";
import { DriverStepsSection } from "@/components/driver/DriverStepsSection";
import { DriverRequirementsSection } from "@/components/driver/DriverRequirementsSection";
import { DriverCTASection } from "@/components/driver/DriverCTASection";
import { Helmet } from "react-helmet-async";

export const DrivePage = () => {
  const { user, isDriver, loading } = useAuth();

  // Show driver dashboard if logged in as driver
  if (!loading && user && isDriver) {
    return (
      <>
        <Helmet>
          <title>Driver Dashboard | GoRide</title>
          <meta name="description" content="Manage your rides, track earnings, and go online to start accepting ride requests." />
        </Helmet>
        <div className="min-h-screen bg-background">
          <Header />
          <main className="pt-16">
            <DriverDashboard />
            
            {/* Documents Section */}
            <div className="container mx-auto px-4 py-8">
              <DriverDocumentsSection />
            </div>
          </main>
          <Footer />
        </div>
      </>
    );
  }

  // Show signup/landing page for non-drivers
  return (
    <>
      <Helmet>
        <title>Drive with GoRide | Earn Money on Your Schedule</title>
        <meta
          name="description"
          content="Become a GoRide driver-partner. Set your own hours, earn competitive pay, and join thousands of drivers across Africa. Sign up today!"
        />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />

        <main className="pt-16">
          {/* Hero Section */}
          <section className="relative py-20 lg:py-32 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-goride-amber-light via-background to-goride-green-light opacity-50" />

            <div className="container mx-auto px-4 relative z-10">
              <div className="grid lg:grid-cols-2 gap-12 items-center">
                <DriverHeroSection />
                <DriverSignupForm />
              </div>
            </div>
          </section>

          <DriverStepsSection />
          <DriverRequirementsSection />
          <DriverCTASection />
        </main>

        <Footer />
      </div>
    </>
  );
};

export default DrivePage;
