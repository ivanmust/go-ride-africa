import { User, FileText, Car, CheckCircle2, ChevronRight } from "lucide-react";

const steps = [
  { icon: User, title: "Create Account", description: "Sign up with your phone number and email" },
  { icon: FileText, title: "Submit Documents", description: "Upload your license, ID, and vehicle docs" },
  { icon: Car, title: "Vehicle Inspection", description: "Get your vehicle inspected at our partner centers" },
  { icon: CheckCircle2, title: "Start Earning", description: "Once approved, go online and start accepting rides" },
];

export const DriverStepsSection = () => {
  return (
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
  );
};
