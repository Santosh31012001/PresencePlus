import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Box, Flex, Text, SimpleGrid, Spinner, VStack } from "@chakra-ui/react";
import {
  MdBarChart, MdVideoCall, MdCheckCircle, MdWarning, MdPeople,
} from "react-icons/md";
import StatsCard from "../components/StatsCard";

axios.defaults.withCredentials = true;

// Simple bar chart using divs
const BarChart = ({ data, max }) => (
  <VStack gap={3} align="stretch">
    {data.map((item, i) => (
      <Box key={i}>
        <Flex justify="space-between" mb={1}>
          <Text fontSize="xs" fontWeight="600" color="gray.600" noOfLines={1}>{item.label}</Text>
          <Text fontSize="xs" color="gray.400">{item.value} students</Text>
        </Flex>
        <Box bg="gray.100" borderRadius="999px" h="8px" overflow="hidden">
          <Box
            h="8px"
            borderRadius="999px"
            style={{
              width: max > 0 ? `${(item.value / max) * 100}%` : "0%",
              background: "linear-gradient(90deg, #7a69ff, #9b8aff)",
              transition: "width 0.6s ease",
            }}
          />
        </Box>
      </Box>
    ))}
  </VStack>
);

const TeacherAnalytics = () => {
  const [token] = useState(localStorage.getItem("token") || "");
  const [sessionList, setSessionList] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) { navigate("/login"); return; }
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await axios.post("http://localhost:5000/sessions/getSessions", { token });
        setSessionList(res.data.sessions || []);
      } catch (err) {
        if (err.response?.status === 401) { localStorage.removeItem("token"); navigate("/login"); }
      } finally { setLoading(false); }
    };
    fetch();
    // eslint-disable-next-line
  }, [token]);

  // Compute stats
  const totalSessions = sessionList.length;
  const allAttendance = sessionList.flatMap((s) => s.attendance || []);
  const totalAttendance = allAttendance.length;

  const uniqueStudents = new Set(
    allAttendance.map((s) => s.regno || s.student_email).filter(Boolean)
  ).size;

  const suspiciousTotal = sessionList.reduce((acc, session) => {
    const radius = parseFloat(session.radius || 50);
    return acc + (session.attendance || []).filter(
      (s) => parseFloat(s.distance || 0) > radius
    ).length;
  }, 0);

  const verifiedTotal = totalAttendance - suspiciousTotal;
  const avgPerSession = totalSessions > 0
    ? (totalAttendance / totalSessions).toFixed(1) : 0;

  // Top sessions by attendance
  const topSessions = [...sessionList]
    .sort((a, b) => (b.attendance?.length || 0) - (a.attendance?.length || 0))
    .slice(0, 6)
    .map((s) => ({ label: s.name || "Untitled", value: s.attendance?.length || 0 }));

  const maxAttendance = topSessions.length > 0 ? topSessions[0].value : 1;

  return (
    <Box minH="100vh" p={{ base: 4, md: 8 }}>
      {/* Header */}
      <Box mb={6}>
        <Text fontSize="2xl" fontWeight="800" color="gray.800" letterSpacing="-0.5px">
          📊 Analytics
        </Text>
        <Text fontSize="sm" color="gray.500" mt={1}>
          Overview of attendance and session performance
        </Text>
      </Box>

      {loading ? (
        <Flex justify="center" align="center" py={20}><Spinner size="xl" color="#7a69ff" /></Flex>
      ) : totalSessions === 0 ? (
        <Flex direction="column" align="center" py={20} gap={4}>
          <Box bg="#f0eeff" borderRadius="50%" p={6} display="flex" alignItems="center" justifyContent="center">
            <MdBarChart size={48} color="#7a69ff" />
          </Box>
          <Text color="gray.500" fontWeight="500">No data yet. Create sessions to see analytics.</Text>
        </Flex>
      ) : (
        <>
          {/* Stats Grid */}
          <SimpleGrid columns={{ base: 2, md: 2, lg: 4 }} gap={5} mb={8}>
            <StatsCard
              label="Total Sessions"
              value={totalSessions}
              icon={<MdVideoCall size={22} color="white" />}
              accent="#7a69ff"
            />
            <StatsCard
              label="Unique Students"
              value={uniqueStudents}
              icon={<MdPeople size={22} color="white" />}
              accent="#1fb6ff"
            />
            <StatsCard
              label="Verified Check-ins"
              value={verifiedTotal}
              icon={<MdCheckCircle size={22} color="white" />}
              accent="#3dd498"
              trend={totalAttendance > 0 ? `${Math.round((verifiedTotal / totalAttendance) * 100)}% of total` : ""}
            />
            <StatsCard
              label="Suspicious"
              value={suspiciousTotal}
              icon={<MdWarning size={22} color="white" />}
              accent="#ff6b81"
              trend={totalAttendance > 0 ? `${Math.round((suspiciousTotal / totalAttendance) * 100)}% of total` : ""}
            />
          </SimpleGrid>

          {/* Charts row */}
          <SimpleGrid columns={{ base: 1, lg: 2 }} gap={6}>
            {/* Top sessions bar chart */}
            <Box
              bg="white"
              borderRadius="24px"
              p={6}
              boxShadow="0 4px 24px rgba(122,105,255,0.07)"
              border="1px solid rgba(122,105,255,0.1)"
            >
              <Flex justify="space-between" align="center" mb={5}>
                <Text fontWeight="700" fontSize="md" color="gray.800">
                  Top Sessions by Attendance
                </Text>
              </Flex>
              {topSessions.length > 0 ? (
                <BarChart data={topSessions} max={maxAttendance} />
              ) : (
                <Text color="gray.400" fontSize="sm">No attendance data yet.</Text>
              )}
            </Box>

            {/* Summary card */}
            <Box
              bg="white"
              borderRadius="24px"
              p={6}
              boxShadow="0 4px 24px rgba(122,105,255,0.07)"
              border="1px solid rgba(122,105,255,0.1)"
            >
              <Text fontWeight="700" fontSize="md" color="gray.800" mb={5}>
                Key Metrics
              </Text>
              <VStack gap={4} align="stretch">
                {[
                  { label: "Avg. students per session", value: avgPerSession, color: "#7a69ff" },
                  { label: "Total attendance records", value: totalAttendance, color: "#1fb6ff" },
                  { label: "Geofence pass rate", value: totalAttendance > 0 ? `${Math.round((verifiedTotal / totalAttendance) * 100)}%` : "N/A", color: "#3dd498" },
                  { label: "Out-of-range incidents", value: suspiciousTotal, color: "#ff6b81" },
                ].map((metric) => (
                  <Flex key={metric.label} justify="space-between" align="center" p={3} borderRadius="12px" bg="#faf9ff">
                    <Text fontSize="sm" color="gray.600">{metric.label}</Text>
                    <Text fontSize="lg" fontWeight="800" color={metric.color}>{metric.value}</Text>
                  </Flex>
                ))}
              </VStack>
            </Box>
          </SimpleGrid>
        </>
      )}
    </Box>
  );
};

export default TeacherAnalytics;
