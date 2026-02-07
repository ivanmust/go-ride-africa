import React from "react";
import { createRoot } from "react-dom/client";
import { PassengerApp } from "./PassengerApp";
import "@/index.css";

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <PassengerApp />
  </React.StrictMode>
);
