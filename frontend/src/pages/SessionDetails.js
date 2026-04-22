import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
import axios from "axios";
import QRCode from "qrcode.react";
import { io } from "socket.io-client";
import { Box, Flex, Text, Button, HStack } from "@chakra-ui/react";
import { MdClose, MdQrCode2, MdPeople, MdCheckCircle, MdWarning, MdMyLocation } from "react-icons/md";
import MapView from "../components/MapView";
import StudentMapModal from "../components/StudentMapModal";

/* ─────────────────────────────────────────────────────────────────────────── */
/*  SessionDetails — full-screen map view with floating navbar & stat chips   */
/* ─────────────────────────────────────────────────────────────────────────── */

const SessionDetails = (props) => {
  const [qr, setQR] = useState("");
  const [attendanceList, setAttendanceList] = useState(
    props.currentSession?.[0]?.attendance || []
  );
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [qrOpen, setQrOpen] = useState(false);
  const qrPopoverRef = useRef(null);

  const currentSession = props.currentSession?.[0];

  /* ── Socket listener — live attendance updates ── */
  useEffect(() => {
    if (!currentSession) return;
    const socket = io("http://localhost:5000");
    socket.on("new_attendance", (data) => {
      if (data.session_id === currentSession.session_id) {
        setAttendanceList((prev) => [...prev, data.student]);
      }
    });
    return () => { socket.disconnect(); };
  }, [currentSession]);

  /* ── Fetch QR code ── */
  const getQR = useCallback(async () => {
    if (!currentSession) return;
    try {
      const res = await axios.post("http://localhost:5000/sessions/getQR", {
        session_id: currentSession.session_id,
        token: localStorage.getItem("token"),
      });
      setQR(res.data.url);
    } catch (e) {
      console.log("QR Fetch Error:", e);
    }
  }, [currentSession]);

  useEffect(() => { getQR(); }, [getQR]);

  /* ── Close QR popover on outside click ── */
  useEffect(() => {
    if (!qrOpen) return;
    const handleClick = (e) => {
      if (qrPopoverRef.current && !qrPopoverRef.current.contains(e.target)) {
        setQrOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [qrOpen]);

  /* ── Derived stats ── */
  const radius = useMemo(
    () => (currentSession ? parseFloat(currentSession.radius) : 0),
    [currentSession]
  );

  const suspiciousCount = useMemo(
    () => attendanceList.filter((s) => parseFloat(s.distance || 0) > radius).length,
    [attendanceList, radius]
  );

  const verifiedCount = attendanceList.length - suspiciousCount;

  /* ── No-session guard ── */
  if (!currentSession) {
    return (
      <Flex
        position="fixed" inset={0} zIndex={1000}
        align="center" justify="center"
        bg="rgba(15,10,40,0.65)"
        backdropFilter="blur(8px)"
      >
        <Box
          bg="white" borderRadius="24px" p={8} textAlign="center"
          border="1px solid rgba(122,105,255,0.15)"
          boxShadow="0 20px 50px rgba(122,105,255,0.18)"
          fontFamily="'Inter', sans-serif"
        >
          <Text color="gray.500" mb={5}>No session data available.</Text>
          <Button
            onClick={props.toggleSessionDetails}
            style={{ background: "linear-gradient(135deg, #7a69ff, #9b8aff)" }}
            color="white" fontWeight="700" borderRadius="12px"
            boxShadow="0 4px 14px rgba(122,105,255,0.4)"
          >
            Close
          </Button>
        </Box>
      </Flex>
    );
  }

  const sessionDate = currentSession.date?.split("T")[0] || "—";
  const sessionTime = currentSession.time || "—";
  const sessionDuration = currentSession.duration || "—";

  /* ─────────────────────────────── RENDER ─────────────────────────────── */
  return (
    <>
      {/* ── FULL-SCREEN MAP — position:fixed handled inside MapView ── */}
      <MapView
        sessionLocation={currentSession.location}
        radius={radius}
        attendance={attendanceList}
        onStudentClick={(student) => setSelectedStudent(student)}
      />

      {/* ══════════════════════════════════════════════════════════════
          OVERLAY — transparent fixed layer; all UI floats above map
      ══════════════════════════════════════════════════════════════ */}
      <Box
        position="fixed" inset={0} zIndex={1000}
        pointerEvents="none"           /* let map clicks fall through */
        fontFamily="'Inter', '-apple-system', sans-serif"
      >

        {/* ════════════════════════════════════════
            FLOATING NAVBAR (top)
        ════════════════════════════════════════ */}
        <Flex
          position="absolute" top={0} left={0} right={0} zIndex={20}
          align="center" justify="space-between"
          px={6} py="14px"
          bg="rgba(255,255,255,0.94)"
          backdropFilter="blur(18px)"
          borderBottom="1px solid rgba(122,105,255,0.14)"
          boxShadow="0 4px 24px rgba(122,105,255,0.12)"
          pointerEvents="auto"
        >
          {/* ── Left: icon + session name + LIVE badge ── */}
          <HStack gap={3}>
            {/* Brand icon */}
            <Box
              bg="linear-gradient(135deg, #7a69ff, #9b8aff)"
              borderRadius="12px" p="9px"
              display="flex" alignItems="center" justifyContent="center"
              boxShadow="0 4px 14px rgba(122,105,255,0.38)"
            >
              <MdMyLocation size={18} color="white" />
            </Box>

            {/* Session name */}
            <Box>
              <Text
                fontWeight="800" fontSize="16px" color="gray.800"
                letterSpacing="-0.02em" lineHeight={1.2}
              >
                {currentSession.name}
              </Text>
              <Text fontSize="11px" color="gray.400" mt="1px" fontFamily="mono">
                ID: {(currentSession.session_id || "").slice(0, 14)}…
              </Text>
            </Box>


          </HStack>

          {/* ── Right: session meta + QR button + Close ── */}
          <HStack gap={3}>
            {/* Date chip */}
            <HStack
              gap={2} bg="#f0eeff"
              border="1px solid rgba(122,105,255,0.18)"
              borderRadius="10px" px={3} py="7px"
              display={{ base: "none", md: "flex" }}
            >
              <Text fontSize="11px" fontWeight="700" color="#7a69ff">📅</Text>
              <Text fontSize="12px" fontWeight="600" color="gray.700">{sessionDate}</Text>
            </HStack>

            {/* Time chip */}
            <HStack
              gap={2} bg="#e8f7ff"
              border="1px solid rgba(31,182,255,0.18)"
              borderRadius="10px" px={3} py="7px"
              display={{ base: "none", md: "flex" }}
            >
              <Text fontSize="11px" fontWeight="700" color="#1fb6ff">⏰</Text>
              <Text fontSize="12px" fontWeight="600" color="gray.700">{sessionTime}</Text>
            </HStack>

            {/* Radius chip */}
            <HStack
              gap={2} bg="#fff0f1"
              border="1px solid rgba(255,107,129,0.18)"
              borderRadius="10px" px={3} py="7px"
              display={{ base: "none", lg: "flex" }}
            >
              <Text fontSize="11px" fontWeight="700" color="#ff6b81">🎯</Text>
              <Text fontSize="12px" fontWeight="600" color="gray.700">{radius}m</Text>
            </HStack>

            {/* QR Code button */}
            {qr && (
              <Button
                leftIcon={<MdQrCode2 size={16} />}
                onClick={() => setQrOpen((p) => !p)}
                size="sm"
                style={{ background: "linear-gradient(135deg, #1fb6ff, #5dd3ff)" }}
                color="white" fontWeight="700" borderRadius="12px"
                boxShadow="0 4px 14px rgba(31,182,255,0.35)"
                _hover={{ opacity: 0.88, transform: "translateY(-2px)" }}
                transition="all 0.2s"
              >
                QR Code
              </Button>
            )}

            {/* Close button */}
            <Button
              leftIcon={<MdClose size={16} />}
              onClick={props.toggleSessionDetails}
              size="sm"
              bg="#f0eeff" color="#7a69ff"
              border="1px solid rgba(122,105,255,0.22)"
              fontWeight="700" borderRadius="12px"
              _hover={{ bg: "#e6e2ff" }}
              transition="all 0.2s"
            >
              Close
            </Button>
          </HStack>
        </Flex>

        {/* ════════════════════════════════════════
            QR POPOVER
        ════════════════════════════════════════ */}
        {qrOpen && qr && (
          <Box
            ref={qrPopoverRef}
            position="absolute" top="70px" right="160px" zIndex={50}
            bg="white"
            border="1px solid rgba(122,105,255,0.16)"
            borderRadius="20px" p={6}
            boxShadow="0 20px 50px rgba(122,105,255,0.20)"
            display="flex" flexDirection="column" alignItems="center" gap={4}
            minW="220px"
            pointerEvents="auto"
          >
            <Text
              fontSize="10px" fontWeight="800" color="gray.500"
              textTransform="uppercase" letterSpacing="0.1em" m={0}
            >
              Session QR Code
            </Text>

            <Box
              bg="#f4f3ff" p={3} borderRadius="14px"
              border="1px solid rgba(122,105,255,0.12)"
            >
              <QRCode value={qr} size={160} />
            </Box>

            <Text fontSize="12px" color="gray.400" textAlign="center">
              Students scan to mark attendance
            </Text>

            <Button
              onClick={() => { navigator.clipboard.writeText(qr); setQrOpen(false); }}
              w="100%"
              style={{ background: "linear-gradient(135deg, #7a69ff, #9b8aff)" }}
              color="white" fontWeight="700" borderRadius="10px"
              boxShadow="0 4px 14px rgba(122,105,255,0.35)"
              _hover={{ transform: "translateY(-2px)", boxShadow: "0 8px 20px rgba(122,105,255,0.45)" }}
              transition="all 0.22s"
            >
              Copy Link
            </Button>
          </Box>
        )}

        {/* ════════════════════════════════════════
            FLOATING STAT CHIPS (bottom-left)
        ════════════════════════════════════════ */}
        <HStack
          position="absolute" bottom={6} right={6} zIndex={15}
          gap={3}
          pointerEvents="auto"
        >
          {/* Total */}
          <Flex
            align="center" gap={2}
            bg="rgba(255,255,255,0.93)" backdropFilter="blur(12px)"
            border="1px solid rgba(122,105,255,0.18)"
            borderRadius="999px" px={4} py="10px"
            boxShadow="0 8px 24px rgba(122,105,255,0.18)"
          >
            <Box
              bg="linear-gradient(135deg, #7a69ff, #9b8aff)"
              borderRadius="50%" p="5px"
              display="flex" alignItems="center" justifyContent="center"
            >
              <MdPeople size={14} color="white" />
            </Box>
            <Text fontSize="13px" fontWeight="800" color="#7a69ff">
              {attendanceList.length}
            </Text>
            <Text fontSize="11px" fontWeight="600" color="gray.500">Total</Text>
          </Flex>

          {/* Verified */}
          <Flex
            align="center" gap={2}
            bg="rgba(255,255,255,0.93)" backdropFilter="blur(12px)"
            border="1px solid rgba(61,212,152,0.22)"
            borderRadius="999px" px={4} py="10px"
            boxShadow="0 8px 24px rgba(61,212,152,0.15)"
          >
            <Box
              bg="linear-gradient(135deg, #3dd498, #6ee7b7)"
              borderRadius="50%" p="5px"
              display="flex" alignItems="center" justifyContent="center"
            >
              <MdCheckCircle size={14} color="white" />
            </Box>
            <Text fontSize="13px" fontWeight="800" color="#3dd498">
              {verifiedCount}
            </Text>
            <Text fontSize="11px" fontWeight="600" color="gray.500">Verified</Text>
          </Flex>

          {/* Flagged */}
          {suspiciousCount > 0 && (
            <Flex
              align="center" gap={2}
              bg="rgba(255,255,255,0.93)" backdropFilter="blur(12px)"
              border="1px solid rgba(255,107,129,0.25)"
              borderRadius="999px" px={4} py="10px"
              boxShadow="0 8px 24px rgba(255,107,129,0.18)"
            >
              <Box
                bg="linear-gradient(135deg, #ff6b81, #ff92a0)"
                borderRadius="50%" p="5px"
                display="flex" alignItems="center" justifyContent="center"
              >
                <MdWarning size={14} color="white" />
              </Box>
              <Text fontSize="13px" fontWeight="800" color="#ff6b81">
                {suspiciousCount}
              </Text>
              <Text fontSize="11px" fontWeight="600" color="gray.500">Flagged</Text>
            </Flex>
          )}
        </HStack>

        {/* ════════════════════════════════════════
            PROXY ALERT CHIP (bottom-center)
            — only shown when there are flagged students
        ════════════════════════════════════════ */}
        {suspiciousCount > 0 && (
          <Flex
            position="absolute" bottom={6}
            left="50%" transform="translateX(-50%)"
            zIndex={15}
            align="center" gap={2}
            bg="linear-gradient(135deg, #ff6b81, #ff92a0)"
            backdropFilter="blur(12px)"
            color="white" borderRadius="999px"
            px={5} py="12px"
            fontWeight={700} fontSize="13px"
            boxShadow="0 8px 28px rgba(255,107,129,0.45)"
            border="1px solid rgba(255,255,255,0.25)"
            fontFamily="'Inter', sans-serif"
            letterSpacing="0.01em"
            pointerEvents="auto"
            whiteSpace="nowrap"
          >
            <Text>⚠️</Text>
            <Text>
              {suspiciousCount} student{suspiciousCount > 1 ? "s" : ""} outside geofence
            </Text>
          </Flex>
        )}

        {/* ── STUDENT MAP MODAL ── */}
        {selectedStudent && (
          <Box pointerEvents="auto">
            <StudentMapModal
              student={selectedStudent}
              sessionLocation={currentSession.location}
              radius={radius}
              onClose={() => setSelectedStudent(null)}
            />
          </Box>
        )}
      </Box>
    </>
  );
};

export default SessionDetails;