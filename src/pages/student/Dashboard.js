import { useEffect, useState, useCallback } from "react";
import { Row, Col, Card, Spinner, Badge, ProgressBar } from "react-bootstrap";
import API from "../../api/api";
import { useAuth } from "../../context/AuthContext";

function StudentDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const styles = `
    /* Gradient Banner */
    .dashboard-header {
      background: linear-gradient(135deg, #1a73e8, #673ab7, #d500f9);
      background-size: 300% 300%;
      animation: gradientMove 7s ease infinite;
      border-radius: 16px;
      padding: 22px 28px;
      color: white;
    }

    @keyframes gradientMove {
      0% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }

    /* Cards */
    .dash-card {
      transition: all 0.25s ease;
      border-radius: 16px;
    }
    .dash-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 4px 18px rgba(0,0,0,0.15);
    }

    /* Responsive heading */
    @media (max-width: 576px) {
      .dashboard-header h3 {
        font-size: 1.3rem;
      }
    }

    /* ProgressBar text fix */
    .progress-bar {
      font-weight: 600;
    }
  `;

  const fetchStats = useCallback(async () => {
    try {
      const res = await API.get(`/student/${user.id}/summary`);
      setStats(res.data);
    } catch (err) {
      console.error("Error loading dashboard:", err);
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  if (loading || !stats)
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ height: "60vh" }}
      >
        <Spinner animation="border" variant="primary" />
      </div>
    );

  const completionRate =
    stats.taskCount > 0
      ? Math.round((stats.completedTaskCount / stats.taskCount) * 100)
      : 0;

  return (
    <div className="p-3 p-md-4">
      <style>{styles}</style>

      {/* ================= HEADER BANNER ================= */}
      <div className="dashboard-header mb-4">
        <h3 className="fw-bold mb-1">Welcome, {user.name}</h3>
        <p className="mb-0">Here’s your progress overview.</p>
      </div>

      {/* ================= GRID CARDS ================= */}
      <Row xs={1} sm={2} lg={4} className="g-4 mb-4">
        <Col>
          <Card className="shadow dash-card border-0 text-center p-2">
            <Card.Body>
              <Card.Title>Attendance</Card.Title>
              <Card.Text className="fs-3 fw-bold text-primary">
                {stats.attendanceCount}
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>

        <Col>
          <Card className="shadow dash-card border-0 text-center p-2">
            <Card.Body>
              <Card.Title>Tasks Assigned</Card.Title>
              <Card.Text className="fs-3 fw-bold text-warning">
                {stats.taskCount}
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>

        <Col>
          <Card className="shadow dash-card border-0 text-center p-2">
            <Card.Body>
              <Card.Title>Leaves Applied</Card.Title>
              <Card.Text className="fs-3 fw-bold text-danger">
                {stats.leaveCount}
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>

        <Col>
          <Card className="shadow dash-card border-0 text-center p-2">
            <Card.Body>
              <Card.Title>Messages Received</Card.Title>
              <Card.Text className="fs-3 fw-bold text-success">
                {stats.messageCount}
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* ================= PROGRESS SECTION ================= */}
      <Card className="p-3 shadow-sm border-0 rounded-4">
        <h5 className="fw-bold mb-2">Task Completion Progress</h5>

        <ProgressBar
          now={completionRate}
          label={`${completionRate}%`}
          variant={
            completionRate >= 80
              ? "success"
              : completionRate >= 50
              ? "warning"
              : "danger"
          }
          style={{ height: "25px", borderRadius: "12px" }}
        />

        <p className="text-muted mt-2 mb-1">
          Completed <strong>{stats.completedTaskCount}</strong> /{" "}
          <strong>{stats.taskCount}</strong> tasks.
        </p>
      </Card>

      {/* ================= FOOTER BADGE ================= */}
      <div className="mt-4 text-center">
        <Badge bg="info" className="px-3 py-2 fw-semibold">
          Keep it up, {user.name}!
        </Badge>
      </div>
    </div>
  );
}

export default StudentDashboard;
