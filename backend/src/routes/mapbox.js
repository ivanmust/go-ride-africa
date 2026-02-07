import express from "express";

const router = express.Router();
const token = process.env.MAPBOX_ACCESS_TOKEN || "";

router.get("/token", (_, res) => {
  if (!token) return res.status(503).json({ error: "Mapbox token not configured" });
  res.json({ token });
});

export default router;
