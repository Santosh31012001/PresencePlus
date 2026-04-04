import React from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline, Tooltip } from "react-leaflet";
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

const MapView = ({ sessionLocation, radius, attendance }) => {
  if (!sessionLocation) return null;
  // sessionLocation is string like "28.7041,77.1025"
  const [lat, lng] = sessionLocation.split(",").map(Number);
  const position = [lat, lng];

  return (
    <MapContainer
      center={position}
      zoom={18}
      style={{
        height: "400px",
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

      {/* Student Markers */}
      {attendance &&
        attendance.map((student, idx) => {
          if (!student.Location) return null;
          const [stLat, stLng] = student.Location.split(",").map(Number);
          const stPos = [stLat, stLng];
          const isInside = parseFloat(student.distance) <= parseFloat(radius);

          // Custom colored dot icon for students
          const customIcon = new L.DivIcon({
            className: "custom-div-icon",
            html: `<div style="background-color: ${
              isInside ? "green" : "red"
            }; width: 16px; height: 16px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.5);"></div>`,
            iconSize: [20, 20],
            iconAnchor: [10, 10],
          });

          return (
            <React.Fragment key={idx}>
              <Polyline
                positions={[position, stPos]}
                pathOptions={{
                  color: isInside ? "green" : "red",
                  dashArray: "4 4",
                  weight: 2,
                }}
              >
                <Tooltip permanent direction="center" className="bg-transparent border-0 shadow-none text-xs font-bold">
                  {Math.round(parseFloat(student.distance))}m
                </Tooltip>
              </Polyline>

              <Circle
                center={stPos}
                radius={15}
                pathOptions={{ color: "orange", fillColor: "orange", fillOpacity: 0.2, stroke: false }}
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
                    <div style={{ margin: "10px 0 5px 0", padding: "5px", borderRadius: "5px", backgroundColor: isInside ? "#d4edda" : "#f8d7da", color: isInside ? "#155724" : "#721c24", fontWeight: "bold", textAlign: "center" }}>
                      Status: {isInside ? "Verified" : "Out of bounds"}
                    </div>
                    <div style={{ fontSize: "11px", color: "#888", textAlign: "center" }}>
                      Distance: {student.distance}m (±15m)
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
