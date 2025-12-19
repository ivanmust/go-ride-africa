import { Header } from "@/components/layout/Header";
import { HeroSection } from "@/components/home/HeroSection";
import { FeaturesSection } from "@/components/home/FeaturesSection";
import { HowItWorksSection } from "@/components/home/HowItWorksSection";
import { DriveSection } from "@/components/home/DriveSection";
import { DownloadSection } from "@/components/home/DownloadSection";
import { Footer } from "@/components/home/Footer";
import { Helmet } from "react-helmet-async";

const Index = () => {
  return (
    <>
      <Helmet>
        <title>GoRide - Your Reliable Ride in Africa | Request a Ride Now</title>
        <meta
          name="description"
          content="GoRide is Africa's trusted ride-hailing platform. Request a safe, affordable ride in seconds. Available in Kigali and expanding across Africa. Download the app today!"
        />
        <meta name="keywords" content="ride hailing, taxi, Kigali, Rwanda, Africa, transport, GoRide" />
        <link rel="canonical" href="https://goride.rw" />
      </Helmet>
      
      <div className="min-h-screen bg-background">
        <Header />
        <main>
          <HeroSection />
          <FeaturesSection />
          <HowItWorksSection />
          <DriveSection />
          <DownloadSection />
        </main>
        <Footer />
      </div>
    </>
  );
};

export default Index;
