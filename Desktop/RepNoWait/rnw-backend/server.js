  // server.js
  import express from "express";
  import cors from "cors";
  import db from "./db.js"; // import your Postgres pool helpers

  const app = express();
  app.use(cors());
  app.use(express.json());

  // Map equipment_id to gym zone name for heatmap
  const EQUIPMENT_MAP = {
    1: "Chest Press",
    2: "Incline Bench",
    3: "Lat Pulldown",
    4: "Seated Row",
    5: "Leg Press",
    6: "Squat Rack",
    7: "Bicep Curl",
    8: "Tricep Pushdown",
    9: "Shoulder Press",
    10: "Lateral Raise Machine",
    11: "Treadmill",
    12: "Elliptical"
  };

  // Map equipment names to zones (for heatmap updates)
  const EQUIPMENT_TO_ZONE = {
    "Treadmill": "Treadmills",
    "Elliptical": "Ellipticals",
    "Chest Press Machine": "Chest Press",
    "Leg Press": "Leg Press",
    "Lat Pulldown": "Lat Pulldown",
    "Squat Rack": "Squat Rack",
    "Bicep Curl Machine": "Bicep Curl",
    "Incline Bench": "Chest Press",
    "Seated Row": "Lat Pulldown",
    "Tricep Pushdown": "Calisthenics Area",
    "Shoulder Press": "Dumbbell Area",
    "Lateral Raise Machine": "Dumbbell Area"
  };

  // ==================== BASIC DATA ====================

  // Get muscle groups
  app.get("/api/muscle-groups", async (req, res) => {
    try {
      const result = await db.query("SELECT * FROM muscle_groups ORDER BY id");
      res.json(result.rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get equipment by muscle group
  app.get("/api/equipment/:groupId", async (req, res) => {
    const { groupId } = req.params;
    try {
      const result = await db.query(
        "SELECT * FROM equipment WHERE muscle_group_id = $1 ORDER BY id",
        [groupId]
      );
      res.json(result.rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get all time slots
  app.get("/api/time-slots", async (req, res) => {
    try {
      const result = await db.query("SELECT * FROM time_slots ORDER BY id");
      res.json(result.rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get active bookings
  app.get("/api/bookings", async (req, res) => {
    try {
      const result = await db.query("SELECT * FROM bookings WHERE done = false");
      res.json(result.rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ==================== BOOKING ROUTES ====================

  // Add booking
  // Add booking
app.post("/api/bookings", async (req, res) => {
  const { equipment_id, time_slot_id, user_id } = req.body;
  const uid = user_id || 1;

  try {
    // Insert booking (trigger will update gym_map automatically)
    const result = await db.query(
      "INSERT INTO bookings (equipment_id, time_slot_id, done, user_id) VALUES ($1,$2,false,$3) RETURNING *",
      [equipment_id, time_slot_id, uid]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error("POST /api/bookings error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Mark booking done
app.put("/api/bookings/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const result = await db.query(
      "UPDATE bookings SET done = true WHERE id = $1 RETURNING *",
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Booking not found or already done" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error("PUT /api/bookings/:id error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Cancel booking
app.delete("/api/bookings/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const result = await db.query("DELETE FROM bookings WHERE id = $1 RETURNING *", [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Booking not found" });
    }
    res.json({ message: "Booking cancelled" });
  } catch (err) {
    console.error("DELETE /api/bookings/:id error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});


  // ==================== HEATMAP DATA ====================
  app.get("/api/heatmap-data", async (req, res) => {
    try {
      const result = await db.query(
        "SELECT zone_name, current_bookings AS count FROM gym_map ORDER BY zone_id"
      );
      res.json(result.rows);
    } catch (err) {
      console.error("GET /api/heatmap-data error:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ==================== START SERVER ====================
  app.listen(process.env.PORT || 5001, () =>
    console.log(`Server running on port ${process.env.PORT || 5001}`)
  );
