import React from "react";
import { Box, Flex } from "@chakra-ui/react";
import { Outlet } from "react-router-dom";
import TeacherSidebar from "../components/TeacherSidebar";

const TeacherLayout = () => {
  return (
    <Flex minH="100vh" bg="#f4f3ff">
      <TeacherSidebar />
      <Box
        flex={1}
        overflowY="auto"
        bg="linear-gradient(135deg, #f4f3ff 0%, #faf9ff 100%)"
        minH="100vh"
      >
        <Outlet />
      </Box>
    </Flex>
  );
};

export default TeacherLayout;
