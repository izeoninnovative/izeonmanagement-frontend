import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import API from "../api/api";

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

  // Notification state
  const [notif, setNotif] = useState({
    // Admin
    adminMessages: false,
    adminLeaves: false,
    adminFeedbacks: false,
    adminAttendance: false,

    // Employee
    empMessages: false,
    empBatches: false,
    empLeaveStatus: false,

    // Student
    stuMessages: false,
    stuTasks: false,
    stuBatches: false,
  });

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

  /* ------------------ LOAD NOTIFICATIONS ------------------ */
  useEffect(() => {
    const loadNotifications = async () => {
      try {
        // =============== ADMIN ===============
        if (role === "admin") {
          const [msg, leaves, fb, att] = await Promise.all([
            API.get("/admin/messages/unread-count"),
            API.get("/admin/leaves/pending-count"),
            API.get("/admin/feedbacks/unread-count"),
            API.get("/admin/attendance/pending-count"),
          ]);

          setNotif((prev) => ({
            ...prev,
            adminMessages: (msg.data?.count || 0) > 0,
            adminLeaves: (leaves.data?.count || 0) > 0,
            adminFeedbacks: (fb.data?.count || 0) > 0,
            adminAttendance: (att.data?.count || 0) > 0,
          }));
        }

        // =============== EMPLOYEE ===============
        if (role === "employee" && user?.id) {
          const [msg, batches, leaveStatus] = await Promise.all([
            API.get(`/employee/${user.id}/messages/unread-count`),
            API.get(`/employee/${user.id}/batches/updates-count`),
            API.get(`/employee/${user.id}/leaves/status-updated-count`),
          ]);

          setNotif((prev) => ({
            ...prev,
            empMessages: (msg.data?.count || 0) > 0,
            empBatches: (batches.data?.count || 0) > 0,
            empLeaveStatus: (leaveStatus.data?.count || 0) > 0,
          }));
        }

        // =============== STUDENT ===============
        if (role === "student" && user?.id) {
          const [msg, tasks, batches] = await Promise.all([
            API.get(`/student/${user.id}/messages/unread-count`),
            API.get(`/student/${user.id}/tasks/unread-count`),
            API.get(`/student/${user.id}/batches/updates-count`),
          ]);

          setNotif((prev) => ({
            ...prev,
            stuMessages: (msg.data?.count || 0) > 0,
            stuTasks: (tasks.data?.count || 0) > 0,
            stuBatches: (batches.data?.count || 0) > 0,
          }));
        }
      } catch (err) {
        console.warn("Notification load failed:", err?.message || err);
      }
    };

    loadNotifications();
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

    const common = [
      { name: "Profile", icon: <FaUser />, path: "/profile" },
      { name: "Logout", icon: <FaSignOutAlt />, action: logout },
    ];

    return {
      admin: [...baseMenus.admin],
      employee: [...baseMenus.employee],
      student: [...baseMenus.student],
      bottom: common,
    };
  }, [isTutor, logout]);

  /* ------------------ STYLE STRING ------------------ */
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
      overflow: hidden;
    }

    .sidebar-logo {
      width: 215px;
      margin: 0 auto 16px;
    }

    .menu-section {
      flex-grow: 1;
      overflow-y: auto;
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

    .bottom-section {
      border-top: 1px solid #eee;
      padding-top: 8px;
      margin-top: 6px;
    }

    .bottom-section .sidebar-item {
      padding: 6px 12px;
      margin-bottom: 4px;
    }

    .notification-dot {
      width: 9px;
      height: 9px;
      background: #ff2c2c;
      border-radius: 50%;
      margin-left: auto;
    }
  `;

  /* ------------------ MAP MENU → NOTIF DOT ------------------ */
  const getMenuDot = (name) => {
    // ADMIN
    if (role === "admin") {
      if (name === "Messages") return notif.adminMessages;
      if (name === "Leave" || name === "Leaves") return notif.adminLeaves;
      if (name === "Feedback" || name === "Feedbacks") return notif.adminFeedbacks;
      if (name === "Attendance") return notif.adminAttendance;
    }

    // EMPLOYEE
    if (role === "employee") {
      if (name === "Messages") return notif.empMessages;
      if (name === "Batches") return notif.empBatches;
      if (name === "Leaves") return notif.empLeaveStatus;
    }

    // STUDENT
    if (role === "student") {
      if (name === "Messages") return notif.stuMessages;
      if (name === "Tasks") return notif.stuTasks;
      if (name === "Batches") return notif.stuBatches;
    }

    return false;
  };

  /* ------------------ HANDLE CLICK ------------------ */
  const handleClick = (item) => {
    const name = item.name;

    // ===== Clear notifications and hit APIs =====
    try {
      // ADMIN
      if (role === "admin" && name === "Messages") {
        setNotif((p) => ({ ...p, adminMessages: false }));
        API.put("/admin/messages/mark-all-read").catch(() => {});
      }
      if (role === "admin" && (name === "Leave" || name === "Leaves")) {
        setNotif((p) => ({ ...p, adminLeaves: false }));
        API.put("/admin/leaves/mark-all-reviewed").catch(() => {});
      }
      if (role === "admin" && (name === "Feedback" || name === "Feedbacks")) {
        setNotif((p) => ({ ...p, adminFeedbacks: false }));
        API.put("/admin/feedbacks/mark-all-read").catch(() => {});
      }
      if (role === "admin" && name === "Attendance") {
        setNotif((p) => ({ ...p, adminAttendance: false }));
        API.put("/admin/attendance/mark-reviewed").catch(() => {});
      }

      // EMPLOYEE
      if (role === "employee" && name === "Messages") {
        setNotif((p) => ({ ...p, empMessages: false }));
        API.put(`/employee/${user.id}/messages/mark-all-read`).catch(() => {});
      }
      if (role === "employee" && name === "Batches") {
        setNotif((p) => ({ ...p, empBatches: false }));
        API.put(`/employee/${user.id}/batches/mark-updates-seen`).catch(() => {});
      }
      if (role === "employee" && name === "Leaves") {
        setNotif((p) => ({ ...p, empLeaveStatus: false }));
        API.put(`/employee/${user.id}/leaves/mark-status-seen`).catch(() => {});
      }

      // STUDENT
      if (role === "student" && name === "Messages") {
        setNotif((p) => ({ ...p, stuMessages: false }));
        API.put(`/student/${user.id}/messages/mark-all-read`).catch(() => {});
      }
      if (role === "student" && name === "Tasks") {
        setNotif((p) => ({ ...p, stuTasks: false }));
        API.put(`/student/${user.id}/tasks/mark-read`).catch(() => {});
      }
      if (role === "student" && name === "Batches") {
        setNotif((p) => ({ ...p, stuBatches: false }));
        API.put(`/student/${user.id}/batches/mark-seen`).catch(() => {});
      }
    } catch {
      // ignore
    }

    // Custom action (Logout)
    if (item.action) return item.action();

    // Navigate
    navigate(item.path);
    if (onSelect) onSelect?.();
  };

  return (
    <>
      <style>{style}</style>

      <div className="sidebar-outer">
        <div className="sidebar-wrapper">
          {/* LOGO */}
          <img src={IzeonLogo} className="sidebar-logo" alt="Izeon Logo" />

          {/* MAIN MENU */}
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
                  {getMenuDot(item.name) && <div className="notification-dot" />}
                </div>
              );
            })}
          </div>

          {/* BOTTOM (PROFILE + LOGOUT) */}
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
