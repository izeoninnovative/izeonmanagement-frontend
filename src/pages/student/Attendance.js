import { useEffect, useState, useCallback } from "react";
import {
  Table,
  Spinner,
  Alert,
  Badge,
  Form,
  Row,
  Col,
  Button,
} from "react-bootstrap";
import API from "../../api/api";
import { useAuth } from "../../context/AuthContext";

function StudentAttendance() {
  const { user } = useAuth();

  const [attendance, setAttendance] = useState([]);
  const [filtered, setFiltered] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");

  /* -----------------------------------------------
          INTERNAL STYLING (UPDATED WITH FONTS)
  ------------------------------------------------ */
  const styles = `
    @import url('https://fonts.googleapis.com/css2?family=Salsa:wght@400;700&display=swap');
    @import url('https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&display=swap');

    * {
      font-family: 'Instrument Sans', sans-serif !important;
    }

    .title-text {
      font-size: 36px;
      font-weight: 700;
      text-align: center;
      font-family: 'Salsa', cursive !important;
      margin-bottom: 25px;
      color: #000;
    }

    .filter-box {
      border: 2px solid #136CED;
      padding: 25px;
      border-radius: 18px;
      background: #ffffff;
    }

    .filter-label {
      font-weight: 500;
      font-size: 15px;
      margin-bottom: 6px;
    }

    .filter-input {
      background: #F7F7F7;
      border: 1px solid #D8D8D8;
      border-radius: 8px;
      height: 46px;
      padding-left: 12px;
      font-size: 15px;
    }

    .reset-btn {
      background: #4CAF50 !important;
      border: none !important;
      font-size: 16px;
      font-weight: 500;
      padding: 10px 25px;
      border-radius: 8px;
      color: #fff;
    }

    .table-header {
      background: #136CED !important;
      color: #fff !important;
      font-size: 18px;
      font-weight: 500;
      text-align: center;
      border: 1px solid #000 !important;
      font-family: 'Salsa', cursive !important;
    }

    table td {
      vertical-align: middle;
      font-size: 16px;
      padding: 14px;
      border: 1px solid #000 !important;
    }

    .badge-present {
      background: #34C759 !important;
      color: #fff;
      font-size: 14px;
      padding: 6px 12px;
      border-radius: 8px;
    }

    .badge-absent {
      background: #FF383C !important;
      color: #fff;
      font-size: 14px;
      padding: 6px 12px;
      border-radius: 8px;
    }
  `;

  /* ---------------- FETCH ATTENDANCE ---------------- */
  const fetchAttendance = useCallback(async () => {
    try {
      const res = await API.get(`/student/${user.id}/attendance`);
      setAttendance(res.data || []);
      setFiltered(res.data || []);
    } catch {
      setError("Failed to load attendance records");
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  /* ---------------- FILTER LOGIC ---------------- */
  useEffect(() => {
    let data = [...attendance];

    if (selectedMonth) {
      data = data.filter((a) => a.date.startsWith(selectedMonth));
    }

    if (selectedDate && !selectedMonth) {
      data = data.filter((a) => a.date === selectedDate);
    }

    setFiltered(data);
  }, [selectedDate, selectedMonth, attendance]);

  /* ---------------- LOADING UI ---------------- */
  if (loading)
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ height: "60vh" }}
      >
        <Spinner animation="border" variant="primary" />
      </div>
    );

  return (
    <div className="p-3 p-md-4">
      <style>{styles}</style>

      {/* PAGE TITLE */}
      <h2 className="title-text">My Attendance</h2>

      {error && <Alert variant="danger">{error}</Alert>}

      {/* ---------------- FILTER BOX ---------------- */}
      <div className="filter-box mb-4 shadow-sm">
        <Row className="g-3">
          {/* Date Filter */}
          <Col xs={12} md={4}>
            <label className="filter-label">Filter by Date</label>
            <Form.Control
              type="date"
              className="filter-input"
              value={selectedDate}
              onChange={(e) => {
                setSelectedMonth("");
                setSelectedDate(e.target.value);
              }}
            />
          </Col>

          {/* Month Filter */}
          <Col xs={12} md={4}>
            <label className="filter-label">Filter by Month</label>
            <Form.Control
              type="month"
              className="filter-input"
              value={selectedMonth}
              onChange={(e) => {
                setSelectedDate("");
                setSelectedMonth(e.target.value);
              }}
            />
          </Col>

          {/* Reset Button */}
          <Col xs={12} md={4} className="d-flex align-items-end">
            <Button
              className="reset-btn w-100"
              onClick={() => {
                setSelectedDate("");
                setSelectedMonth("");
                setFiltered(attendance);
              }}
            >
              Reset Filter
            </Button>
          </Col>
        </Row>
      </div>

      {/* ---------------- TABLE ---------------- */}
      <Table bordered hover responsive className="shadow-sm">
        <thead>
          <tr>
            <th className="table-header">Date</th>
            <th className="table-header">Status</th>
            <th className="table-header">Tutor</th>
            <th className="table-header">Batch</th>
          </tr>
        </thead>

        <tbody>
          {filtered.length > 0 ? (
            filtered.map((a) => (
              <tr key={a.id}>
                <td className="text-center">{a.date}</td>

                <td className="text-center">
                  <Badge className={a.present ? "badge-present" : "badge-absent"}>
                    {a.present ? "Present" : "Absent"}
                  </Badge>
                </td>

                <td className="text-center">{a.tutorName || "N/A"}</td>

                <td className="text-center">{a.batchName || "—"}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={4} className="text-center text-muted py-3">
                No records match your filters.
              </td>
            </tr>
          )}
        </tbody>
      </Table>
    </div>
  );
}

export default StudentAttendance;
