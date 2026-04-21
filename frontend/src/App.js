import { RouterProvider, createBrowserRouter } from "react-router-dom";
import {
  TeacherDashboard,
  HomeLayout,
  Landing,
  Login,
  Logout,
  Register,
  NewSession,
  StudentDashboard,
  ForgotPassword,
} from "./pages/Index";
import TeacherLayout from "./pages/TeacherLayout";
import TeacherSessions from "./pages/TeacherSessions";
import TeacherStudents from "./pages/TeacherStudents";
import TeacherAnalytics from "./pages/TeacherAnalytics";
import TeacherSettings from "./pages/TeacherSettings";

const router = createBrowserRouter([
  {
    path: "/",
    element: <HomeLayout />,
    children: [
      {
        index: true,
        element: <Landing />,
      },
      {
        path: "login",
        element: <Login />,
      },
      {
        path: "register",
        element: <Register />,
      },
      {
        path: "student-dashboard",
        element: <StudentDashboard />,
      },
      {
        path: "logout",
        element: <Logout />,
      },
      {
        path: "create-session",
        element: <NewSession />,
      },
      {
        path: "forgot-password",
        element: <ForgotPassword />,
      },
      {
        path: "*",
        element: <h1>404 Not Found</h1>,
      },
    ],
  },
  // Teacher routes — sidebar layout (no top nav)
  {
    path: "/teacher-dashboard",
    element: <TeacherLayout />,
    children: [
      {
        index: true,
        element: <TeacherDashboard />,
      },
      {
        path: "sessions",
        element: <TeacherSessions />,
      },
      {
        path: "students",
        element: <TeacherStudents />,
      },
      {
        path: "analytics",
        element: <TeacherAnalytics />,
      },
      {
        path: "settings",
        element: <TeacherSettings />,
      },
    ],
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
