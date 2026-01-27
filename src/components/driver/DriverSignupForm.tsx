import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";

export const DriverSignupForm = () => {
  const navigate = useNavigate();
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
    navigate("/auth?type=driver");
  };

  return (
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
  );
};
