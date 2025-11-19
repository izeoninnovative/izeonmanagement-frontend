import { useEffect, useState, useCallback } from "react";
import { Row, Col, Form, Button, Table, Spinner, Alert, Card } from "react-bootstrap";
import API from "../../api/api";
import { useAuth } from "../../context/AuthContext";

function EmployeeLeaves() {
  const { user } = useAuth();

  const [form, setForm] = useState({
    type: "SICK",
    fromDate: "",
    toDate: "",
    reason: "",
  });

  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);

  const today = new Date().toISOString().split("T")[0];

  // ---------------- INTERNAL PREMIUM STYLING ----------------
  const styles = `
      .leaves-header {
        background: linear-gradient(135deg, #1a73e8, #673ab7, #d500f9);
        background-size: 300% 300%;
        animation: gradientMove 7s ease infinite;
        border-radius: 14px;
        color: white;
        padding: 18px 22px;
        margin-bottom: 20px;
        text-align: center;
      }

      @keyframes gradientMove {
        0% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
      }

      .leaves-card {
        border-radius: 14px;
        transition: all 0.25s ease;
      }

      .leaves-card:hover {
        transform: translateY(-4px);
        box-shadow: 0 4px 15px rgba(0,0,0,0.15);
      }

      @media (max-width: 576px) {
        .leaves-header h2 {
          font-size: 1.4rem;
        }
      }
  `;

  // ---------------- FETCH LEAVES ----------------
  const fetchLeaves = useCallback(async () => {
    if (!user?.id) {
      setMessage({ type: "warning", text: "⚠ No employee ID found. Please log in again." });
      setLoading(false);
      return;
    }

    try {
      const res = await API.get(`/employee/${user.id}/leaves`);
      setLeaves(res.data || []);
    } catch (err) {
      console.error(err);
      setMessage({ type: "danger", text: "❌ Failed to fetch leave records." });
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchLeaves();
  }, [fetchLeaves]);

  // ---------------- VALIDATION ----------------
  const validateLeave = () => {
    if (!form.fromDate || !form.toDate) {
      setMessage({ type: "warning", text: "⚠ Please select both From and To dates." });
      return false;
    }
    if (form.toDate < form.fromDate) {
      setMessage({ type: "warning", text: "🚫 'To' date cannot be earlier than 'From' date." });
      return false;
    }

    const diffDays = (new Date(form.fromDate) - new Date(today)) / (1000 * 60 * 60 * 24);

    if (form.type === "PAY" && diffDays < 7) {
      setMessage({ type: "warning", text: "💼 Paid leave must be applied at least 7 days in advance." });
      return false;
    }

    if (form.type === "SICK" && form.fromDate < today) {
      setMessage({ type: "warning", text: "🩺 Sick leave cannot start in the past." });
      return false;
    }

    // ⭐ NEW: Reason Required
    if (!form.reason.trim()) {
      setMessage({ type: "warning", text: "✏️ Reason is required for leave application." });
      return false;
    }

    return true;
  };

  // ---------------- SUBMIT LEAVE ----------------
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);

    if (!validateLeave()) return;

    try {
      await API.post(`/employee/${user.id}/leave`, form);

      setMessage({
        type: "success",
        text: "✅ Leave request submitted successfully!",
      });

      setForm({ type: "SICK", fromDate: "", toDate: "", reason: "" });
      fetchLeaves();
    } catch (err) {
      console.error(err);
      setMessage({ type: "danger", text: "❌ Failed to submit leave request." });
    }
  };

  // ---------------- UI ----------------
  return (
    <div className="container py-3">
      <style>{styles}</style>

      {/* Gradient Header */}
      <div className="leaves-header shadow-sm">
        <h2 className="fw-bold">Leave Application</h2>
      </div>

      {message && (
        <Alert variant={message.type} className="text-center">
          {message.text}
        </Alert>
      )}

      {/* Leave Form Card */}
      <Card className="p-3 mb-4 shadow-sm leaves-card bg-light">
        <Form onSubmit={handleSubmit}>
          <Row>
            <Col md={3}>
              <Form.Group className="mb-3">
                <Form.Label>Leave Type</Form.Label>
                <Form.Select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                >
                  <option value="SICK">Sick Leave</option>
                  <option value="PAY">Paid Leave</option>
                </Form.Select>
                <Form.Text className="text-muted">
                  {form.type === "SICK"
                    ? "🩺 Apply for today or future dates."
                    : "💼 Paid leave requires 7 days notice."}
                </Form.Text>
              </Form.Group>
            </Col>

            <Col md={3}>
              <Form.Group className="mb-3">
                <Form.Label>From</Form.Label>
                <Form.Control
                  type="date"
                  min={today}
                  value={form.fromDate}
                  onChange={(e) => setForm({ ...form, fromDate: e.target.value })}
                />
              </Form.Group>
            </Col>

            <Col md={3}>
              <Form.Group className="mb-3">
                <Form.Label>To</Form.Label>
                <Form.Control
                  type="date"
                  min={form.fromDate || today}
                  value={form.toDate}
                  onChange={(e) => setForm({ ...form, toDate: e.target.value })}
                />
              </Form.Group>
            </Col>

            <Col md={3}>
              <Form.Group className="mb-3">
                <Form.Label>Reason</Form.Label>
                <Form.Control
                  type="text"
                  value={form.reason}
                  onChange={(e) => setForm({ ...form, reason: e.target.value })}
                  placeholder="Enter reason"
                />
              </Form.Group>
            </Col>
          </Row>

          <div className="text-end">
            <Button type="submit" variant="primary">
              Submit Leave
            </Button>
          </div>
        </Form>
      </Card>

      {/* Leaves Table */}
      <h4 className="fw-bold text-center mb-3">Submitted Leaves</h4>

      {loading ? (
        <div className="text-center mt-4">
          <Spinner animation="border" />
          <p className="text-muted mt-2">Loading leave records...</p>
        </div>
      ) : leaves.length === 0 ? (
        <p className="text-muted text-center">No leaves submitted yet.</p>
      ) : (
        <Table bordered hover responsive className="shadow-sm">
          <thead className="table-dark">
            <tr>
              <th>#</th>
              <th>Type</th>
              <th>From</th>
              <th>To</th>
              <th>Reason</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            {leaves.map((l, i) => (
              <tr key={l.id}>
                <td>{i + 1}</td>
                <td>{l.type}</td>
                <td>{l.fromDate}</td>
                <td>{l.toDate}</td>
                <td>{l.reason}</td>
                <td>
                  <span
                    className={`badge ${l.status === "APPROVED"
                        ? "bg-success"
                        : l.status === "REJECTED"
                          ? "bg-danger"
                          : "bg-warning text-dark"
                      }`}
                  >
                    {l.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
}

export default EmployeeLeaves;
