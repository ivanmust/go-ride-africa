import express from "express";
import { query, pool } from "../db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = express.Router();

// List ride requests that belong to the authenticated user (as passenger or driver)
router.get("/", requireAuth, async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT * FROM ride_requests WHERE user_id = $1 OR driver_id = $1 ORDER BY created_at DESC`,
      [req.userId]
    );
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch ride requests" });
  }
});

// Fetch a specific ride request (for passenger or driver)
router.get("/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await query(
      `SELECT * FROM ride_requests WHERE id = $1 AND (user_id = $2 OR driver_id = $2)`,
      [id, req.userId]
    );
    if (!rows[0]) return res.status(404).json({ error: "Ride request not found" });
    res.json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch ride request" });
  }
});

// List incoming (pending) ride requests for the authenticated driver
router.get("/driver/incoming", requireAuth, requireRole("driver"), async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT *
       FROM ride_requests
       WHERE driver_id = $1
         AND status = 'pending'
       ORDER BY created_at ASC`,
      [req.userId]
    );
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch incoming ride requests" });
  }
});

// Passenger creates a new ride request (does matching but does NOT auto-start the trip)
router.post("/create", requireAuth, requireRole("passenger"), async (req, res) => {
  try {
    const {
      pickup_address,
      dropoff_address,
      vehicle_type,
      payment_method_id,
      fare_amount,
      pickup_lat,
      pickup_lng,
      dropoff_lat,
      dropoff_lng,
      currency,
      distance_km,
      duration_minutes,
      ride_sharing,
    } = req.body;
    if (!pickup_address || !dropoff_address || !vehicle_type || !payment_method_id || fare_amount == null) {
      return res.status(400).json({
        error: "pickup_address, dropoff_address, vehicle_type, payment_method_id, fare_amount required",
      });
    }
    const { rows } = await query(
      `SELECT create_ride_request($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) AS result`,
      [
        req.userId,
        pickup_address,
        dropoff_address,
        vehicle_type,
        payment_method_id,
        fare_amount,
        pickup_lat ?? null,
        pickup_lng ?? null,
        dropoff_lat ?? null,
        dropoff_lng ?? null,
        currency || "RWF",
        distance_km ?? null,
        duration_minutes ?? null,
        !!ride_sharing,
      ]
    );
    const rawResult = rows[0]?.result;
    if (rawResult == null) return res.status(500).json({ error: "Ride creation failed" });
    const result = typeof rawResult === "string" ? JSON.parse(rawResult) : rawResult;
    res.status(201).json(result);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message || "Failed to create ride" });
  }
});

// Driver accepts a pending ride request (creates ride_history and marks accepted)
router.post("/:id/accept", requireAuth, requireRole("driver"), async (req, res) => {
  const client = await pool.connect();
  try {
    const requestId = req.params.id;
    const driverId = req.userId;

    await client.query("BEGIN");

    const { rows: reqRows } = await client.query(
      `SELECT *
       FROM ride_requests
       WHERE id = $1 AND driver_id = $2 AND status = 'pending'
       FOR UPDATE`,
      [requestId, driverId]
    );

    const request = reqRows[0];
    if (!request) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Ride request not found or not available" });
    }

    // Build driver display info
    const { rows: profileRows } = await client.query(
      `SELECT full_name, avatar_url FROM profiles WHERE id = $1`,
      [driverId]
    );
    const profile = profileRows[0];

    const { rows: vehicleRows } = await client.query(
      `SELECT vehicle_type, plate_number, make, model, color
       FROM vehicles
       WHERE driver_id = $1 AND is_primary = true
       LIMIT 1`,
      [driverId]
    );
    const vehicle = vehicleRows[0];

    const driverName = profile?.full_name || "Driver";
    const driverPhoto = profile?.avatar_url || null;
    const vehicleType = vehicle?.vehicle_type || request.vehicle_type;
    const vehiclePlate = vehicle?.plate_number || "—";

    // Create ride_history row (fare from ride_requests or body; fare_amount is NOT NULL)
    const fareAmount = Math.max(0, Number(request.fare_amount) || Number(req.body?.fare_amount) || 0);
    const currency = request.currency || req.body?.currency || "RWF";
    const distanceKm = request.distance_km != null ? request.distance_km : req.body?.distance_km ?? null;
    const durationMinutes = request.duration_minutes != null ? request.duration_minutes : req.body?.duration_minutes ?? null;

    const { rows: historyRows } = await client.query(
      `INSERT INTO ride_history (
         user_id, driver_id, driver_name, driver_photo, vehicle_type, vehicle_plate,
         pickup_address, dropoff_address, pickup_lat, pickup_lng,
         dropoff_lat, dropoff_lng, fare_amount, currency, distance_km,
         duration_minutes, status, started_at
       )
       VALUES (
         $1, $2, $3, $4, $5, $6,
         $7, $8, $9, $10,
         $11, $12, $13, $14, $15,
         $16, 'in_progress', now()
       )
       RETURNING *`,
      [
        request.user_id,
        driverId,
        driverName,
        driverPhoto,
        vehicleType,
        vehiclePlate,
        request.pickup_address,
        request.dropoff_address,
        request.pickup_lat,
        request.pickup_lng,
        request.dropoff_lat,
        request.dropoff_lng,
        fareAmount,
        currency,
        distanceKm,
        durationMinutes,
      ]
    );

    const ride = historyRows[0];

    await client.query(
      `UPDATE ride_requests
       SET status = 'accepted',
           ride_history_id = $2,
           updated_at = now()
       WHERE id = $1`,
      [requestId, ride.id]
    );

    await client.query("COMMIT");
    res.json({ ride_request_id: requestId, ride });
  } catch (e) {
    try {
      await client?.query?.("ROLLBACK");
    } catch {
      // ignore rollback error
    }
    console.error(e);
    res.status(500).json({ error: e.message || "Failed to accept ride request" });
  }
});

// Passenger reassigns a declined ride request to the next available driver
router.post("/:id/reassign", requireAuth, requireRole("passenger"), async (req, res) => {
  try {
    const requestId = req.params.id;
    const { rows } = await query(
      `SELECT reassign_ride_request($1, $2) AS result`,
      [requestId, req.userId]
    );
    const rawResult = rows[0]?.result;
    if (rawResult == null) return res.status(500).json({ error: "Reassign failed" });
    const result = typeof rawResult === "string" ? JSON.parse(rawResult) : rawResult;
    res.json(result);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message || "Failed to reassign ride" });
  }
});

// Driver rejects a pending ride request
router.post("/:id/reject", requireAuth, requireRole("driver"), async (req, res) => {
  try {
    const requestId = req.params.id;
    const driverId = req.userId;
    const { rows } = await query(
      `UPDATE ride_requests
       SET status = 'declined',
           updated_at = now()
       WHERE id = $1 AND driver_id = $2 AND status = 'pending'
       RETURNING *`,
      [requestId, driverId]
    );
    if (!rows[0]) {
      return res.status(404).json({ error: "Ride request not found or already handled" });
    }
    res.json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message || "Failed to reject ride request" });
  }
});

export default router;
