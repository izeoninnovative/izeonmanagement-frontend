import React, { useState, useEffect, useMemo } from "react";
import { ListGroup } from "react-bootstrap";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

import {
  FaUserTie,
  FaUsers,
  FaChalkboardTeacher,
  FaHome,
  FaFileAlt,
  FaComments,
  FaClipboardList,
  FaTasks,
  FaLayerGroup,
  FaCalendar,
  FaBook,   // ICON FOR REPORTS
} from "react-icons/fa";

function Sidebar({ role, onSelect }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const [isTutor, setIsTutor] = useState(false);

  /* ------------------ TUTOR CHECK ------------------ */
  useEffect(() => {
    const lower = (v) => v?.toLowerCase?.() || "";
    setIsTutor(
      role === "employee" &&
        (lower(user?.subRole) === "tutor" ||
          lower(user?.role) === "tutor" ||
          lower(user?.designation) === "tutor")
    );
  }, [role, user]);

  /* ------------------ MENUS ------------------ */
  const menus = useMemo(
    () => ({
      admin: [
        { name: "Dashboard", icon: <FaHome />, path: "/admin/dashboard" },
        { name: "Employees", icon: <FaUserTie />, path: "/admin/employees" },
        { name: "Students", icon: <FaUsers />, path: "/admin/students" },
        { name: "Attendance", icon: <FaClipboardList />, path: "/admin/attendance" },
        { name: "Leaves", icon: <FaFileAlt />, path: "/admin/leaves" },
        { name: "Messages", icon: <FaComments />, path: "/admin/messages" },
        { name: "Batches", icon: <FaChalkboardTeacher />, path: "/admin/batches" },
        { name: "Feedback", icon: <FaComments />, path: "/admin/feedbacks" },
        { name: "Holidays", icon: <FaCalendar />, path: "/admin/holidays" },

        // 🔥 ADDED REPORTS MENU
        { name: "Reports", icon: <FaBook />, path: "/admin/reports" },
      ],

      employee: [
        { name: "Dashboard", icon: <FaHome />, path: "/employee/dashboard" },
        { name: "Attendance", icon: <FaClipboardList />, path: "/employee/attendance" },
        { name: "Leaves", icon: <FaFileAlt />, path: "/employee/leaves" },
        { name: "Messages", icon: <FaComments />, path: "/employee/messages" },

        // 🔥 EMPLOYEE REPORT SECTION
        { name: "Reports", icon: <FaBook />, path: "/employee/reports" },

        ...(isTutor
          ? [
              { name: "Batches", icon: <FaLayerGroup />, path: "/employee/tutor/batches" },
              { name: "Students", icon: <FaUsers />, path: "/employee/tutor/students" },
              { name: "Tasks", icon: <FaTasks />, path: "/employee/tutor/tasks" },
            ]
          : []),
      ],

      student: [
        { name: "Dashboard", icon: <FaHome />, path: "/student/dashboard" },
        { name: "Attendance", icon: <FaClipboardList />, path: "/student/attendance" },
        { name: "Leaves", icon: <FaFileAlt />, path: "/student/leaves" },
        { name: "Feedback", icon: <FaComments />, path: "/student/feedback" },
        { name: "Messages", icon: <FaComments />, path: "/student/messages" },
        { name: "Batches", icon: <FaLayerGroup />, path: "/student/batches" },
        { name: "Tasks", icon: <FaTasks />, path: "/student/tasks" },
      ],
    }),
    [isTutor]
  );

  /* ------------------ PANEL TITLE ------------------ */
  const getTitle = () => {
    if (role === "admin") return "Admin Panel";
    if (role === "employee") return isTutor ? "Tutor Panel" : "Employee Panel";
    if (role === "student") return "Student Panel";
    return "Dashboard";
  };

  /* ------------------ ON CLICK MENU ------------------ */
  const handleNavigate = (item) => {
    navigate(item.path);
    if (onSelect) onSelect(); // For mobile offcanvas
  };

  return (
    <>
      <style>{`
        .sidebar-wrapper {
          width: 100%;
          height: 100%;
          overflow-y: auto;
          padding: 18px;
        }
        .sidebar-item:hover {
          background: rgba(0,0,0,0.08) !important;
        }
        .sidebar-item-active {
          background: linear-gradient(135deg, #1a73e8, #673ab7, #d500f9);
          background-size: 300% 300%;
          animation: gradientMove 8s ease infinite;
          color: white !important;
          border-radius: 10px;
        }
        .sidebar-item-active svg {
          color: white !important;
        }
        @keyframes gradientMove {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>

      <div className="sidebar-wrapper bg-light border-end">
        <h6 className="text-primary fw-bold text-center mb-3">{getTitle()}</h6>

        <ListGroup variant="flush">
          {menus[role]?.map((item) => {
            const active = location.pathname.startsWith(item.path);

            return (
              <ListGroup.Item
                key={item.name}
                onClick={() => handleNavigate(item)}
                className={`d-flex align-items-center gap-2 py-2 px-2 mb-2 rounded sidebar-item 
                  ${active ? "sidebar-item-active" : ""}
                `}
                style={{ cursor: "pointer" }}
              >
                {item.icon}
                <span>{item.name}</span>
              </ListGroup.Item>
            );
          })}
        </ListGroup>
      </div>
    </>
  );
}

export default Sidebar;
