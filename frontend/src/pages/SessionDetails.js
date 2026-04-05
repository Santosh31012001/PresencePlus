//create a new session component
import React, { useEffect, useState } from "react";
import axios from "axios";
import QRCode from "qrcode.react";
import { io } from "socket.io-client";
import "../styles/SessionDetails.css";
import MapView from "../components/MapView";

const SessionDetails = (props) => {
  const [qr, setQR] = useState("");
  const [attendanceList, setAttendanceList] = useState(props.currentSession[0].attendance);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");

  useEffect(() => {
    const socket = io("http://localhost:5000");

    socket.on("new_attendance", (data) => {
      if (data.session_id === props.currentSession[0].session_id) {
        setAttendanceList((prev) => [...prev, data.student]);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [props.currentSession]);

  async function getQR() {
    await axios
      .post("http://localhost:5000/sessions/getQR", {
        session_id: props.currentSession[0].session_id,
        token: localStorage.getItem("token"),
      })
      .then((response) => {
        setQR(response.data.url);
      })
      .catch((error) => {
        console.log(error);
      });
  }
  const showImage = (e) => {
    let image = e.target.src;
    let imageWindow = window.open("", "_blank");
    imageWindow.document.write(
      `<img src=${image} alt="student" width="50%" />`
    );
  };
  const copyQR = () => {
    navigator.clipboard.writeText(qr);
  };

  function getDistance(distance, radius) {
    return {
      distance,
      color: distance <= parseFloat(radius) ? "green" : "red",
    };
  }

  useEffect(() => {
    getQR();
  });

  const radius = parseFloat(props.currentSession[0].radius);
  const suspiciousCount = attendanceList.filter(student => parseFloat(student.distance || 0) > radius).length;

  const filteredStudents = attendanceList.filter(student => {
    const matchesSearch = (student.regno || "").toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (student.student_email || "").toLowerCase().includes(searchTerm.toLowerCase());
    const isSuspicious = parseFloat(student.distance) > radius;
    
    if (filterStatus === "VERIFIED" && isSuspicious) return false;
    if (filterStatus === "SUSPICIOUS" && !isSuspicious) return false;
    
    return matchesSearch;
  });

  return (
    <div className="popup">
      <button onClick={props.toggleSessionDetails}>
        <strong>X</strong>
      </button>
      <div className="popup-inner">
        <div className="popup-content">
          <div className="session-details" style={{ flex: 1, minWidth: '250px' }}>
            <p><strong>Session Name</strong>: {props.currentSession[0].name}</p>
            <p><strong>Session Date</strong>: {props.currentSession[0].date.split("T")[0]}</p>
            <p><strong>Session Time</strong>: {props.currentSession[0].time}</p>
            <p><strong>Session Duration</strong>: {props.currentSession[0].duration}</p>
            <p><strong>Session Location</strong>: {props.currentSession[0].location}</p>
            <p><strong>Session Radius</strong>: {props.currentSession[0].radius} meters</p>
          </div>
          <div className="qr-code" style={{ flexShrink: 0 }}>
            <QRCode value={qr} onClick={copyQR} size={150} />
            <button onClick={copyQR} className="copybtn" style={{ padding: '8px', marginTop: '10px' }}>
              Copy Link
            </button>
          </div>
        </div>

        <div className="session-body" style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
          {/* Main Area: Alerts & Map */}
          <div className="main-content" style={{ flex: '2', minWidth: '400px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {suspiciousCount > 0 && (
              <div className="alert-panel" style={{ padding: '15px', background: '#f8d7da', border: '1px solid #f5c6cb', borderRadius: '8px', color: '#721c24', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '20px' }}>⚠️</span>
                <div>
                  <strong style={{ display: 'block' }}>Action Required: Proxy Suspected</strong>
                  <span>{suspiciousCount} student(s) marked attendance out of physical bounds! Check the map and sidebar for details.</span>
                </div>
              </div>
            )}
            
            <MapView 
              sessionLocation={props.currentSession[0].location} 
              radius={radius} 
              attendance={attendanceList} 
            />
          </div>

          {/* Sidebar Area: List & Filters */}
          <div className="sidebar" style={{ flex: '1', minWidth: '300px', display: 'flex', flexDirection: 'column', gap: '15px', background: 'rgba(0,0,0,0.02)', padding: '15px', borderRadius: '10px', border: '1px solid var(--border-soft)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '16px' }}>Attendance Log ({filteredStudents.length})</h3>
            </div>
            
            <div className="filters" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <input 
                type="text" 
                placeholder="Search Reg No or Email..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
                style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ccc', outline: 'none' }}
              />
              <select 
                value={filterStatus} 
                onChange={(e) => setFilterStatus(e.target.value)} 
                style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ccc', outline: 'none', background: '#fff' }}
              >
                <option value="ALL">All Students</option>
                <option value="VERIFIED">Verified Only (Inside)</option>
                <option value="SUSPICIOUS">Suspicious Only (Outside)</option>
              </select>
            </div>

            <div className="student-list scrollable-content" style={{ maxHeight: '420px', background: '#fff', borderRadius: '8px', border: '1px solid #eee' }}>
              {filteredStudents.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: '#888' }}>No students match your filters.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {filteredStudents.map((student, index) => {
                    const distProp = getDistance(student.distance, radius);
                    const isOk = distProp.color === 'green';
                    
                    return (
                      <div key={index} style={{ padding: '15px', borderBottom: '1px solid #f0f0f0', display: 'flex', gap: '15px', position: 'relative' }}>
                        {student.image ? (
                          <img
                            src={student.image}
                            alt="student"
                            style={{ height: '50px', width: '50px', borderRadius: '50%', objectFit: 'cover', cursor: 'pointer', border: '2px solid', borderColor: isOk ? '#28a745' : '#dc3545' }}
                            onClick={showImage}
                          />
                        ) : (
                          <div style={{ height: '50px', width: '50px', borderRadius: '50%', background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>N/A</div>
                        )}
                        <div style={{ flex: 1, overflow: 'hidden' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                            <strong style={{ fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{student.regno}</strong>
                            <span style={{ fontSize: '10px', fontWeight: 'bold', padding: '3px 6px', borderRadius: '10px', background: isOk ? '#d4edda' : '#f8d7da', color: isOk ? '#155724' : '#721c24' }}>
                              {isOk ? 'VERIFIED' : 'PROXY'}
                            </span>
                          </div>
                          <div style={{ fontSize: '12px', color: '#666', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{student.student_email}</div>
                          <div style={{ fontSize: '12px', marginTop: '4px', color: '#888' }}>Distance: <strong style={{ color: distProp.color }}>{distProp.distance}m</strong></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SessionDetails;
