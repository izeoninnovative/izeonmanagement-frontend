import React, { useEffect, useState } from "react";
import {
  Table,
  Button,
  Form,
  Card,
  Spinner,
  Alert,
  Row,
  Col,
} from "react-bootstrap";
import API from "../../api/api";

function Holidays() {
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState(null);

  const [form, setForm] = useState({
    date: "",
    name: "",
  });

  /* ----------------------------------------------------
      LOAD HOLIDAYS
  ---------------------------------------------------- */
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

  /* ----------------------------------------------------
      ADD HOLIDAY
  ---------------------------------------------------- */
  const submitHoliday = async (e) => {
    e.preventDefault();

    if (!form.date || !form.name) {
      setError("Date & Name are required");
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

  /* ----------------------------------------------------
      DELETE HOLIDAY
  ---------------------------------------------------- */
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
      {/* Responsive styling */}
      <style>{`
        .holiday-form input, .holiday-form button {
          width: 100%;
        }

        @media (min-width: 768px) {
          .holiday-form input {
            width: auto;
          }
        }
      `}</style>

      <h3 className="fw-bold mb-3">Manage Holidays</h3>
      {error && <Alert variant="danger">{error}</Alert>}

      {/* ------------------ ADD HOLIDAY ------------------ */}
      <Card className="p-3 mb-4 shadow-sm">
        <h5 className="mb-3">Add New Holiday</h5>

        <Form onSubmit={submitHoliday}>
          <Row className="gy-3 holiday-form">
            
            <Col md={3}>
              <Form.Label>Date</Form.Label>
              <Form.Control
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </Col>

            <Col md={6}>
              <Form.Label>Holiday Name</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter holiday name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </Col>

            <Col
              md={3}
              className="d-flex align-items-end justify-content-start justify-content-md-end"
            >
              <Button type="submit" disabled={adding} className="w-100 w-md-auto">
                {adding ? <Spinner size="sm" /> : "Add Holiday"}
              </Button>
            </Col>

          </Row>
        </Form>
      </Card>

      {/* ------------------ HOLIDAY LIST ------------------ */}
      <Card className="shadow-sm p-2">
        <div className="table-responsive">
          {loading ? (
            <div className="text-center py-4">
              <Spinner />
            </div>
          ) : (
            <Table bordered hover responsive className="mb-0">
              <thead className="table-dark text-center">
                <tr>
                  <th>Date</th>
                  <th>Name</th>
                  <th>Active</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody className="text-center">
                {holidays.length ? (
                  holidays.map((h) => (
                    <tr key={h.id}>
                      <td>{h.date}</td>
                      <td>{h.name}</td>
                      <td>{h.active ? "✔" : "—"}</td>

                      <td>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => deleteHoliday(h.id)}
                        >
                          Delete
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="text-muted py-3">
                      No holidays found.
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          )}
        </div>
      </Card>
    </div>
  );
}

export default Holidays;
