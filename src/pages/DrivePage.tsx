import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/home/Footer";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { DriverDashboard } from "@/components/driver/DriverDashboard";
import {
  DollarSign,
  Clock,
  Shield,
  TrendingUp,
  CheckCircle2,
  ChevronRight,
  Car,
  FileText,
  User,
} from "lucide-react";
import { Helmet } from "react-helmet-async";

const requirements = [
  "Valid driver's license (at least 1 year)",
  "National ID or Passport",
  "Vehicle registration documents",
  "Proof of vehicle insurance",
  "Pass a background check",
  "Vehicle inspection certificate",
];

const steps = [
  { icon: User, title: "Create Account", description: "Sign up with your phone number and email" },
  { icon: FileText, title: "Submit Documents", description: "Upload your license, ID, and vehicle docs" },
  { icon: Car, title: "Vehicle Inspection", description: "Get your vehicle inspected at our partner centers" },
  { icon: CheckCircle2, title: "Start Earning", description: "Once approved, go online and start accepting rides" },
];

const earnings = [
  { amount: "RWF 50,000+", period: "per week", description: "Average earnings for active drivers" },
  { amount: "85%", period: "", description: "Of fare goes to you" },
  { amount: "Weekly", period: "", description: "Payouts to your mobile money" },
];

export const DrivePage = () => {
  const navigate = useNavigate();
  const { user, isDriver, loading } = useAuth();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    city: "",
    hasVehicle: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Navigate to auth page with driver type
    navigate("/auth?type=driver");
  };

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
          </main>
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
                {/* Content */}
                <div className="animate-slide-up">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-goride-amber-light text-accent rounded-full text-sm font-medium mb-6">
                    <TrendingUp className="w-4 h-4" />
                    High demand in your area
                  </div>

                  <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight mb-6">
                    Drive with GoRide,{" "}
                    <span className="text-accent">earn your way</span>
                  </h1>

                  <p className="text-lg text-muted-foreground mb-8 max-w-lg">
                    Join thousands of driver-partners earning competitive income on their own schedule. 
                    Sign up today and start earning within days.
                  </p>

                  {/* Earnings Preview */}
                  <div className="grid grid-cols-3 gap-4 mb-8">
                    {earnings.map((item, index) => (
                      <div key={index} className="bg-card rounded-xl p-4 border border-border">
                        <div className="text-xl font-bold text-foreground">{item.amount}</div>
                        {item.period && <div className="text-sm text-muted-foreground">{item.period}</div>}
                        <div className="text-xs text-muted-foreground mt-1">{item.description}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Sign Up Form */}
                <div className="bg-card rounded-2xl shadow-xl p-8 border border-border animate-fade-in">
                  <h2 className="text-2xl font-bold text-foreground mb-6">Start your application</h2>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-foreground mb-1 block">First Name</label>
                        <input
                          type="text"
                          value={formData.firstName}
                          onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                          className="w-full px-4 py-3 bg-secondary rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                          placeholder="Jean"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-foreground mb-1 block">Last Name</label>
                        <input
                          type="text"
                          value={formData.lastName}
                          onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                          className="w-full px-4 py-3 bg-secondary rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                          placeholder="Dupont"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-foreground mb-1 block">Phone Number</label>
                      <div className="flex">
                        <span className="inline-flex items-center px-4 bg-secondary rounded-l-xl border-r border-border text-muted-foreground">
                          +250
                        </span>
                        <input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          className="flex-1 px-4 py-3 bg-secondary rounded-r-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                          placeholder="788 123 456"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-foreground mb-1 block">Email</label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-4 py-3 bg-secondary rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                        placeholder="jean@email.com"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium text-foreground mb-1 block">City</label>
                      <select
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        className="w-full px-4 py-3 bg-secondary rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                      >
                        <option value="">Select your city</option>
                        <option value="kigali">Kigali</option>
                        <option value="huye">Huye</option>
                        <option value="musanze">Musanze</option>
                        <option value="rubavu">Rubavu</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-foreground mb-1 block">Do you have a vehicle?</label>
                      <div className="flex gap-4">
                        <label className="flex-1">
                          <input
                            type="radio"
                            name="hasVehicle"
                            value="yes"
                            className="sr-only peer"
                            onChange={(e) => setFormData({ ...formData, hasVehicle: e.target.value })}
                          />
                          <div className="p-4 bg-secondary rounded-xl text-center cursor-pointer peer-checked:bg-primary peer-checked:text-primary-foreground transition-all">
                            Yes
                          </div>
                        </label>
                        <label className="flex-1">
                          <input
                            type="radio"
                            name="hasVehicle"
                            value="no"
                            className="sr-only peer"
                            onChange={(e) => setFormData({ ...formData, hasVehicle: e.target.value })}
                          />
                          <div className="p-4 bg-secondary rounded-xl text-center cursor-pointer peer-checked:bg-primary peer-checked:text-primary-foreground transition-all">
                            No
                          </div>
                        </label>
                      </div>
                    </div>

                    <Button type="submit" variant="goride-accent" size="xl" className="w-full">
                      Apply Now
                      <ChevronRight className="w-5 h-5" />
                    </Button>

                    <p className="text-xs text-muted-foreground text-center">
                      By signing up, you agree to our Terms of Service and Privacy Policy
                    </p>
                  </form>
                </div>
              </div>
            </div>
          </section>

          {/* How It Works */}
          <section className="py-20 bg-secondary/30">
            <div className="container mx-auto px-4">
              <div className="text-center max-w-2xl mx-auto mb-16">
                <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                  Get on the road in 4 easy steps
                </h2>
                <p className="text-muted-foreground text-lg">
                  Our simple signup process gets you earning quickly
                </p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {steps.map((step, index) => (
                  <div key={step.title} className="relative">
                    <div className="bg-card rounded-2xl p-6 border border-border h-full">
                      <div className="w-12 h-12 bg-goride-amber-light rounded-xl flex items-center justify-center mb-4">
                        <step.icon className="w-6 h-6 text-accent" />
                      </div>
                      <div className="text-xs font-bold text-accent mb-2">STEP {index + 1}</div>
                      <h3 className="text-lg font-semibold text-foreground mb-2">{step.title}</h3>
                      <p className="text-muted-foreground text-sm">{step.description}</p>
                    </div>
                    {index < steps.length - 1 && (
                      <div className="hidden lg:block absolute top-1/2 -right-3 w-6 text-muted-foreground">
                        <ChevronRight className="w-6 h-6" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Requirements */}
          <section className="py-20">
            <div className="container mx-auto px-4">
              <div className="grid lg:grid-cols-2 gap-12 items-center">
                <div>
                  <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
                    Requirements to drive
                  </h2>
                  <p className="text-muted-foreground text-lg mb-8">
                    Make sure you meet these basic requirements before applying
                  </p>

                  <div className="space-y-4">
                    {requirements.map((req) => (
                      <div key={req} className="flex items-center gap-3">
                        <div className="w-6 h-6 bg-goride-green-light rounded-full flex items-center justify-center flex-shrink-0">
                          <CheckCircle2 className="w-4 h-4 text-primary" />
                        </div>
                        <span className="text-foreground">{req}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-card rounded-2xl p-8 border border-border">
                  <h3 className="text-xl font-semibold text-foreground mb-6">Why drivers love GoRide</h3>

                  <div className="space-y-6">
                    <div className="flex gap-4">
                      <div className="w-12 h-12 bg-goride-green-light rounded-xl flex items-center justify-center flex-shrink-0">
                        <DollarSign className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-medium text-foreground mb-1">Competitive earnings</h4>
                        <p className="text-sm text-muted-foreground">
                          Keep 85% of every fare. Earn bonuses during peak hours and complete ride challenges.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className="w-12 h-12 bg-goride-amber-light rounded-xl flex items-center justify-center flex-shrink-0">
                        <Clock className="w-6 h-6 text-accent" />
                      </div>
                      <div>
                        <h4 className="font-medium text-foreground mb-1">Flexible schedule</h4>
                        <p className="text-sm text-muted-foreground">
                          Work when you want. There's no minimum hours, and you can go offline anytime.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className="w-12 h-12 bg-goride-green-light rounded-xl flex items-center justify-center flex-shrink-0">
                        <Shield className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-medium text-foreground mb-1">Safety first</h4>
                        <p className="text-sm text-muted-foreground">
                          In-app safety features, 24/7 support, and comprehensive insurance coverage.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* CTA */}
          <section className="py-20 bg-primary">
            <div className="container mx-auto px-4 text-center">
              <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
                Ready to start earning?
              </h2>
              <p className="text-primary-foreground/80 text-lg mb-8 max-w-2xl mx-auto">
                Join thousands of driver-partners and start earning on your own terms today.
              </p>
              <Button 
                size="xl" 
                className="bg-foreground text-background hover:bg-foreground/90"
                onClick={() => navigate("/auth?type=driver")}
              >
                Apply Now
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default DrivePage;
