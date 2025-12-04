import { useEffect, useState } from "react";
import { Row, Col, Card, Spinner } from "react-bootstrap";
import { useNavigate} from "react-router-dom";
import API from "../../api/api";
import { useAuth } from "../../context/AuthContext";

/* ---------------- GOOGLE FONTS IMPORT ---------------- */
const fontStyles = `
@import url('https://fonts.googleapis.com/css2?family=Salsa&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Inclusive+Sans:wght@400;600&display=swap');
`;

function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  

  const fetchStats = async () => {
    try {
      const res = await API.get("/admin/summary");
      setStats(res.data);
    } catch (err) {
      console.error("Error fetching summary:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const styleElement = document.createElement("style");
    styleElement.innerHTML = fontStyles;
    document.head.appendChild(styleElement);

    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);
 

  if (loading)
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: "60vh" }}>
        <Spinner animation="border" variant="primary" />
      </div>
    );

  /* ------------ CARD DATA + ROUTES ------------ */
  const topCards = [
    { title: "Total Employees", value: stats?.employees || 0, color: "#1A73E8", route: "/admin/employees" },
    { title: "Total Students", value: stats?.students || 0, color: "#1A73E8", route: "/admin/students" },
    { title: "Active Tutors", value: stats?.tutors || 0, color: "#34A853", route: "/admin/batches" },
    { title: "Unread Messages", value: stats?.unreadMessages || 0, color: "#EA4335", route: "/admin/messages" },
    { title: "Report", value: stats?.reports || 0, color: "#F9AB00", route: "/admin/reports" },
    { title: "Feedback", value: stats?.feedback || 0, color: "#A67C52", route: "/admin/feedbacks" },
  ];

  const attendanceCards = [
    { title: "Employees Attendance", value: stats?.empAttendance || 0, color: "#34A853", route: "/admin/attendance?tab=employees" },
    { title: "Students Attendance", value: stats?.stdAttendance || 0, color: "#34A853", route: "/admin/attendance?tab=students" },
  ];

  return (
    <div className="px-2 px-md-3 py-2">

      {/* ------------ DASHBOARD STYLES ------------ */}
      <style>{`
        .admin-welcome-box {
  background: #2D68FE;
  padding: 22px 28px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #fff;
  margin-bottom: 25px;
}

.admin-welcome-text h2 {
  margin: 0;
  font-size: 26px;
  font-weight: 700;
  font-family: 'Salsa', cursive;
}

.admin-welcome-text p {
  margin: 2px 0 0;
  font-size: 14px;
  opacity: 0.9;
  font-family: 'Salsa', cursive;
}

.admin-welcome-avatar img {
  width: 70px;
  height: 70px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid #fff;
  box-shadow: 0 3px 8px rgba(0,0,0,0.25);
}


        .dashboard-card {
          border-radius: 20px !important;
          padding: 22px 10px;
          min-height: 130px;
          transition: 0.2s ease;
          cursor: pointer;
        }

        .dashboard-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.12) !important;
        }

        .card-title-text {
          font-family: 'Instrument Sans', sans-serif;
          font-size: 18px;
          font-weight: 600;
        }

        .value-text {
          font-family: 'Inclusive Sans', sans-serif;
          font-size: 24px;
          font-weight: 700;
          margin-top: 6px;
        }

       /* ============================================================
   MOBILE VIEW — Apply new card sizes but KEEP old UI styles
   ============================================================ */
@media (max-width: 576px) {

  .admin-welcome-box {
    max-width: 381px;
    height: 80px;
    border-radius: 12px;
    padding: 0 18px;
    margin: 0 auto 20px auto;
  }

  .admin-welcome-text h2 {
    font-size: 20px;
  }

  .admin-welcome-text p {
    font-size: 12px;
  }

  .admin-welcome-avatar img {
    width: 50px;
    height: 50px;
    border-width: 2px;
  }

}

      `}</style>

      {/* ------------ HEADER ------------ */}
      {/* ------------ HEADER ------------ */}
<div className="admin-welcome-box shadow-sm">
  <div className="admin-welcome-text">
    <h2>Welcome {user?.name || "Admin"}</h2>
    <p>Admin</p>
  </div>

  <div className="admin-welcome-avatar">
    <img
      src={
        user.profile ||
        "https://cdn-icons-png.flaticon.com/512/149/149071.png"
      }
      alt="User"
    />
  </div>
</div>


      {/* ------------ TOP CARDS ------------ */}
      <Row xs={2} sm={2} md={3} lg={3} xl={3} className="g-3">
        {topCards.map((card, index) => (
          <Col key={index}>
            <Card
              className="shadow-sm border-0 text-center dashboard-card"
              onClick={() => navigate(card.route)}
            >
              <Card.Body>
                <div className="card-title-text">{card.title}</div>
                <div className="value-text" style={{ color: card.color }}>
                  {card.value.toString().padStart(2, "0")}
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {/* ------------ ATTENDANCE CARDS ------------ */}
      <Row xs={1} sm={2} md={2} lg={2} xl={2} className="g-3 mt-2 mb-3">
        {attendanceCards.map((card, index) => (
          <Col key={index}>
            <Card
              className="shadow-sm border-0 text-center dashboard-card"
              onClick={() => navigate(card.route)}
            >
              <Card.Body>
                <div className="card-title-text">{card.title}</div>
                <div className="value-text" style={{ color: card.color }}>
                  {card.value.toString().padStart(2, "0")}
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

    </div>
  );
}

export default AdminDashboard;
