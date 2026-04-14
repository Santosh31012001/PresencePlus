//create a new session component
import React, { useState, useRef } from "react";
import axios from "axios";
import "../styles/StudentForm.css";

const StudentForm = ({ togglePopup }) => {
  //eslint-disable-next-line
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [image, setImage] = useState({ contentType: "", data: "" });
  const [photoData, setPhotoData] = useState(""); // To store the captured photo data
  const videoRef = useRef(null);

  // ─────────────────────────────────────────────────────────────
  // PHASE 3: State for GPS capture progress
  // ─────────────────────────────────────────────────────────────
  const [isCapturingGPS, setIsCapturingGPS] = useState(false);
  const [gpsReadings, setGpsReadings] = useState([]);
  const [gpsProgress, setGpsProgress] = useState(0); // 0-5 for number of readings
  const gpsReadingsRef = useRef([]); // Use ref to avoid stale closures in interval
  // ─────────────────────────────────────────────────────────────

  const constraints = {
    video: true,
  };
  const startCamera = () => {
    navigator.mediaDevices
      .getUserMedia(constraints)
      .then((stream) => {
        videoRef.current.srcObject = stream;
      })
      .catch((error) => {
        console.error("Error accessing camera:", error);
      });
  };
  const stopCamera = () => {
    const stream = videoRef.current.srcObject;
    const tracks = stream.getTracks();

    tracks.forEach((track) => track.stop());
    videoRef.current.srcObject = null;
  };
  const capturePhoto = async () => {
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas
      .getContext("2d")
      .drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

    const photoDataUrl = canvas.toDataURL("image/png");

    setImage(await fetch(photoDataUrl).then((res) => res.blob()));

    setPhotoData(photoDataUrl);
    stopCamera();
  };
  const ResetCamera = () => {
    setPhotoData("");
    startCamera();
  };

  // ─────────────────────────────────────────────────────────────
  // PHASE 4: Bluetooth detection using Web Bluetooth API
  // ─────────────────────────────────────────────────────────────
  const [isCheckingBT, setIsCheckingBT] = useState(false);
  const [btStatus, setBtStatus] = useState(null); // null | true | false
  const [btError, setBtError] = useState(null);

  const checkBluetoothPresence = async () => {
    // Only attempt once per session to avoid permission overload
    if (btStatus !== null) {
      console.log("📡 BT already checked, skipping...");
      return btStatus;
    }

    setIsCheckingBT(true);
    setBtError(null);

    try {
      // Check if browser supports Web Bluetooth API
      if (!navigator.bluetooth) {
        console.warn(
          "⚠️ Web Bluetooth API not supported. Using mock BT detection."
        );
        // For browsers/devices without BT support, we'll use fallback
        setBtStatus(false);
        setIsCheckingBT(false);
        return false;
      }

      console.log("📡 Scanning for Bluetooth devices...");

      // Request Bluetooth device - this will show browser's BT picker
      // We're looking for ANY device to confirm BT radio is on
      const device = await navigator.bluetooth.requestDevice({
        // Look for generic services available on most devices
        optionalServices: [
          "generic_access", // Standard UUID for generic Bluetooth device
          "health_thermometer", // Common service
          "heart_rate", // Common service
        ],
        acceptAllDevices: true, // Accept any device to just verify BT presence
      });

      console.log("✅ Bluetooth device found:", device.name || "Unknown");
      setBtStatus(true);
      setIsCheckingBT(false);
      return true;
    } catch (error) {
      if (error.name === "NotFoundError") {
        // User couldn't find Bluetooth device or canceled
        console.log("⚠️ No Bluetooth devices found or user cancelled");
        setBtStatus(false);
      } else if (error.name === "NotSupportedError") {
        console.warn("⚠️ Bluetooth not supported on this device");
        setBtStatus(false);
      } else if (error.name === "SecurityError") {
        console.warn(
          "⚠️ Bluetooth requires HTTPS or localhost"
        );
        setBtStatus(false);
        setBtError(
          "Bluetooth requires HTTPS connection for security reasons"
        );
      } else {
        console.error("Bluetooth error:", error);
        setBtStatus(false);
        setBtError(error.message);
      }
      setIsCheckingBT(false);
      return false;
    }
  };
  // ─────────────────────────────────────────────────────────────

  const captureGPSReadings = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject("Geolocation is not supported by this browser.");
        return;
      }

      setIsCapturingGPS(true);
      gpsReadingsRef.current = [];
      setGpsReadings([]);
      setGpsProgress(0);

      const captureInterval = setInterval(() => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            const reading = {
              latitude: parseFloat(latitude.toFixed(6)),
              longitude: parseFloat(longitude.toFixed(6)),
              timestamp: new Date().toISOString(),
            };

            gpsReadingsRef.current.push(reading);
            setGpsReadings([...gpsReadingsRef.current]);
            setGpsProgress(gpsReadingsRef.current.length);

            console.log(
              `📍 GPS Reading ${gpsReadingsRef.current.length}: ${latitude}, ${longitude}`
            );

            // Stop after 5 readings (captured at 0s, 45s, 90s, 135s, 180s)
            if (gpsReadingsRef.current.length >= 5) {
              clearInterval(captureInterval);
              setIsCapturingGPS(false);
              console.log("✅ GPS capture complete!");
              resolve(gpsReadingsRef.current);
            }
          },
          (error) => {
            console.error("GPS Error:", error);
            reject(`Error getting geolocation: ${error.message}`);
          }
        );
      }, 45000); // Capture every 45 seconds (5 readings in ~3.75 minutes)

      // Fallback: Stop after 4 minutes if something goes wrong
      setTimeout(() => {
        clearInterval(captureInterval);
        if (gpsReadingsRef.current.length > 0) {
          setIsCapturingGPS(false);
          resolve(gpsReadingsRef.current);
        }
      }, 240000); // 4 minutes
    });
  };
  // ─────────────────────────────────────────────────────────────

  const AttendSession = async (e) => {
    e.preventDefault();
    let regno = e.target.regno.value;

    if (regno.length === 0) {
      alert("Please enter registration number");
      return;
    }

    try {
      // Get user IP address
      axios.defaults.withCredentials = false;
      const res = await axios.get("https://api64.ipify.org?format=json");
      axios.defaults.withCredentials = true;
      let IP = res.data.ip;

      // ─────────────────────────────────────────────────────────────
      // PHASE 3: Capture GPS readings instead of single point
      // ─────────────────────────────────────────────────────────────
      console.log("🚀 Starting GPS capture for 3+ minutes...");
      const gpsReadingsArray = await captureGPSReadings();

      if (gpsReadingsArray.length < 5) {
        alert(
          `Not enough GPS readings. Got ${gpsReadingsArray.length}, need 5+`
        );
        return;
      }

      console.log(`✅ Captured ${gpsReadingsArray.length} GPS readings`);

      // ─────────────────────────────────────────────────────────────
      // PHASE 4: Bluetooth Detection
      // ─────────────────────────────────────────────────────────────
      console.log("📡 Bluetooth check...");
      
      // 🎯 OPTION 1 (TESTING): Mock Bluetooth
      const bluetoothDetected = true;
      console.log(`✅ [MOCK] Bluetooth: DETECTED`);
      
      // 🔄 OPTION 2 (PRODUCTION): Real Bluetooth detection
      // Uncomment below and comment above when ready to use real Bluetooth
      // const bluetoothDetected = await checkBluetoothPresence();
      // console.log(
      //   `${bluetoothDetected ? "✅" : "⚠️"} Bluetooth: ${bluetoothDetected ? "DETECTED" : "NOT DETECTED"}`
      // );
      // ─────────────────────────────────────────────────────────────

      // Use FormData for multipart/form-data upload
      const formData = new FormData();
      formData.append("token", token);
      formData.append("regno", regno);
      formData.append("session_id", localStorage.getItem("session_id"));
      formData.append("teacher_email", localStorage.getItem("teacher_email"));
      formData.append("IP", IP);
      formData.append("date", new Date().toISOString().split("T")[0]);

      // ─────────────────────────────────────────────────────────────
      // PHASE 3 + 4: Send GPS array + Bluetooth detection
      // ─────────────────────────────────────────────────────────────
      formData.append("gps_readings", JSON.stringify(gpsReadingsArray));
      formData.append("bluetooth_detected", bluetoothDetected); // NEW: Actual BT status
      // ─────────────────────────────────────────────────────────────

      formData.append("student_email", localStorage.getItem("email"));

      // Append the image blob with field name "image" (must match multer's field name)
      if (image instanceof Blob) {
        formData.append("image", image, "photo.png");
      }

      console.log("📤 Sending attendance with GPS array...");
      const response = await axios.post(
        "http://localhost:5000/sessions/attend_session",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      // ─────────────────────────────────────────────────────────────
      // PHASE 5: Show validation status from backend
      // ─────────────────────────────────────────────────────────────
      const { status, consistency_score } = response.data;
      const statusEmoji = {
        VERIFIED: "✅",
        SUSPICIOUS: "⚠️",
        OUTSIDE_GEOFENCE: "❌",
      }[status] || "❓";

      document.querySelector(
        ".form-popup-inner"
      ).innerHTML = `
        <div style="text-align: center; padding: 20px;">
          <h2>${statusEmoji} ${response.data.message}</h2>
          <p style="font-size: 14px; color: #666;">
            Status: <strong>${status}</strong><br/>
            Accuracy: <strong>${(consistency_score * 100).toFixed(0)}%</strong>
          </p>
        </div>
      `;
      // ─────────────────────────────────────────────────────────────
    } catch (err) {
      console.error("❌ Attendance Error:", err);

      // ── QR Expired (HTTP 410) ─────────────────────────────────────
      if (err.response?.status === 410 || err.response?.data?.expired) {
        document.querySelector(".form-popup-inner").innerHTML = `
          <div style="text-align: center; padding: 24px;">
            <div style="font-size: 48px; margin-bottom: 12px;">⏰</div>
            <h2 style="color: #b91c1c; margin: 0 0 8px 0;">QR Code Expired</h2>
            <p style="font-size: 14px; color: #6b7280; margin: 0 0 16px 0;">
              The 15-minute attendance window for this session has closed.
            </p>
            <p style="font-size: 12px; color: #9ca3af; background: #f3f4f6; padding: 10px; border-radius: 6px; word-break: break-word;">
              ${err.response?.data?.message || "Please ask your teacher to create a new session."}
            </p>
          </div>
        `;
        return;
      }
      // ─────────────────────────────────────────────────────────────

      // Generic error messages
      let errorMsg = "Error marking attendance: ";
      if (err.response?.status === 400) {
        errorMsg += err.response.data?.message || "Bad request (check console)";
      } else if (err.response?.status === 404) {
        errorMsg += "Session not found";
      } else {
        errorMsg += err.message;
      }

      console.error("Full error response:", err.response?.data);

      // Show error in popup
      document.querySelector(".form-popup-inner").innerHTML = `
        <div style="text-align: center; padding: 20px;">
          <h2>❌ Error</h2>
          <p style="font-size: 13px; color: #dc2626; word-break: break-word;">
            ${errorMsg}
          </p>
          <button onClick="location.reload()" style="padding: 10px 20px; margin-top: 10px;">
            Try Again
          </button>
        </div>
      `;
    }
  };

  return (
    <div className="form-popup">
      <button onClick={togglePopup} disabled={isCapturingGPS}>
        <strong>X</strong>
      </button>
      <div className="form-popup-inner">
        <h5>Enter Your Details</h5>

        {/* ─────────────────────────────────────────────────────────────────── */}
        {/* PHASE 3: Show GPS capture progress */}
        {/* ─────────────────────────────────────────────────────────────────── */}
        {isCapturingGPS && (
          <div
            style={{
              background: "#f0f9ff",
              border: "2px solid #3b82f6",
              borderRadius: 8,
              padding: "16px",
              marginBottom: 16,
              textAlign: "center",
            }}
          >
            <p style={{ margin: "0 0 8px 0", fontWeight: 600, color: "#1f2937" }}>
              📍 Capturing GPS Locations...
            </p>
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: 6,
                marginBottom: 8,
              }}
            >
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 4,
                    background:
                      gpsProgress >= i
                        ? "#10b981"
                        : "#e5e7eb",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: gpsProgress >= i ? "#fff" : "#9ca3af",
                    fontWeight: 700,
                    fontSize: 12,
                  }}
                >
                  {i}
                </div>
              ))}
            </div>
            <p style={{ margin: 0, fontSize: 12, color: "#6b7280 " }}>
              Reading {gpsProgress} of 5 (takes ~3-4 minutes)
            </p>
          </div>
        )}
        {/* ───────────────────────────────────────────────────────────────────── */}

        {/* ─────────────────────────────────────────────────────────────────── */}
        {/* PHASE 4: Show mock Bluetooth status during GPS capture */}
        {isCapturingGPS && (
          <div
            style={{
              background: "#d1fae5",
              border: "2px solid #10b981",
              borderRadius: 8,
              padding: "12px",
              marginBottom: 16,
              textAlign: "center",
              fontSize: 13,
              color: "#065f46",
            }}
          >
            <p style={{ margin: 0 }}>
              📡 [MOCK] ✅ Bluetooth ready for testing
            </p>
          </div>
        )}
        {/* ───────────────────────────────────────────────────────────────────── */}

        {!photoData && <video ref={videoRef} width={300} autoPlay={true} />}
        {photoData && <img src={photoData} width={300} alt="Captured" />}
        <div className="cam-btn">
          <button onClick={startCamera} disabled={isCapturingGPS}>
            Start Camera
          </button>
          <button onClick={capturePhoto} disabled={isCapturingGPS}>
            Capture
          </button>
          <button onClick={ResetCamera} disabled={isCapturingGPS}>
            Reset
          </button>
        </div>

        <form onSubmit={AttendSession}>
          <input
            type="text"
            name="regno"
            placeholder="RegNo"
            autoComplete="off"
            disabled={isCapturingGPS}
          />
          <button
            type="submit"
            disabled={isCapturingGPS}
            style={{
              opacity: isCapturingGPS ? 0.5 : 1,
              cursor: isCapturingGPS ? "not-allowed" : "pointer",
            }}
          >
            {isCapturingGPS ? "Capturing GPS..." : "Done"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default StudentForm;
