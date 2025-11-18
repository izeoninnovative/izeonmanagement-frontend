import { useEffect, useState, useCallback } from "react";
import { Row, Col, Card, Spinner, Badge } from "react-bootstrap";
import API from "../../api/api";
import { useAuth } from "../../context/AuthContext";

function EmployeeDashboard() {
  const { user } = useAuth();
  const [summary, setSummary] = useState({
    attendance: 0,
    leaves: 0,
    messages: 0,
    batches: 0,
  });

  const [loading, setLoading] = useState(true);

  // ---------------- INTERNAL PREMIUM UI STYLING ----------------
  const styles = `
    /* Gradient Banner */
    .dashboard-header {
      background: linear-gradient(135deg, #1a73e8, #673ab7, #d500f9);
      background-size: 300% 300%;
      animation: gradientMove 7s ease infinite;
      border-radius: 16px;
      padding: 20px 25px;
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
  `;

  // ---------------- FETCH SUMMARY ----------------
  const fetchSummary = useCallback(async () => {
    try {
      const res = await API.get(`/employee/${user.id}/summary`);

      setSummary({
        attendance: res.data.attendance || 0,
        leaves: res.data.leaves || 0,
        messages: res.data.messages || 0,
        batches: res.data.batches || 0,
      });
    } catch (err) {
      console.error("Failed to load summary:", err);
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  // ---------------- LOADING ----------------
  if (loading)
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: "60vh" }}>
        <Spinner animation="border" variant="primary" />
      </div>
    );

  return (
    <div className="p-3 p-md-4">

      <style>{styles}</style>

      {/* ------------ Gradient Welcome Header ------------ */}
      <div className="dashboard-header mb-4 shadow-sm">
        <h3 className="fw-bold mb-2">Welcome, {user.name}</h3>
        <p className="m-0">
          Logged in as{" "}
          <Badge bg="light" text="dark" className="text-uppercase">
            {user.subRole || user.role}
          </Badge>
        </p>
      </div>

      {/* ------------ Summary Cards ------------ */}
      <Row xs={1} sm={2} md={2} lg={4} className="g-4 mb-4">
        <Col>
          <Card className="shadow-sm dash-card border-0 text-center">
            <Card.Body>
              <Card.Title className="fw-semibold">Attendance</Card.Title>
              <Card.Text className="fs-2 fw-bold text-primary">
                {summary.attendance}
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>

        <Col>
          <Card className="shadow-sm dash-card border-0 text-center">
            <Card.Body>
              <Card.Title className="fw-semibold">Leaves Taken</Card.Title>
              <Card.Text className="fs-2 fw-bold text-warning">
                {summary.leaves}
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>

        <Col>
          <Card className="shadow-sm dash-card border-0 text-center">
            <Card.Body>
              <Card.Title className="fw-semibold">Messages</Card.Title>
              <Card.Text className="fs-2 fw-bold text-success">
                {summary.messages}
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>

        {user.subRole === "TUTOR" && (
          <Col>
            <Card className="shadow-sm dash-card border-0 text-center">
              <Card.Body>
                <Card.Title className="fw-semibold">Batches Assigned</Card.Title>
                <Card.Text className="fs-2 fw-bold text-danger">
                  {summary.batches}
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>
        )}
      </Row>

      {/* ------------ Bottom Overview Section ------------ */}
      <Card className="border-0 shadow-sm p-3 bg-light">
        <Card.Body>
          {user.subRole === "TUTOR" ? (
            <>
              <h5 className="fw-bold mb-2">Tutor Overview</h5>
              <p className="text-muted mb-0">
                You are managing <strong>{summary.batches}</strong> batches and{" "}
                <strong>{summary.attendance}</strong> attendance records.
                Track students, assign tasks, and manage evaluations easily.
              </p>
            </>
          ) : (
            <>
              <h5 className="fw-bold mb-2">Employee Overview</h5>
              <p className="text-muted mb-0">
                You have <strong>{summary.attendance}</strong> attendance entries,{" "}
                <strong>{summary.leaves}</strong> leave requests, and{" "}
                <strong>{summary.messages}</strong> messages from management.
              </p>
            </>
          )}
        </Card.Body>
      </Card>
    </div>
  );
}

export default EmployeeDashboard;
