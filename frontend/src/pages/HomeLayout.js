import React from "react";
import { Outlet } from "react-router-dom";
import { Box } from "@chakra-ui/react";
import Nav from "./Nav";

const HomeLayout = () => {
  return (
    <Box minH="100vh" bg="gray.50">
      <Nav />
      <Outlet />
    </Box>
  );
};

export default HomeLayout;
