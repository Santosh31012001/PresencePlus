import mongoose from "mongoose";
const schema = mongoose.Schema;

const userSchema = new schema(
  {
    name:     { type: String, required: true },
    email:    { type: String, required: true },
    pno:      { type: String },
    password: { type: String, required: true }, // Password saved as hash
    sessions: [
      {
        session_id: { type: String, required: true },
        date: { type: Date, required: true },
        time: { type: String, required: true },
        name: { type: String, required: true },
        duration: { type: String, required: true },
        location: { type: String, required: true },
        radius: { type: String, required: true },
        created_at: { type: Date, default: Date.now }, // QR validity window starts here
        attendance: [
          {
            regno: { type: String, required: true },
            image: { type: String, required: true },
            IP: { type: String, required: true },
            date: { type: Date, required: true },
            student_email: { type: String, required: true },
            
            // ─── PHASE 1: New fields for hybrid GPS + Bluetooth ───
            status: { type: String, enum: ["VERIFIED", "SUSPICIOUS", "OUTSIDE_GEOFENCE"], default: "SUSPICIOUS" },
            
            // GPS array: multiple readings over 2-3 minutes
            gps_readings: [
              {
                latitude: { type: Number, required: true },
                longitude: { type: Number, required: true },
                timestamp: { type: Date, required: true },
              },
            ],
            
            // Calculated median position from all GPS readings
            median_location: {
              latitude: { type: Number },
              longitude: { type: Number },
            },
            
            // Bluetooth detection flag
            bluetooth_detected: { type: Boolean, default: false },
            
            // GPS consistency score (0-1): how tightly clustered are the readings
            gps_consistency_score: { type: Number, default: 0 },
            
            // Distance from teacher (calculated from median location)
            distance: { type: String, required: true },
            
            // Legacy: Old single location (kept for backward compatibility)
            Location: { type: String },
            // ───────────────────────────────────────────────────────
          },
        ],
      },
    ],
  },
  { timestamps: true }
);

export const Teacher = mongoose.model("teacher", userSchema);
