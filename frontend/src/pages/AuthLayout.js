import React from "react";
import { Outlet } from "react-router-dom";
import { Box } from "@chakra-ui/react";

// Layout for auth pages (login, register, forgot-password)
// No Nav bar — users aren't logged in yet
const AuthLayout = () => {
  return (
    <Box minH="100vh" bg="gray.50">
      <Outlet />
    </Box>
  );
};

export default AuthLayout;
