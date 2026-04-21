import React, { useState } from "react";
import { Box, Flex, Text, VStack } from "@chakra-ui/react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  MdDashboard,
  MdVideoCall,
  MdPeople,
  MdBarChart,
  MdSettings,
  MdLogout,
  MdKeyboardArrowLeft,
  MdKeyboardArrowRight,
  MdGpsFixed,
} from "react-icons/md";

const SIDEBAR_EXPANDED = 240;
const SIDEBAR_COLLAPSED = 72;

const navItems = [
  { label: "Dashboard", icon: MdDashboard, path: "/teacher-dashboard" },
  { label: "Sessions",  icon: MdVideoCall, path: "/teacher-dashboard/sessions"  },
  { label: "Students",  icon: MdPeople,    path: "/teacher-dashboard/students"  },
  { label: "Analytics", icon: MdBarChart,  path: "/teacher-dashboard/analytics" },
  { label: "Settings",  icon: MdSettings,  path: "/teacher-dashboard/settings"  },
];

const TeacherSidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => {
    if (path === "/teacher-dashboard") {
      return location.pathname === "/teacher-dashboard";
    }
    return location.pathname === path;
  };

  return (
    <Box
      as="aside"
      w={collapsed ? `${SIDEBAR_COLLAPSED}px` : `${SIDEBAR_EXPANDED}px`}
      minH="100vh"
      style={{
        background: "linear-gradient(180deg, #6558ee 0%, #7a69ff 50%, #9b8aff 100%)",
        boxShadow: "4px 0 24px rgba(122, 105, 255, 0.25)",
        transition: "width 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      }}
      display="flex"
      flexDirection="column"
      overflow="hidden"
      position="sticky"
      top={0}
      zIndex={20}
      flexShrink={0}
    >
      {/* Brand / Logo */}
      <Flex
        align="center"
        gap={3}
        px={collapsed ? 3 : 5}
        py={5}
        borderBottom="1px solid rgba(255,255,255,0.12)"
        cursor="pointer"
        onClick={() => navigate("/teacher-dashboard")}
        _hover={{ bg: "rgba(255,255,255,0.08)" }}
        transition="background 0.2s"
      >
        <Box
          display="flex"
          alignItems="center"
          justifyContent="center"
          style={{
            background: "rgba(255,255,255,0.2)",
            borderRadius: "12px",
            padding: "8px",
            flexShrink: 0,
          }}
        >
          <MdGpsFixed size={22} color="white" />
        </Box>
        {!collapsed && (
          <Text
            fontWeight="800"
            fontSize="lg"
            color="white"
            letterSpacing="-0.5px"
            whiteSpace="nowrap"
          >
            GeoAttend
          </Text>
        )}
      </Flex>

      {/* Nav Items */}
      <VStack gap={1} align="stretch" flex={1} py={4} px={collapsed ? 2 : 3}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          return (
            <Box
              key={item.path}
              as="div"
              role="button"
              aria-label={item.label}
              title={collapsed ? item.label : undefined}
              display="flex"
              alignItems="center"
              gap={3}
              px={3}
              py={3}
              borderRadius="12px"
              cursor="pointer"
              position="relative"
              overflow="hidden"
              onClick={() => navigate(item.path)}
              style={{
                background: active ? "rgba(255,255,255,0.2)" : "transparent",
                boxShadow: active ? "0 4px 12px rgba(0,0,0,0.15)" : "none",
                transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
              }}
              _hover={{
                bg: "rgba(255,255,255,0.15)",
                transform: "translateX(2px)",
              }}
            >
              {active && (
                <Box
                  position="absolute"
                  left={0}
                  top="20%"
                  bottom="20%"
                  w="3px"
                  bg="white"
                  borderRadius="0 4px 4px 0"
                />
              )}
              <Icon size={20} color="white" style={{ flexShrink: 0 }} />
              {!collapsed && (
                <Text
                  fontSize="sm"
                  whiteSpace="nowrap"
                  color="white"
                  fontWeight={active ? "700" : "500"}
                >
                  {item.label}
                </Text>
              )}
            </Box>
          );
        })}
      </VStack>

      {/* Bottom Section — Logout + Collapse */}
      <Box
        px={collapsed ? 2 : 3}
        pb={4}
        pt={3}
        borderTop="1px solid rgba(255,255,255,0.12)"
      >
        {/* Logout */}
        <Box
          as="div"
          role="button"
          title={collapsed ? "Logout" : undefined}
          display="flex"
          alignItems="center"
          gap={3}
          px={3}
          py={3}
          borderRadius="12px"
          cursor="pointer"
          onClick={() => navigate("/logout")}
          _hover={{ bg: "rgba(255,80,80,0.25)" }}
          transition="background 0.2s"
        >
          <MdLogout size={20} color="white" style={{ flexShrink: 0 }} />
          {!collapsed && (
            <Text fontSize="sm" fontWeight="500" color="white" whiteSpace="nowrap">
              Logout
            </Text>
          )}
        </Box>

        {/* Collapse Toggle */}
        <Flex justify={collapsed ? "center" : "flex-end"} mt={2}>
          <Box
            as="button"
            aria-label="Toggle sidebar"
            onClick={() => setCollapsed(!collapsed)}
            display="flex"
            alignItems="center"
            justifyContent="center"
            p={2}
            borderRadius="8px"
            color="white"
            cursor="pointer"
            border="none"
            background="transparent"
            _hover={{ bg: "rgba(255,255,255,0.15)" }}
            transition="background 0.2s"
          >
            {collapsed ? (
              <MdKeyboardArrowRight size={18} color="white" />
            ) : (
              <MdKeyboardArrowLeft size={18} color="white" />
            )}
          </Box>
        </Flex>
      </Box>
    </Box>
  );
};

export default TeacherSidebar;
