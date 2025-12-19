import { MapPin, Users, Navigation } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: MapPin,
    title: "Set your destination",
    description: "Enter where you want to go. Our app shows you fare estimates and nearby drivers.",
  },
  {
    number: "02",
    icon: Users,
    title: "Get matched with a driver",
    description: "We'll connect you with a verified driver nearby. See their rating, car details, and ETA.",
  },
  {
    number: "03",
    icon: Navigation,
    title: "Enjoy your ride",
    description: "Track your trip in real-time. Pay easily and rate your driver when you arrive.",
  },
];

export const HowItWorksSection = () => {
  return (
    <section className="py-20 lg:py-32">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="inline-block px-4 py-1.5 bg-goride-amber-light text-accent text-sm font-medium rounded-full mb-4">
            How it works
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Get a ride in 3 easy steps
          </h2>
          <p className="text-muted-foreground text-lg">
            Getting around has never been this simple. Here's how GoRide works.
          </p>
        </div>

        {/* Steps */}
        <div className="relative">
          {/* Connection Line */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-border to-transparent -translate-y-1/2" />

          <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
            {steps.map((step, index) => (
              <div key={step.number} className="relative group">
                {/* Step Card */}
                <div className="relative bg-card rounded-2xl p-8 border border-border text-center hover:shadow-lg hover:border-primary/20 transition-all duration-300">
                  {/* Step Number */}
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-bold">
                    {step.number}
                  </div>

                  {/* Icon */}
                  <div className="w-16 h-16 bg-goride-green-light rounded-2xl flex items-center justify-center mx-auto mt-4 mb-6 group-hover:scale-110 transition-transform">
                    <step.icon className="w-8 h-8 text-primary" />
                  </div>

                  {/* Content */}
                  <h3 className="text-xl font-semibold text-foreground mb-3">{step.title}</h3>
                  <p className="text-muted-foreground">{step.description}</p>
                </div>

                {/* Arrow (except last) */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-6 w-12 h-12 -translate-y-1/2">
                    <svg viewBox="0 0 24 24" fill="none" className="w-full h-full text-primary/30">
                      <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
