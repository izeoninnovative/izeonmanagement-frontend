import { useEffect, useState } from "react";
import { Table, Spinner, Alert, Badge, Form, Tabs, Tab } from "react-bootstrap";
import API from "../../api/api";

function Attendance() {
  const [attendance, setAttendance] = useState({
    employees: [],
    students: [],
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  // Fetch attendance by date
  const fetchAttendance = async (date) => {
    try {
      const res = await API.get(`/admin/attendance/date/${date}`);

      const all = Array.isArray(res.data) ? res.data : [];

      const employees = all.filter((a) => a.employeeId);
      const students = all.filter((a) => a.studentId);

      setAttendance({ employees, students });
    } catch (err) {
      console.error("Error fetching attendance:", err);
      setError("Failed to load attendance");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance(selectedDate);
  }, [selectedDate]);

  // Total Hours Calculation
  const calculateTotalHours = (a) => {
    if (!a.morningCheckIn || !a.eveningCheckOut) return "—";

    try {
      const inTime = new Date(`1970-01-01T${a.morningCheckIn}`);
      const outTime = new Date(`1970-01-01T${a.eveningCheckOut}`);
      const diffMs = outTime - inTime;
      const diffHrs = diffMs / (1000 * 60 * 60) - 1;
      return diffHrs > 0 ? `${diffHrs.toFixed(1)} hrs` : "—";
    } catch {
      return "—";
    }
  };

  if (loading)
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: "60vh" }}>
        <Spinner animation="border" variant="primary" />
      </div>
    );

  return (
    <div className="p-3">

      {/* Page Header + Date Filter */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-3">
        <h3 className="fw-bold mb-2 mb-md-0">Attendance (Admin)</h3>

        <Form.Control
          type="date"
          style={{ width: "200px" }}
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
        />
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      {/*Tabs*/}
      <Tabs defaultActiveKey="employees" className="mb-3" fill>
        
        {/* -------------------- EMPLOYEE TAB -------------------- */}
        <Tab eventKey="employees" title="Employees">
          <div className="table-responsive">
            <Table bordered hover className="shadow-sm">
              <thead className="table-dark">
                <tr>
                  <th>Date</th>
                  <th>Name</th>
                  <th>Morning In</th>
                  <th>Lunch Out</th>
                  <th>Lunch In</th>
                  <th>Evening Out</th>
                  <th>Total Hours</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {attendance.employees.length > 0 ? (
                  attendance.employees.map((a) => (
                    <tr key={a.id}>
                      <td>{a.date}</td>
                      <td>{a.employeeName}</td>
                      <td>{a.morningCheckIn || "—"}</td>
                      <td>{a.lunchCheckOut || "—"}</td>
                      <td>{a.lunchCheckIn || "—"}</td>
                      <td>{a.eveningCheckOut || "—"}</td>
                      <td>{calculateTotalHours(a)}</td>
                      <td>
                        <Badge bg={a.eveningCheckOut ? "success" : "warning"}>
                          {a.eveningCheckOut ? "Complete" : "In Progress"}
                        </Badge>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="text-center text-muted py-3">
                      No employee attendance found.
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>
        </Tab>

        {/* -------------------- STUDENT TAB -------------------- */}
        <Tab eventKey="students" title="Students">
          <div className="table-responsive">
            <Table bordered hover className="shadow-sm">
              <thead className="table-dark">
                <tr>
                  <th>Date</th>
                  <th>Name</th>
                  <th>Batch</th>
                  <th>Tutor</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {attendance.students.length > 0 ? (
                  attendance.students.map((s) => (
                    <tr key={s.id}>
                      <td>{s.date}</td>
                      <td>{s.studentName}</td>
                      <td>{s.batchName || "—"}</td>
                      <td>{s.tutorName || "—"}</td>
                      <td>
                        <Badge bg={s.present ? "success" : "danger"}>
                          {s.present ? "Present" : "Absent"}
                        </Badge>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="text-center text-muted py-3">
                      No student attendance found.
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>
        </Tab>

      </Tabs>
    </div>
  );
}

export default Attendance;
