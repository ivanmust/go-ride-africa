import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";

export const DriverCTASection = () => {
  const navigate = useNavigate();

  return (
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
  );
};
