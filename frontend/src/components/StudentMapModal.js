import React, { useEffect } from "react";
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

// ── Fix default Leaflet icon path ──────────────────────────────────────────
import iconUrl from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";
const DefaultIcon = L.icon({ iconUrl, shadowUrl: iconShadow, iconAnchor: [12, 41] });
L.Marker.prototype.options.icon = DefaultIcon;

// ── Teacher pin (purple gradient) ──────────────────────────────────────────
const teacherIcon = new L.DivIcon({
  className: "",
  html: `
    <div style="
      width:38px; height:38px;
      background: linear-gradient(135deg,#8a7bff,#1fb6ff);
      border-radius:50% 50% 50% 0;
      transform:rotate(-45deg);
      border:3px solid #fff;
      box-shadow:0 4px 16px rgba(138,123,255,0.6);
    ">
      <div style="
        transform:rotate(45deg);
        display:flex; align-items:center; justify-content:center;
        height:100%; font-size:16px; margin-top:-2px;
      ">🏫</div>
    </div>`,
  iconSize: [38, 38],
  iconAnchor: [19, 38],
  popupAnchor: [0, -40],
});

// ── Student pin (green / red) ──────────────────────────────────────────────
function makeStudentIcon(isInside) {
  const bg = isInside
    ? "linear-gradient(135deg,#5be4a8,#00c6a0)"
    : "linear-gradient(135deg,#ff6b81,#ff4757)";
  const glow = isInside
    ? "rgba(91,228,168,0.55)"
    : "rgba(255,107,129,0.55)";
  return new L.DivIcon({
    className: "",
    html: `
      <div style="
        width:34px; height:34px;
        background:${bg};
        border-radius:50% 50% 50% 0;
        transform:rotate(-45deg);
        border:3px solid #fff;
        box-shadow:0 4px 16px ${glow};
      ">
        <div style="
          transform:rotate(45deg);
          display:flex; align-items:center; justify-content:center;
          height:100%; font-size:14px; margin-top:-2px;
        ">${isInside ? "✅" : "⚠️"}</div>
      </div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 34],
    popupAnchor: [0, -36],
  });
}

// ── Auto-fit both markers ──────────────────────────────────────────────────
function FitTwo({ teacherPos, studentPos }) {
  const map = useMap();
  useEffect(() => {
    // Wait for the modal's DOM to fully paint before sizing
    const timer = setTimeout(() => {
      map.invalidateSize();           // recalculate container dimensions
      const bounds = L.latLngBounds([teacherPos, studentPos]);
      map.fitBounds(bounds, {
        padding: [70, 70],
        maxZoom: 16,                  // never so close that line disappears
      });
    }, 150);
    return () => clearTimeout(timer);
  }, [map, teacherPos, studentPos]);
  return null;
}

// ── Animated polyline pulse ────────────────────────────────────────────────
function AnimatedLine({ positions, isInside }) {
  const color = isInside ? "#5be4a8" : "#ff6b81";
  return (
    <>
      {/* glow under-layer */}
      <Polyline
        positions={positions}
        pathOptions={{ color, weight: 10, opacity: 0.15 }}
      />
      {/* solid line */}
      <Polyline
        positions={positions}
        pathOptions={{ color, weight: 3, opacity: 0.9 }}
      />
      {/* dashed overlay */}
      <Polyline
        positions={positions}
        pathOptions={{
          color: "#fff",
          weight: 1.5,
          opacity: 0.5,
          dashArray: "8, 10",
        }}
      />
    </>
  );
}

// ── Responsive map height ──────────────────────────────────────────────────
function getMapHeight() {
  const w = window.innerWidth;
  if (w <= 480) return "260px";
  if (w <= 768) return "320px";
  return "420px";
}

// ── Main Modal ─────────────────────────────────────────────────────────────
const StudentMapModal = ({ student, sessionLocation, radius, onClose }) => {
  // ── ALL hooks must come before any early return ────────────────────────
  // Close on Escape key
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Guard — after all hooks
  if (!student || !sessionLocation) return null;

  const [tLat, tLng] = sessionLocation.split(",").map(Number);
  const teacherPos = [tLat, tLng];

  const [sLat, sLng] = student.Location.split(",").map(Number);
  const studentPos = [sLat, sLng];

  const dist = parseFloat(student.distance);
  const rad = parseFloat(radius);
  const isInside = dist <= rad;
  const mapHeight = getMapHeight();

  // Close on overlay click
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className="smm-overlay" onClick={handleOverlayClick}>
      <div className="smm-panel">

        {/* ── Header ── */}
        <div className="smm-header">
          <div className="smm-header-left">
            <div className="smm-avatar" style={{ borderColor: isInside ? "#5be4a8" : "#ff6b81" }}>
              {student.image
                ? <img src={student.image} alt="student" />
                : <span>{(student.regno || "?")[0]}</span>}
            </div>
            <div>
              <h2 className="smm-name">{student.regno}</h2>
              <p className="smm-email">{student.student_email}</p>
            </div>
          </div>

          <div className="smm-header-right">
            <div className={`smm-badge ${isInside ? "smm-badge--ok" : "smm-badge--bad"}`}>
              {isInside ? "✅ Verified" : "⚠️ Suspicious"}
            </div>
            <button className="smm-close-btn" onClick={onClose} title="Close">✕</button>
          </div>
        </div>

        {/* ── Stats row ── */}
        <div className="smm-stats">
          <div className="smm-stat">
            <span className="smm-stat-label">Distance</span>
            <span className="smm-stat-value" style={{ color: isInside ? "#5be4a8" : "#ff6b81" }}>
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
            zoomControl={true}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            />

            <FitTwo teacherPos={teacherPos} studentPos={studentPos} />

            {/* Geofence */}
            <Circle
              center={teacherPos}
              radius={rad}
              pathOptions={{
                color: "#8a7bff",
                fillColor: "#8a7bff",
                fillOpacity: 0.08,
                weight: 2,
                dashArray: "6 4",
              }}
            />

            {/* Connection line */}
            <AnimatedLine
              positions={[teacherPos, studentPos]}
              isInside={isInside}
            />

            {/* Teacher marker */}
            <Marker position={teacherPos} icon={teacherIcon}>
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
            <Marker position={studentPos} icon={makeStudentIcon(isInside)}>
              <Popup>
                <div style={{ minWidth: 160 }}>
                  <strong style={{ color: "#333" }}>{student.regno}</strong>
                  {student.student_email && (
                    <div style={{ fontSize: 12, color: "#666", marginTop: 3 }}>
                      {student.student_email}
                    </div>
                  )}
                  <div
                    style={{
                      marginTop: 8,
                      padding: "5px 8px",
                      borderRadius: 6,
                      background: isInside ? "#d4edda" : "#f8d7da",
                      color: isInside ? "#155724" : "#721c24",
                      fontWeight: "bold",
                      fontSize: 13,
                      textAlign: "center",
                    }}
                  >
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
              <span className="smm-legend-dot" style={{ background: isInside ? "#5be4a8" : "#ff6b81" }} />
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
};

export default StudentMapModal;
