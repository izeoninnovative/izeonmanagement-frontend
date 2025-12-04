import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Logo
import IzeonLogo from "../images/izeon-logo.svg";

// Icons
import {
  FaUserTie,
  FaUsers,
  FaHome,
  FaFileAlt,
  FaComments,
  FaClipboardList,
  FaLayerGroup,
  FaCalendar,
  FaBook,
  FaUser,
  FaSignOutAlt,
  FaTasks,
} from "react-icons/fa";

function Sidebar({ role, onSelect }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const [isTutor, setIsTutor] = useState(false);

  /* ------------------ TUTOR ROLE CHECK ------------------ */
  useEffect(() => {
    const lower = (v) => v?.toLowerCase?.() || "";
    setIsTutor(
      role === "employee" &&
        (lower(user?.subRole) === "tutor" ||
          lower(user?.role) === "tutor" ||
          lower(user?.designation) === "tutor")
    );
  }, [role, user]);

  /* ------------------ MENU ITEMS ------------------ */
  const menus = useMemo(() => {
    const baseMenus = {
      admin: [
        { name: "Dashboard", icon: <FaHome />, path: "/admin/dashboard" },
        { name: "Employees", icon: <FaUserTie />, path: "/admin/employees" },
        { name: "Students", icon: <FaUsers />, path: "/admin/students" },
        { name: "Attendance", icon: <FaClipboardList />, path: "/admin/attendance" },
        { name: "Leave", icon: <FaFileAlt />, path: "/admin/leaves" },
        { name: "Messages", icon: <FaComments />, path: "/admin/messages" },
        { name: "Reports", icon: <FaBook />, path: "/admin/reports" },
        { name: "Batches", icon: <FaLayerGroup />, path: "/admin/batches" },
        { name: "Holidays", icon: <FaCalendar />, path: "/admin/holidays" },
        { name: "Feedback", icon: <FaComments />, path: "/admin/feedbacks" },
        { name: "Notifications", icon: <FaCalendar />, path: "/admin/notifications" },
      ],

      employee: [
        { name: "Dashboard", icon: <FaHome />, path: "/employee/dashboard" },
        { name: "Attendance", icon: <FaClipboardList />, path: "/employee/attendance" },
        { name: "Leaves", icon: <FaFileAlt />, path: "/employee/leaves" },
        { name: "Messages", icon: <FaComments />, path: "/employee/messages" },
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
    };

    /* Always added at bottom */
    const common = [
      { name: "Profile", icon: <FaUser />, path: "/profile" },
      { name: "Logout", icon: <FaSignOutAlt />, action: logout },
    ];

    return {
      admin: [...baseMenus.admin],
      employee: [...baseMenus.employee],
      student: [...baseMenus.student],
      bottom: common, // <- Bottom section only
    };
  }, [isTutor, logout]);

 /* ------------------ STYLES ------------------ */
const style = `
  .sidebar-outer {
    padding: 10px;
    height: 100%;
    background: transparent;
  }

  .sidebar-wrapper {
    background: white;
    border-radius: 22px;
    height: 100%;
    padding: 20px 18px;

    display: flex;
    flex-direction: column;

    /* IMPORTANT: prevent entire sidebar from scrolling */
    overflow: hidden;
  }

  .sidebar-logo {
    width: 215px;
    margin: 0 auto 16px; /* slightly reduced */
  }

  /* MENU ITEMS SCROLL ONLY */
  .menu-section {
    flex-grow: 1;
    overflow-y: auto;       /* <--- SCROLL HERE */
    padding-right: 3px;
  }

  .sidebar-item {
    height: 38px;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 6px 12px;
    margin-bottom: 5px;

    font-size: 16px;
    font-weight: 500;
    color: #333 !important;
    border-radius: 8px;
    cursor: pointer;
  }

  .sidebar-item svg {
    font-size: 17px;
    color: #7a7a7a;
  }

  .sidebar-item:hover {
    background: #f4f7ff;
  }

  .sidebar-item-active {
    background: #EBF2FF;
    color: #2D68FE !important;
  }
  .sidebar-item-active svg {
    color: #2D68FE !important;
  }

  /* FIXED COMMON SECTION AT BOTTOM */
  .bottom-section {
    border-top: 1px solid #eee;
    padding-top: 8px;      /* reduced */
    margin-top: 6px;       /* reduced */
  }

  /* Common (Profile / Logout) smaller items */
  .bottom-section .sidebar-item {
    padding: 6px 12px;
    margin-bottom: 4px;
  }
`;


  /* ------------------ HANDLE CLICK ------------------ */
  const handleClick = (item) => {
    if (item.action) return item.action();
    navigate(item.path);
    if (onSelect) onSelect();
  };

  return (
    <>
      <style>{style}</style>

      {/* OUTER FRAME */}
      <div className="sidebar-outer">

        {/* INNER WHITE CONTAINER */}
        <div className="sidebar-wrapper">

          {/* LOGO */}
          <img src={IzeonLogo} className="sidebar-logo" alt="Izeon Logo" />

          {/* TOP MENU SECTION */}
          <div className="menu-section">
            {menus[role]?.map((item, index) => {
              const active = item.path && location.pathname.startsWith(item.path);

              return (
                <div
                  key={index}
                  onClick={() => handleClick(item)}
                  className={`sidebar-item ${active ? "sidebar-item-active" : ""}`}
                >
                  {item.icon}
                  <span>{item.name}</span>
                </div>
              );
            })}
          </div>

          {/* FIXED BOTTOM PROFILE + LOGOUT */}
          <div className="bottom-section">
            {menus.bottom.map((item, index) => {
              const active = item.path && location.pathname.startsWith(item.path);

              return (
                <div
                  key={index}
                  onClick={() => handleClick(item)}
                  className={`sidebar-item ${active ? "sidebar-item-active" : ""}`}
                >
                  {item.icon}
                  <span>{item.name}</span>
                </div>
              );
            })}
          </div>

        </div>
      </div>
    </>
  );
}

export default Sidebar;
