// src/pages/student/StudentFeedback.jsx
import React, { useEffect, useState, useCallback } from "react";
import { Table, Button, Form, Spinner, Alert, Card } from "react-bootstrap";
import API from "../../api/api";
import { useAuth } from "../../context/AuthContext";

function StudentFeedback() {
  const { user } = useAuth();

  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);

  const [form, setForm] = useState({
    content: "",
    targetRole: "ADMIN",
  });

  /* ==================== INTERNAL CSS ==================== */
  const CSS = `
   
     @import url('https://fonts.googleapis.com/css2?family=Salsa:wght@400;700&display=swap');
    @import url('https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&display=swap');
    * { font-family: 'Instrument Sans', sans-serif !important; }
    .page-title {
      font-size: 40px;
      font-weight: 700;
      text-align: center;
      margin-bottom: 25px;
      font-family: 'Salsa', cursive !important;
    }

    .feedback-box {
      border: 3px solid #136CED;
      border-radius: 18px;
      padding: 30px;
      background: #fff;
      margin-bottom: 40px;
    }

    .feed-flex-box {
      display: flex;
      gap: 20px;
      align-items: stretch;
    }

    .feedback-label {
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 6px;
    }

    .feedback-input {
      background: #F4F4F4;
      padding: 16px;
      border-radius: 12px;
      border: 1.5px solid #DDD;
      font-size: 16px;
      flex-grow: 1;
      resize: none;
      height: 120px;
    }

    .feedback-btn {
      background: #34C759;
      border: none;
      padding: 16px 26px;
      border-radius: 12px;
      font-size: 18px;
      font-weight: 600;
      white-space: nowrap;
      align-self: flex-end;
      height: fit-content;
      margin-top: auto;
    }

    .feedback-btn:hover {
      background: #27b74d;
    }

    /* ---------- TABLE ---------- */
    .att-table th {
      background: #136CED !important;
      color: #fff !important;
      border: 1px solid #000 !important;
      text-align: center;
      padding: 12px;
      font-size: 18px;
      font-family: 'Salsa', cursive !important;
    }

    .att-table td {
      border: 1px solid #000 !important;
      padding: 10px;
      text-align: center;
      font-size: 16px;
    }

    /* ---------- MOBILE FIX ---------- */
    @media (max-width: 768px) {
      .feed-flex-box {
        flex-direction: column;
      }

      .feedback-btn {
        width: 100%;
        margin-top: 10px;
        align-self: unset;
      }

      .feedback-input {
        height: 140px;
      }
    }
  `;

  /* ==================== FETCH FEEDBACK ==================== */
  const fetchFeedbacks = useCallback(async () => {
    try {
      const res = await API.get(`/student/${user.id}/feedback`);

      const sorted = [...res.data].sort(
        (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
      );

      setFeedbacks(sorted);
    } catch {
      setMessage({ type: "danger", text: "Failed to load feedback." });
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  useEffect(() => {
    fetchFeedbacks();
  }, [fetchFeedbacks]);

  /* ==================== SUBMIT FEEDBACK ==================== */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);

    if (!form.content.trim()) {
      return setMessage({
        type: "warning",
        text: "Please enter your feedback.",
      });
    }

    try {
      await API.post(`/student/${user.id}/feedback`, form);

      setMessage({
        type: "success",
        text: "Feedback submitted successfully!",
      });

      setForm({ content: "", targetRole: "ADMIN" });
      fetchFeedbacks();
    } catch {
      setMessage({
        type: "danger",
        text: "Failed to submit feedback.",
      });
    }
  };

  /* ==================== LOADING UI ==================== */
  if (loading)
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ height: "60vh" }}
      >
        <Spinner animation="border" />
      </div>
    );

  /* ==================== PAGE UI ==================== */
  return (
    <div className="p-3 p-md-4">
      <style>{CSS}</style>

      <h2 className="page-title">My Feedback</h2>

      {message && (
        <Alert variant={message.type} className="text-center fw-semibold">
          {message.text}
        </Alert>
      )}

      {/* ---------------- FEEDBACK FORM BOX ---------------- */}
      <div className="feedback-box">
        <Form onSubmit={handleSubmit}>
          <div className="feed-flex-box">

            {/* LEFT: Label + Textarea */}
            <div className="flex-grow-1 d-flex flex-column">
              <Form.Label className="feedback-label">
                Your Feedback
              </Form.Label>

              <Form.Control
                as="textarea"
                rows={3}
                placeholder="Enter your feedback..."
                className="feedback-input"
                value={form.content}
                onChange={(e) =>
                  setForm({ ...form, content: e.target.value })
                }
              />
            </div>

            {/* RIGHT: Submit button (aligned bottom on desktop) */}
            <Button type="submit" className="feedback-btn">
              Submit Feedback
            </Button>
          </div>
        </Form>
      </div>

      {/* ---------------- FEEDBACK TABLE ---------------- */}
      {feedbacks.length === 0 ? (
        <Card className="p-4 text-center shadow-sm">
          <h6 className="text-muted">No feedback submitted yet.</h6>
        </Card>
      ) : (
        <Table bordered responsive className="att-table">
          <thead>
            <tr>
              <th>Feedback</th>
              <th>Submitted To</th>
              <th>Submitted On</th>
            </tr>
          </thead>

          <tbody>
            {feedbacks.map((fb) => (
              <tr key={fb.id}>
                <td className="text-start">{fb.content}</td>
                <td>ADMIN</td>
                <td>
                  {fb.timestamp
                    ? new Date(fb.timestamp).toLocaleString()
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
}

export default StudentFeedback;
