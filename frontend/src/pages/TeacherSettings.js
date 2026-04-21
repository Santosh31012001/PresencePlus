import React from "react";
import {
  Box, Flex, Text, VStack, SimpleGrid, Separator,
} from "@chakra-ui/react";
import {
  MdSettings, MdGpsFixed, MdSecurity, MdPalette, MdInfo,
} from "react-icons/md";

const SettingRow = ({ label, description, children }) => (
  <Box>
    <Flex align="center" justify="space-between" gap={4}>
      <Box flex={1}>
        <Text fontSize="sm" fontWeight="600" color="gray.800">{label}</Text>
        {description && (
          <Text fontSize="xs" color="gray.400" mt={0.5}>{description}</Text>
        )}
      </Box>
      <Box>{children}</Box>
    </Flex>
  </Box>
);

const SettingsSection = ({ icon: Icon, title, accent, children }) => (
  <Box
    bg="white"
    borderRadius="24px"
    p={6}
    boxShadow="0 4px 24px rgba(122,105,255,0.07)"
    border="1px solid rgba(122,105,255,0.1)"
  >
    <Flex align="center" gap={3} mb={5}>
      <Box
        style={{ background: accent, borderRadius: "12px", padding: "8px", display: "flex", alignItems: "center", justifyContent: "center" }}
        boxShadow={`0 4px 12px ${accent}60`}
      >
        <Icon size={18} color="white" />
      </Box>
      <Text fontWeight="700" fontSize="md" color="gray.800">{title}</Text>
    </Flex>
    <VStack gap={4} align="stretch">
      {children}
    </VStack>
  </Box>
);

const Toggle = ({ defaultOn = false }) => {
  const [on, setOn] = React.useState(defaultOn);
  return (
    <Box
      as="button"
      onClick={() => setOn(!on)}
      w="44px" h="24px"
      borderRadius="999px"
      style={{
        background: on ? "#7a69ff" : "#e5e7eb",
        position: "relative",
        transition: "background 0.2s",
        border: "none",
        cursor: "pointer",
        outline: "none",
      }}
    >
      <Box
        style={{
          position: "absolute",
          top: "3px",
          left: on ? "22px" : "3px",
          width: "18px",
          height: "18px",
          borderRadius: "50%",
          background: "white",
          boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
          transition: "left 0.2s",
        }}
      />
    </Box>
  );
};

const TeacherSettings = () => {
  return (
    <Box minH="100vh" p={{ base: 4, md: 8 }}>
      {/* Header */}
      <Box mb={6}>
        <Text fontSize="2xl" fontWeight="800" color="gray.800" letterSpacing="-0.5px">
          ⚙️ Settings
        </Text>
        <Text fontSize="sm" color="gray.500" mt={1}>
          Manage your GeoAttend preferences
        </Text>
      </Box>

      <SimpleGrid columns={{ base: 1, lg: 2 }} gap={6}>
        {/* Geofence Settings */}
        <SettingsSection icon={MdGpsFixed} title="Geofence" accent="#7a69ff">
          <SettingRow label="Default Radius" description="Radius used when creating new sessions">
            <Box
              as="select"
              fontSize="sm"
              fontWeight="600"
              color="gray.700"
              bg="#f8f7ff"
              border="1px solid rgba(122,105,255,0.2)"
              borderRadius="10px"
              px={3}
              py={2}
              cursor="pointer"
              outline="none"
            >
              <option value="15">15 meters</option>
              <option value="20">20 meters</option>
              <option value="50" selected>50 meters</option>
              <option value="100">100 meters</option>
            </Box>
          </SettingRow>
          <Separator borderColor="gray.100" />
          <SettingRow label="High-Accuracy GPS" description="Use device high-accuracy mode for location">
            <Toggle defaultOn={true} />
          </SettingRow>
          <Separator borderColor="gray.100" />
          <SettingRow label="Proxy Detection" description="Flag students outside geofence as suspicious">
            <Toggle defaultOn={true} />
          </SettingRow>
        </SettingsSection>

        {/* Security */}
        <SettingsSection icon={MdSecurity} title="Security" accent="#ff6b81">
          <SettingRow label="QR Expiry Window" description="Time before a QR code becomes invalid">
            <Box
              as="select"
              fontSize="sm"
              fontWeight="600"
              color="gray.700"
              bg="#fff5f6"
              border="1px solid rgba(255,107,129,0.2)"
              borderRadius="10px"
              px={3}
              py={2}
              cursor="pointer"
              outline="none"
            >
              <option value="5">5 minutes</option>
              <option value="10">10 minutes</option>
              <option value="15" selected>15 minutes</option>
              <option value="30">30 minutes</option>
            </Box>
          </SettingRow>
          <Separator borderColor="gray.100" />
          <SettingRow label="Two-Factor Auth" description="Require OTP for teacher login">
            <Toggle defaultOn={false} />
          </SettingRow>
          <Separator borderColor="gray.100" />
          <SettingRow label="Session Locking" description="Lock sessions after attendance window closes">
            <Toggle defaultOn={true} />
          </SettingRow>
        </SettingsSection>

        {/* Appearance */}
        <SettingsSection icon={MdPalette} title="Appearance" accent="#1fb6ff">
          <SettingRow label="Sidebar Collapsed by Default" description="Start with the sidebar minimized">
            <Toggle defaultOn={false} />
          </SettingRow>
          <Separator borderColor="gray.100" />
          <SettingRow label="Compact Mode" description="Show more data with reduced spacing">
            <Toggle defaultOn={false} />
          </SettingRow>
        </SettingsSection>

        {/* About */}
        <SettingsSection icon={MdInfo} title="About" accent="#3dd498">
          <SettingRow label="App Version" description="">
            <Text fontSize="sm" fontWeight="700" color="#3dd498">v1.0.0</Text>
          </SettingRow>
          <Separator borderColor="gray.100" />
          <SettingRow label="System" description="">
            <Text fontSize="sm" fontWeight="600" color="gray.500">GeoAttend — Final Year Project</Text>
          </SettingRow>
          <Separator borderColor="gray.100" />
          <SettingRow label="Technology" description="">
            <Text fontSize="sm" fontWeight="600" color="gray.500">React · Node.js · MongoDB</Text>
          </SettingRow>
        </SettingsSection>
      </SimpleGrid>
    </Box>
  );
};

export default TeacherSettings;
