import React, { useEffect } from "react";
import {
  MapContainer, TileLayer, Marker, Popup, Circle, Polyline, useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

/* ── Fix default Leaflet marker icon ─────────────────────────────────────── */
const DefaultIcon = L.icon({ iconUrl: icon, shadowUrl: iconShadow, iconAnchor: [12, 41] });
L.Marker.prototype.options.icon = DefaultIcon;

/* ── Teacher icon (classroom pin) ─────────────────────────────────────────── */
const TEACHER_ICON = new L.DivIcon({
  className: "",
  html: `<div style="
      width:42px;height:42px;
      background:linear-gradient(135deg,#7a69ff,#9b8aff);
      border-radius:50% 50% 50% 0;transform:rotate(-45deg);
      border:3px solid #fff;box-shadow:0 4px 18px rgba(122,105,255,0.55);">
    <div style="transform:rotate(45deg);display:flex;align-items:center;
      justify-content:center;height:100%;font-size:18px;margin-top:-2px;">🏫</div>
  </div>`,
  iconSize: [42, 42],
  iconAnchor: [21, 42],
  popupAnchor: [0, -44],
});

/* ── Student icon factory (verified / flagged) ─────────────────────────────── */
const makeStudentIcon = (isInside) =>
  new L.DivIcon({
    className: "",
    html: `<div style="
        width:34px;height:34px;
        background:${
          isInside
            ? "linear-gradient(135deg,#3dd498,#6ee7b7)"
            : "linear-gradient(135deg,#ff6b81,#ff92a0)"
        };
        border-radius:50% 50% 50% 0;transform:rotate(-45deg);
        border:3px solid #fff;
        box-shadow:0 4px 16px ${
          isInside ? "rgba(61,212,152,0.5)" : "rgba(255,107,129,0.5)"
        };">
      <div style="transform:rotate(45deg);display:flex;align-items:center;
        justify-content:center;height:100%;font-size:14px;margin-top:-2px;">
        ${isInside ? "✅" : "⚠️"}
      </div>
    </div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 34],
    popupAnchor: [0, -36],
  });

/* ── Geofence circle style ─────────────────────────────────────────────────── */
const GEOFENCE_STYLE = {
  color: "#7a69ff",
  fillColor: "#7a69ff",
  fillOpacity: 0.08,
  weight: 2,
  dashArray: "6 4",
};

/* ── FitBounds + invalidateSize after mount ────────────────────────────────── */
function FitAndInvalidate({ positions }) {
  const map = useMap();

  useEffect(() => {
    /* Small delay lets the container fully paint before Leaflet measures */
    const t = setTimeout(() => {
      map.invalidateSize();
      if (!positions || positions.length === 0) return;
      if (positions.length === 1) {
        map.setView(positions[0], 18);
        return;
      }
      const bounds = L.latLngBounds(positions);
      map.fitBounds(bounds, { padding: [80, 80], maxZoom: 18 });
    }, 100);
    return () => clearTimeout(t);
  }, [map, positions]);

  return null;
}

/* ══════════════════════════════════════════════════════════════════════════ */
const MapView = ({ sessionLocation, radius, attendance, onStudentClick }) => {
  if (!sessionLocation) return null;

  const [lat, lng] = sessionLocation.split(",").map(Number);
  const position   = [lat, lng];

  /* Collect all positions for FitBounds */
  const allPositions = [position];
  (attendance || []).forEach((s) => {
    if (s.Location) {
      const [sLat, sLng] = s.Location.split(",").map(Number);
      allPositions.push([sLat, sLng]);
    }
  });

  return (
    /* ── Key: EXPLICIT viewport units so Leaflet always has a measured size ── */
    <MapContainer
      center={position}
      zoom={18}
      style={{
        height: "100vh",
        width:  "100vw",
        position: "fixed",
        top: 0,
        left: 0,
        zIndex: 1,
      }}
      zoomControl={false}   /* We add our own positioned zoom control below */
    >
      {/* Relocate zoom control so it doesn't hide under the navbar */}
      <ZoomControl />

      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      />

      {/* Auto-fit + size-fix on mount */}
      <FitAndInvalidate positions={allPositions} />

      {/* Geofence circle */}
      <Circle center={position} radius={parseFloat(radius)} pathOptions={GEOFENCE_STYLE} />

      {/* Classroom marker */}
      <Marker position={position} icon={TEACHER_ICON}>
        <Popup>
          <div style={{ minWidth: 150, fontFamily: "'Inter', sans-serif" }}>
            <strong style={{ color: "#1f2937", fontSize: 13 }}>📍 Classroom Location</strong>
            <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>
              Geofence radius: <strong>{radius} m</strong>
            </div>
          </div>
        </Popup>
      </Marker>

      {/* Student markers + connection lines */}
      {(attendance || []).map((student, idx) => {
        if (!student.Location) return null;
        const [sLat, sLng] = student.Location.split(",").map(Number);
        const stPos        = [sLat, sLng];
        const isInside     = parseFloat(student.distance) <= parseFloat(radius);
        const lineColor    = isInside ? "#3dd498" : "#ff6b81";
        const studentIcon  = makeStudentIcon(isInside);

        return (
          <React.Fragment key={`student-${idx}`}>
            {/* Glow halo line */}
            <Polyline
              positions={[position, stPos]}
              pathOptions={{ color: lineColor, weight: 8, opacity: 0.12 }}
            />
            {/* Dashed main line */}
            <Polyline
              positions={[position, stPos]}
              pathOptions={{ color: lineColor, dashArray: "7 6", weight: 2.5, opacity: 0.85 }}
            />

            <Marker
              position={stPos}
              icon={studentIcon}
              eventHandlers={{
                click: () => onStudentClick && onStudentClick(student),
              }}
            >
              <Popup>
                <div style={{ minWidth: 170, fontFamily: "'Inter', sans-serif" }}>
                  <div style={{ fontWeight: 700, color: "#1f2937", fontSize: 13 }}>
                    {student.regno}
                  </div>
                  {student.student_email && (
                    <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>
                      {student.student_email}
                    </div>
                  )}
                  <div style={{
                    marginTop: 8, padding: "5px 10px", borderRadius: 8, textAlign: "center",
                    background: isInside ? "rgba(61,212,152,0.12)" : "rgba(255,107,129,0.12)",
                    color: isInside ? "#059669" : "#e11d48",
                    fontWeight: 700, fontSize: 12,
                    border: `1px solid ${isInside ? "rgba(61,212,152,0.3)" : "rgba(255,107,129,0.3)"}`,
                  }}>
                    {isInside ? "✅ Within geofence" : "⚠️ Outside geofence"}
                  </div>
                  <div style={{ fontSize: 11, color: "#9ca3af", textAlign: "center", marginTop: 6 }}>
                    Distance: {student.distance} m
                  </div>
                  {onStudentClick && (
                    <div
                      style={{
                        marginTop: 8, padding: "6px", borderRadius: 8,
                        background: "#f0eeff", color: "#7a69ff",
                        fontWeight: 700, fontSize: 11, textAlign: "center",
                        cursor: "pointer",
                      }}
                      onClick={() => onStudentClick(student)}
                    >
                      View on map detail →
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          </React.Fragment>
        );
      })}
    </MapContainer>
  );
};

/* ── Custom zoom control — bottom-left, offset past sidebar ────────────── */
function ZoomControl() {
  const map = useMap();
  useEffect(() => {
    const zc = L.control.zoom({ position: "bottomleft" }).addTo(map);
    // Push it right of the sidebar (240px expanded + gap)
    const el = zc.getContainer();
    if (el) {
      el.style.marginLeft = "260px";
      el.style.marginBottom = "24px";
    }
    return () => { try { map.removeControl(zc); } catch (_) {} };
  }, [map]);
  return null;
}

export default MapView;
