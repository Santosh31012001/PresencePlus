import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  Box, Flex, Text, SimpleGrid, Spinner,
  HStack, VStack, Badge, Separator,
} from "@chakra-ui/react";
import {
  MdVideoCall, MdCalendarToday, MdAccessTime,
  MdCheckCircle, MdWarning, MdGpsFixed, MdPeople,
  MdBarChart, MdQrCodeScanner,
} from "react-icons/md";
import StudentForm from "./StudentForm";

axios.defaults.withCredentials = true;

const queryParameters = new URLSearchParams(window.location.search);

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  VERIFIED:         { label: "Verified",        color: "#3dd498", bg: "#eafaf4", border: "rgba(61,212,152,0.22)", icon: <MdCheckCircle size={13} /> },
  SUSPICIOUS:       { label: "Suspicious",      color: "#f59e0b", bg: "#fffbeb", border: "rgba(245,158,11,0.22)",  icon: <MdWarning size={13} />     },
  OUTSIDE_GEOFENCE: { label: "Outside Geofence",color: "#ff6b81", bg: "#fff0f1", border: "rgba(255,107,129,0.22)",icon: <MdWarning size={13} />     },
};

// ─── Session Card ─────────────────────────────────────────────────────────────
const SessionCard = ({ session }) => {
  const cfg = STATUS_CONFIG[session.status] || STATUS_CONFIG.SUSPICIOUS;

  const formatDate = (d) => {
    if (!d) return "—";
    try { return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }); }
    catch { return d; }
  };

  const distNum = parseFloat(session.distance || 0);
  const radius  = parseFloat(session.radius   || 50);
  const withinFence = distNum <= radius;

  return (
    <Box
      bg="white"
      borderRadius="20px"
      p={5}
      boxShadow="0 4px 20px rgba(122,105,255,0.07)"
      border="1px solid rgba(122,105,255,0.1)"
      position="relative"
      overflow="hidden"
      transition="all 0.22s cubic-bezier(0.4,0,0.2,1)"
      _hover={{ transform: "translateY(-4px)", boxShadow: "0 14px 36px rgba(122,105,255,0.16)" }}
    >
      {/* Top accent bar */}
      <Box
        position="absolute" top={0} left={0} right={0} h="3px"
        style={{ background: `linear-gradient(90deg, ${cfg.color}, ${cfg.color}88)` }}
      />

      {/* Header */}
      <Flex align="flex-start" justify="space-between" gap={3} mb={3}>
        <Flex align="flex-start" gap={3} flex={1} minW={0}>
          <Box
            style={{
              background: "linear-gradient(135deg, #7a69ff, #9b8aff)",
              borderRadius: "12px", padding: "9px",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0, boxShadow: "0 4px 12px rgba(122,105,255,0.3)",
            }}
          >
            <MdVideoCall size={18} color="white" />
          </Box>
          <Box minW={0} flex={1}>
            <Text fontWeight="700" color="gray.800" fontSize="sm" lineHeight="1.3"
              overflow="hidden" whiteSpace="nowrap" textOverflow="ellipsis">
              {session.name || "Untitled Session"}
            </Text>
            <Text fontSize="10px" color="gray.400" mt="2px" fontFamily="mono">
              {session.teacher_email || ""}
            </Text>
          </Box>
        </Flex>

        {/* Status badge */}
        <Flex
          align="center" gap={1}
          bg={cfg.bg} color={cfg.color}
          border={`1px solid ${cfg.border}`}
          borderRadius="999px" px={2} py="4px"
          flexShrink={0}
        >
          {cfg.icon}
          <Text fontSize="10px" fontWeight="700">{cfg.label}</Text>
        </Flex>
      </Flex>

      <Separator borderColor="rgba(122,105,255,0.08)" mb={3} />

      {/* Meta */}
      <VStack gap={2} align="stretch" mb={3}>
        <HStack gap={3}>
          <HStack gap={1}>
            <MdCalendarToday size={12} color="#9ca3af" />
            <Text fontSize="xs" color="gray.500">{formatDate(session.date)}</Text>
          </HStack>
          {session.time && (
            <HStack gap={1}>
              <MdAccessTime size={12} color="#9ca3af" />
              <Text fontSize="xs" color="gray.500">{session.time}</Text>
            </HStack>
          )}
          {session.duration && (
            <Badge bg="#f0eeff" color="#7a69ff" borderRadius="6px" px={2} fontSize="10px" fontWeight="700">
              {session.duration}m
            </Badge>
          )}
        </HStack>
      </VStack>

      {/* Distance chip */}
      <Flex
        align="center" justify="space-between"
        bg={withinFence ? "#eafaf4" : "#fff0f1"}
        borderRadius="10px" px={3} py={2}
        border={`1px solid ${withinFence ? "rgba(61,212,152,0.2)" : "rgba(255,107,129,0.2)"}`}
      >
        <HStack gap={2}>
          <MdGpsFixed size={13} color={withinFence ? "#3dd498" : "#ff6b81"} />
          <Text fontSize="xs" fontWeight="600" color={withinFence ? "#3dd498" : "#ff6b81"}>
            {distNum.toFixed(1)}m from session
          </Text>
        </HStack>
        <Text fontSize="10px" color="gray.400">radius: {radius}m</Text>
      </Flex>
    </Box>
  );
};

// ─── Main Dashboard ───────────────────────────────────────────────────────────
const StudentDashboard = () => {
  const [token] = useState(localStorage.getItem("token") || "");
  const [sessionList, setSessionList]   = useState([]);
  const [isSessionDisplay, setSessionDisplay] = useState(false);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState(null);
  const navigate = useNavigate();

  const getStudentSessions = () => {
    setLoading(true);
    setError(null);
    axios
      .post("http://localhost:5000/sessions/getStudentSessions", { token })
      .then((res) => { setSessionList(res.data.sessions || []); setLoading(false); })
      .catch((err) => {
        if (err.response?.status === 401) { localStorage.removeItem("token"); navigate("/login"); return; }
        setError(err.response?.data?.message || "Failed to load sessions");
        setSessionList([]);
        setLoading(false);
      });
  };

  const toggleStudentForm = (action) => {
    if (action === "open") {
      setSessionDisplay(true);
    } else {
      localStorage.removeItem("session_id");
      localStorage.removeItem("teacher_email");
      setSessionDisplay(false);
      navigate("/student-dashboard");
      getStudentSessions();
    }
  };

  useEffect(() => {
    if (!token) { navigate("/login"); return; }
    getStudentSessions();
    try {
      if (queryParameters.get("session_id") && queryParameters.get("email")) {
        localStorage.setItem("session_id",     queryParameters.get("session_id"));
        localStorage.setItem("teacher_email",  queryParameters.get("email"));
      }
      const hasSession = localStorage.getItem("session_id") && localStorage.getItem("teacher_email");
      toggleStudentForm(hasSession ? "open" : "close");
    } catch (err) { console.error("Form setup error:", err); }
    // eslint-disable-next-line
  }, [token]);

  // ── derived stats ──
  const verified   = sessionList.filter((s) => s.status === "VERIFIED").length;
  const suspicious = sessionList.filter((s) => s.status === "SUSPICIOUS" || s.status === "OUTSIDE_GEOFENCE").length;
  const totalSessions = sessionList.length;

  return (
    <Box minH="100vh" bg="#f7f6ff" p={{ base: 4, md: 8 }}>

      {/* ── Header ── */}
      <Flex justify="space-between" align="center" mb={8} flexWrap="wrap" gap={4}>
        <Box>
          <Text fontSize={{ base: "xl", md: "2xl" }} fontWeight="800" color="gray.800" letterSpacing="-0.5px">
            👋 My Attendance
          </Text>
          <Text fontSize="sm" color="gray.500" mt={1}>
            Track your attendance history across all sessions.
          </Text>
        </Box>

        {/* Scan button — opens form if a session is active */}
        <Flex
          as="button"
          align="center" gap={2}
          bg="linear-gradient(135deg, #7a69ff, #6558ee)"
          color="white" fontWeight="700" fontSize="sm"
          borderRadius="14px" px={5} py="10px"
          boxShadow="0 6px 20px rgba(122,105,255,0.4)"
          _hover={{ boxShadow: "0 8px 28px rgba(122,105,255,0.55)", transform: "translateY(-2px)" }}
          transition="all 0.2s"
          onClick={() => toggleStudentForm("open")}
          cursor="pointer" border="none"
        >
          <MdQrCodeScanner size={18} />
          Mark Attendance
        </Flex>
      </Flex>

      {/* ── Stat chips ── */}
      {!loading && totalSessions > 0 && (
        <SimpleGrid columns={{ base: 3 }} gap={4} mb={8}>
          {[
            { label: "Sessions",  value: totalSessions, color: "#7a69ff", bg: "#f0eeff", icon: <MdBarChart size={18} color="#7a69ff" /> },
            { label: "Verified",  value: verified,      color: "#3dd498", bg: "#eafaf4", icon: <MdCheckCircle size={18} color="#3dd498" /> },
            { label: "Flagged",   value: suspicious,    color: "#ff6b81", bg: "#fff0f1", icon: <MdWarning size={18} color="#ff6b81" /> },
          ].map((s) => (
            <Box key={s.label} bg={s.bg} borderRadius="18px" p={4}
              border={`1px solid ${s.color}30`}
              boxShadow={`0 4px 16px ${s.color}12`}>
              <Flex align="center" gap={2} mb={1}>{s.icon}</Flex>
              <Text fontSize="2xl" fontWeight="800" color={s.color} lineHeight={1}>{s.value}</Text>
              <Text fontSize="xs" color="gray.500" fontWeight="600" mt={1}>{s.label}</Text>
            </Box>
          ))}
        </SimpleGrid>
      )}

      {/* ── Error banner ── */}
      {error && (
        <Flex align="center" gap={3} bg="#fff0f1" border="1px solid rgba(255,107,129,0.3)"
          borderRadius="14px" p={4} mb={5}>
          <MdWarning size={18} color="#ff6b81" />
          <Text fontSize="sm" color="#ff6b81" fontWeight="600">{error}</Text>
        </Flex>
      )}

      {/* ── Loading ── */}
      {loading && (
        <Flex justify="center" align="center" py={20}>
          <Spinner size="xl" color="#7a69ff" />
        </Flex>
      )}

      {/* ── Empty state ── */}
      {!loading && !error && totalSessions === 0 && (
        <Flex direction="column" align="center" py={20} gap={4}>
          <Box bg="#f0eeff" borderRadius="50%" p={6}
            display="flex" alignItems="center" justifyContent="center"
            boxShadow="0 8px 24px rgba(122,105,255,0.2)">
            <MdPeople size={48} color="#7a69ff" />
          </Box>
          <Text color="gray.500" fontWeight="500" fontSize="sm">
            No sessions attended yet.
          </Text>
          <Text fontSize="xs" color="gray.400" textAlign="center" maxW="280px">
            Scan a teacher's QR code to mark attendance for your first session.
          </Text>
        </Flex>
      )}

      {/* ── Session grid ── */}
      {!loading && totalSessions > 0 && (
        <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} gap={5}>
          {sessionList.map((session, i) => (
            <SessionCard key={session.session_id || i} session={session} />
          ))}
        </SimpleGrid>
      )}

      {/* ── Attendance form overlay ── */}
      {isSessionDisplay && (
        <Box
          position="fixed" inset={0}
          bg="rgba(15,10,40,0.55)" backdropFilter="blur(6px)"
          zIndex={200}
          display="flex" alignItems="center" justifyContent="center"
        >
          <StudentForm togglePopup={toggleStudentForm} />
        </Box>
      )}
    </Box>
  );
};

export default StudentDashboard;
