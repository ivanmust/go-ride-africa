/**
 * Default entry: Passenger app (index.html).
 * Driver app: index-driver.html -> /src/apps/driver/main.tsx
 * Admin app: index-admin.html -> /src/apps/admin/main.tsx
 */
import React from "react";
import { createRoot } from "react-dom/client";
import { PassengerApp } from "@/apps/passenger/PassengerApp";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <PassengerApp />
  </React.StrictMode>
);
