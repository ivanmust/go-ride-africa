import { Outlet } from "react-router-dom";
import { PassengerHeader } from "./PassengerHeader";
import { Footer } from "@/components/home/Footer";

export const PassengerLayout = () => (
  <div className="min-h-screen bg-background">
    <PassengerHeader />
    <main className="pt-16">
      <Outlet />
    </main>
    <Footer />
  </div>
);
