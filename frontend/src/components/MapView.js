import React, { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

// Fix for default marker icon in react-leaflet
let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

// Auto-fits map to show all markers (teacher + all students)
function FitBounds({ positions }) {
  const map = useMap();
  useEffect(() => {
    if (!positions || positions.length === 0) return;
    if (positions.length === 1) {
      map.setView(positions[0], 19);
      return;
    }
    const bounds = L.latLngBounds(positions);
    map.fitBounds(bounds, { padding: [60, 60], maxZoom: 19 });
  }, [map, positions]);
  return null;
}

const MapView = ({ sessionLocation, radius, attendance }) => {
  if (!sessionLocation) return null;

  const [lat, lng] = sessionLocation.split(",").map(Number);
  const position = [lat, lng];

  // Collect all positions: teacher + students (for fitBounds)
  const allPositions = [position];
  if (attendance) {
    attendance.forEach((student) => {
      if (student.Location) {
        const [stLat, stLng] = student.Location.split(",").map(Number);
        allPositions.push([stLat, stLng]);
      }
    });
  }

  return (
    <MapContainer
      center={position}
      zoom={19}
      style={{
        height: "450px",
        width: "100%",
        marginTop: "20px",
        borderRadius: "10px",
        border: "1px solid #ccc",
      }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      />

      {/* Auto-fit to all markers */}
      <FitBounds positions={allPositions} />

      {/* Classroom Marker */}
      <Marker position={position}>
        <Popup>
          <strong>Classroom Location</strong>
        </Popup>
      </Marker>

      {/* Geofence Circle */}
      <Circle
        center={position}
        radius={parseFloat(radius)}
        pathOptions={{ color: "blue", fillColor: "blue", fillOpacity: 0.1 }}
      />

      {/* Student Markers + Lines */}
      {attendance &&
        attendance.map((student, idx) => {
          if (!student.Location) return null;
          const [stLat, stLng] = student.Location.split(",").map(Number);
          const stPos = [stLat, stLng];
          const isInside = parseFloat(student.distance) <= parseFloat(radius);

          const customIcon = new L.DivIcon({
            className: "custom-div-icon",
            html: `<div style="background-color: ${
              isInside ? "#22c55e" : "#ef4444"
            }; width: 16px; height: 16px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 6px rgba(0,0,0,0.5);"></div>`,
            iconSize: [20, 20],
            iconAnchor: [10, 10],
          });

          return (
            <React.Fragment key={`student-${idx}`}>
              {/* Line from classroom to student */}
              <Polyline
                positions={[position, stPos]}
                pathOptions={{
                  color: isInside ? "#22c55e" : "#ef4444",
                  dashArray: "6, 5",
                  weight: 3,
                  opacity: 1,
                }}
              />

              <Marker position={stPos} icon={customIcon}>
                <Popup>
                  <div style={{ minWidth: "160px" }}>
                    <h4 style={{ margin: "0 0 5px 0", color: "#333" }}>{student.regno}</h4>
                    {student.student_email && (
                      <div style={{ fontSize: "12px", color: "#666", marginBottom: "5px" }}>
                        {student.student_email}
                      </div>
                    )}
                    <div
                      style={{
                        margin: "10px 0 5px 0",
                        padding: "5px",
                        borderRadius: "5px",
                        backgroundColor: isInside ? "#d4edda" : "#f8d7da",
                        color: isInside ? "#155724" : "#721c24",
                        fontWeight: "bold",
                        textAlign: "center",
                      }}
                    >
                      Status: {isInside ? "Verified ✓" : "Out of bounds ✗"}
                    </div>
                    <div style={{ fontSize: "11px", color: "#888", textAlign: "center" }}>
                      Distance: {student.distance}m
                    </div>
                  </div>
                </Popup>
              </Marker>
            </React.Fragment>
          );
        })}
    </MapContainer>
  );
};

export default MapView;
