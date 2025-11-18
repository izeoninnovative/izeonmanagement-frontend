import React, { useState } from "react";
import { Offcanvas, Button } from "react-bootstrap";
import Sidebar from "../components/Sidebar";
import NavbarComp from "../components/NavbarComp";
import { useAuth } from "../context/AuthContext";
import { FaBars } from "react-icons/fa";

const SIDEBAR_WIDTH = 230;

const StudentLayout = ({ children }) => {
  const { user } = useAuth();
  const [showSidebar, setShowSidebar] = useState(false);

  return (
    <div className="layout-wrapper">

      {/* TOP NAVBAR */}
      <NavbarComp />

      {/* HAMBURGER FOR MOBILE */}
      <Button
        variant="outline-primary"
        className="d-lg-none ms-2 mt-2"
        onClick={() => setShowSidebar(true)}
      >
        <FaBars size={18} />
      </Button>

      {/* ======================= DESKTOP LAYOUT ======================= */}
      <div className="desktop-layout d-none d-lg-flex">
        
        {/* SIDEBAR */}
        <div
          className="sidebar-container bg-light border-end p-0"
          style={{ width: SIDEBAR_WIDTH }}
        >
          <Sidebar role={user?.role || "student"} />
        </div>

        {/* MAIN CONTENT */}
        <div className="content-container bg-white p-3 p-md-4">
          {children}
        </div>
      </div>

      {/* ======================= MOBILE MAIN CONTENT ======================= */}
      <div className="d-lg-none bg-white p-3 p-md-4">
        {children}
      </div>

      {/* ======================= MOBILE OFFCANVAS SIDEBAR ======================= */}
      <Offcanvas
        show={showSidebar}
        onHide={() => setShowSidebar(false)}
        placement="start"
        className="d-lg-none"
      >
        <Offcanvas.Header closeButton />

        <Offcanvas.Body className="p-0">
          {/* AUTO-CLOSE on item selection */}
          <Sidebar
            role={user?.role || "student"}
            onSelect={() => setShowSidebar(false)}
          />
        </Offcanvas.Body>
      </Offcanvas>

    </div>
  );
};

export default StudentLayout;
