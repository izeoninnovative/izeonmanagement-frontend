// src/pages/employee/EmployeeLeaves.jsx
import { useEffect, useState, useCallback } from "react";
import {  Form, Button, Spinner, Alert } from "react-bootstrap";
import API from "../../api/api";
import { useAuth } from "../../context/AuthContext";

function EmployeeLeaves() {
  const { user } = useAuth();
  const today = new Date().toISOString().split("T")[0];

  const [loading, setLoading] = useState(true);
  const [leaves, setLeaves] = useState([]);
  const [message, setMessage] = useState(null);

  const [form, setForm] = useState({
    type: "SICK",
    fromDate: "",
    toDate: "",
    reason: "",
  });

  /* ------------------------ STYLES (match image) ------------------------ */
   const styles = `
    @import url('https://fonts.googleapis.com/css2?family=Salsa&display=swap');
    @import url('https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&display=swap');

    .employee-leaves-page,
    .employee-leaves-page * {
      font-family: 'Instrument Sans', sans-serif;
    }

    /* PAGE TITLE */
    .leave-page-title {
      font-family: 'Salsa', cursive;
      font-size: 40px;
      font-weight: 700;
      text-align: center;
      margin-bottom: 28px;
    }

    /* BIG FORM BOX */
    .leave-form-wrapper {
      border: 3px solid #136CED;
      border-radius: 18px;
      padding: 26px 28px;
      background: #ffffff;
      margin-bottom: 36px;
    }

    /* GRID LAYOUT */
    .leave-form-grid {
      display: grid;
      grid-template-columns: 1.3fr 1.7fr auto;
      column-gap: 32px;
      row-gap: 20px;
      align-items: stretch;
    }

    @media (max-width: 768px) {
      .leave-form-grid {
        grid-template-columns: 1fr;
      }
    }

    /* LABELS */
    .leave-label {
      font-weight: 600;
      font-size: 16px;
      margin-bottom: 6px;
    }

    /* INPUTS */
    .leave-input,
    .leave-select,
    .leave-textarea {
      background: #F4F4F4;
      border-radius: 10px;
      border: none;
      font-size: 15px;
      padding: 10px 12px;
      width: 100%;
    }

    .leave-input,
    .leave-select {
      height: 44px;
    }

    .leave-textarea {
      resize: none;
      height: 80px;
    }

    /* SUBMIT BUTTON COL */
    .leave-submit-col {
      display: flex;
      justify-content: center;
      align-items: center;
    }

    .leave-submit-btn {
      background: #34C759;
      border: none;
      padding: 14px 32px;
      font-size: 18px;
      font-weight: 700;
      border-radius: 12px;
      min-width: 190px;
    }

    /* YOUR LEAVES TITLE */
    .your-leaves-title {
      font-size: 36px;
      font-family: 'Salsa', cursive;
      font-weight: 700;
      text-align: center;
      margin: 28px 0 18px;
    }

    /* TABLE WRAPPER (scroll enabled) */
    .employee-leaves-table-wrapper {
      width: 100%;
      overflow-x: auto;
      border: 2px solid #000;
      border-radius: 14px;
      background: #ffffff;
    }

    .employee-leaves-table {
      min-width: 720px;
      width: 100%;
      border-collapse: collapse;
    }

    /* TABLE HEAD */
    .employee-leaves-table thead th {
      background: #136CED;
      color: #ffffff;
      padding: 12px;
      font-size: 16px;
      font-weight: 600;
      text-align: center;
      border: 1px solid #000;
      white-space: nowrap;
    }

    /* TABLE BODY */
    .employee-leaves-table tbody td {
      padding: 12px;
      font-size: 15px;
      text-align: center;
      border: 1px solid #000;
      vertical-align: middle;
    }

    /* STATUS BADGES */
    .badge-approved {
      background: #34C759;
      color: white;
      padding: 6px 16px;
      border-radius: 8px;
      font-weight: 600;
      display: inline-block;
    }

    .badge-pending {
      background: #FFD43B;
      color: black;
      padding: 6px 16px;
      border-radius: 8px;
      font-weight: 600;
      display: inline-block;
    }

    .badge-rejected {
      background: #FF383C;
      color: white;
      padding: 6px 16px;
      border-radius: 8px;
      font-weight: 600;
      display: inline-block;
    }
  `;

  /* ------------------------ FETCH LEAVES ------------------------ */
  const fetchLeaves = useCallback(async () => {
    try {
      const res = await API.get(`/employee/${user.id}/leaves`);

      // Sort newest first by fromDate (DESC)
      const sorted = (res.data || []).sort(
        (a, b) => new Date(b.fromDate) - new Date(a.fromDate)
      );
      setLeaves(sorted);
    } catch {
      setMessage({ type: "danger", text: "❌ Failed to fetch leave records" });
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  useEffect(() => {
    fetchLeaves();
  }, [fetchLeaves]);

  /* ------------------------ VALIDATION ------------------------ */
  const validate = () => {
    const { type, fromDate, toDate, reason } = form;

    if (!fromDate || !toDate) {
      setMessage({ type: "warning", text: "⚠ Select From & To dates" });
      return false;
    }

    if (toDate < fromDate) {
      setMessage({
        type: "warning",
        text: "🚫 'To Date' cannot be earlier than 'From Date'",
      });
      return false;
    }

    // Paid Leave requires 7 days notice
    if (type === "PAY") {
      const diff =
        (new Date(fromDate) - new Date(today)) / (1000 * 3600 * 24);
      if (diff < 7) {
        setMessage({
          type: "warning",
          text: "💼 Paid leave must be applied at least 7 days earlier",
        });
        return false;
      }
    }

    // Sick Leave cannot start in the past
    if (type === "SICK" && fromDate < today) {
      setMessage({
        type: "warning",
        text: "🩺 Sick leave cannot start in the past",
      });
      return false;
    }

    if (!reason.trim()) {
      setMessage({ type: "warning", text: "✏️ Reason is required" });
      return false;
    }

    return true;
  };

  /* ------------------------ SUBMIT LEAVE ------------------------ */
  const submitLeave = async (e) => {
    e.preventDefault();
    setMessage(null);

    if (!validate()) return;

    try {
      await API.post(`/employee/${user.id}/leave`, form);
      setMessage({ type: "success", text: "✅ Leave request submitted" });
      setForm({ type: "SICK", fromDate: "", toDate: "", reason: "" });
      fetchLeaves();
    } catch {
      setMessage({ type: "danger", text: "❌ Failed to submit leave" });
    }
  };

  return (
    <div className="container py-3">
      <style>{styles}</style>

      {/* PAGE TITLE */}
      <h2 className="leave-page-title">Leave Application</h2>

      {message && (
        <Alert variant={message.type} className="text-center">
          {message.text}
        </Alert>
      )}

      {/* -------------------- LEAVE APPLICATION FORM (exact layout) -------------------- */}
      <div className="leave-form-wrapper shadow-sm">
        <Form onSubmit={submitLeave}>
          <div className="leave-form-grid">
            {/* LEFT COLUMN: From / To */}
            <div>
              <Form.Group className="mb-3">
                <Form.Label className="leave-label">From</Form.Label>
                <Form.Control
                  type="date"
                  className="leave-input"
                  value={form.fromDate}
                  min={today}
                  onChange={(e) =>
                    setForm({ ...form, fromDate: e.target.value })
                  }
                />
              </Form.Group>

              <Form.Group className="mb-1">
                <Form.Label className="leave-label">To</Form.Label>
                <Form.Control
                  type="date"
                  className="leave-input"
                  value={form.toDate}
                  min={form.fromDate || today}
                  onChange={(e) =>
                    setForm({ ...form, toDate: e.target.value })
                  }
                />
              </Form.Group>
            </div>

            {/* MIDDLE COLUMN: Leave Type / Reason */}
            <div>
              <Form.Group className="mb-3">
                <Form.Label className="leave-label">Leave Type</Form.Label>
                <Form.Select
                  className="leave-select"
                  value={form.type}
                  onChange={(e) =>
                    setForm({ ...form, type: e.target.value })
                  }
                >
                  <option value="SICK">Sick Leave</option>
                  <option value="CASUAL">Casual Leave</option>
                  <option value="PAY">Paid Leave</option>
                  <option value="OD">On Duty</option>
                </Form.Select>
              </Form.Group>

              <Form.Group>
                <Form.Label className="leave-label">Reason</Form.Label>
                <Form.Control
                  as="textarea"
                  className="leave-textarea"
                  value={form.reason}
                  onChange={(e) =>
                    setForm({ ...form, reason: e.target.value })
                  }
                />
              </Form.Group>
            </div>

            {/* RIGHT COLUMN: Submit-Leave button */}
            <div className="leave-submit-col">
              <Button type="submit" className="leave-submit-btn">
                Submit-Leave
              </Button>
            </div>
          </div>
        </Form>
      </div>

      
      {/* -------------------- LEAVES TABLE -------------------- */}
<h2 className="your-leaves-title">Your Leaves</h2>

{loading ? (
  <div className="text-center mt-4">
    <Spinner animation="border" />
  </div>
) : leaves.length === 0 ? (
  <p className="text-center text-muted">No leave requests yet.</p>
) : (
  <div className="employee-leaves-table-wrapper">
    <table className="employee-leaves-table">
      <thead>
        <tr>
          <th>Type</th>
          <th>From</th>
          <th>To</th>
          <th>Reason</th>
          <th>Status</th>
        </tr>
      </thead>

      <tbody>
        {leaves.map((l) => (
          <tr key={l.id}>
            <td>{l.type}</td>
            <td>{l.fromDate}</td>
            <td>{l.toDate}</td>
            <td>{l.reason}</td>
            <td>
              <span
                className={
                  l.status === "APPROVED"
                    ? "badge-approved"
                    : l.status === "REJECTED"
                    ? "badge-rejected"
                    : "badge-pending"
                }
              >
                {l.status}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
)}

    </div>
  );
}

export default EmployeeLeaves;
