import React from "react";
import { Box, Flex, Button, HStack, useBreakpointValue, Container } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";

const Nav = () => {
  const navigate = useNavigate();
  const isMobile = useBreakpointValue({ base: true, md: false });

  const handleLogout = () => {
    navigate("/logout");
  };

  return (
    <Box
      as="nav"
      bg="brand.500"
      color="brand.50"
      py={4}
      boxShadow="md"
      position="sticky"
      top={0}
      zIndex={10}
    >
      <Container maxW="container.xl">
        <Flex
          justify="space-between"
          align="center"
          direction={isMobile ? "column" : "row"}
          gap={isMobile ? 4 : 0}
        >
          {/* Logo Placeholder */}
          <Box
            fontSize="2xl"
            fontWeight="bold"
            cursor="pointer"
            onClick={() => navigate("/")}
            transition="all 0.2s"
            _hover={{ opacity: 0.8 }}
          >
            GeoAttend
          </Box>

          {/* Logout Button */}
          <HStack gap={4}>
            <Button
              onClick={handleLogout}
              bg="brand.50"
              color="brand.500"
              fontWeight="bold"
              _hover={{ bg: "brand.50", opacity: 0.8 }}
              _active={{ bg: "brand.100" }}
              transition="all 0.2s"
              size={isMobile ? "sm" : "md"}
            >
              Logout
            </Button>
          </HStack>
        </Flex>
      </Container>
    </Box>
  );
};

export default Nav;
