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
  Card,
} from "react-bootstrap";
import API from "../../api/api";
import { useAuth } from "../../context/AuthContext";

function StudentAttendance() {
  const { user } = useAuth();
  const [attendance, setAttendance] = useState([]);
  const [filtered, setFiltered] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const today = new Date().toISOString().split("T")[0];
  const currentMonth = today.slice(0, 7);

  const [selectedDate, setSelectedDate] = useState(today);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);

  const styles = `
    .att-header {
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

    .filter-card {
      border-radius: 16px !important;
    }

    @media(max-width: 576px) {
      .att-header h3 {
        font-size: 1.3rem;
      }
    }
  `;

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

  // Filter Logic
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

      {/* HEADER */}
      <div className="att-header mb-4">
        <h3 className="fw-bold mb-0">My Attendance</h3>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      {/* FILTER CARD */}
      <Card className="shadow-sm p-3 mb-4 filter-card">
        <Row className="g-3">
          <Col xs={12} md={4}>
            <Form.Group>
              <Form.Label><strong>Filter by Date</strong></Form.Label>
              <Form.Control
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  setSelectedMonth("");
                  setSelectedDate(e.target.value);
                }}
              />
            </Form.Group>
          </Col>

          <Col xs={12} md={4}>
            <Form.Group>
              <Form.Label><strong>Filter by Month</strong></Form.Label>
              <Form.Control
                type="month"
                value={selectedMonth}
                onChange={(e) => {
                  setSelectedDate("");
                  setSelectedMonth(e.target.value);
                }}
              />
            </Form.Group>
          </Col>

          <Col xs={12} md={4} className="d-flex align-items-end">
            <Button
              variant="secondary"
              className="w-100"
              onClick={() => {
                setSelectedDate(today);
                setSelectedMonth(currentMonth);
                setFiltered(attendance);
              }}
            >
              Reset Filters
            </Button>
          </Col>
        </Row>
      </Card>

      {/* TABLE */}
      <Card className="shadow-sm border-0">
        <Table bordered hover responsive className="m-0">
          <thead className="table-dark">
            <tr>
              <th>Date</th>
              <th>Status</th>
              <th>Tutor</th>
              <th>Batch</th>
            </tr>
          </thead>

          <tbody>
            {filtered.length > 0 ? (
              filtered.map((a) => (
                <tr key={a.id}>
                  <td>{a.date}</td>
                  <td>
                    <Badge bg={a.present ? "success" : "danger"}>
                      {a.present ? "Present" : "Absent"}
                    </Badge>
                  </td>
                  <td>{a.tutorName || "N/A"}</td>
                  <td>{a.batchName || "—"}</td>
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
      </Card>
    </div>
  );
}

export default StudentAttendance;
