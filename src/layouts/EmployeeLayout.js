import React, { useState } from "react";
import Sidebar from "../components/Sidebar";
import { useAuth } from "../context/AuthContext";
import IzeonLogo from "../images/izeon-logo.svg";

const SIDEBAR_WIDTH = 283;

const EmployeeLayout = ({ children }) => {
  const { user } = useAuth();
  const [showSidebar, setShowSidebar] = useState(false);

  const toggleSidebar = () => setShowSidebar(prev => !prev);

  return (
    <div className="employee-layout-wrapper">

      <style>{`
        .employee-layout-wrapper {
          width: 100%;
          height: 100vh;
          background: #f8f8f8;
          display: flex;
          flex-direction: column;
        }

        /* DESKTOP */
        .desktop-layout {
          display: flex;
          height: 100vh;
          overflow: hidden;
        }

        .sidebar-container {
          height: 100vh;
          background: #ffffff;
          border: 0.5px solid #000000;
          border-top-right-radius: 24px;
          border-bottom-right-radius: 24px;
        }

        .content-container {
          flex-grow: 1;
          height: 100%;
          background: #ffffff;
          padding: 20px;
          overflow-y: auto;
        }

        /* MOBILE MAIN WRAPPER */
        .mobile-wrapper {
          max-width: 390px;
          min-height: 100vh;
          background: #fff;
          margin: 0 auto;
          padding: 16px;
          border-radius: 22px;
          box-shadow: 0 0 18px rgba(0,0,0,0.08);
          overflow: hidden;
        }

        

        /* FIXED HAMBURGER */
        .mobile-hamburger {
          position: fixed;
          bottom: 18px;
          left: 50%;
          transform: translateX(-50%);
          background: #F1F5FB;
          width: 60px;
          height: 60px;
          border-radius: 16px;
          display: flex;
          justify-content: center;
          align-items: center;
          box-shadow: 0 3px 10px rgba(0,0,0,0.25);
          z-index: 3000;
          cursor: pointer;
        }

        /* HAMBURGER TO X ANIMATION */
.hamburger-icon {
  width: 28px;
  height: 22px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  cursor: pointer;
  transition: 0.3s ease-in-out;
}

.hamburger-icon span {
  display: block;
  height: 3px;
  background: #333;
  border-radius: 4px;
  transition: 0.3s ease-in-out;
}

/* Transform to X */
.hamburger-icon.active span:nth-child(1) {
  transform: translateY(9px) rotate(45deg);
}

.hamburger-icon.active span:nth-child(2) {
  opacity: 0;
}

.hamburger-icon.active span:nth-child(3) {
  transform: translateY(-9px) rotate(-45deg);
}
 .mobile-sidebar-popup .sidebar-logo {
          display: none !important;
        }
      
        @media (min-width: 992px) {
          .mobile-hamburger {
            display: none;
          }
          .mobile-logo-box {
          background: #fff;
          min-width: 150px;
         
          border-radius: 16px;
          
          
        }

        .sidebar-logo {
          width: 100%;
        
        }
        }

        /* === CUSTOM MOBILE POPUP SIDEBAR === */
         .mobile-sidebar-popup {
          position: fixed;
          width: 90%;
          max-width: 360px;
          height: 70%;
          max-height: 420px;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          background: #fff;
          border-radius: 20px;
          box-shadow: 0px 4px 18px rgba(0,0,0,0.20);
          z-index: 1;
          overflow-y: auto;
        }
      `}</style>

      {/* Desktop */}
      <div className="d-none d-lg-flex desktop-layout">
        <div className="sidebar-container" style={{ width: SIDEBAR_WIDTH }}>
          <Sidebar role={user?.role || "employee"} />
        </div>

        <div className="content-container">{children}</div>
      </div>

      {/* Mobile */}
      <div className="d-lg-none">
        <div className="mobile-wrapper">
          <div className="mobile-logo-box mx-2">
            <img src={IzeonLogo} className="sidebar-logo" alt="Izeon Logo" />
          </div>

          {children}
        </div>
      </div>

      {/* Floating Hamburger */}
      <div className="mobile-hamburger d-lg-none" onClick={toggleSidebar}>
        <div className={`hamburger-icon ${showSidebar ? "active" : ""}`}>
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>

      {/* Popup Sidebar */}
      {showSidebar && (
        <div className="mobile-sidebar-popup d-lg-none">
          <Sidebar
            role={user?.role || "employee"}
            onSelect={toggleSidebar}
          />
        </div>
      )}
    </div>
  );
};

export default EmployeeLayout;
