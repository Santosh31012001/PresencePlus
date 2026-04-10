import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
import axios from "axios";
import QRCode from "qrcode.react";
import { io } from "socket.io-client";
import MapView from "../components/MapView";
import StudentMapModal from "../components/StudentMapModal";
import "./SessionDetails.css";

/* ─── tiny inline styles (no extra deps needed) ─── */
const S = {
  /* overlay that fills the screen */
  overlay: {
    position: "fixed",
    inset: 0,
    zIndex: 1000,
    display: "flex",
    flexDirection: "column",
    fontFamily: "'Inter', '-apple-system', 'BlinkMacSystemFont', sans-serif",
  },

  /* floating top navbar */
  navbar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "16px 24px",
    background: "linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(249,250,251,0.95) 100%)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    borderBottom: "1px solid #e5e7eb",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
  },

  navLeft: {
    display: "flex",
    alignItems: "center",
    gap: 14,
  },

  sessionName: {
    color: "#1f2937",
    fontWeight: 700,
    fontSize: 18,
    letterSpacing: "-0.02em",
    fontFamily: "'Inter', sans-serif",
  },

  /* pill badge for status */
  pillLive: {
    background: "linear-gradient(135deg, #6366f1, #818cf8)",
    color: "#fff",
    fontSize: 11,
    fontWeight: 700,
    padding: "4px 12px",
    borderRadius: 999,
    letterSpacing: "0.05em",
    textTransform: "uppercase",
    fontFamily: "'Inter', sans-serif",
  },

  navRight: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },

  /* Attendance log toggle button */
  logBtn: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    background: "linear-gradient(135deg, #6366f1, #818cf8)",
    color: "#fff",
    border: "none",
    borderRadius: 10,
    padding: "10px 18px",
    fontWeight: 600,
    fontSize: 14,
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(99, 102, 241, 0.4)",
    transition: "all 0.3s ease",
    fontFamily: "'Inter', sans-serif",
  },

  closeBtn: {
    background: "rgba(99, 102, 241, 0.1)",
    color: "#6366f1",
    border: "1px solid rgba(99, 102, 241, 0.2)",
    borderRadius: 10,
    padding: "10px 16px",
    fontWeight: 600,
    fontSize: 14,
    cursor: "pointer",
    transition: "all 0.3s ease",
    fontFamily: "'Inter', sans-serif",
  },

  /* full-screen map wrapper */
  mapFull: {
    position: "absolute",
    inset: 0,
    zIndex: 1,
  },

  /* QR navbar button */
  qrNavBtn: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    background: "linear-gradient(135deg, #3b82f6, #60a5fa)",
    color: "#fff",
    border: "none",
    borderRadius: 10,
    padding: "10px 18px",
    fontWeight: 600,
    fontSize: 14,
    cursor: "pointer",
    transition: "all 0.3s ease",
    fontFamily: "'Inter', sans-serif",
    boxShadow: "0 4px 12px rgba(59, 130, 246, 0.3)",
  },

  /* QR popover card */
  qrPopover: {
    position: "absolute",
    top: 64,
    right: 100,
    zIndex: 50,
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    padding: "24px 20px",
    boxShadow: "0 16px 40px rgba(0,0,0,0.1)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 16,
    minWidth: 200,
  },

  qrPopoverTitle: {
    color: "#6b7280",
    fontSize: 12,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    margin: 0,
    fontFamily: "'Inter', sans-serif",
  },

  copyBtn: {
    background: "linear-gradient(135deg, #6366f1, #818cf8)",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    padding: "10px 20px",
    fontWeight: 600,
    fontSize: 13,
    cursor: "pointer",
    width: "100%",
    transition: "all 0.3s ease",
    fontFamily: "'Inter', sans-serif",
    boxShadow: "0 4px 12px rgba(99, 102, 241, 0.3)",
  },

  /* proxy alert floating chip on map */
  proxyChip: {
    position: "absolute",
    bottom: 28,
    left: "50%",
    transform: "translateX(-50%)",
    zIndex: 15,
    background: "linear-gradient(135deg, #ef4444, #f87171)",
    backdropFilter: "blur(12px)",
    color: "#fff",
    borderRadius: 999,
    padding: "12px 20px",
    fontWeight: 700,
    fontSize: 14,
    boxShadow: "0 8px 24px rgba(239, 68, 68, 0.35)",
    display: "flex",
    alignItems: "center",
    gap: 8,
    letterSpacing: "0.02em",
    border: "1px solid rgba(255,255,255,0.25)",
    fontFamily: "'Inter', sans-serif",
  },
};

/* ═══════════════════════════════════════════════════════════ */
const SessionDetails = (props) => {
  const [qr, setQR] = useState("");
  const [attendanceList, setAttendanceList] = useState(
    props.currentSession?.[0]?.attendance || []
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [logBtnHover, setLogBtnHover] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const qrPopoverRef = useRef(null);

  const currentSession = props.currentSession?.[0];

  /* socket listener */
  useEffect(() => {
    if (!currentSession) return;
    const socket = io("http://localhost:5000");
    socket.on("new_attendance", (data) => {
      if (data.session_id === currentSession.session_id) {
        setAttendanceList((prev) => [...prev, data.student]);
      }
    });
    return () => { socket.disconnect(); };
  }, [currentSession]);

  /* fetch QR */
  const getQR = useCallback(async () => {
    if (!currentSession) return;
    try {
      const res = await axios.post("http://localhost:5000/sessions/getQR", {
        session_id: currentSession.session_id,
        token: localStorage.getItem("token"),
      });
      setQR(res.data.url);
    } catch (e) {
      console.log("QR Fetch Error:", e);
    }
  }, [currentSession]);

  useEffect(() => { getQR(); }, [getQR]);

  /* close QR popover on outside click */
  useEffect(() => {
    if (!qrOpen) return;
    const handleClick = (e) => {
      if (qrPopoverRef.current && !qrPopoverRef.current.contains(e.target)) {
        setQrOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [qrOpen]);

  const radius = useMemo(() =>
    currentSession ? parseFloat(currentSession.radius) : 0
  , [currentSession]);

  const suspiciousCount = useMemo(() =>
    attendanceList.filter((s) => parseFloat(s.distance || 0) > radius).length
  , [attendanceList, radius]);

  const verifiedCount = attendanceList.length - suspiciousCount;

  const filteredStudents = useMemo(() =>
    attendanceList.filter((student) => {
      const matchesSearch =
        (student.regno || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (student.student_email || "").toLowerCase().includes(searchTerm.toLowerCase());
      const isSuspicious = parseFloat(student.distance) > radius;
      if (filterStatus === "VERIFIED" && isSuspicious) return false;
      if (filterStatus === "SUSPICIOUS" && !isSuspicious) return false;
      return matchesSearch;
    }),
    [attendanceList, searchTerm, filterStatus, radius]
  );

  /* ── no session guard ── */
  if (!currentSession) {
    return (
      <div style={{ ...S.overlay, alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.6)" }}>
        <div style={{ background: "#0f0c20", padding: 32, borderRadius: 20, textAlign: "center", color: "#fff", border: "1px solid rgba(122,105,255,0.3)" }}>
          <p style={{ marginBottom: 16, color: "rgba(255,255,255,0.6)" }}>No session data available.</p>
          <button style={S.logBtn} onClick={props.toggleSessionDetails}>Close</button>
        </div>
      </div>
    );
  }

  const sessionDate = currentSession.date?.split("T")[0] || "—";
  const sessionTime = currentSession.time || "—";
  const sessionDuration = currentSession.duration || "—";

  return (
    <>
      <div style={S.overlay}>

        {/* ── FULL-SCREEN MAP ── */}
        <div style={S.mapFull}>
          <MapView
            sessionLocation={currentSession.location}
            radius={radius}
            attendance={attendanceList}
          />
        </div>

        {/* ── FLOATING NAVBAR ── */}
        <div style={S.navbar}>
          {/* Left: logo + session name */}
          <div style={S.navLeft}>
            <span style={{ fontSize: 22 }}>📍</span>
            <span style={S.sessionName}>{currentSession.name}</span>
            <span style={S.pillLive}>Live</span>
          </div>

          {/* Right: QR button + Attendance Log button + Close */}
          <div style={S.navRight}>
            {/* QR Code button */}
            {qr && (
              <button
                style={S.qrNavBtn}
                onClick={() => setQrOpen((p) => !p)}
                onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.9"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.transform = "translateY(0)"; }}
              >
                <span style={{ fontSize: 15 }}>📷</span>
                QR Code
              </button>
            )}

            <button
              style={{
                ...S.logBtn,
                ...(logBtnHover ? { opacity: 0.88, transform: "translateY(-1px)" } : {}),
              }}
              onMouseEnter={() => setLogBtnHover(true)}
              onMouseLeave={() => setLogBtnHover(false)}
              onClick={() => setDrawerOpen(true)}
            >
              <span style={{ fontSize: 16 }}>📋</span>
              Attendance Log
              {attendanceList.length > 0 && (
                <span style={{
                  background: "rgba(99, 102, 241, 0.3)",
                  borderRadius: 999,
                  padding: "2px 8px",
                  fontSize: 11,
                  fontWeight: 800,
                  color: "#fff",
                }}>
                  {attendanceList.length}
                </span>
              )}
            </button>

            <button
              style={S.closeBtn}
              onClick={props.toggleSessionDetails}
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(99, 102, 241, 0.15)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(99, 102, 241, 0.1)"; }}
            >
              ✕ Close
            </button>
          </div>
        </div>

        {/* ── QR POPOVER ── */}
        {qrOpen && qr && (
          <div ref={qrPopoverRef} style={S.qrPopover}>
            <p style={S.qrPopoverTitle}>Session QR Code</p>
            <div style={{ background: "#f9fafb", padding: 12, borderRadius: 10 }}>
              <QRCode value={qr} size={160} />
            </div>
            <p style={{ color: "#6b7280", fontSize: 12, margin: 0, textAlign: "center", fontFamily:"'Inter', sans-serif" }}>
              Students scan to mark attendance
            </p>
            <button
              style={S.copyBtn}
              onClick={() => { navigator.clipboard.writeText(qr); setQrOpen(false); }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 6px 16px rgba(99, 102, 241, 0.4)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 12px rgba(99, 102, 241, 0.3)"; }}
            >
              Copy Link
            </button>
          </div>
        )}

        {/* ── PROXY ALERT CHIP (floating on map) ── */}
        {suspiciousCount > 0 && !drawerOpen && (
          <div style={S.proxyChip}>
            <span>⚠️</span>
            {suspiciousCount} student{suspiciousCount > 1 ? "s" : ""} outside geofence
          </div>
        )}

        {/* ── STUDENT MAP MODAL ── */}
        {selectedStudent && (
          <StudentMapModal
            student={selectedStudent}
            sessionLocation={currentSession.location}
            radius={radius}
            onClose={() => setSelectedStudent(null)}
          />
        )}
      </div>

      {/* ── DRAWER BACKDROP ── */}
      {drawerOpen && (
        <div className="drawer-backdrop" onClick={() => setDrawerOpen(false)} />
      )}

      {/* ── ATTENDANCE DRAWER ── */}
      {drawerOpen && (
        <div className="drawer">

          {/* Drawer Header: title + session info cards */}
            <div className="drawer-header" style={{ paddingBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <button
                  style={S.closeBtn}
                  onClick={props.toggleSessionDetails}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(99, 102, 241, 0.15)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(99, 102, 241, 0.1)"; }}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Session info cards */}
            <div className="info-grid">
              {/* Date */}
              <div className="info-card date">
                <span className="info-icon">📅</span>
                <span className="info-label">Date</span>
                <span className="info-value">{sessionDate}</span>
              </div>

              {/* Time */}
              <div className="info-card time">
                <span className="info-icon">⏰</span>
                <span className="info-label">Time</span>
                <span className="info-value">{sessionTime}</span>
              </div>

              {/* Duration */}
              <div className="info-card duration">
                <span className="info-icon">⏱️</span>
                <span className="info-label">Duration</span>
                <span className="info-value">{sessionDuration}</span>
              </div>

              {/* Radius */}
              <div className="info-card radius">
                <span className="info-icon">🎯</span>
                <span className="info-label">Radius</span>
                <span className="info-value">{radius} m</span>
              </div>
            </div>

          {/* Stats row */}
          <div className="stats-row">
            <div className="stat-box verified">
              <div className="stat-num verified">{verifiedCount}</div>
              <div className="stat-label">Verified</div>
            </div>
            <div className="stat-box suspicious">
              <div className="stat-num suspicious">{suspiciousCount}</div>
              <div className="stat-label">Suspicious</div>
            </div>
            <div className="stat-box total">
              <div className="stat-num total">{attendanceList.length}</div>
              <div className="stat-label">Total</div>
            </div>
          </div>

          {/* Search + filter */}
          <div className="search-bar">
            <input
              className="search-input"
              placeholder="🔍  Search reg no or email…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <select
              className="filter-select"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="ALL">All</option>
              <option value="VERIFIED">Verified</option>
              <option value="SUSPICIOUS">Suspicious</option>
            </select>
          </div>

          {/* Student list */}
          <div className="list-scroll">
            {filteredStudents.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">🎓</div>
                No students found
              </div>
            ) : (
              filteredStudents.map((student, i) => {
                const isOk = parseFloat(student.distance) <= radius;
                return (
                  <div
                    key={i}
                    className={`student-card ${isOk ? 'verified' : 'suspicious'}`}
                    onClick={() => student.Location && setSelectedStudent(student)}
                  >
                    <span className="student-icon">
                      {isOk ? '👤' : '⚠️'}
                    </span>
                    <div className="student-left">
                      <span className="student-regno">{student.regno}</span>
                      <span className="student-email">{student.student_email}</span>
                    </div>
                    <div className="student-right">
                      <span className={`student-badge ${isOk ? 'verified' : 'suspicious'}`}>{isOk ? "✓ OK" : "⚠ OUT"}</span>
                      <span className={`distance-chip ${isOk ? 'verified' : 'suspicious'}`}>{student.distance}m</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default SessionDetails;