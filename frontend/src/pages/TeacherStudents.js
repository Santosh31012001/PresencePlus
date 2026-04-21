import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  Box, Flex, Text, VStack, HStack, Spinner, Badge, Separator, SimpleGrid,
} from "@chakra-ui/react";
import {
  MdPeople, MdPerson, MdVideoCall, MdSearch, MdCheckCircle, MdWarning,
  MdMap, MdKeyboardArrowDown, MdKeyboardArrowUp,
} from "react-icons/md";
import StudentMapModal from "../components/StudentMapModal";

axios.defaults.withCredentials = true;

// ─── Session attendance row (inside the expanded student) ───────────────────
const SessionRow = ({ session, record, radius, onViewMap }) => {
  const isOk = parseFloat(record.distance || 0) <= parseFloat(radius || 50);
  const formatDate = (d) => {
    if (!d) return "—";
    try { return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }); }
    catch { return d; }
  };

  return (
    <Flex
      align="center"
      gap={3}
      p={3}
      borderRadius="12px"
      bg={isOk ? "#eafaf4" : "#fff5f6"}
      border={`1px solid ${isOk ? "rgba(61,212,152,0.25)" : "rgba(255,107,129,0.25)"}`}
    >
      {/* Session name */}
      <Box flex={1} minW={0}>
        <Text fontSize="xs" fontWeight="700" color="gray.700" noOfLines={1}>
          {session.name || "Untitled Session"}
        </Text>
        <Text fontSize="xs" color="gray.400" mt={0.5}>{formatDate(session.date)}</Text>
      </Box>

      {/* Distance badge */}
      <Badge
        fontSize="xs"
        fontWeight="700"
        px={2} py={1}
        borderRadius="8px"
        bg={isOk ? "#eafaf4" : "#fff0f1"}
        color={isOk ? "#3dd498" : "#ff4757"}
        border={`1px solid ${isOk ? "#3dd49840" : "#ff475740"}`}
      >
        {record.distance ? `${parseFloat(record.distance).toFixed(1)}m` : "—"}
      </Badge>

      {/* Status */}
      <Badge
        fontSize="xs"
        fontWeight="700"
        px={2} py={1}
        borderRadius="8px"
        bg={isOk ? "#eafaf4" : "#fff0f1"}
        color={isOk ? "#3dd498" : "#ff4757"}
      >
        {isOk ? "✅ OK" : "⚠️ Flag"}
      </Badge>

      {/* Map button — only if student has Location data */}
      {record.Location && (
        <Box
          as="button"
          onClick={() => onViewMap(record, session)}
          display="flex"
          alignItems="center"
          gap={1}
          px={3}
          py={2}
          borderRadius="10px"
          bg="#f0eeff"
          color="#7a69ff"
          fontSize="xs"
          fontWeight="700"
          border="none"
          cursor="pointer"
          style={{ transition: "all 0.15s" }}
          _hover={{ bg: "#e4e0ff" }}
        >
          <MdMap size={14} />
          Map
        </Box>
      )}
    </Flex>
  );
};

// ─── Expanded student card ───────────────────────────────────────────────────
const StudentCard = ({ student, onViewMap }) => {
  const [expanded, setExpanded] = useState(false);
  const total = student.records.length;
  const verified = student.records.filter(
    (r) => parseFloat(r.record.distance || 0) <= parseFloat(r.session.radius || 50)
  ).length;
  const rate = total > 0 ? Math.round((verified / total) * 100) : 0;
  const isClean = verified === total;

  return (
    <Box
      bg="white"
      borderRadius="20px"
      boxShadow="0 4px 20px rgba(122,105,255,0.07)"
      border="1px solid rgba(122,105,255,0.1)"
      overflow="hidden"
      transition="all 0.2s"
      _hover={{ boxShadow: "0 8px 28px rgba(122,105,255,0.14)" }}
    >
      {/* Header row */}
      <Flex
        align="center"
        gap={4}
        px={5}
        py={4}
        cursor="pointer"
        onClick={() => setExpanded(!expanded)}
        _hover={{ bg: "#faf9ff" }}
        transition="background 0.15s"
      >
        {/* Avatar */}
        <Box
          style={{
            background: isClean
              ? "linear-gradient(135deg, #3dd498, #00c6a0)"
              : "linear-gradient(135deg, #ff6b81, #ff4757)",
            borderRadius: "12px",
            padding: "10px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            boxShadow: isClean
              ? "0 4px 12px rgba(61,212,152,0.3)"
              : "0 4px 12px rgba(255,107,129,0.3)",
          }}
        >
          <MdPerson size={20} color="white" />
        </Box>

        {/* Name & email */}
        <Box flex={1} minW={0}>
          <Text fontWeight="700" color="gray.800" fontSize="md" noOfLines={1}>
            {student.regno || "Unknown"}
          </Text>
          <Text fontSize="xs" color="gray.400" noOfLines={1} mt={0.5}>
            {student.email || "—"}
          </Text>
        </Box>

        {/* Stats */}
        <HStack gap={3} flexShrink={0}>
          <Flex direction="column" align="center">
            <Text fontSize="lg" fontWeight="800" color="gray.800" lineHeight={1}>{total}</Text>
            <Text fontSize="10px" color="gray.400" fontWeight="600" textTransform="uppercase">Sessions</Text>
          </Flex>
          <Flex direction="column" align="center">
            <Text fontSize="lg" fontWeight="800" color={isClean ? "#3dd498" : "#ff6b81"} lineHeight={1}>{rate}%</Text>
            <Text fontSize="10px" color="gray.400" fontWeight="600" textTransform="uppercase">Clean</Text>
          </Flex>
          <Badge
            bg={isClean ? "#eafaf4" : "#fff0f1"}
            color={isClean ? "#3dd498" : "#ff4757"}
            borderRadius="8px" px={2} py={1} fontSize="xs" fontWeight="700"
          >
            {isClean ? "✅ Clean" : "⚠️ Flagged"}
          </Badge>
          <Box color="gray.400">
            {expanded ? <MdKeyboardArrowUp size={20} /> : <MdKeyboardArrowDown size={20} />}
          </Box>
        </HStack>
      </Flex>

      {/* Expanded session history */}
      {expanded && (
        <Box px={5} pb={4}>
          <Separator borderColor="gray.100" mb={4} />
          <Text fontSize="xs" fontWeight="700" color="gray.500" textTransform="uppercase" letterSpacing="0.06em" mb={3}>
            Session History
          </Text>
          <VStack gap={2} align="stretch">
            {student.records.map((r, i) => (
              <SessionRow
                key={i}
                session={r.session}
                record={r.record}
                radius={r.session.radius}
                onViewMap={onViewMap}
              />
            ))}
          </VStack>
        </Box>
      )}
    </Box>
  );
};

// ─── Main Page ───────────────────────────────────────────────────────────────
const TeacherStudents = () => {
  const [token] = useState(localStorage.getItem("token") || "");
  const [sessionList, setSessionList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [mapData, setMapData] = useState(null); // { student, sessionLocation, radius }
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) { navigate("/login"); return; }
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await axios.post("http://localhost:5000/sessions/getSessions", { token });
        setSessionList(res.data.sessions || []);
      } catch (err) {
        if (err.response?.status === 401) { localStorage.removeItem("token"); navigate("/login"); }
      } finally { setLoading(false); }
    };
    fetchData();
    // eslint-disable-next-line
  }, [token]);

  // Aggregate students — each student keeps ALL their session records
  const allStudents = React.useMemo(() => {
    const map = new Map();
    sessionList.forEach((session) => {
      (session.attendance || []).forEach((record) => {
        const key = record.regno || record.student_email;
        if (!key) return;
        if (!map.has(key)) {
          map.set(key, {
            regno: record.regno,
            email: record.student_email,
            records: [],
          });
        }
        map.get(key).records.push({ session, record });
      });
    });
    return Array.from(map.values());
  }, [sessionList]);

  const filtered = allStudents.filter((s) => {
    const q = search.toLowerCase();
    return (s.regno || "").toLowerCase().includes(q) || (s.email || "").toLowerCase().includes(q);
  });

  const openMap = (record, session) => {
    setMapData({
      student: record,
      sessionLocation: session.location,
      radius: parseFloat(session.radius || 50),
    });
  };

  // Summary stats
  const totalStudents = allStudents.length;
  const cleanStudents = allStudents.filter((s) =>
    s.records.every((r) => parseFloat(r.record.distance || 0) <= parseFloat(r.session.radius || 50))
  ).length;

  return (
    <Box minH="100vh" p={{ base: 4, md: 8 }}>
      {/* Header */}
      <Flex justify="space-between" align="center" mb={6} flexWrap="wrap" gap={4}>
        <Box>
          <Text fontSize="2xl" fontWeight="800" color="gray.800" letterSpacing="-0.5px">
            👥 Students
          </Text>
          <Text fontSize="sm" color="gray.500" mt={1}>
            {totalStudents} unique student{totalStudents !== 1 ? "s" : ""} · Click any card to see session history & map
          </Text>
        </Box>
      </Flex>

      {/* Quick Stats */}
      {!loading && totalStudents > 0 && (
        <SimpleGrid columns={{ base: 2, md: 3 }} gap={4} mb={6}>
          {[
            { label: "Total Students", value: totalStudents, color: "#7a69ff", bg: "#f0eeff" },
            { label: "Clean Record", value: cleanStudents, color: "#3dd498", bg: "#eafaf4" },
            { label: "Flagged", value: totalStudents - cleanStudents, color: "#ff6b81", bg: "#fff0f1" },
          ].map((stat) => (
            <Box
              key={stat.label}
              bg={stat.bg}
              borderRadius="16px"
              p={4}
              border={`1px solid ${stat.color}30`}
            >
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
          placeholder="Search by reg no or email…"
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
          <Box
            as="button"
            onClick={() => setSearch("")}
            fontSize="xs"
            color="gray.400"
            cursor="pointer"
            bg="transparent"
            border="none"
            _hover={{ color: "gray.600" }}
          >
            ✕
          </Box>
        )}
      </Box>

      {/* Content */}
      {loading ? (
        <Flex justify="center" align="center" py={20}><Spinner size="xl" color="#7a69ff" /></Flex>
      ) : filtered.length === 0 ? (
        <Flex direction="column" align="center" py={20} gap={4}>
          <Box bg="#f0eeff" borderRadius="50%" p={6} display="flex" alignItems="center" justifyContent="center">
            <MdPeople size={48} color="#7a69ff" />
          </Box>
          <Text color="gray.500" fontWeight="500">
            {search ? "No students match your search." : "No attendance data yet. Run a session first."}
          </Text>
        </Flex>
      ) : (
        <VStack gap={4} align="stretch">
          {filtered.map((student) => (
            <StudentCard
              key={student.regno || student.email}
              student={student}
              onViewMap={openMap}
            />
          ))}
        </VStack>
      )}

      {/* Map Modal */}
      {mapData && (
        <StudentMapModal
          student={mapData.student}
          sessionLocation={mapData.sessionLocation}
          radius={mapData.radius}
          onClose={() => setMapData(null)}
        />
      )}

      {/* Empty state for sessions without location */}
      {!loading && totalStudents > 0 && (
        <Flex align="center" gap={2} mt={4} justify="center">
          <MdMap size={14} color="#9ca3af" />
          <Text fontSize="xs" color="gray.400">
            "Map" button appears on sessions where GPS location was recorded
          </Text>
        </Flex>
      )}
    </Box>
  );
};

export default TeacherStudents;
