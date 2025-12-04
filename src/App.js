import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";

import { AuthProvider, useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

/* -------------------- Layouts -------------------- */
import AdminLayout from "./layouts/AdminLayout";
import EmployeeLayout from "./layouts/EmployeeLayout";
import StudentLayout from "./layouts/StudentLayout";

/* -------------------- Auth -------------------- */
import Login from "./pages/auth/Login";

/* -------------------- Admin Pages -------------------- */
import AdminDashboard from "./pages/admin/Dashboard";
import Students from "./pages/admin/Students";
import Employees from "./pages/admin/Employees";
import Batches from "./pages/admin/Batches";
import AdminMessages from "./pages/admin/Messages";
import AdminLeaves from "./pages/admin/Leaves";
import AdminAttendance from "./pages/admin/Attendance";
import AdminFeedbacks from "./pages/admin/Feedbacks";
import Reports from "./pages/admin/Reports";

/* -------------------- Employee Pages -------------------- */
import EmployeeDashboard from "./pages/employee/Dashboard";
import EmployeeAttendance from "./pages/employee/Attendance";
import EmployeeLeaves from "./pages/employee/Leaves";
import EmployeeMessages from "./pages/employee/Messages";
import MyReports from "./pages/employee/Reports";

/* -------------------- Tutor (Employee Sub-role) -------------------- */
import TutorBatches from "./pages/employee/tutor/TutorBatches";
import TutorStudents from "./pages/employee/tutor/TutorStudents";
import TutorTasks from "./pages/employee/tutor/Tasks";

/* -------------------- Student Pages -------------------- */
import StudentDashboard from "./pages/student/Dashboard";
import StudentTasks from "./pages/student/Tasks";
import StudentAttendance from "./pages/student/Attendance";
import StudentLeaves from "./pages/student/Leaves";
import StudentFeedback from "./pages/student/Feedback";
import StudentMessages from "./pages/student/Messages";
import StudentBatches from "./pages/student/Batches";
import Holidays from "./pages/admin/Holidays";


/* -------------------- ROUTING LOGIC -------------------- */
function AppRoutes() {
  const { user } = useAuth();
  const location = useLocation();

  /* ------------ Always show Login at root ------------- */
  if (location.pathname === "/") {
    return (
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  /* ------------ If not logged in → redirect to login ------------ */
  if (!user) return <Navigate to="/" replace />;

  const role = user.role?.toUpperCase();
  const subRole = user.subRole?.toUpperCase();

  /* -------------------- ADMIN ROUTES -------------------- */
  if (role === "ADMIN") {
    return (
      <AdminLayout>
        <Routes>
          <Route path="/admin/dashboard" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/employees" element={<ProtectedRoute><Employees /></ProtectedRoute>} />
          <Route path="/admin/students" element={<ProtectedRoute><Students /></ProtectedRoute>} />
          <Route path="/admin/attendance" element={<ProtectedRoute><AdminAttendance /></ProtectedRoute>} />
          <Route path="/admin/leaves" element={<ProtectedRoute><AdminLeaves /></ProtectedRoute>} />
          <Route path="/admin/messages" element={<ProtectedRoute><AdminMessages /></ProtectedRoute>} />
          <Route path="/admin/batches" element={<ProtectedRoute><Batches /></ProtectedRoute>} />
          <Route path="/admin/feedbacks" element={<ProtectedRoute><AdminFeedbacks /></ProtectedRoute>} />
           <Route path="/admin/holidays" element={<ProtectedRoute><Holidays /></ProtectedRoute>} />
           <Route path="/admin/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />


          <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
        </Routes>
      </AdminLayout>
    );
  }

  /* -------------------- EMPLOYEE ROUTES -------------------- */
  if (role === "EMPLOYEE") {
    const isTutor = subRole === "TUTOR";

    return (
      <EmployeeLayout>
        <Routes>
          <Route path="/employee/dashboard" element={<ProtectedRoute><EmployeeDashboard /></ProtectedRoute>} />
          <Route path="/employee/attendance" element={<ProtectedRoute><EmployeeAttendance /></ProtectedRoute>} />
          <Route path="/employee/leaves" element={<ProtectedRoute><EmployeeLeaves /></ProtectedRoute>} />
          <Route path="/employee/messages" element={<ProtectedRoute><EmployeeMessages /></ProtectedRoute>} />
          <Route path="/employee/reports" element={<ProtectedRoute><MyReports /></ProtectedRoute>} />


          {/* -------- Tutor Only Pages -------- */}
          {isTutor && (
            <>
              <Route path="/employee/tutor/batches" element={<ProtectedRoute><TutorBatches /></ProtectedRoute>} />
              <Route path="/employee/tutor/students" element={<ProtectedRoute><TutorStudents /></ProtectedRoute>} />
              <Route path="/employee/tutor/tasks" element={<ProtectedRoute><TutorTasks /></ProtectedRoute>} />
            </>
          )}

          <Route path="*" element={<Navigate to="/employee/dashboard" replace />} />
        </Routes>
      </EmployeeLayout>
    );
  }

  /* -------------------- STUDENT ROUTES -------------------- */
  if (role === "STUDENT") {
    return (
      <StudentLayout>
        <Routes>
          <Route path="/student/dashboard" element={<ProtectedRoute><StudentDashboard /></ProtectedRoute>} />
          <Route path="/student/tasks" element={<ProtectedRoute><StudentTasks /></ProtectedRoute>} />
          <Route path="/student/attendance" element={<ProtectedRoute><StudentAttendance /></ProtectedRoute>} />
          <Route path="/student/leaves" element={<ProtectedRoute><StudentLeaves /></ProtectedRoute>} />
          <Route path="/student/feedback" element={<ProtectedRoute><StudentFeedback /></ProtectedRoute>} />
          <Route path="/student/messages" element={<ProtectedRoute><StudentMessages /></ProtectedRoute>} />
          <Route path="/student/batches" element={<ProtectedRoute><StudentBatches /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/student/dashboard" replace />} />
        </Routes>
      </StudentLayout>
    );
  }

  /* fallback */
  return <Navigate to="/" replace />;
}

/* -------------------- MAIN APP -------------------- */
function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;
