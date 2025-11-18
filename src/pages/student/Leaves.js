import React, { useEffect, useState, useCallback } from "react";
import {
  Row,
  Col,
  Form,
  Button,
  Table,
  Spinner,
  Alert,
  Card,
} from "react-bootstrap";
import API from "../../api/api";
import { useAuth } from "../../context/AuthContext";

function StudentLeaves() {
  const { user } = useAuth();

  const [form, setForm] = useState({
    fromDate: "",
    toDate: "",
    reason: "",
  });

  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);

  const today = new Date().toISOString().split("T")[0];

  /* ---------------------------------------------------------
     STYLES - Gradient Banner + Premium UI
  --------------------------------------------------------- */
  const styles = `
    .leaves-header {
      background: linear-gradient(135deg, #1a73e8, #7e57c2, #d500f9);
      background-size: 300% 300%;
      animation: gradientShift 6s ease infinite;
      border-radius: 16px;
      padding: 22px 25px;
      color: white;
    }
    @keyframes gradientShift {
      0% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }
    .leave-card {
      border-radius: 14px;
      transition: all 0.25s ease;
    }
    .leave-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 6px 18px rgba(0,0,0,0.15);
    }
  `;

  /* ---------------------------------------------------------
     FETCH LEAVE REQUESTS
  --------------------------------------------------------- */
  const fetchLeaves = useCallback(async () => {
    try {
      const res = await API.get(`/student/${user.id}/leaves`);
      setLeaves(Array.isArray(res.data) ? res.data : []);
    } catch {
      setLeaves([]);
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  useEffect(() => {
    fetchLeaves();
  }, [fetchLeaves]);

  /* ---------------------------------------------------------
     VALIDATION
  --------------------------------------------------------- */
  const validateLeave = () => {
    if (!form.fromDate || !form.toDate || !form.reason) {
      setMessage({ type: "warning", text: "⚠️ Please fill all fields." });
      return false;
    }
    if (form.toDate < form.fromDate) {
      setMessage({
        type: "warning",
        text: "🚫 'To Date' cannot be earlier than 'From Date'.",
      });
      return false;
    }
    if (form.fromDate < today) {
      setMessage({
        type: "warning",
        text: "📅 Leave cannot start in the past.",
      });
      return false;
    }
    return true;
  };

  /* ---------------------------------------------------------
     SUBMIT LEAVE REQUEST
  --------------------------------------------------------- */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);

    if (!validateLeave()) return;

    try {
      await API.post(`/student/${user.id}/leave`, form);

      setMessage({
        type: "success",
        text: "✅ Leave request submitted successfully!",
      });

      setForm({ fromDate: "", toDate: "", reason: "" });
      fetchLeaves();
    } catch {
      setMessage({
        type: "danger",
        text: "❌ Failed to submit leave. Please try again.",
      });
    }
  };

  /* ---------------------------------------------------------
     UI
  --------------------------------------------------------- */
  return (
    <div className="p-3 p-md-4">
      <style>{styles}</style>

      {/* HEADER */}
      <div className="leaves-header mb-4 shadow-sm">
        <h3 className="fw-bold mb-0">Leave Application</h3>
      </div>

      {message && (
        <Alert variant={message.type} className="fw-semibold text-center shadow-sm">
          {message.text}
        </Alert>
      )}

      {/* LEAVE FORM */}
      <Card className="p-4 mb-4 shadow-sm leave-card bg-light">
        <h5 className="fw-bold mb-3">Apply for Leave</h5>

        <Form onSubmit={handleSubmit}>
          <Row>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label><strong>From Date</strong></Form.Label>
                <Form.Control
                  type="date"
                  min={today}
                  value={form.fromDate}
                  onChange={(e) =>
                    setForm({ ...form, fromDate: e.target.value })
                  }
                  required
                />
              </Form.Group>
            </Col>

            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label><strong>To Date</strong></Form.Label>
                <Form.Control
                  type="date"
                  min={form.fromDate || today}
                  value={form.toDate}
                  onChange={(e) =>
                    setForm({ ...form, toDate: e.target.value })
                  }
                  required
                />
              </Form.Group>
            </Col>

            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label><strong>Reason</strong></Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Enter reason"
                  value={form.reason}
                  onChange={(e) =>
                    setForm({ ...form, reason: e.target.value })
                  }
                  required
                />
              </Form.Group>
            </Col>
          </Row>

          <div className="text-end">
            <Button type="submit" variant="primary" className="px-4">
              Submit Leave
            </Button>
          </div>
        </Form>
      </Card>

      {/* LEAVE RECORDS */}
      <h5 className="fw-bold mb-3 text-center">My Leave Records</h5>

      {loading ? (
        <div className="text-center mt-4">
          <Spinner animation="border" />
          <p className="text-muted mt-2">Loading leave history...</p>
        </div>
      ) : leaves.length === 0 ? (
        <Card className="p-4 text-center shadow-sm leave-card">
          <p className="text-muted mb-0">You have not applied for any leave.</p>
        </Card>
      ) : (
        <Card className="shadow-sm leave-card">
          <Table bordered hover responsive className="mb-0 text-center">
            <thead className="table-dark">
              <tr>
                <th>#</th>
                <th>From</th>
                <th>To</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Approved By</th>
              </tr>
            </thead>

            <tbody>
              {leaves.map((l, i) => (
                <tr key={l.id}>
                  <td>{i + 1}</td>
                  <td>{l.fromDate}</td>
                  <td>{l.toDate}</td>
                  <td>{l.reason}</td>
                  <td>
                    <span
                      className={`badge ${
                        l.status === "APPROVED"
                          ? "bg-success"
                          : l.status === "REJECTED"
                          ? "bg-danger"
                          : "bg-warning text-dark"
                      }`}
                    >
                      {l.status}
                    </span>
                  </td>
                  <td>{l.approvedByTutor || "Pending"}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
      )}
    </div>
  );
}

export default StudentLeaves;
