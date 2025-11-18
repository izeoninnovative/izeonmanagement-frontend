import { useState, useRef, useEffect } from "react";
import { Navbar, Nav, Container, Button } from "react-bootstrap";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { FaUserCircle } from "react-icons/fa";
import "../styles/NavbarCustom.css";

function NavbarComp() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const [showMenu, setShowMenu] = useState(false);
    const menuRef = useRef(null);

    const handleLogout = () => {
        logout();
        navigate("/");
    };

    // Close menu when clicking outside
    useEffect(() => {
        const handler = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setShowMenu(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    return (
        <Navbar className="custom-navbar shadow-sm" sticky="top">
            <Container fluid>

                {/* Brand */}
                <Navbar.Brand className="fw-bold text-white fs-4">
                    IZEON
                </Navbar.Brand>

                {/* MOBILE/TABLET USER ICON */}
                <div className="ms-auto d-lg-none position-relative" ref={menuRef}>
                    <FaUserCircle
                        size={30}
                        color="white"
                        className="mobile-user-icon"
                        onClick={() => setShowMenu(!showMenu)}
                    />

                    {/* DROPDOWN MENU */}
                    {showMenu && (
                        <div className="mobile-dropdown-menu shadow-sm">
                            <div className="px-3 py-2 fw-bold">{user?.name}</div>

                            <Button
                                variant="danger"
                                className="w-100"
                                onClick={handleLogout}
                            >
                                Logout
                            </Button>
                        </div>
                    )}
                </div>

                {/* DESKTOP USER SECTION */}
                <Nav className="ms-auto d-none d-lg-flex align-items-center gap-3">
                    {user && (
                        <div className="d-flex align-items-center text-white gap-2">
                            <FaUserCircle size={28} />
                            <span className="fw-semibold">{user.name}</span>
                        </div>
                    )}
                    <Button
                        variant="light"
                        size="sm"
                        className="px-3 fw-semibold logout-btn"
                        onClick={handleLogout}
                    >
                        Logout
                    </Button>
                </Nav>

            </Container>
        </Navbar>
    );
}

export default NavbarComp;
