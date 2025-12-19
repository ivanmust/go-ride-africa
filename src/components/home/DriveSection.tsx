import { Button } from "@/components/ui/button";
import { ArrowRight, DollarSign, Clock, Users, Shield } from "lucide-react";
import { Link } from "react-router-dom";

const benefits = [
  {
    icon: DollarSign,
    title: "Earn More",
    description: "Competitive pay with bonuses during peak hours",
  },
  {
    icon: Clock,
    title: "Flexible Hours",
    description: "Work when you want, as much as you want",
  },
  {
    icon: Users,
    title: "Build Relationships",
    description: "Meet new people and grow your network",
  },
  {
    icon: Shield,
    title: "24/7 Support",
    description: "We're always here to help you succeed",
  },
];

export const DriveSection = () => {
  return (
    <section className="py-20 lg:py-32 bg-secondary/30">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left - Image/Visual */}
          <div className="relative order-2 lg:order-1">
            <div className="aspect-square max-w-md mx-auto relative">
              {/* Background shape */}
              <div className="absolute inset-0 bg-gradient-to-br from-goride-amber-light to-goride-green-light rounded-3xl rotate-3" />
              
              {/* Main card */}
              <div className="absolute inset-4 bg-card rounded-2xl shadow-xl p-6 flex flex-col justify-between">
                {/* Driver info */}
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center">
                    <span className="text-2xl font-bold text-primary">JD</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">Jean Damascène</h4>
                    <p className="text-sm text-muted-foreground">Driver since 2022</p>
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-accent">★★★★★</span>
                      <span className="text-sm text-muted-foreground">4.95</span>
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 my-6">
                  <div className="text-center p-3 bg-secondary rounded-xl">
                    <div className="text-2xl font-bold text-primary">2.5K+</div>
                    <div className="text-xs text-muted-foreground">Trips</div>
                  </div>
                  <div className="text-center p-3 bg-secondary rounded-xl">
                    <div className="text-2xl font-bold text-accent">98%</div>
                    <div className="text-xs text-muted-foreground">On-time</div>
                  </div>
                  <div className="text-center p-3 bg-secondary rounded-xl">
                    <div className="text-2xl font-bold text-primary">3yrs</div>
                    <div className="text-xs text-muted-foreground">Active</div>
                  </div>
                </div>

                {/* Quote */}
                <div className="bg-goride-green-light p-4 rounded-xl">
                  <p className="text-sm text-foreground italic">
                    "GoRide changed my life. I earn well, set my own schedule, and meet amazing people every day."
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right - Content */}
          <div className="order-1 lg:order-2">
            <span className="inline-block px-4 py-1.5 bg-goride-amber-light text-accent text-sm font-medium rounded-full mb-4">
              Become a Driver
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
              Drive with GoRide and earn on your own terms
            </h2>
            <p className="text-muted-foreground text-lg mb-8">
              Join thousands of driver-partners across Africa. Set your own hours, 
              earn great money, and be part of a growing community.
            </p>

            {/* Benefits */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              {benefits.map((benefit) => (
                <div key={benefit.title} className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-goride-amber-light rounded-lg flex items-center justify-center flex-shrink-0">
                    <benefit.icon className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground text-sm">{benefit.title}</h4>
                    <p className="text-xs text-muted-foreground">{benefit.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <Link to="/drive">
              <Button variant="goride-accent" size="lg" className="group">
                Start Driving
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};
