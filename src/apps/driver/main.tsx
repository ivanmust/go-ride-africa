import React from "react";
import { createRoot } from "react-dom/client";
import { DriverApp } from "./DriverApp";
import "@/index.css";

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <DriverApp />
  </React.StrictMode>
);
