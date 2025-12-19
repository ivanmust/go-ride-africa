import { Shield, Clock, CreditCard, MapPin, Star, Headphones } from "lucide-react";
import { cn } from "@/lib/utils";

const features = [
  {
    icon: Shield,
    title: "Safe & Secure",
    description: "All drivers verified with background checks. Share your trip with loved ones in real-time.",
    color: "primary",
  },
  {
    icon: Clock,
    title: "Always On Time",
    description: "Real-time tracking and accurate ETAs. Get picked up within minutes, anytime.",
    color: "accent",
  },
  {
    icon: CreditCard,
    title: "Easy Payments",
    description: "Pay with cash, mobile money (MTN, Airtel), or cards. Simple and transparent pricing.",
    color: "primary",
  },
  {
    icon: MapPin,
    title: "Door to Door",
    description: "Get picked up and dropped off exactly where you need. Save your favorite locations.",
    color: "accent",
  },
  {
    icon: Star,
    title: "Rate & Review",
    description: "Help us improve by rating your rides. Only top-rated drivers on our platform.",
    color: "primary",
  },
  {
    icon: Headphones,
    title: "24/7 Support",
    description: "Our support team is always ready to help. Reach us anytime, in your language.",
    color: "accent",
  },
];

export const FeaturesSection = () => {
  return (
    <section className="py-20 lg:py-32 bg-secondary/30">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="inline-block px-4 py-1.5 bg-goride-green-light text-primary text-sm font-medium rounded-full mb-4">
            Why GoRide?
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            The smarter way to move around
          </h2>
          <p className="text-muted-foreground text-lg">
            Experience the future of urban mobility with features designed for Africa's fastest-growing cities.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="group relative bg-card rounded-2xl p-6 border border-border hover:border-primary/20 hover:shadow-lg transition-all duration-300"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div
                className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110",
                  feature.color === "primary" ? "bg-goride-green-light" : "bg-goride-amber-light"
                )}
              >
                <feature.icon
                  className={cn(
                    "w-6 h-6",
                    feature.color === "primary" ? "text-primary" : "text-accent"
                  )}
                />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
