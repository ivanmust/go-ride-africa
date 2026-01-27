import { TrendingUp } from "lucide-react";

const earnings = [
  { amount: "RWF 50,000+", period: "per week", description: "Average earnings for active drivers" },
  { amount: "85%", period: "", description: "Of fare goes to you" },
  { amount: "Weekly", period: "", description: "Payouts to your mobile money" },
];

export const DriverHeroSection = () => {
  return (
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
  );
};
