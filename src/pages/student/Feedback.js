import React, { useEffect, useState, useCallback } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Spinner,
  Alert,
  Badge,
  Card,
} from "react-bootstrap";
import API from "../../api/api";
import { useAuth } from "../../context/AuthContext";

function StudentFeedback() {
  const { user } = useAuth();

  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const [form, setForm] = useState({
    content: "",
    targetRole: "ADMIN",
  });

  /* --------------------------------------------------
      Premium Styling + Animated Banner
  -------------------------------------------------- */
  const styles = `
    .feedback-header {
      background: linear-gradient(135deg, #1a73e8, #673ab7, #d500f9);
      background-size: 300% 300%;
      animation: gradientMove 6s ease infinite;
      border-radius: 16px;
      padding: 20px 25px;
      color: white;
    }

    @keyframes gradientMove {
      0% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }

    .feedback-card {
      border-radius: 18px;
      transition: all 0.25s ease;
    }

    .feedback-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 6px 18px rgba(0,0,0,0.15);
    }
  `;

  /* --------------------------------------------------
      FETCH FEEDBACKS
  -------------------------------------------------- */
  const fetchFeedbacks = useCallback(async () => {
    try {
      const res = await API.get(`/student/${user.id}/feedback`);
      setFeedbacks(Array.isArray(res.data) ? res.data : []);
    } catch {
      setMessage({
        type: "danger",
        text: "❌ Failed to load your feedback.",
      });
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  useEffect(() => {
    fetchFeedbacks();
  }, [fetchFeedbacks]);

  /* --------------------------------------------------
      SUBMIT FEEDBACK
  -------------------------------------------------- */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);

    if (!form.content.trim()) {
      return setMessage({
        type: "warning",
        text: "⚠️ Please write your feedback.",
      });
    }

    try {
      await API.post(`/student/${user.id}/feedback`, form);

      setMessage({
        type: "success",
        text: "✅ Feedback submitted successfully!",
      });

      setShowModal(false);
      setForm({ content: "", targetRole: "ADMIN" });
      fetchFeedbacks();
    } catch {
      setMessage({
        type: "danger",
        text: "❌ Failed to submit. Try again.",
      });
    }
  };

  /* --------------------------------------------------
      LOADING UI
  -------------------------------------------------- */
  if (loading)
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: "60vh" }}>
        <Spinner animation="border" />
      </div>
    );

  return (
    <div className="p-3 p-md-4">
      <style>{styles}</style>

      {/* HEADER */}
      <div className="feedback-header mb-4">
        <div className="d-flex justify-content-between align-items-center">
          <h3 className="fw-bold mb-0">My Feedback</h3>

          <Button variant="light" className="fw-semibold" onClick={() => setShowModal(true)}>
            + Submit Feedback
          </Button>
        </div>
      </div>

      {message && (
        <Alert variant={message.type} className="text-center shadow-sm fw-semibold">
          {message.text}
        </Alert>
      )}

      {/* NO FEEDBACK MESSAGE */}
      {feedbacks.length === 0 ? (
        <Card className="p-4 text-center shadow-sm feedback-card">
          <h6 className="text-muted">You haven’t submitted any feedback yet.</h6>
        </Card>
      ) : (
        <Card className="shadow-sm feedback-card">
          <Table bordered hover responsive className="mb-0">
            <thead className="table-dark">
              <tr>
                <th>#</th>
                <th>Feedback</th>
                <th>Submitted To</th>
                <th>Submitted On</th>
              </tr>
            </thead>

            <tbody>
              {feedbacks.map((fb, index) => (
                <tr key={fb.id}>
                  <td>{index + 1}</td>
                  <td className="text-start">{fb.content}</td>
                  <td>
                    <Badge bg="info">ADMIN</Badge>
                  </td>
                  <td>{fb.timestamp ? new Date(fb.timestamp).toLocaleString() : "—"}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
      )}

      {/* ---------------- FEEDBACK MODAL ---------------- */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>📝 Submit Feedback</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <Form onSubmit={handleSubmit}>

            <Form.Group className="mb-3">
              <Form.Label>Your Feedback</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                placeholder="Write your feedback..."
                required
              />
            </Form.Group>

            <div className="text-end">
              <Button variant="secondary" className="me-2" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                Submit
              </Button>
            </div>

          </Form>
        </Modal.Body>
      </Modal>
    </div>
  );
}

export default StudentFeedback;
