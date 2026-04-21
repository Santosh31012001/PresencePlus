import React from "react";
import { Box, Flex, Text } from "@chakra-ui/react";

/**
 * StatsCard - A premium animated stat widget for the teacher dashboard.
 * @param {string} label - The label for the stat
 * @param {string|number} value - The main value to display
 * @param {React.ReactNode} icon - An icon element
 * @param {string} accent - Accent color (hex or CSS value)
 * @param {string} trend - Optional trend text e.g. "+12% this week"
 */
const StatsCard = ({ label, value, icon, accent = "#7a69ff", trend }) => {
  return (
    <Box
      bg="white"
      borderRadius="20px"
      p={5}
      boxShadow="0 4px 24px rgba(122, 105, 255, 0.08)"
      border="1px solid rgba(122, 105, 255, 0.1)"
      position="relative"
      overflow="hidden"
      cursor="default"
      transition="all 0.25s cubic-bezier(0.4, 0, 0.2, 1)"
      _hover={{
        transform: "translateY(-4px)",
        boxShadow: "0 12px 32px rgba(122, 105, 255, 0.18)",
      }}
    >
      {/* Background accent blob */}
      <Box
        position="absolute"
        top="-20px"
        right="-20px"
        w="80px"
        h="80px"
        borderRadius="50%"
        bg={accent}
        opacity={0.08}
        filter="blur(20px)"
      />

      <Flex justify="space-between" align="flex-start">
        <Box>
          <Text
            fontSize="xs"
            fontWeight="600"
            color="gray.500"
            textTransform="uppercase"
            letterSpacing="0.08em"
            mb={2}
          >
            {label}
          </Text>
          <Text
            fontSize="3xl"
            fontWeight="800"
            color="gray.800"
            lineHeight={1}
            letterSpacing="-1px"
          >
            {value}
          </Text>
          {trend && (
            <Text fontSize="xs" color="green.500" fontWeight="600" mt={2}>
              {trend}
            </Text>
          )}
        </Box>

        {/* Icon Box */}
        <Box
          bg={accent}
          borderRadius="14px"
          p={3}
          display="flex"
          alignItems="center"
          justifyContent="center"
          boxShadow={`0 6px 16px ${accent}50`}
          flexShrink={0}
        >
          {icon}
        </Box>
      </Flex>
    </Box>
  );
};

export default StatsCard;
