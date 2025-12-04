// src/pages/admin/Holidays.jsx
import React, { useEffect, useState } from "react";
import { Spinner, Alert, Form, Row, Col } from "react-bootstrap";
import API from "../../api/api";

function Holidays() {
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    date: "",
    name: "",
  });

  const loadHolidays = async () => {
    try {
      const res = await API.get("/admin/holidays");
      setHolidays(res.data || []);
    } catch {
      setError("Failed to load holidays");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHolidays();
  }, []);

  const submitHoliday = async (e) => {
    e.preventDefault();
    if (!form.date || !form.name) {
      setError("Date & Holiday Name are required");
      return;
    }
    setAdding(true);
    try {
      await API.post("/admin/holiday", {
        date: form.date,
        name: form.name,
        active: true,
      });
      setForm({ date: "", name: "" });
      loadHolidays();
    } catch {
      setError("Failed to add holiday");
    } finally {
      setAdding(false);
    }
  };

  const deleteHoliday = async (id) => {
    if (!window.confirm("Delete this holiday?")) return;
    try {
      await API.delete(`/admin/holiday/${id}`);
      loadHolidays();
    } catch {
      alert("Delete failed");
    }
  };

  return (
    <div className="p-3">

      {/* ================== CSS ================== */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Salsa&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&display=swap');

        * {
          font-family: 'Instrument Sans', sans-serif !important;
        }

        .page-title {
          font-family: 'Salsa', cursive !important;
          font-size: 42px;
          font-weight: 700;
          text-align: center;
          margin-bottom: 30px;
        }

        .holiday-box {
          border: 2px solid #2D68FE;
          border-radius: 20px;
          padding: 30px;
          margin-bottom: 40px;
        }

        .holiday-heading {
          font-family: 'Salsa', cursive !important;
          font-size: 28px;
          font-weight: 700;
          text-align: center;
          margin-bottom: 25px;
        }

        .holiday-label {
          font-weight: 600;
          margin-bottom: 6px;
          font-size: 16px;
          font-family: 'Salsa', cursive !important;
        }

        .add-btn {
          background: #34C759;
          color: white;
          font-weight: 600;
          border: none;
          padding: 12px 22px;
          border-radius: 10px;
          width: 100%;
          cursor: pointer;
          font-family: 'Salsa', cursive !important;
        }

        .delete-btn {
          background: #FF383C;
          color: white;
          padding: 6px 14px;
          border-radius: 8px;
          border: none;
          font-weight: 600;
          cursor: pointer;
        }

        .holiday-table-container {
          border: 2px solid #000;
          overflow: hidden;
          margin-top: 20px;
        }

        table.holiday-table {
          width: 100%;
          border-collapse: collapse;
        }

        table.holiday-table thead th {
          background: #2D68FE;
          color: white;
          padding: 14px;
          font-size: 18px;
          font-weight: 700;
          border: 1px solid #000;
          text-align: center;
          font-family: 'Salsa', cursive !important;
        }

        table.holiday-table tbody td {
          padding: 14px;
          border: 1px solid #000;
          text-align: center;
          font-size: 16px;
        }
      `}</style>

      {/* ================== TITLE ================== */}
      <h1 className="page-title">Manager Holidays</h1>

      {error && <Alert variant="danger">{error}</Alert>}

      {/* ================== ADD HOLIDAY ================== */}
      <div className="holiday-box">
        <h2 className="holiday-heading">Add New Holiday</h2>

        <Form onSubmit={submitHoliday}>
          <Row className="gy-4">

            <Col md={4}>
              <div className="holiday-label">Date</div>
              <Form.Control
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </Col>

            <Col md={5}>
              <div className="holiday-label">Holiday Name</div>
              <Form.Control
                type="text"
                placeholder="Enter Holiday Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </Col>

            <Col md={3} className="d-flex align-items-end">
              <button className="add-btn" type="submit" disabled={adding}>
                {adding ? "Adding..." : "Add Holiday"}
              </button>
            </Col>

          </Row>
        </Form>
      </div>

      {/* ================== HOLIDAYS TABLE ================== */}
      <div className="holiday-table-container">
        {loading ? (
          <div className="text-center py-4"><Spinner /></div>
        ) : (
          <table className="holiday-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Name</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {holidays.length ? (
                holidays.map((h) => (
                  <tr key={h.id}>
                    <td>{h.date}</td>
                    <td>{h.name}</td>
                    <td>
                      <button className="delete-btn" onClick={() => deleteHoliday(h.id)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="text-muted py-3">
                    No holidays found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

    </div>
  );
}

export default Holidays;
