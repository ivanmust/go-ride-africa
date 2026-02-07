import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

import authRoutes from "./routes/auth.js";
import profilesRoutes from "./routes/profiles.js";
import savedLocationsRoutes from "./routes/saved-locations.js";
import rideHistoryRoutes from "./routes/ride-history.js";
import rideMessagesRoutes from "./routes/ride-messages.js";
import rideRequestsRoutes from "./routes/ride-requests.js";
import driverEarningsRoutes from "./routes/driver-earnings.js";
import driverDocumentsRoutes from "./routes/driver-documents.js";
import paymentMethodsRoutes from "./routes/payment-methods.js";
import driverAvailabilityRoutes from "./routes/driver-availability.js";
import userLocationsRoutes from "./routes/user-locations.js";
import mapboxRoutes from "./routes/mapbox.js";
import adminRoutes from "./routes/admin.js";
import scheduledRidesRoutes from "./routes/scheduled-rides.js";
import paymentsRoutes from "./routes/payments.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// Static uploads (avatars, driver-documents)
const uploadsDir = path.join(__dirname, "..", "uploads");
app.use("/uploads", express.static(uploadsDir));

app.use("/api/auth", authRoutes);
app.use("/api/profiles", profilesRoutes);
app.use("/api/saved-locations", savedLocationsRoutes);
app.use("/api/ride-history", rideHistoryRoutes);
app.use("/api/ride-messages", rideMessagesRoutes);
app.use("/api/ride-requests", rideRequestsRoutes);
app.use("/api/driver-earnings", driverEarningsRoutes);
app.use("/api/driver-documents", driverDocumentsRoutes);
app.use("/api/payment-methods", paymentMethodsRoutes);
app.use("/api/driver-availability", driverAvailabilityRoutes);
app.use("/api/user-locations", userLocationsRoutes);
app.use("/api/mapbox", mapboxRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/scheduled-rides", scheduledRidesRoutes);
app.use("/api/payments", paymentsRoutes);

app.get("/api/health", (_, res) => res.json({ ok: true }));

// 404 for unknown routes (avoids browser "Failed to load resource" for missing paths)
app.use((req, res) => {
  if (req.path.startsWith("/api/")) {
    return res.status(404).json({ error: "Not Found", path: req.path });
  }
  res.status(404).send("Not Found");
});

app.listen(PORT, () => {
  console.log(`GoRide API running on http://localhost:${PORT}`);
});
