import { useEffect, useState } from "react";
import { Row, Col, Card, Spinner, Badge } from "react-bootstrap";
import API from "../../api/api";

function AdminDashboard() {
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

  const dashboardCards = [
    {
      title: "Total Students",
      value: stats?.students || 0,
      color: "primary",
    },
    {
      title: "Total Employees",
      value: stats?.employees || 0,
      color: "success",
    },
    {
      title: "Active Tutors",
      value: stats?.tutors || 0,
      color: "info",
    },
    {
      title: "Today's Attendance",
      value: stats?.todayAttendance || 0,
      color: "warning",
      sub: `${stats?.presentPercentage ?? 0}% Present`,
    },
    {
      title: "Pending Leaves",
      value: stats?.pendingLeaves || 0,
      color: "danger",
    },
    {
      title: "Unread Messages",
      value: stats?.unreadMessages || 0,
      color: "secondary",
      badge: stats?.unreadMessages > 0 ? "New" : null,
    },
  ];

  return (
    <div className="p-2 p-md-3">
      <h3 className="fw-bold mb-4">Admin Dashboard</h3>

      <Row xs={1} sm={2} md={3} lg={3} xl={4} className="g-4">
        {dashboardCards.map((card, index) => (
          <Col key={index}>
            <Card className="shadow-sm border-0 text-center dashboard-card">
              <Card.Body>
                <Card.Title className="fw-semibold">{card.title}</Card.Title>

                <Card.Text className={`fs-2 fw-bold text-${card.color}`}>
                  {card.value}
                </Card.Text>

                {card.sub && <small className="text-muted">{card.sub}</small>}

                {card.badge && (
                  <Badge bg="danger" className="ms-1">
                    {card.badge}
                  </Badge>
                )}
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
}

export default AdminDashboard;
