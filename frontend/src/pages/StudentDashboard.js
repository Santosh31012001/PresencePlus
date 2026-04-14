import React, { useEffect, useState } from "react";
import axios from "axios";
import "../styles/StudentDashboard.css";
import { useNavigate } from "react-router-dom";
import StudentForm from "./StudentForm";
import { Table, Box } from "@chakra-ui/react";
const queryParameters = new URLSearchParams(window.location.search);

const Dashboard = () => {
  //eslint-disable-next-line
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  // eslint-disable-next-line
  const [sessionList, setSessionList] = useState([]);
  const [isSessionDisplay, setSessionDisplay] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  function getStudentSessions() {
    setLoading(true);
    setError(null);
    console.log("Fetching sessions with token:", token);
    
    axios
      .post("http://localhost:5000/sessions/getStudentSessions", {
        token: token,
      })
      .then((response) => {
        console.log("Sessions fetched:", response.data);
        setSessionList(response.data.sessions || []);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching sessions:", error.response?.data || error.message);
        // If token is expired/invalid, clear it and redirect to login
        if (error.response?.status === 401) {
          localStorage.removeItem("token");
          navigate("/login");
          return;
        }
        setError(error.response?.data?.message || "Failed to load sessions");
        setSessionList([]);
        setLoading(false);
      });
  }

  function toggleStudentForm(action) {
    if (action === "open") {
      setSessionDisplay(true);
    } else {
      localStorage.removeItem("session_id");
      localStorage.removeItem("teacher_email");
      setSessionDisplay(false);
      navigate("/student-dashboard");
    }
  }

  function getDistance(distance, radius) {
    return {
      distance,
      color: distance <= parseFloat(radius) ? "green" : "red",
    };
  }

  useEffect(() => {
    if (token === "" || token === undefined) {
      navigate("/login");
    } else {
      getStudentSessions();
      try {
        if (
          queryParameters.get("session_id") !== null &&
          queryParameters.get("email") !== null
        ) {
          localStorage.setItem("session_id", queryParameters.get("session_id"));
          localStorage.setItem("teacher_email", queryParameters.get("email"));
        }
        if (
          localStorage.getItem("session_id") == null &&
          localStorage.getItem("teacher_email") == null
        ) {
          toggleStudentForm("close");
        } else {
          toggleStudentForm("open");
        }
      } catch (err) {
        console.error("Error in form setup:", err);
      }
    }
  }, [token, navigate]);

  return (
    <div className="dashboard-main student-dashboard">
      {!isSessionDisplay && (
        <div className="session-list">
          <h2>Your Sessions</h2>
          {error && (
            <Box bg="danger.500" color="white" p={4} mb={4} borderRadius="md">
              {error}
            </Box>
          )}
          {loading && (
            <Box textAlign="center" py={8}>
              <p>Loading sessions...</p>
            </Box>
          )}
          {!loading && !error && sessionList.length === 0 && (
            <Box textAlign="center" py={8} color="gray.500">
              <p>No sessions found</p>
            </Box>
          )}
          {!loading && sessionList.length > 0 && (
            <Table.Root>
              <Table.Header bg="brand.500">
                <Table.Row>
                  <Table.ColumnHeader color="white" fontWeight="bold">Name</Table.ColumnHeader>
                  <Table.ColumnHeader color="white" fontWeight="bold">Date</Table.ColumnHeader>
                  <Table.ColumnHeader color="white" fontWeight="bold">Time</Table.ColumnHeader>
                  <Table.ColumnHeader color="white" fontWeight="bold">Duration</Table.ColumnHeader>
                  <Table.ColumnHeader color="white" fontWeight="bold">Distance</Table.ColumnHeader>
                  <Table.ColumnHeader color="white" fontWeight="bold">Image</Table.ColumnHeader>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {sessionList.map((session, index) => {
                  return (
                    <Table.Row key={index} className="session">
                      <Table.Cell>{session.name}</Table.Cell>
                      <Table.Cell>{session.date.split("T")[0]}</Table.Cell>
                      <Table.Cell>{session.time}</Table.Cell>
                      <Table.Cell>{session.duration}</Table.Cell>
                      <Table.Cell
                        color={getDistance(session.distance, session.radius).color}
                        fontWeight="bold"
                      >
                        {getDistance(session.distance, session.radius).distance}
                      </Table.Cell>
                      <Table.Cell>
                        <img src={session.image} alt="session" width={200} />
                      </Table.Cell>
                    </Table.Row>
                  );
                })}
              </Table.Body>
            </Table.Root>
          )}
        </div>
      )}
      {isSessionDisplay && (
        <div className="popup-overlay">
          <StudentForm togglePopup={toggleStudentForm} />
        </div>
      )}
    </div>
  );
};

export default Dashboard;
