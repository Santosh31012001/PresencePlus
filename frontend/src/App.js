import { RouterProvider, createBrowserRouter } from "react-router-dom";
import {
  HomeLayout,
  Landing,
  Login,
  Logout,
  Register,
  NewSession,
  StudentDashboard,
  ForgotPassword,
} from "./pages/Index";
import AuthLayout from "./pages/AuthLayout";
import TeacherLayout from "./pages/TeacherLayout";
import TeacherDashboard from "./pages/TeacherDashboard";
import TeacherSessions from "./pages/TeacherSessions";
import TeacherStudents from "./pages/TeacherStudents";
import TeacherAnalytics from "./pages/TeacherAnalytics";
import TeacherSettings from "./pages/TeacherSettings";

const router = createBrowserRouter([

  // ── Landing — fully standalone (has its own navbar, no Nav wrapper) ────────
  {
    path: "/",
    element: <Landing />,
  },

  // ── Auth pages — no Nav bar (users are not yet logged in) ──────────────────
  {
    element: <AuthLayout />,
    children: [
      { path: "login",           element: <Login />          },
      { path: "register",        element: <Register />       },
      { path: "forgot-password", element: <ForgotPassword /> },
      { path: "logout",          element: <Logout />         },
    ],
  },

  // ── Student area — HomeLayout shows Nav with logout button ─────────────────
  {
    element: <HomeLayout />,
    children: [
      { path: "student-dashboard", element: <StudentDashboard /> },
      { path: "*",                 element: <h1 style={{ textAlign: "center", padding: "60px", fontSize: "2rem", color: "#7a69ff" }}>404 — Page Not Found</h1> },
    ],
  },

  // ── Teacher dashboard — sidebar layout (no top Nav) ────────────────────────
  {
    path: "/teacher-dashboard",
    element: <TeacherLayout />,
    children: [
      { index: true,       element: <TeacherDashboard /> },
      { path: "sessions",  element: <TeacherSessions />  },
      { path: "students",  element: <TeacherStudents />  },
      { path: "analytics", element: <TeacherAnalytics /> },
      { path: "settings",  element: <TeacherSettings />  },
    ],
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
