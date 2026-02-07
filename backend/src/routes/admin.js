import express from "express";
import { query } from "../db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = express.Router();

router.get("/dashboard", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const [
      profilesRes,
      rolesRes,
      docsRes,
      requestsRes,
      historyRes,
      pendingReq,
      totalReq,
      totalHistory,
      completedRidesRes,
      totalUsersRes,
      totalDriversRes,
      approvedDriversRes,
      pendingDriverApprovalsRes,
    ] = await Promise.all([
      query("SELECT id, email, full_name, phone, created_at, is_driver_approved FROM profiles ORDER BY created_at DESC LIMIT 50"),
      query("SELECT user_id, role FROM user_roles"),
      query("SELECT id, user_id, document_type, file_name, status, uploaded_at FROM driver_documents WHERE status = 'pending'"),
      query("SELECT id, pickup_address, dropoff_address, status, vehicle_type, created_at, user_id FROM ride_requests ORDER BY created_at DESC LIMIT 10"),
      query("SELECT id, pickup_address, dropoff_address, fare_amount, status, created_at FROM ride_history ORDER BY created_at DESC LIMIT 10"),
      query("SELECT COUNT(*) AS count FROM ride_requests WHERE status = 'pending'"),
      query("SELECT COUNT(*) AS count FROM ride_requests"),
      query("SELECT COUNT(*) AS count FROM ride_history"),
      query("SELECT COUNT(*) AS count FROM ride_history WHERE status = 'completed'"),
      query("SELECT COUNT(DISTINCT user_id) AS count FROM user_roles"),
      query("SELECT COUNT(*) AS count FROM user_roles WHERE role = 'driver'"),
      query(
        "SELECT COUNT(*) AS count FROM profiles p INNER JOIN user_roles r ON r.user_id = p.id AND r.role = 'driver' WHERE p.is_driver_approved = true"
      ),
      query(
        "SELECT COUNT(*) AS count FROM profiles p INNER JOIN user_roles r ON r.user_id = p.id AND r.role = 'driver' WHERE p.is_driver_approved = false"
      ),
    ]);
    const pendingRequests = parseInt(pendingReq.rows[0]?.count || "0", 10);
    const totalRequests = parseInt(totalReq.rows[0]?.count || "0", 10);
    const totalRides = parseInt(totalHistory.rows[0]?.count || "0", 10);
    const completedRides = parseInt(completedRidesRes.rows[0]?.count || "0", 10);
    const totalUsers = parseInt(totalUsersRes.rows[0]?.count || "0", 10);
    const totalDrivers = parseInt(totalDriversRes.rows[0]?.count || "0", 10);
    const approvedDrivers = parseInt(approvedDriversRes.rows[0]?.count || "0", 10);
    const pendingDriverApprovals = parseInt(pendingDriverApprovalsRes.rows[0]?.count || "0", 10);

    res.json({
      profiles: profilesRes.rows,
      user_roles: rolesRes.rows,
      driver_documents: docsRes.rows,
      ride_requests: requestsRes.rows,
      ride_history: historyRes.rows,
      counts: {
        pending_requests: pendingRequests,
        total_requests: totalRequests,
        total_rides: totalRides,
        completed_rides: completedRides,
        total_users: totalUsers,
        total_drivers: totalDrivers,
        approved_drivers: approvedDrivers,
        pending_driver_approvals: pendingDriverApprovals,
      },
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch dashboard" });
  }
});

router.patch("/profiles/:id", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const { id } = req.params;
    const { is_driver_approved } = req.body;
    if (is_driver_approved === undefined) return res.status(400).json({ error: "is_driver_approved required" });
    await query("UPDATE profiles SET is_driver_approved = $1, updated_at = now() WHERE id = $2", [!!is_driver_approved, id]);
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to update profile" });
  }
});

// List payouts for admin (optional status filter: pending | completed | rejected)
router.get("/payouts", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const status = req.query.status || "pending";
    const { rows } = await query(
      `SELECT dp.id, dp.driver_id, dp.amount, dp.payout_method, dp.mobile_money_provider,
              dp.mobile_money_number, dp.status, dp.requested_at, dp.processed_at, dp.transaction_reference, dp.notes,
              p.full_name AS driver_name, p.email AS driver_email
       FROM driver_payouts dp
       LEFT JOIN profiles p ON p.id = dp.driver_id
       WHERE dp.status = $1
       ORDER BY dp.requested_at DESC`,
      [status]
    );
    const payouts = rows.map((r) => ({
      id: r.id,
      driver_id: r.driver_id,
      amount: Number(r.amount),
      payout_method: r.payout_method,
      mobile_money_provider: r.mobile_money_provider,
      mobile_money_number: r.mobile_money_number,
      status: r.status,
      requested_at: r.requested_at,
      processed_at: r.processed_at,
      transaction_reference: r.transaction_reference,
      notes: r.notes,
      driverName: r.driver_name,
      driverEmail: r.driver_email,
    }));
    res.json(payouts);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch payouts" });
  }
});

// Approve or reject a driver document
router.patch("/documents/:id", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const { id } = req.params;
    const { status, rejection_reason } = req.body;
    if (!status || !["approved", "rejected"].includes(status)) {
      return res.status(400).json({ error: "status must be 'approved' or 'rejected'" });
    }
    const { rows } = await query(
      "SELECT id FROM driver_documents WHERE id = $1 AND status = $2",
      [id, "pending"]
    );
    if (!rows[0]) {
      return res.status(404).json({ error: "Document not found or already reviewed" });
    }
    await query(
      `UPDATE driver_documents
       SET status = $1, rejection_reason = $2, reviewed_at = now(), updated_at = now()
       WHERE id = $3`,
      [status, status === "rejected" ? rejection_reason || null : null, id]
    );
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to update document" });
  }
});

// Approve (complete) or reject a payout
router.patch("/payouts/:id", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const { id } = req.params;
    const { status, transaction_reference, notes } = req.body;
    if (!status || !["completed", "rejected"].includes(status)) {
      return res.status(400).json({ error: "status must be 'completed' or 'rejected'" });
    }
    const { rows } = await query(
      "SELECT id FROM driver_payouts WHERE id = $1 AND status = $2",
      [id, "pending"]
    );
    if (!rows[0]) {
      return res.status(404).json({ error: "Payout not found or already processed" });
    }
    await query(
      `UPDATE driver_payouts
       SET status = $1, processed_at = CASE WHEN $1 = 'completed' THEN now() ELSE processed_at END,
           transaction_reference = COALESCE($2, transaction_reference), notes = COALESCE($3, notes)
       WHERE id = $4`,
      [status, transaction_reference || null, notes || null, id]
    );
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to update payout" });
  }
});

export default router;
