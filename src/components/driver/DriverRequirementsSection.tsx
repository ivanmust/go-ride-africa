import { DollarSign, Clock, Shield, CheckCircle2 } from "lucide-react";

const requirements = [
  "Valid driver's license (at least 1 year)",
  "National ID or Passport",
  "Vehicle registration documents",
  "Proof of vehicle insurance",
  "Pass a background check",
  "Vehicle inspection certificate",
];

export const DriverRequirementsSection = () => {
  return (
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
  );
};
