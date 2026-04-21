import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  Box, Flex, Text, SimpleGrid, Badge,
  Spinner, HStack, VStack, Button, Separator,
} from "@chakra-ui/react";
import {
  MdVideoCall, MdCalendarToday, MdAccessTime,
  MdAdd, MdSearch, MdGpsFixed, MdPeople, MdCheckCircle,
  MdWarning, MdArrowForward,
} from "react-icons/md";
import SessionDetails from "./SessionDetails";
import NewSession from "./NewSession";

axios.defaults.withCredentials = true;

// ─── Session Card ─────────────────────────────────────────────────────────────
const SessionCard = ({ session, onClick }) => {
  const attendance = session.attendance || [];
  const radius = parseFloat(session.radius || 50);
  const verified = attendance.filter((s) => parseFloat(s.distance || 0) <= radius).length;
  const suspicious = attendance.length - verified;

  const formatDate = (d) => {
    if (!d) return "—";
    try { return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }); }
    catch { return d; }
  };

  const attendanceRate = attendance.length > 0
    ? Math.round((verified / attendance.length) * 100) : null;

  return (
    <Box
      bg="white"
      borderRadius="20px"
      p={5}
      boxShadow="0 4px 20px rgba(122,105,255,0.07)"
      border="1px solid rgba(122,105,255,0.1)"
      cursor="pointer"
      transition="all 0.22s cubic-bezier(0.4,0,0.2,1)"
      _hover={{ transform: "translateY(-5px)", boxShadow: "0 14px 36px rgba(122,105,255,0.18)" }}
      onClick={onClick}
      position="relative"
      overflow="hidden"
    >
      {/* Top accent bar */}
      <Box
        position="absolute"
        top={0} left={0} right={0} h="3px"
        style={{ background: "linear-gradient(90deg, #7a69ff, #9b8aff)" }}
      />

      {/* Header */}
      <Flex align="flex-start" gap={3} mb={4}>
        <Box
          style={{
            background: "linear-gradient(135deg, #7a69ff, #9b8aff)",
            borderRadius: "12px",
            padding: "10px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            boxShadow: "0 4px 12px rgba(122,105,255,0.35)",
          }}
        >
          <MdVideoCall size={20} color="white" />
        </Box>
        <Box flex={1} minW={0}>
          <Text fontWeight="700" color="gray.800" fontSize="md" noOfLines={2} lineHeight="1.3">
            {session.name || "Untitled Session"}
          </Text>
          <Text fontSize="10px" color="gray.400" mt={1} fontFamily="mono" letterSpacing="0.03em">
            ID: {(session.session_id || "").slice(0, 12)}…
          </Text>
        </Box>
        <Box color="gray.200"><MdArrowForward size={18} /></Box>
      </Flex>

      <Separator borderColor="rgba(122,105,255,0.08)" mb={4} />

      {/* Meta row */}
      <VStack gap={2} align="stretch" mb={4}>
        <HStack gap={2}>
          <MdCalendarToday size={13} color="#9ca3af" />
          <Text fontSize="xs" color="gray.500">{formatDate(session.date)}</Text>
          {session.time && (
            <>
              <MdAccessTime size={13} color="#9ca3af" />
              <Text fontSize="xs" color="gray.500">{session.time}</Text>
            </>
          )}
        </HStack>
        <HStack gap={2}>
          <MdGpsFixed size={13} color="#9ca3af" />
          <Text fontSize="xs" color="gray.500">Radius: {radius}m</Text>
          {session.duration && (
            <Text fontSize="xs" color="gray.500">· {session.duration} min</Text>
          )}
        </HStack>
      </VStack>

      {/* Attendance Stats */}
      {attendance.length > 0 ? (
        <Box bg="#f8f7ff" borderRadius="12px" p={3}>
          <Flex justify="space-between" align="center" mb={2}>
            <Text fontSize="xs" fontWeight="700" color="gray.500" textTransform="uppercase" letterSpacing="0.06em">
              Attendance
            </Text>
            {attendanceRate !== null && (
              <Text fontSize="xs" fontWeight="800" color="#7a69ff">{attendanceRate}% clean</Text>
            )}
          </Flex>
          <Flex gap={3}>
            <Flex align="center" gap={1}>
              <MdPeople size={13} color="#7a69ff" />
              <Text fontSize="xs" fontWeight="700" color="gray.700">{attendance.length} total</Text>
            </Flex>
            <Flex align="center" gap={1}>
              <MdCheckCircle size={13} color="#3dd498" />
              <Text fontSize="xs" fontWeight="700" color="#3dd498">{verified} verified</Text>
            </Flex>
            {suspicious > 0 && (
              <Flex align="center" gap={1}>
                <MdWarning size={13} color="#ff6b81" />
                <Text fontSize="xs" fontWeight="700" color="#ff6b81">{suspicious} flagged</Text>
              </Flex>
            )}
          </Flex>
          {/* Progress bar */}
          <Box bg="gray.200" borderRadius="999px" h="5px" mt={2} overflow="hidden">
            <Box
              h="5px"
              borderRadius="999px"
              style={{
                width: `${attendanceRate}%`,
                background: attendanceRate === 100
                  ? "#3dd498"
                  : attendanceRate > 70
                  ? "#1fb6ff"
                  : "#ff6b81",
                transition: "width 0.5s ease",
              }}
            />
          </Box>
        </Box>
      ) : (
        <Flex align="center" gap={2} bg="#f8f7ff" borderRadius="12px" p={3}>
          <MdPeople size={14} color="#9ca3af" />
          <Text fontSize="xs" color="gray.400">No attendance recorded yet</Text>
        </Flex>
      )}
    </Box>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
const TeacherSessions = () => {
  const [token] = useState(localStorage.getItem("token") || "");
  const [sessionList, setSessionList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);       // create session popup
  const [activeSession, setActiveSession] = useState(null); // selected session for details
  const navigate = useNavigate();

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const res = await axios.post("http://localhost:5000/sessions/getSessions", { token });
      setSessionList(res.data.sessions || []);
    } catch (err) {
      if (err.response?.status === 401) { localStorage.removeItem("token"); navigate("/login"); }
    } finally { setLoading(false); }
  };

  useEffect(() => {
    if (!token) navigate("/login");
    else fetchSessions();
    // eslint-disable-next-line
  }, [token]);

  const openSession = (session_id) => {
    const found = sessionList.filter((s) => s.session_id === session_id);
    setActiveSession(found);
  };

  const closeSession = () => setActiveSession(null);

  const togglePopup = () => {
    setIsOpen((p) => !p);
    if (isOpen) fetchSessions();
  };

  const filtered = sessionList.filter((s) =>
    (s.name || "").toLowerCase().includes(search.toLowerCase())
  );

  // Summary counts
  const totalStudents = sessionList.reduce((acc, s) => acc + (s.attendance?.length || 0), 0);

  return (
    <Box minH="100vh" p={{ base: 4, md: 8 }}>
      {/* Header */}
      <Flex justify="space-between" align="center" mb={6} flexWrap="wrap" gap={4}>
        <Box>
          <Text fontSize="2xl" fontWeight="800" color="gray.800" letterSpacing="-0.5px">
            📡 Sessions
          </Text>
          <Text fontSize="sm" color="gray.500" mt={1}>
            {sessionList.length} session{sessionList.length !== 1 ? "s" : ""} · {totalStudents} attendance records
          </Text>
        </Box>
        <Button
          leftIcon={<MdAdd size={18} />}
          onClick={togglePopup}
          style={{ background: "linear-gradient(135deg, #7a69ff, #6558ee)" }}
          color="white"
          fontWeight="700"
          borderRadius="14px"
          px={6} py={5}
          boxShadow="0 6px 20px rgba(122, 105, 255, 0.4)"
          _hover={{ boxShadow: "0 8px 28px rgba(122, 105, 255, 0.55)", transform: "translateY(-2px)" }}
          _active={{ transform: "translateY(0)" }}
          transition="all 0.2s"
        >
          New Session
        </Button>
      </Flex>

      {/* Quick summary bar */}
      {!loading && sessionList.length > 0 && (
        <SimpleGrid columns={{ base: 2, md: 4 }} gap={4} mb={6}>
          {[
            { label: "Total Sessions", value: sessionList.length, color: "#7a69ff", bg: "#f0eeff" },
            { label: "Total Attendance", value: totalStudents, color: "#1fb6ff", bg: "#e8f7ff" },
            {
              label: "Verified",
              value: sessionList.reduce((acc, s) => {
                const r = parseFloat(s.radius || 50);
                return acc + (s.attendance || []).filter((a) => parseFloat(a.distance || 0) <= r).length;
              }, 0),
              color: "#3dd498",
              bg: "#eafaf4",
            },
            {
              label: "Flagged",
              value: sessionList.reduce((acc, s) => {
                const r = parseFloat(s.radius || 50);
                return acc + (s.attendance || []).filter((a) => parseFloat(a.distance || 0) > r).length;
              }, 0),
              color: "#ff6b81",
              bg: "#fff0f1",
            },
          ].map((stat) => (
            <Box key={stat.label} bg={stat.bg} borderRadius="16px" p={4} border={`1px solid ${stat.color}30`}>
              <Text fontSize="2xl" fontWeight="800" color={stat.color} lineHeight={1}>{stat.value}</Text>
              <Text fontSize="xs" color="gray.500" fontWeight="600" mt={1}>{stat.label}</Text>
            </Box>
          ))}
        </SimpleGrid>
      )}

      {/* Search */}
      <Box
        mb={5}
        bg="white"
        borderRadius="14px"
        border="1px solid rgba(122,105,255,0.15)"
        boxShadow="0 2px 8px rgba(122,105,255,0.06)"
        px={4} py={3}
        display="flex"
        alignItems="center"
        gap={3}
      >
        <MdSearch size={20} color="#9ca3af" />
        <Box
          as="input"
          placeholder="Search sessions by name…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          flex={1}
          border="none"
          outline="none"
          fontSize="sm"
          color="gray.700"
          bg="transparent"
          _placeholder={{ color: "gray.400" }}
        />
        {search && (
          <Box as="button" onClick={() => setSearch("")} fontSize="xs" color="gray.400"
            cursor="pointer" bg="transparent" border="none" _hover={{ color: "gray.600" }}>
            ✕
          </Box>
        )}
      </Box>

      {/* Grid */}
      {loading ? (
        <Flex justify="center" align="center" py={20}><Spinner size="xl" color="#7a69ff" /></Flex>
      ) : filtered.length === 0 ? (
        <Flex direction="column" align="center" py={20} gap={4}>
          <Box bg="#f0eeff" borderRadius="50%" p={6} display="flex" alignItems="center" justifyContent="center">
            <MdVideoCall size={48} color="#7a69ff" />
          </Box>
          <Text color="gray.500" fontWeight="500">
            {search ? "No sessions match your search." : "No sessions yet — create your first one!"}
          </Text>
          {!search && (
            <Button size="sm" onClick={togglePopup} style={{ background: "#7a69ff" }} color="white" borderRadius="12px">
              Create Session
            </Button>
          )}
        </Flex>
      ) : (
        <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} gap={5}>
          {filtered.map((session, i) => (
            <SessionCard
              key={session.session_id || i}
              session={session}
              onClick={() => openSession(session.session_id)}
            />
          ))}
        </SimpleGrid>
      )}

      {/* ── Session Details (full-screen overlay) ── */}
      {activeSession && (
        <SessionDetails
          currentSession={activeSession}
          toggleSessionDetails={closeSession}
        />
      )}

      {/* ── New Session Popup ── */}
      {isOpen && (
        <Box
          position="fixed" inset={0}
          bg="rgba(0,0,0,0.5)"
          backdropFilter="blur(4px)"
          zIndex={100}
          display="flex" alignItems="center" justifyContent="center"
        >
          <NewSession togglePopup={togglePopup} />
        </Box>
      )}
    </Box>
  );
};

export default TeacherSessions;
