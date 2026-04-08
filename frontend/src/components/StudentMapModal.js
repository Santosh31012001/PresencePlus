import React, { useEffect, useMemo, useCallback, memo } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  Circle,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import "../styles/StudentMapModal.css";

// ── Fix default Leaflet icon (module-level — runs once) ────────────────────
import iconUrl from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";
const DefaultIcon = L.icon({ iconUrl, shadowUrl: iconShadow, iconAnchor: [12, 41] });
L.Marker.prototype.options.icon = DefaultIcon;

// ── Teacher icon (module-level constant — created once, never recreated) ───
const TEACHER_ICON = new L.DivIcon({
  className: "",
  html: `<div style="
      width:38px;height:38px;
      background:linear-gradient(135deg,#8a7bff,#1fb6ff);
      border-radius:50% 50% 50% 0;transform:rotate(-45deg);
      border:3px solid #fff;box-shadow:0 4px 16px rgba(138,123,255,0.6);">
    <div style="transform:rotate(45deg);display:flex;align-items:center;
      justify-content:center;height:100%;font-size:16px;margin-top:-2px;">🏫</div>
  </div>`,
  iconSize: [38, 38],
  iconAnchor: [19, 38],
  popupAnchor: [0, -40],
});

// ── Student icons (two variants, module-level — never recreated) ───────────
const STUDENT_ICON_OK = new L.DivIcon({
  className: "",
  html: `<div style="
      width:34px;height:34px;
      background:linear-gradient(135deg,#5be4a8,#00c6a0);
      border-radius:50% 50% 50% 0;transform:rotate(-45deg);
      border:3px solid #fff;box-shadow:0 4px 16px rgba(91,228,168,0.55);">
    <div style="transform:rotate(45deg);display:flex;align-items:center;
      justify-content:center;height:100%;font-size:14px;margin-top:-2px;">✅</div>
  </div>`,
  iconSize: [34, 34],
  iconAnchor: [17, 34],
  popupAnchor: [0, -36],
});

const STUDENT_ICON_BAD = new L.DivIcon({
  className: "",
  html: `<div style="
      width:34px;height:34px;
      background:linear-gradient(135deg,#ff6b81,#ff4757);
      border-radius:50% 50% 50% 0;transform:rotate(-45deg);
      border:3px solid #fff;box-shadow:0 4px 16px rgba(255,107,129,0.55);">
    <div style="transform:rotate(45deg);display:flex;align-items:center;
      justify-content:center;height:100%;font-size:14px;margin-top:-2px;">⚠️</div>
  </div>`,
  iconSize: [34, 34],
  iconAnchor: [17, 34],
  popupAnchor: [0, -36],
});

// ── Responsive map height (pure function — derived once per open) ──────────
function getMapHeight() {
  const w = window.innerWidth;
  if (w <= 480) return "260px";
  if (w <= 768) return "320px";
  return "420px";
}

// ── FitTwo — memoised so it never re-renders unless positions change ────────
const FitTwo = memo(function FitTwo({ teacherPos, studentPos }) {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
      const bounds = L.latLngBounds([teacherPos, studentPos]);
      map.fitBounds(bounds, { padding: [70, 70], maxZoom: 16 });
    }, 150);
    return () => clearTimeout(timer);
  }, [map, teacherPos, studentPos]);
  return null;
});

// ── AnimatedLine — memoised so polylines don't repaint on unrelated renders ─
const AnimatedLine = memo(function AnimatedLine({ positions, color }) {
  return (
    <>
      <Polyline positions={positions} pathOptions={{ color, weight: 10, opacity: 0.15 }} />
      <Polyline positions={positions} pathOptions={{ color, weight: 3,  opacity: 0.9  }} />
      <Polyline positions={positions} pathOptions={{ color: "#fff", weight: 1.5, opacity: 0.5, dashArray: "8, 10" }} />
    </>
  );
});

// ── Stable pathOptions objects (avoid inline object recreation each render) ─
const GEOFENCE_STYLE = {
  color: "#8a7bff",
  fillColor: "#8a7bff",
  fillOpacity: 0.08,
  weight: 2,
  dashArray: "6 4",
};

// ═══════════════════════════════════════════════════════════════════════════
// Main Modal
// ═══════════════════════════════════════════════════════════════════════════
const StudentMapModal = memo(function StudentMapModal({
  student,
  sessionLocation,
  radius,
  onClose,
}) {
  // ── All hooks MUST come before any early return ───────────────────────────

  // Stable close handler — doesn't change unless onClose prop changes
  const handleOverlayClick = useCallback(
    (e) => { if (e.target === e.currentTarget) onClose(); },
    [onClose]
  );

  // Derive computed values with useMemo so they only recalculate when inputs change
  const derived = useMemo(() => {
    if (!student || !sessionLocation) return null;
    const [tLat, tLng] = sessionLocation.split(",").map(Number);
    const [sLat, sLng] = student.Location.split(",").map(Number);
    const dist = parseFloat(student.distance);
    const rad  = parseFloat(radius);
    const isInside = dist <= rad;
    return {
      teacherPos: [tLat, tLng],
      studentPos: [sLat, sLng],
      tLat, tLng, sLat, sLng,
      dist, rad, isInside,
      lineColor: isInside ? "#5be4a8" : "#ff6b81",
      studentIcon: isInside ? STUDENT_ICON_OK : STUDENT_ICON_BAD,
      avatarBorder: isInside ? "#5be4a8" : "#ff6b81",
      badgeClass: isInside ? "smm-badge smm-badge--ok" : "smm-badge smm-badge--bad",
      badgeLabel: isInside ? "✅ Verified" : "⚠️ Suspicious",
    };
  }, [student, sessionLocation, radius]);

  // Map height — stable until window is resized (re-opens will recalculate)
  const mapHeight = useMemo(() => getMapHeight(), []);

  // Escape key listener
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // ── Guard (after all hooks) ───────────────────────────────────────────────
  if (!derived) return null;

  const {
    teacherPos, studentPos,
    tLat, tLng, sLat, sLng,
    dist, rad, isInside,
    lineColor, studentIcon, avatarBorder, badgeClass, badgeLabel,
  } = derived;

  // Stable position arrays for markers/polylines
  const linePositions = [teacherPos, studentPos];

  return (
    <div className="smm-overlay" onClick={handleOverlayClick}>
      <div className="smm-panel">

        {/* ── Header ── */}
        <div className="smm-header">
          <div className="smm-header-left">
            <div className="smm-avatar" style={{ borderColor: avatarBorder }}>
              {student.image
                ? <img src={student.image} alt="student" loading="lazy" />
                : <span>{(student.regno || "?")[0]}</span>}
            </div>
            <div>
              <h2 className="smm-name">{student.regno}</h2>
              <p className="smm-email">{student.student_email}</p>
            </div>
          </div>

          <div className="smm-header-right">
            <div className={badgeClass}>{badgeLabel}</div>
            <button className="smm-close-btn" onClick={onClose} title="Close (Esc)">✕</button>
          </div>
        </div>

        {/* ── Stats row ── */}
        <div className="smm-stats">
          <div className="smm-stat">
            <span className="smm-stat-label">Distance</span>
            <span className="smm-stat-value" style={{ color: lineColor }}>
              {dist.toFixed(1)} m
            </span>
          </div>
          <div className="smm-stat">
            <span className="smm-stat-label">Allowed Radius</span>
            <span className="smm-stat-value">{rad} m</span>
          </div>
          <div className="smm-stat">
            <span className="smm-stat-label">Teacher Location</span>
            <span className="smm-stat-value smm-coord">{tLat.toFixed(5)}, {tLng.toFixed(5)}</span>
          </div>
          <div className="smm-stat">
            <span className="smm-stat-label">Student Location</span>
            <span className="smm-stat-value smm-coord">{sLat.toFixed(5)}, {sLng.toFixed(5)}</span>
          </div>
        </div>

        {/* ── Map ── */}
        <div className="smm-map-wrap">
          <MapContainer
            center={teacherPos}
            zoom={17}
            style={{ height: mapHeight, width: "100%" }}
            zoomControl
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            />

            <FitTwo teacherPos={teacherPos} studentPos={studentPos} />

            {/* Geofence circle */}
            <Circle center={teacherPos} radius={rad} pathOptions={GEOFENCE_STYLE} />

            {/* Connection line */}
            <AnimatedLine positions={linePositions} color={lineColor} />

            {/* Teacher marker */}
            <Marker position={teacherPos} icon={TEACHER_ICON}>
              <Popup>
                <div style={{ minWidth: 140 }}>
                  <strong style={{ color: "#333" }}>📍 Teacher / Classroom</strong>
                  <div style={{ fontSize: 12, color: "#555", marginTop: 4 }}>
                    Radius: {rad} m
                  </div>
                </div>
              </Popup>
            </Marker>

            {/* Student marker */}
            <Marker position={studentPos} icon={studentIcon}>
              <Popup>
                <div style={{ minWidth: 160 }}>
                  <strong style={{ color: "#333" }}>{student.regno}</strong>
                  {student.student_email && (
                    <div style={{ fontSize: 12, color: "#666", marginTop: 3 }}>
                      {student.student_email}
                    </div>
                  )}
                  <div style={{
                    marginTop: 8, padding: "5px 8px", borderRadius: 6,
                    background: isInside ? "#d4edda" : "#f8d7da",
                    color: isInside ? "#155724" : "#721c24",
                    fontWeight: "bold", fontSize: 13, textAlign: "center",
                  }}>
                    {isInside ? "Within bounds ✓" : "Out of bounds ✗"}
                  </div>
                  <div style={{ fontSize: 11, color: "#888", textAlign: "center", marginTop: 5 }}>
                    Distance: {dist.toFixed(1)} m
                  </div>
                </div>
              </Popup>
            </Marker>
          </MapContainer>

          {/* Legend */}
          <div className="smm-legend">
            <div className="smm-legend-item">
              <span className="smm-legend-dot" style={{ background: "linear-gradient(135deg,#8a7bff,#1fb6ff)" }} />
              Teacher
            </div>
            <div className="smm-legend-item">
              <span className="smm-legend-dot" style={{ background: lineColor }} />
              Student
            </div>
            <div className="smm-legend-item">
              <span className="smm-legend-ring" />
              Geofence ({rad}m)
            </div>
          </div>
        </div>

      </div>
    </div>
  );
});

export default StudentMapModal;
