import React, { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Box, Flex, Text, SimpleGrid, VStack, HStack, Badge,
} from "@chakra-ui/react";
import {
  MdGpsFixed, MdFaceRetouchingNatural, MdQrCode2,
  MdSecurity, MdInsights, MdEmail,
} from "react-icons/md";
import Footer from "../components/Footer";

// ─── Data ─────────────────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: <MdGpsFixed size={22} color="#7a69ff" />,
    bg: "rgba(122,105,255,0.1)",
    title: "Geofence Attendance",
    body: "Students can only check in when physically inside the GPS radius you define.",
  },
  {
    icon: <MdFaceRetouchingNatural size={22} color="#1fb6ff" />,
    bg: "rgba(31,182,255,0.1)",
    title: "Face Verification",
    body: "Live facial recognition confirms identity matches the registered profile photo.",
  },
  {
    icon: <MdQrCode2 size={22} color="#3dd498" />,
    bg: "rgba(61,212,152,0.1)",
    title: "QR Code Sessions",
    body: "Each session generates a unique QR valid for 15 minutes, preventing reuse.",
  },
  {
    icon: <MdSecurity size={22} color="#ff6b81" />,
    bg: "rgba(255,107,129,0.1)",
    title: "GPS Consistency Score",
    body: "Multiple readings are compared to detect spoofing attempts automatically.",
  },
  {
    icon: <MdInsights size={22} color="#f59e0b" />,
    bg: "rgba(245,158,11,0.1)",
    title: "Live Session Map",
    body: "Monitor student check-ins on a real-time map with flagged location alerts.",
  },
  {
    icon: <MdEmail size={22} color="#a590ff" />,
    bg: "rgba(165,144,255,0.1)",
    title: "Email Confirmations",
    body: "Students get instant email confirmation with their attendance status.",
  },
];

const STEPS = [
  { num: "1", title: "Create Session",    body: "Set name, duration, and GPS radius from your dashboard." },
  { num: "2", title: "Share QR Code",     body: "A unique, time-limited QR is instantly generated."       },
  { num: "3", title: "Students Scan",     body: "Students capture a photo and submit their location."      },
  { num: "4", title: "Auto Verified",     body: "GPS, face ID, and geofence are verified in seconds."      },
];

const STATS = [
  { value: "15 min", label: "QR validity window"     },
  { value: "5×",     label: "GPS readings per check" },
  { value: "0.5",    label: "Face match threshold"   },
  { value: "100%",   label: "Proxy-proof sessions"   },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

const Navbar = () => (
  <Flex
    as="nav"
    align="center"
    justify="space-between"
    px={{ base: 5, md: 10 }}
    py={5}
    borderBottom="1px solid rgba(122,105,255,0.12)"
    backdropFilter="blur(16px)"
    bg="rgba(13,11,26,0.75)"
    position="sticky"
    top={0}
    zIndex={100}
  >
    <Text
      fontWeight="800"
      fontSize="lg"
      letterSpacing="-0.03em"
      style={{
        background: "linear-gradient(135deg, #a590ff, #7a69ff)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
      }}
    >
      GeoAttend
    </Text>

    <HStack gap={3}>
      <Link to="/login">
        <Box
          as="span"
          px={4} py={2}
          borderRadius="10px"
          fontSize="sm"
          fontWeight="600"
          color="rgba(240,238,255,0.65)"
          cursor="pointer"
          _hover={{ color: "#f0eeff", bg: "rgba(122,105,255,0.1)" }}
          transition="all 0.2s"
        >
          Sign In
        </Box>
      </Link>
      <Link to="/register">
        <Box
          as="span"
          px={5} py="10px"
          borderRadius="12px"
          fontSize="sm"
          fontWeight="700"
          color="white"
          cursor="pointer"
          style={{ background: "linear-gradient(135deg, #7a69ff, #6558ee)" }}
          boxShadow="0 6px 20px rgba(122,105,255,0.4)"
          _hover={{ transform: "translateY(-2px)", boxShadow: "0 10px 28px rgba(122,105,255,0.55)" }}
          transition="all 0.2s"
        >
          Get Started →
        </Box>
      </Link>
    </HStack>
  </Flex>
);

const Hero = () => (
  <VStack
    gap={6}
    textAlign="center"
    px={{ base: 5, md: 8 }}
    py={{ base: "70px", md: "100px" }}
    maxW="820px"
    mx="auto"
  >
    {/* Live badge */}
    <HStack
      gap={2}
      bg="rgba(122,105,255,0.12)"
      border="1px solid rgba(122,105,255,0.28)"
      borderRadius="999px"
      px={4} py="6px"
    >
      <Box
        w="7px" h="7px" borderRadius="50%"
        bg="#7a69ff"
        boxShadow="0 0 8px #7a69ff"
        style={{ animation: "pp-pulse 2s ease-in-out infinite" }}
      />
      <Text fontSize="xs" fontWeight="700" color="#c4b5fd" textTransform="uppercase" letterSpacing="0.06em">
        Geo-Verified Attendance Platform
      </Text>
    </HStack>

    <Text
      as="h1"
      fontSize={{ base: "3xl", md: "5xl", lg: "6xl" }}
      fontWeight="900"
      lineHeight="1.08"
      letterSpacing="-0.04em"
      color="#f0eeff"
    >
      Attendance that can't{" "}
      <Box
        as="span"
        style={{
          background: "linear-gradient(135deg, #a590ff 0%, #7a69ff 50%, #1fb6ff 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        be faked.
      </Box>
    </Text>

    <Text
      fontSize={{ base: "md", md: "lg" }}
      color="rgba(240,238,255,0.55)"
      lineHeight="1.7"
      maxW="560px"
    >
      GeoAttend combines GPS geofencing, real-time face verification, and QR codes
      to make attendance fraud impossible — for any classroom.
    </Text>

    <HStack gap={4} flexWrap="wrap" justify="center" pt={2}>
      <Link to="/register">
        <Box
          as="span"
          display="inline-block"
          px={8} py={4}
          borderRadius="16px"
          fontWeight="700"
          fontSize="md"
          color="white"
          cursor="pointer"
          style={{ background: "linear-gradient(135deg, #7a69ff, #6558ee)" }}
          boxShadow="0 8px 24px rgba(122,105,255,0.45)"
          _hover={{ transform: "translateY(-3px)", boxShadow: "0 14px 36px rgba(122,105,255,0.55)" }}
          transition="all 0.22s"
        >
          Start for Free →
        </Box>
      </Link>
      <Link to="/login">
        <Box
          as="span"
          display="inline-block"
          px={8} py="15px"
          borderRadius="16px"
          fontWeight="600"
          fontSize="md"
          color="#a590ff"
          cursor="pointer"
          border="1.5px solid rgba(122,105,255,0.4)"
          _hover={{ bg: "rgba(122,105,255,0.08)", borderColor: "#7a69ff" }}
          transition="all 0.2s"
        >
          Sign In
        </Box>
      </Link>
    </HStack>
  </VStack>
);

const StatsBar = () => (
  <SimpleGrid
    columns={{ base: 2, md: 4 }}
    borderTop="1px solid rgba(122,105,255,0.1)"
    borderBottom="1px solid rgba(122,105,255,0.1)"
    mx={{ base: 4, md: 10 }}
    mb={20}
  >
    {STATS.map((s, i) => (
      <Box
        key={s.label}
        textAlign="center"
        py={6} px={4}
        borderRight={{ base: i % 2 === 0 ? "1px solid rgba(122,105,255,0.1)" : "none", md: i < 3 ? "1px solid rgba(122,105,255,0.1)" : "none" }}
      >
        <Text
          fontSize="2xl"
          fontWeight="900"
          letterSpacing="-0.04em"
          style={{
            background: "linear-gradient(135deg, #a590ff, #7a69ff)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          {s.value}
        </Text>
        <Text fontSize="xs" color="rgba(240,238,255,0.4)" fontWeight="600" mt={1} textTransform="uppercase" letterSpacing="0.05em">
          {s.label}
        </Text>
      </Box>
    ))}
  </SimpleGrid>
);

const FeaturesSection = () => (
  <Box px={{ base: 5, md: 10 }} mb={20} maxW="1100px" mx="auto">
    <VStack gap={3} mb={10} textAlign="center">
      <Text fontSize="xs" fontWeight="800" textTransform="uppercase" letterSpacing="0.1em" color="#7a69ff">
        Features
      </Text>
      <Text fontSize={{ base: "2xl", md: "3xl" }} fontWeight="800" letterSpacing="-0.03em" color="#f0eeff">
        Everything you need for honest attendance
      </Text>
      <Text fontSize="sm" color="rgba(240,238,255,0.45)" maxW="480px" lineHeight="1.7">
        Built for educators who want real data, not just ticked boxes.
      </Text>
    </VStack>

    <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={5}>
      {FEATURES.map((f) => (
        <Box
          key={f.title}
          bg="rgba(255,255,255,0.03)"
          border="1px solid rgba(122,105,255,0.13)"
          borderRadius="20px"
          p={6}
          transition="all 0.22s"
          _hover={{ transform: "translateY(-6px)", borderColor: "rgba(122,105,255,0.32)", boxShadow: "0 20px 50px rgba(122,105,255,0.12)" }}
        >
          <Box
            w="44px" h="44px"
            borderRadius="12px"
            bg={f.bg}
            display="flex" alignItems="center" justifyContent="center"
            mb={4}
          >
            {f.icon}
          </Box>
          <Text fontWeight="700" fontSize="sm" color="#f0eeff" mb={2}>{f.title}</Text>
          <Text fontSize="xs" color="rgba(240,238,255,0.45)" lineHeight="1.7">{f.body}</Text>
        </Box>
      ))}
    </SimpleGrid>
  </Box>
);

const HowItWorks = () => (
  <Box px={{ base: 5, md: 10 }} mb={20} maxW="1100px" mx="auto">
    <VStack gap={3} mb={10} textAlign="center">
      <Text fontSize="xs" fontWeight="800" textTransform="uppercase" letterSpacing="0.1em" color="#7a69ff">
        How It Works
      </Text>
      <Text fontSize={{ base: "2xl", md: "3xl" }} fontWeight="800" letterSpacing="-0.03em" color="#f0eeff">
        Up and running in minutes
      </Text>
    </VStack>

    <SimpleGrid columns={{ base: 1, sm: 2, md: 4 }} gap={6}>
      {STEPS.map((s) => (
        <VStack key={s.num} gap={3} textAlign="center">
          <Flex
            w="52px" h="52px"
            borderRadius="50%"
            align="center" justify="center"
            fontWeight="900" fontSize="lg" color="white"
            style={{ background: "linear-gradient(135deg, #7a69ff, #9b8aff)" }}
            boxShadow="0 8px 24px rgba(122,105,255,0.38)"
          >
            {s.num}
          </Flex>
          <Text fontWeight="700" fontSize="sm" color="#f0eeff">{s.title}</Text>
          <Text fontSize="xs" color="rgba(240,238,255,0.4)" lineHeight="1.65">{s.body}</Text>
        </VStack>
      ))}
    </SimpleGrid>
  </Box>
);

const CTABanner = () => (
  <Box
    mx={{ base: 4, md: 10 }}
    mb={20}
    borderRadius="24px"
    style={{ background: "linear-gradient(135deg, #7a69ff, #9b8aff)" }}
    p={{ base: 10, md: 14 }}
    textAlign="center"
    position="relative"
    overflow="hidden"
    boxShadow="0 20px 60px rgba(122,105,255,0.35)"
  >
    {/* decorative circles */}
    <Box position="absolute" top="-50px" right="-50px" w="180px" h="180px" borderRadius="50%" bg="rgba(255,255,255,0.07)" />
    <Box position="absolute" bottom="-30px" left="-30px" w="130px" h="130px" borderRadius="50%" bg="rgba(255,255,255,0.05)" />

    <VStack gap={4} position="relative" zIndex={1}>
      <Text fontSize={{ base: "xl", md: "3xl" }} fontWeight="800" color="white" letterSpacing="-0.03em">
        Ready to eliminate proxy attendance?
      </Text>
      <Text fontSize="sm" color="rgba(255,255,255,0.75)">
        Join teachers already using GeoAttend to run fraud-proof classes.
      </Text>
      <Link to="/register">
        <Box
          as="span"
          display="inline-block"
          px={8} py="14px"
          borderRadius="14px"
          fontWeight="800"
          fontSize="md"
          color="#7a69ff"
          cursor="pointer"
          bg="white"
          boxShadow="0 8px 24px rgba(0,0,0,0.15)"
          _hover={{ transform: "translateY(-3px)", boxShadow: "0 14px 36px rgba(0,0,0,0.2)" }}
          transition="all 0.2s"
        >
          Create Your Account →
        </Box>
      </Link>
    </VStack>
  </Box>
);

// ─── Landing Page ─────────────────────────────────────────────────────────────

const Landing = () => {
  const navigate = useNavigate();

  useEffect(() => {
    if (localStorage.getItem("token")) navigate("/student-dashboard");
  }, [navigate]);

  return (
    <>
      {/* Pulse animation for live badge */}
      <style>{`
        @keyframes pp-pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.35; }
        }
      `}</style>

      <Box
        bg="#0d0b1a"
        minH="100vh"
        position="relative"
        overflow="hidden"
        fontFamily="'Inter', -apple-system, sans-serif"
      >
        {/* Background mesh */}
        <Box
          position="fixed" inset={0} pointerEvents="none" zIndex={0}
          style={{
            background: `
              radial-gradient(ellipse 80% 60% at 20% 0%,  rgba(122,105,255,0.18) 0%, transparent 60%),
              radial-gradient(ellipse 60% 50% at 80% 20%, rgba(31,182,255,0.10)  0%, transparent 55%),
              radial-gradient(ellipse 50% 40% at 50% 80%, rgba(122,105,255,0.08) 0%, transparent 60%)
            `,
          }}
        />

        <Box position="relative" zIndex={1}>
          <Navbar />
          <Hero />
          <StatsBar />
          <FeaturesSection />
          <HowItWorks />
          <CTABanner />
          <Footer />
        </Box>
      </Box>
    </>
  );
};

export default Landing;
