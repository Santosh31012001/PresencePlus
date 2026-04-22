import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Flex,
  Text,
  Button,
  Grid,
  SimpleGrid,
  Badge,
  Spinner,
  HStack,
  VStack,
  Separator,
} from "@chakra-ui/react";
import {
  MdVideoCall,
  MdPeople,
  MdCheckCircle,
  MdAdd,
  MdCalendarToday,
  MdAccessTime,
  MdArrowForward,
  MdQrCode,
} from "react-icons/md";
import StatsCard from "../components/StatsCard";
import NewSession from "./NewSession";
import SessionDetails from "./SessionDetails";

axios.defaults.withCredentials = true;

const TeacherDashboard = () => {
  const [token] = useState(localStorage.getItem("token") || "");
  const [sessionList, setSessionList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [isSessionDisplay, setSessionDisplay] = useState(false);
  const [currentSession, setCurrentSession] = useState("");
  const navigate = useNavigate();

  const updateList = async () => {
    setLoading(true);
    try {
      const response = await axios.post(
        "http://localhost:5000/sessions/getSessions",
        { token }
      );
      setSessionList(response.data.sessions || []);
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  const openSessionDetails = (session_id) => {
    const matched = sessionList.filter((s) => s.session_id === session_id);
    setCurrentSession(matched);
    setSessionDisplay(true);
  };

  const closeSessionDetails = () => {
    setSessionDisplay(false);
    setCurrentSession("");
  };

  const togglePopup = () => {
    setIsOpen(!isOpen);
    if (isOpen) updateList(); // Refresh list when closing popup
  };

  useEffect(() => {
    if (!token) {
      navigate("/login");
    } else {
      updateList();
    }
    // eslint-disable-next-line
  }, [token]);

  // Format date nicely
  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const recentSessions = sessionList.slice(0, 5);
  const totalSessions = sessionList.length;

  return (
    <Box minH="100vh" p={{ base: 4, md: 8 }}>
      {/* Header */}
      <Flex
        justify="space-between"
        align="center"
        mb={8}
        flexWrap="wrap"
        gap={4}
      >
        <Box>
          <Text
            fontSize={{ base: "xl", md: "2xl" }}
            fontWeight="800"
            color="gray.800"
            letterSpacing="-0.5px"
          >
            👋 Welcome back, Teacher!
          </Text>
          <Text fontSize="sm" color="gray.500" mt={1}>
            Here's what's happening with your classes today.
          </Text>
        </Box>

        <Button
          onClick={togglePopup}
          bg="linear-gradient(135deg, #7a69ff, #6558ee)"
          color="white"
          fontWeight="700"
          borderRadius="14px"
          px={6}
          py={5}
          boxShadow="0 6px 20px rgba(122, 105, 255, 0.4)"
          _hover={{
            boxShadow: "0 8px 28px rgba(122, 105, 255, 0.55)",
            transform: "translateY(-2px)",
          }}
          _active={{ transform: "translateY(0)" }}
          transition="all 0.2s"
          display="flex"
          alignItems="center"
          gap={2}
        >
          <MdAdd size={18} />
          New Session
        </Button>
      </Flex>

      {/* Stats Row */}
      <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} gap={5} mb={8}>
        <StatsCard
          label="Total Sessions"
          value={totalSessions}
          icon={<MdVideoCall size={22} color="white" />}
          accent="#7a69ff"
          trend={totalSessions > 0 ? `${totalSessions} all time` : "No sessions yet"}
        />
        <StatsCard
          label="Active Geofence"
          value="50m"
          icon={<MdQrCode size={22} color="white" />}
          accent="#1fb6ff"
          trend="Default radius"
        />
        <StatsCard
          label="Total Students"
          value="—"
          icon={<MdPeople size={22} color="white" />}
          accent="#5be4a8"
          trend="Based on sessions"
        />
        <StatsCard
          label="Avg. Attendance"
          value="—"
          icon={<MdCheckCircle size={22} color="white" />}
          accent="#ff6b81"
          trend="Cross-session rate"
        />
      </SimpleGrid>

      {/* Main Content Grid */}
      <Grid
        templateColumns={{ base: "1fr", lg: "1fr 360px" }}
        gap={6}
      >
        {/* Sessions List */}
        <Box
          bg="white"
          borderRadius="24px"
          p={6}
          boxShadow="0 4px 24px rgba(122, 105, 255, 0.07)"
          border="1px solid rgba(122, 105, 255, 0.1)"
        >
          <Flex justify="space-between" align="center" mb={5}>
            <Text fontWeight="700" fontSize="lg" color="gray.800">
              Recent Sessions
            </Text>
            {sessionList.length > 5 && (
              <Button
                size="sm"
                variant="ghost"
                color="#7a69ff"
                _hover={{ bg: "#f0eeff" }}
                borderRadius="10px"
                display="flex"
                alignItems="center"
                gap={1}
                onClick={() => navigate("/teacher-dashboard/sessions")}
              >
                View All <MdArrowForward size={14} />
              </Button>
            )}
          </Flex>

          {loading ? (
            <Flex justify="center" align="center" py={12}>
              <Spinner size="lg" color="#7a69ff" />
            </Flex>
          ) : recentSessions.length === 0 ? (
            <Flex
              direction="column"
              align="center"
              justify="center"
              py={12}
              gap={4}
            >
              <Box
                bg="#f0eeff"
                borderRadius="50%"
                p={5}
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                <MdVideoCall size={40} color="#7a69ff" />
              </Box>
              <Text color="gray.500" fontWeight="500">
                No sessions yet. Create your first one!
              </Text>
              <Button
                size="sm"
                onClick={togglePopup}
                bg="#7a69ff"
                color="white"
                borderRadius="12px"
                _hover={{ bg: "#6558ee" }}
              >
                Create Session
              </Button>
            </Flex>
          ) : (
            <VStack gap={0} align="stretch">
              {recentSessions.map((session, index) => {
                const attendanceCount = session.attendance?.length || 0;
                return (
                  <Box key={session.session_id || index}>
                    <Flex
                      align="center"
                      justify="space-between"
                      py={4}
                      px={3}
                      borderRadius="14px"
                      cursor="pointer"
                      _hover={{ bg: "#f8f7ff" }}
                      transition="all 0.15s"
                      onClick={() => openSessionDetails(session.session_id)}
                      gap={3}
                    >
                      <Flex align="center" gap={4} flex={1} minW={0}>
                        <Box
                          bg="linear-gradient(135deg, #7a69ff, #9b8aff)"
                          borderRadius="12px"
                          p={3}
                          flexShrink={0}
                          boxShadow="0 4px 10px rgba(122,105,255,0.3)"
                        >
                          <MdVideoCall size={18} color="white" />
                        </Box>
                        <Box minW={0} flex={1}>
                          <Text
                            fontWeight="600"
                            color="gray.800"
                            fontSize="sm"
                            lineClamp={1}
                            overflow="hidden"
                            whiteSpace="nowrap"
                            textOverflow="ellipsis"
                          >
                            {session.name || "Untitled Session"}
                          </Text>
                          <HStack gap={3} mt={1}>
                            <HStack gap={1}>
                              <MdCalendarToday size={11} color="#9ca3af" />
                              <Text fontSize="xs" color="gray.400">
                                {formatDate(session.date)}
                              </Text>
                            </HStack>
                            {session.time && (
                              <HStack gap={1}>
                                <MdAccessTime size={11} color="#9ca3af" />
                                <Text fontSize="xs" color="gray.400">
                                  {session.time}
                                </Text>
                              </HStack>
                            )}
                          </HStack>
                        </Box>
                      </Flex>

                      <HStack gap={2} flexShrink={0}>
                        {/* Attendance count chip */}
                        <HStack
                          gap={1}
                          bg="#eafaf4"
                          px={2}
                          py={1}
                          borderRadius="8px"
                          border="1px solid rgba(61,212,152,0.2)"
                        >
                          <MdPeople size={12} color="#3dd498" />
                          <Text fontSize="xs" fontWeight="700" color="#3dd498">
                            {attendanceCount}
                          </Text>
                        </HStack>
                        {session.duration && (
                          <Badge
                            borderRadius="8px"
                            px={2}
                            py={1}
                            fontSize="xs"
                            bg="#f0eeff"
                            color="#7a69ff"
                            fontWeight="600"
                          >
                            {session.duration}m
                          </Badge>
                        )}
                        <Box color="gray.300">
                          <MdArrowForward size={16} />
                        </Box>
                      </HStack>
                    </Flex>
                    {index < recentSessions.length - 1 && (
                      <Separator borderColor="gray.100" />
                    )}
                  </Box>
                );
              })}
            </VStack>
          )}
        </Box>

        {/* Right Panel — Quick Actions */}
        <VStack gap={5} align="stretch">
          {/* Quick Actions Card */}
          <Box
            bg="white"
            borderRadius="24px"
            p={6}
            boxShadow="0 4px 24px rgba(122, 105, 255, 0.07)"
            border="1px solid rgba(122, 105, 255, 0.1)"
          >
            <Text fontWeight="700" fontSize="md" color="gray.800" mb={4}>
              Quick Actions
            </Text>
            <VStack gap={3} align="stretch">
              {[
                {
                  label: "Create New Session",
                  icon: <MdAdd size={18} />,
                  color: "#7a69ff",
                  bg: "#f0eeff",
                  action: togglePopup,
                },
                {
                  label: "View All Sessions",
                  icon: <MdVideoCall size={18} />,
                  color: "#1fb6ff",
                  bg: "#e8f7ff",
                  action: () => navigate("/teacher-dashboard/sessions"),
                },
                {
                  label: "Student List",
                  icon: <MdPeople size={18} />,
                  color: "#3dd498",
                  bg: "#eafaf4",
                  action: () => navigate("/teacher-dashboard/students"),
                },
              ].map((item) => (
                <Flex
                  key={item.label}
                  align="center"
                  gap={3}
                  p={3}
                  borderRadius="14px"
                  cursor="pointer"
                  _hover={{ bg: item.bg, transform: "translateX(3px)" }}
                  transition="all 0.2s"
                  onClick={item.action}
                  border="1px solid transparent"
                >
                  <Box
                    bg={item.bg}
                    borderRadius="10px"
                    p={2}
                    color={item.color}
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    {item.icon}
                  </Box>
                  <Text fontSize="sm" fontWeight="600" color="gray.700">
                    {item.label}
                  </Text>
                  <Box ml="auto" color="gray.300">
                    <MdArrowForward size={15} />
                  </Box>
                </Flex>
              ))}
            </VStack>
          </Box>

          {/* Info Card */}
          <Box
            bg="linear-gradient(135deg, #7a69ff 0%, #9b8aff 100%)"
            borderRadius="24px"
            p={6}
            boxShadow="0 8px 32px rgba(122, 105, 255, 0.35)"
            position="relative"
            overflow="hidden"
          >
            <Box
              position="absolute"
              top="-30px"
              right="-30px"
              w="120px"
              h="120px"
              borderRadius="50%"
              bg="rgba(255,255,255,0.1)"
            />
            <Box
              position="absolute"
              bottom="-20px"
              left="-20px"
              w="80px"
              h="80px"
              borderRadius="50%"
              bg="rgba(255,255,255,0.08)"
            />
            <Box
              bg="rgba(255,255,255,0.2)"
              borderRadius="50%"
              p={3}
              display="flex"
              alignItems="center"
              justifyContent="center"
              mb={3}
            >
              <MdQrCode size={28} color="white" />
            </Box>
            <Text fontWeight="700" color="white" fontSize="md" mb={1}>
              GeoAttend System
            </Text>
            <Text fontSize="xs" color="rgba(255,255,255,0.8)" lineHeight={1.6}>
              Create a session to generate a QR code. Students scan it within your
              defined geofence radius to mark attendance.
            </Text>
          </Box>
        </VStack>
      </Grid>

      {/* Popups */}
      {isSessionDisplay && (
        <SessionDetails
          currentSession={currentSession}
          toggleSessionDetails={closeSessionDetails}
        />
      )}
      {isOpen && (
        <Box
          position="fixed"
          inset={0}
          bg="rgba(0,0,0,0.5)"
          backdropFilter="blur(4px)"
          zIndex={100}
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <NewSession togglePopup={togglePopup} />
        </Box>
      )}
    </Box>
  );
};

export default TeacherDashboard;
