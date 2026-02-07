import { Outlet } from "react-router-dom";
import { DriverHeader } from "./DriverHeader";
import { Footer } from "@/components/home/Footer";

export const DriverLayout = () => (
  <div className="min-h-screen bg-background">
    <DriverHeader />
    <main className="pt-16">
      <Outlet />
    </main>
    <Footer />
  </div>
);
