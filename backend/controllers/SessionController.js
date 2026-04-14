import dotenv from "dotenv";
dotenv.config();
import querystring from "querystring";
import { Teacher } from "../model/Teacher.js";
import { Student } from "../model/Student.js";
import uploadImage from "../middleware/Cloudinary.js";
import Mailer from "../middleware/Mailer.js";

function getQR(session_id, email) {
  let url = `${process.env.CLIENT_URL}/login?${querystring.stringify({
    session_id,
    email,
  })}`;
  return url;
}

function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Radius of the Earth in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in meters
  return distance;
}

// ─────────────────────────────────────────────────────────────
// ─── PHASE 1 HELPER FUNCTIONS ───────────────────────────────
// ─────────────────────────────────────────────────────────────

// Calculate median position from multiple GPS readings
function calculateMedianGPS(gpsReadings) {
  if (!gpsReadings || gpsReadings.length === 0) {
    return null;
  }
  
  // Extract latitudes and longitudes
  const latitudes = gpsReadings.map(reading => reading.latitude).sort((a, b) => a - b);
  const longitudes = gpsReadings.map(reading => reading.longitude).sort((a, b) => a - b);
  
  // Calculate median (middle value)
  const medianIndex = Math.floor(latitudes.length / 2);
  const medianLat = latitudes[medianIndex];
  const medianLon = longitudes[medianIndex];
  
  return {
    latitude: parseFloat(medianLat.toFixed(6)),
    longitude: parseFloat(medianLon.toFixed(6)),
  };
}

// Calculate how tightly clustered the GPS readings are (consistency score)
// Returns 0-1 where 1 = all readings very close, 0 = scattered
function calculateGPSConsistency(gpsReadings, medianLocation) {
  if (!gpsReadings || gpsReadings.length < 2) {
    return 0;
  }
  
  // Calculate distance of each reading from median
  const distances = gpsReadings.map(reading =>
    haversineDistance(
      medianLocation.latitude,
      medianLocation.longitude,
      reading.latitude,
      reading.longitude
    )
  );
  
  // Calculate average deviation from median
  const avgDeviation = distances.reduce((a, b) => a + b) / distances.length;
  
  // Consistency score: if avg deviation < 10m, score is high (0.9-1)
  // if avg deviation > 50m, score is low (0.1-0.3)
  // Linear interpolation between 0 and 1
  const consistencyScore = Math.max(0, Math.min(1, 1 - (avgDeviation / 100)));
  
  return parseFloat(consistencyScore.toFixed(2));
}

// ─────────────────────────────────────────────────────────────

function checkStudentDistance(Location1, Location2) {
  Location1 = Location1.split(",");
  Location2 = Location2.split(",");
  const locationLat1 = parseFloat(Location1[0]);
  const locationLon1 = parseFloat(Location1[1]);
  const locationLat2 = parseFloat(Location2[0]);
  const locationLon2 = parseFloat(Location2[1]);

  const distance = haversineDistance(
    locationLat1,
    locationLon1,
    locationLat2,
    locationLon2
  );
  return distance.toFixed(2);
}

//make controller functions

async function CreateNewSession(req, res) {
  let { session_id, name, duration, location, radius, date, time, token } =
    req.body;
  let tokenData = req.user;

  let newSession = {
    session_id,
    date,
    time,
    name,
    duration,
    location,
    radius,
    created_at: new Date(), // Record when the QR was generated
  };

  try {
    let teacher = await Teacher.findOneAndUpdate(
      { email: tokenData.email },
      { $push: { sessions: newSession } }
    );

    res.status(200).json({
      url: getQR(session_id, teacher.email),
      message: "Session created successfully",
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}
//get sessions
async function GetAllTeacherSessions(req, res) {
  try {
    let tokenData = req.user;
    const teacher = await Teacher.findOne({ email: tokenData.email });
    res.status(200).json({ sessions: teacher.sessions });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}
//get QR
async function GetQR(req, res) {
  try {
    let tokenData = req.user;
    let url = getQR(req.body.session_id, tokenData.email);
    res.status(200).json({ url });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

//attend session
async function AttendSession(req, res) {
  let tokenData = req.user;
  let { 
    session_id, 
    teacher_email, 
    regno, 
    IP, 
    student_email, 
    Location,  // Legacy: single point
    date,
    gps_readings,  // Array of GPS readings [{latitude, longitude, timestamp}, ...]
  } = req.body;

  // ─────────────────────────────────────────────────────────────
  // DEBUG: Log received data
  // ─────────────────────────────────────────────────────────────
  console.log("=== ATTEND SESSION REQUEST ===");
  console.log("session_id:", session_id);
  console.log("teacher_email:", teacher_email);
  console.log("regno:", regno);
  console.log("student_email:", student_email);
  console.log("gps_readings type:", typeof gps_readings);
  console.log("gps_readings:", gps_readings);
  console.log("file uploaded:", !!req.file);
  console.log("=============================");

  // Check if file was uploaded
  if (!req.file) {
    return res.status(400).json({
      message: "Image file is required. Please ensure the file is sent with field name 'image'.",
    });
  }

  // ─────────────────────────────────────────────────────────────
  // PHASE 3 FIX: Parse gps_readings if it's a string (from FormData)
  // ─────────────────────────────────────────────────────────────
  let gpsReadingsArray = [];
  try {
    if (typeof gps_readings === "string") {
      gpsReadingsArray = JSON.parse(gps_readings);
      console.log("✅ Parsed GPS readings from string");
    } else if (Array.isArray(gps_readings)) {
      gpsReadingsArray = gps_readings;
      console.log("✅ GPS readings already array");
    } else {
      console.warn("⚠️ gps_readings format unexpected:", typeof gps_readings);
      gpsReadingsArray = [];
    }
  } catch (parseErr) {
    console.error("❌ Failed to parse GPS readings:", parseErr.message);
    gpsReadingsArray = [];
  }
  // ─────────────────────────────────────────────────────────────

  let imageName = req.file.filename;
  console.log(imageName);

  try {
    const teacher = await Teacher.findOne({ email: teacher_email });

    // Use for...of so async/await works correctly inside the loop
    for (const session of teacher.sessions) {
      if (session.session_id !== session_id) continue;

      // ── QR Validity Window Check (15 minutes) ──────────────────
      const QR_VALIDITY_MS = 15 * 60 * 1000; // 15 minutes in milliseconds
      const sessionAge = Date.now() - new Date(session.created_at).getTime();
      if (sessionAge > QR_VALIDITY_MS) {
        const minutesElapsed = Math.floor(sessionAge / 60000);
        return res.status(410).json({
          message: `QR code has expired. This session was created ${minutesElapsed} minute(s) ago. Attendance can only be marked within 15 minutes of session creation.`,
          expired: true,
        });
      }
      // ─────────────────────────────────────────────────────────────

      // ── Duplicate check ──────────────────────────────────────────
      const alreadyMarked = session.attendance.some(
        (student) =>
          student.regno === regno ||
          student.student_email === student_email
      );

      if (alreadyMarked) {
        return res.status(200).json({ message: "Attendance already marked" });
      }
      // ─────────────────────────────────────────────────────────────

      // ─────────────────────────────────────────────────────────────
      // GPS validation
      // ─────────────────────────────────────────────────────────────

      let attendance_status = "SUSPICIOUS";  // Default
      let medianLocation = null;
      let consistencyScore = 0;
      let finalDistance = "0";

      if (gpsReadingsArray && Array.isArray(gpsReadingsArray) && gpsReadingsArray.length >= 1) {
        medianLocation = calculateMedianGPS(gpsReadingsArray);
        consistencyScore = calculateGPSConsistency(gpsReadingsArray, medianLocation);

        const teacherLocation = session.location; // "lat,lng"
        finalDistance = haversineDistance(
          medianLocation.latitude,
          medianLocation.longitude,
          parseFloat(teacherLocation.split(",")[0]),
          parseFloat(teacherLocation.split(",")[1])
        ).toFixed(2);

        const isWithinGeofence = parseFloat(finalDistance) <= parseFloat(session.radius);
        const isHighConsistency = consistencyScore >= 0.7;

        if (isWithinGeofence && isHighConsistency) {
          attendance_status = "VERIFIED";
        } else if (isWithinGeofence && !isHighConsistency) {
          attendance_status = "SUSPICIOUS";  // GPS in range but low consistency
        } else {
          attendance_status = "OUTSIDE_GEOFENCE";
        }

        console.log(`✓ GPS VALIDATION:
          Readings: ${gpsReadingsArray.length}
          Median: ${medianLocation.latitude}, ${medianLocation.longitude}
          Consistency: ${consistencyScore}
          Distance: ${finalDistance}m (radius: ${session.radius}m)
          Status: ${attendance_status}
        `);
      } else {
        // Fallback: legacy single location
        finalDistance = checkStudentDistance(Location, session.location);
        console.log("⚠ Using legacy single-point GPS");
      }
      // ─────────────────────────────────────────────────────────────

      // Upload image and mark attendance
      const imageUrl = await uploadImage(imageName);

      const session_details = {
        session_id: session.session_id,
        teacher_email: teacher.email,
        name: session.name,
        date: session.date,
        time: session.time,
        duration: session.duration,
        distance: finalDistance,
        radius: session.radius,
        image: imageUrl,
        status: attendance_status,
        gps_consistency_score: consistencyScore,
      };

      session.attendance.push({
        regno,
        image: imageUrl,
        date,
        IP,
        student_email: tokenData.email,
        status: attendance_status,
        gps_readings: gpsReadingsArray || [],
        median_location: medianLocation || {},
        gps_consistency_score: consistencyScore,
        Location,
        distance: finalDistance,
      });

      await Teacher.findOneAndUpdate(
        { email: teacher_email },
        { sessions: teacher.sessions }
      );

      await Student.findOneAndUpdate(
        { email: student_email },
        { $push: { sessions: session_details } }
      );

      // ── Send attendance confirmation email to student (fire-and-forget) ──
      Mailer.sendAttendanceConfirmation({
        studentEmail: tokenData.email,
        studentRegno: regno,
        sessionName: session.name,
        sessionDate: session.date,
        sessionTime: session.time,
        teacherEmail: teacher.email,
        status: attendance_status,
        distance: finalDistance,
      }).then((result) => {
        if (result) console.log(`📧 Confirmation email sent to ${tokenData.email}`);
        else        console.warn(`⚠️ Failed to send confirmation email to ${tokenData.email}`);
      });
      // ─────────────────────────────────────────────────────────────

      req.io.emit("new_attendance", {
        session_id: session.session_id,
        student: {
          regno,
          image: imageUrl,
          date,
          IP,
          student_email: tokenData.email,
          status: attendance_status,
          gps_consistency_score: consistencyScore,
          distance: finalDistance,
        },
      });

      return res.status(200).json({ 
        message: "Attendance marked successfully",
        status: attendance_status,  // NEW: Return status to frontend
        consistency_score: consistencyScore,  // NEW
      });
    }

    // If no matching session found
    return res.status(404).json({ message: "Session not found" });

  } catch (err) {
    console.error("❌ AttendSession ERROR:", err);
    res.status(400).json({ 
      message: err.message,
      error_details: err.message  // Better debugging
    });
  }
}

//get student sessions
async function GetStudentSessions(req, res) {
  let tokenData = req.user;
  try {
    const student = await Student.findOne({
      email: tokenData.email,
    });
    res.status(200).json({ sessions: student.sessions });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

const SessionController = {
  CreateNewSession,
  GetAllTeacherSessions,
  GetQR,
  AttendSession,
  GetStudentSessions,
};

export default SessionController;
