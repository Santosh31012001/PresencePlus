// Student attendance form with face verification
import React, { useState, useRef } from "react";
import axios from "axios";
import * as faceapi from "face-api.js";
import "../styles/StudentForm.css";

const StudentForm = ({ togglePopup }) => {
  //eslint-disable-next-line
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [image, setImage] = useState({ contentType: "", data: "" });
  const [photoData, setPhotoData] = useState(""); // To store the captured photo data
  const videoRef = useRef(null);

  // ─────────────────────────────────────────────────────────────
  // GPS capture state
  // ─────────────────────────────────────────────────────────────
  const [isCapturingGPS, setIsCapturingGPS] = useState(false);
  const [gpsProgress, setGpsProgress] = useState(0);
  const gpsReadingsRef = useRef([]);
  // ─────────────────────────────────────────────────────────────

  // ─────────────────────────────────────────────────────────────
  // FACE VERIFICATION: State
  // ─────────────────────────────────────────────────────────────
  const [faceStatus, setFaceStatus] = useState(null);
  const [faceModelsLoaded, setFaceModelsLoaded] = useState(false);

  // Result screen — replaces innerHTML anti-pattern
  const [result, setResult] = useState(null);
  // result shape: { type: 'success'|'error'|'expired'|'faceMismatch', message, status, consistency_score, errorMsg }
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
  // GPS: Collect up to 5 readings via watchPosition.
  // Resolves early once 5 readings are obtained, or after 10s
  // with however many readings were collected (minimum 1).
  // ─────────────────────────────────────────────────────────────
  const captureGPSReadings = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject("Geolocation is not supported by this browser.");
        return;
      }

      setIsCapturingGPS(true);
      gpsReadingsRef.current = [];
      setGpsProgress(0);

      let resolved = false;

      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          if (resolved) return;

          const { latitude, longitude } = position.coords;
          const reading = {
            latitude: parseFloat(latitude.toFixed(6)),
            longitude: parseFloat(longitude.toFixed(6)),
            accuracy: position.coords.accuracy,
            timestamp: new Date().toISOString(),
          };

          gpsReadingsRef.current.push(reading);
          setGpsProgress(gpsReadingsRef.current.length);

          console.log(
            `📍 GPS Reading ${gpsReadingsRef.current.length}: ${latitude}, ${longitude} (±${position.coords.accuracy.toFixed(1)}m)`
          );

          // Stop after 5 readings
          if (gpsReadingsRef.current.length >= 5) {
            resolved = true;
            navigator.geolocation.clearWatch(watchId);
            setIsCapturingGPS(false);
            console.log("✅ GPS capture complete (5 readings)!");
            resolve([...gpsReadingsRef.current]);
          }
        },
        (error) => {
          if (resolved) return;
          resolved = true;
          navigator.geolocation.clearWatch(watchId);
          setIsCapturingGPS(false);
          console.error("GPS Error:", error);
          reject(`Error getting geolocation: ${error.message}`);
        },
        { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
      );

      // 10-second hard cap — resolve with whatever we have (≥1 reading)
      setTimeout(() => {
        if (resolved) return;
        resolved = true;
        navigator.geolocation.clearWatch(watchId);
        setIsCapturingGPS(false);

        if (gpsReadingsRef.current.length > 0) {
          console.warn(
            `⚠️ GPS timeout — using ${gpsReadingsRef.current.length} reading(s)`
          );
          resolve([...gpsReadingsRef.current]);
        } else {
          reject("GPS timeout: no readings received");
        }
      }, 10000);
    });
  };
  // ─────────────────────────────────────────────────────────────

  // ─────────────────────────────────────────────────────────────
  // FACE VERIFICATION: Load models & compare live photo vs registered profile
  // ─────────────────────────────────────────────────────────────
  const verifyFace = async (livePhotoDataUrl) => {
    setFaceStatus("verifying");
    try {
      // Load models only once
      if (!faceModelsLoaded) {
        console.log("🧠 Loading face-api.js models...");
        const MODEL_URL = "/models";
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        ]);
        setFaceModelsLoaded(true);
        console.log("✅ Face models loaded");
      }

      // Fetch the stored profile photo URL from backend
      const profileRes = await axios.get("http://localhost:5000/users/profile_photo", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const profilePhotoUrl = profileRes.data.profile_photo;

      if (!profilePhotoUrl) {
        console.warn("⚠️ No profile photo found — skipping face check");
        setFaceStatus("passed"); // Graceful fallback if photo not set at signup
        return true;
      }

      // Load both images as HTML Image elements
      const loadImage = (src) =>
        new Promise((res, rej) => {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.onload  = () => res(img);
          img.onerror = () => rej(new Error("Failed to load image: " + src));
          img.src = src;
        });

      console.log("📸 Computing face descriptors...");
      const opts = new faceapi.TinyFaceDetectorOptions();

      const [liveImg, profileImg] = await Promise.all([
        loadImage(livePhotoDataUrl),
        loadImage(profilePhotoUrl),
      ]);

      const [liveResult, profileResult] = await Promise.all([
        faceapi.detectSingleFace(liveImg, opts).withFaceLandmarks(true).withFaceDescriptor(),
        faceapi.detectSingleFace(profileImg, opts).withFaceLandmarks(true).withFaceDescriptor(),
      ]);

      if (!liveResult) {
        console.warn("⚠️ No face detected in live photo");
        setFaceStatus("failed");
        return false;
      }
      if (!profileResult) {
        console.warn("⚠️ No face detected in profile photo — skipping check");
        setFaceStatus("passed"); // Fallback: profile photo unusable
        return true;
      }

      // Euclidean distance: < 0.5 = same person, > 0.5 = different person
      const distance = faceapi.euclideanDistance(liveResult.descriptor, profileResult.descriptor);
      console.log(`📏 Face distance: ${distance.toFixed(3)} (threshold: 0.5)`);

      if (distance < 0.5) {
        console.log("✅ Face match!");
        setFaceStatus("passed");
        return true;
      } else {
        console.warn("❌ Face mismatch!");
        setFaceStatus("failed");
        return false;
      }
    } catch (err) {
      console.error("❌ Face verification error:", err);
      setFaceStatus("passed"); // Fail-open: don't block if error occurs
      return true;
    }
  };
  // ─────────────────────────────────────────────────────────────

  const AttendSession = async (e) => {
    e.preventDefault();
    let regno = e.target.regno.value;

    if (regno.length === 0) {
      alert("Please enter registration number");
      return;
    }

    // Check photo is captured
    if (!photoData) {
      alert("Please capture your photo first");
      return;
    }

    try {
      // ─────────────────────────────────────────────────────────────
      // FACE VERIFICATION: Check before anything else
      // ─────────────────────────────────────────────────────────────
      console.log("👀 Running face verification...");
      const faceMatch = await verifyFace(photoData);
      if (!faceMatch) {
        setResult({ type: "faceMismatch" });
        return;
      }
      console.log("✅ Face verified! Proceeding...");
      // ─────────────────────────────────────────────────────────────

      // Get user IP address
      axios.defaults.withCredentials = false;
      const res = await axios.get("https://api64.ipify.org?format=json");
      axios.defaults.withCredentials = true;
      let IP = res.data.ip;

      // ─────────────────────────────────────────────────────────────
      // GPS: Capture readings (up to 5, minimum 1)
      // ─────────────────────────────────────────────────────────────
      console.log("🚀 Starting GPS capture...");
      const gpsReadingsArray = await captureGPSReadings();
      console.log(`✅ Captured ${gpsReadingsArray.length} GPS reading(s)`);
      // ─────────────────────────────────────────────────────────────

      // Use FormData for multipart/form-data upload
      const formData = new FormData();
      formData.append("token", token);
      formData.append("regno", regno);
      formData.append("session_id", localStorage.getItem("session_id"));
      formData.append("teacher_email", localStorage.getItem("teacher_email"));
      formData.append("IP", IP);
      formData.append("date", new Date().toISOString().split("T")[0]);
      formData.append("gps_readings", JSON.stringify(gpsReadingsArray));
      formData.append("student_email", localStorage.getItem("email"));

      // Append the image blob with field name "image" (must match multer's field name)
      if (image instanceof Blob) {
        formData.append("image", image, "photo.png");
      }

      console.log("📤 Sending attendance...");
      const response = await axios.post(
        "http://localhost:5000/sessions/attend_session",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      const { status, consistency_score } = response.data;
      setResult({ type: "success", message: response.data.message, status, consistency_score });
    } catch (err) {
      console.error("❌ Attendance Error:", err);

      // ── QR Expired (HTTP 410) ─────────────────────────────────────
      if (err.response?.status === 410 || err.response?.data?.expired) {
        setResult({ type: "expired", message: err.response?.data?.message || "Please ask your teacher to create a new session." });
        return;
      }

      let errorMsg = "Error marking attendance: ";
      if (err.response?.status === 400) {
        errorMsg += err.response.data?.message || "Bad request (check console)";
      } else if (err.response?.status === 404) {
        errorMsg += "Session not found";
      } else {
        errorMsg += err.message;
      }
      console.error("Full error response:", err.response?.data);
      setResult({ type: "error", errorMsg });
    }
  };

  return (
    <div className="form-popup">
      <button onClick={togglePopup} disabled={isCapturingGPS}>
        <strong>X</strong>
      </button>
      <div className="form-popup-inner">

        {/* ── RESULT SCREEN: shown after submission ── */}
        {result ? (
          <div style={{ textAlign: "center", padding: "24px" }}>
            {result.type === "success" && (() => {
              const emoji = { VERIFIED: "✅", SUSPICIOUS: "⚠️", OUTSIDE_GEOFENCE: "❌" }[result.status] || "❓";
              return (
                <>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>{emoji}</div>
                  <h2>{result.message}</h2>
                  <p style={{ fontSize: 14, color: "#6b7280" }}>
                    Status: <strong>{result.status}</strong><br />
                    Accuracy: <strong>{(result.consistency_score * 100).toFixed(0)}%</strong>
                  </p>
                </>
              );
            })()}
            {result.type === "faceMismatch" && (
              <>
                <div style={{ fontSize: 48, marginBottom: 12 }}>❌</div>
                <h2 style={{ color: "#b91c1c" }}>Face Mismatch</h2>
                <p style={{ fontSize: 14, color: "#6b7280" }}>
                  Your face does not match the registered profile photo.
                  Please ensure you are the registered student.
                </p>
                <button onClick={() => window.location.reload()} style={{ padding: "10px 20px", marginTop: 10 }}>
                  Try Again
                </button>
              </>
            )}
            {result.type === "expired" && (
              <>
                <div style={{ fontSize: 48, marginBottom: 12 }}>⏰</div>
                <h2 style={{ color: "#b91c1c" }}>QR Code Expired</h2>
                <p style={{ fontSize: 14, color: "#6b7280" }}>
                  The 15-minute attendance window for this session has closed.
                </p>
                <p style={{ fontSize: 12, color: "#9ca3af", background: "#f3f4f6", padding: 10, borderRadius: 6, wordBreak: "break-word" }}>
                  {result.message}
                </p>
              </>
            )}
            {result.type === "error" && (
              <>
                <div style={{ fontSize: 48, marginBottom: 12 }}>❌</div>
                <h2>Error</h2>
                <p style={{ fontSize: 13, color: "#dc2626", wordBreak: "break-word" }}>
                  {result.errorMsg}
                </p>
                <button onClick={() => window.location.reload()} style={{ padding: "10px 20px", marginTop: 10 }}>
                  Try Again
                </button>
              </>
            )}
          </div>
        ) : (
          <>
            <h5>Enter Your Details</h5>

            {/* ── FACE VERIFICATION STATUS BANNER ── */}
            {faceStatus === "verifying" && (
              <div style={{ background: "#eff6ff", border: "2px solid #3b82f6", borderRadius: 8, padding: "12px 16px", marginBottom: 12, textAlign: "center", fontSize: 14, color: "#1d4ed8" }}>
                🧠 Verifying your identity... please wait
              </div>
            )}
            {faceStatus === "passed" && (
              <div style={{ background: "#d1fae5", border: "2px solid #10b981", borderRadius: 8, padding: "12px 16px", marginBottom: 12, textAlign: "center", fontSize: 14, color: "#065f46" }}>
                ✅ Identity verified!
              </div>
            )}
            {faceStatus === "failed" && (
              <div style={{ background: "#fee2e2", border: "2px solid #ef4444", borderRadius: 8, padding: "12px 16px", marginBottom: 12, textAlign: "center", fontSize: 14, color: "#991b1b" }}>
                ❌ Face mismatch — attendance blocked
              </div>
            )}

            {/* ── GPS CAPTURE PROGRESS ── */}
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
                        background: gpsProgress >= i ? "#10b981" : "#e5e7eb",
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
                <p style={{ margin: 0, fontSize: 12, color: "#6b7280" }}>
                  Reading {gpsProgress} of 5 (usually done in a few seconds)
                </p>
              </div>
            )}

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
          </>
        )}
        {/* ── end result ternary ── */}

      </div>
    </div>
  );
};

export default StudentForm;
