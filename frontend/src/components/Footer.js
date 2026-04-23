import React from "react";
import { Box, Flex, Text, HStack, Link as ChakraLink } from "@chakra-ui/react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <Box
      borderTop="1px solid rgba(122,105,255,0.15)"
      bg="#0d0b1a"
      px={{ base: 6, md: 12 }}
      py={6}
    >
      <Flex
        direction={{ base: "column", md: "row" }}
        align="center"
        justify="space-between"
        gap={4}
      >
        {/* Brand */}
        <Text
          fontWeight="800"
          fontSize="md"
          letterSpacing="-0.02em"
          style={{
            background: "linear-gradient(135deg, #a590ff, #7a69ff)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          GeoAttend
        </Text>

        {/* Links */}
        <HStack gap={6}>
          {[
            { label: "Sign In",   to: "/login"    },
            { label: "Register",  to: "/register" },
          ].map((item) => (
            <Link key={item.label} to={item.to}>
              <Text
                fontSize="sm"
                color="rgba(240,238,255,0.45)"
                fontWeight="500"
                _hover={{ color: "#a590ff" }}
                transition="color 0.2s"
              >
                {item.label}
              </Text>
            </Link>
          ))}
        </HStack>

        {/* Copyright */}
        <Text fontSize="xs" color="rgba(240,238,255,0.3)">
          © {new Date().getFullYear()} GeoAttend. All rights reserved.
        </Text>
      </Flex>
    </Box>
  );
};

export default Footer;
