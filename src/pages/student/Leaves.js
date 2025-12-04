// src/pages/student/StudentLeaves.jsx
import React, { useEffect, useState, useCallback } from "react";
import { Form, Button, Table, Spinner, Alert } from "react-bootstrap";
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

  /* -------------------------------- CSS -------------------------------- */
  const CSS = `
    @import url('https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&display=swap');
  @import url('https://fonts.googleapis.com/css2?family=Salsa:wght@400;700&display=swap');
    * { font-family: "Instrument Sans", sans-serif !important; }

    .page-title {
      font-size: 38px;
      font-weight: 700;
      text-align: center;
      margin-bottom: 30px;
      color: #000;
      font-family: 'Salsa', cursive !important;
    }

    .form-box {
      border: 2px solid #136CED;
      border-radius: 18px;
      padding: 25px;
      background: #fff;
      margin-bottom: 35px;
    }

    /* MAIN FLEX ROW */
    .leave-flex {
      display: flex;
      gap: 22px;
      align-items:center;
      flex-wrap: wrap;
    }

    /* BOX 1: FROM + TO */
    .leave-box-1 {
      flex: 1;
      min-width: 220px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    /* BOX 2: REASON */
    .leave-box-2 {
      flex: 1.2;
      min-width: 260px;
      display: flex;
      flex-direction: column;
    }

    /* BOX 3: SUBMIT */
    .leave-box-3 {
      width: 180px;
      min-width: 180px;
     
    }

    .form-label {
      font-weight: 600;
      margin-bottom: 6px;
      font-size: 16px;
    }

    .submit-btn {
      background: #34C759;
      border: none;
      font-weight: 600;
      padding: 12px 28px;
      font-size: 18px;
      border-radius: 12px;
      width: 100%;
    }

    .att-table th {
      background: #136CED !important;
      color: #fff !important;
      border: 1px solid #000 !important;
      text-align: center;
      font-size: 17px;
      padding: 12px;
      font-family: 'Salsa', cursive !important;

    }

    .att-table td {
      border: 1px solid #000 !important;
      text-align: center;
      padding: 10px;
      font-size: 16px;
    }

    .badge-approved {
      background:#34C759; color:#fff; padding:6px 14px; border-radius:8px; font-weight:600;
    }
    .badge-rejected {
      background:#FF383C; color:#fff; padding:6px 14px; border-radius:8px; font-weight:600;
    }
    .badge-pending {
      background:#FFD43B; color:#000; padding:6px 14px; border-radius:8px; font-weight:600;
    }

    /* MOBILE */
    @media (max-width: 768px) {
      .leave-box-3 { width: 100%; min-width: 100%; }
      .leave-box-2{width:100%;min-width:100%;}
    }
  `;

  /* ---------------------- FETCH LEAVES ---------------------- */
  const fetchLeaves = useCallback(async () => {
    try {
      const res = await API.get(`/student/${user.id}/leaves`);
      const sorted = [...res.data].sort(
        (a, b) => new Date(b.fromDate) - new Date(a.fromDate)
      );
      setLeaves(sorted);
    } catch {
      setLeaves([]);
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  useEffect(() => {
    fetchLeaves();
  }, [fetchLeaves]);

  /* ---------------------- VALIDATION ---------------------- */
const validateForm = () => {
  if (!form.fromDate || !form.toDate || !form.reason) {
    setMessage({ type: "warning", text: "Please fill all fields." });
    return false;
  }

  if (form.toDate < form.fromDate) {
    setMessage({ type: "warning", text: "'To Date' cannot be earlier." });
    return false;
  }

  if (form.fromDate < today) {
    setMessage({ type: "warning", text: "Leave cannot start in past." });
    return false;
  }

  return true;
};

  /* ---------------------- SUBMIT ---------------------- */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);

    if (!validateForm()) return;

    try {
      await API.post(`/student/${user.id}/leave`, form);
      setMessage({ type: "success", text: "Leave submitted successfully!" });
      setForm({ fromDate: "", toDate: "", reason: "" });
      fetchLeaves();
    } catch {
      setMessage({ type: "danger", text: "Failed to submit. Try again." });
    }
  };

  /* ---------------------- UI ---------------------- */
  return (
    <div className="p-3 p-md-4">
      <style>{CSS}</style>

      <h2 className="page-title">Leave Application</h2>

      {message && (
        <Alert variant={message.type} className="text-center fw-semibold">
          {message.text}
        </Alert>
      )}

      {/* ---------------------- FORM ---------------------- */}
      <div className="form-box">
        <Form onSubmit={handleSubmit}>
          <div className="leave-flex">

            {/* BOX 1 */}
            <div className="leave-box-1">
              <div>
                <label className="form-label">From</label>
                <Form.Control
                  type="date"
                  min={today}
                  value={form.fromDate}
                  onChange={(e) => setForm({ ...form, fromDate: e.target.value })}
                />
              </div>

              <div>
                <label className="form-label">To</label>
                <Form.Control
                  type="date"
                  min={form.fromDate || today}
                  value={form.toDate}
                  onChange={(e) => setForm({ ...form, toDate: e.target.value })}
                />
              </div>
            </div>

            {/* BOX 2 */}
            <div className="leave-box-2">
              <label className="form-label">Reason</label>
              <Form.Control
                as="textarea"
                rows={3}
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
              />
            </div>

            {/* BOX 3 */}
            <div className="leave-box-3">
              <Button type="submit" className="submit-btn">
                Submit-Leave
              </Button>
            </div>

          </div>
        </Form>
      </div>

      {/* ---------------------- LEAVES TABLE ---------------------- */}
      <h2 className="page-title mt-4">Your Leaves</h2>

      {loading ? (
        <div className="text-center mt-4">
          <Spinner animation="border" />
        </div>
      ) : leaves.length === 0 ? (
        <p className="text-center text-muted">No leaves submitted yet.</p>
      ) : (
        <Table bordered responsive className="att-table">
          <thead>
            <tr>
              <th>From</th>
              <th>To</th>
              <th>Reason</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            {leaves.map((l) => (
              <tr key={l.id}>
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
        </Table>
      )}
    </div>
  );
}

export default StudentLeaves;
