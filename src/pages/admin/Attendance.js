// Attendance.jsx
import { useEffect, useState } from "react";
import { Table, Spinner, Alert, Badge, Form, Tabs, Tab, Button } from "react-bootstrap";
import API from "../../api/api";
import EmployeeCalendarModal from "../../components/EmployeeCalendarModal";

function Attendance() {
  const [attendance, setAttendance] = useState({ employees: [], students: [] });
  const [fixRequests, setFixRequests] = useState([]);

  const [loading, setLoading] = useState(true);

  const [fixError, setFixError] = useState(null);

  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);

  // calendar modal
  const [calendarEmployee, setCalendarEmployee] = useState(null);

  /* --------------------------------------------
     LOAD DAILY ATTENDANCE
  -------------------------------------------- */
  const fetchAttendance = async (date) => {
    try {
      const res = await API.get(`/admin/attendance/date/${date}`);
      const all = Array.isArray(res.data) ? res.data : [];

      setAttendance({
        employees: all.filter((a) => a.employeeId),
        students: all.filter((a) => a.studentId),
      });

    } catch (err) {
      console.error("Error fetching attendance:", err);
     
    } finally {
      setLoading(false);
    }
  };

  /* --------------------------------------------
     FETCH FIX REQUESTS
  -------------------------------------------- */
  const fetchFixRequests = async () => {
    try {
  
      const res = await API.get("/admin/attendance-fix");
      setFixRequests(res.data || []);
    } catch (err) {
      console.error("Fix request load error:", err);
      setFixError("Failed to load fix requests");
    } 
  };

  /* --------------------------------------------
     APPROVE / REJECT FIX REQUEST
  -------------------------------------------- */
  const handleFixAction = async (id, action) => {
    try {
      await API.put(`/admin/attendance-fix/${id}/${action}`);
      fetchFixRequests();
    } catch (err) {
      alert("Failed: " + err?.response?.data?.message);
    }
  };

  /* --------------------------------------------
     LIFECYCLE
  -------------------------------------------- */
  useEffect(() => {
    fetchAttendance(selectedDate);
    fetchFixRequests();
  }, [selectedDate]);

  /* --------------------------------------------
     CALCULATE HOURS
  -------------------------------------------- */
  const calculateHours = (a) => {
    if (!a.morningCheckIn || !a.eveningCheckOut) return "—";
    try {
      const inTime = new Date(`1970-01-01T${a.morningCheckIn}`);
      const outTime = new Date(`1970-01-01T${a.eveningCheckOut}`);
      const diff = (outTime - inTime) / 3600000 - 1; // minus 1 hr break
      return diff > 0 ? `${diff.toFixed(1)} hrs` : "—";
    } catch {
      return "—";
    }
  };

  /* --------------------------------------------
     RENDER
  -------------------------------------------- */
  if (loading)
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: "60vh" }}>
        <Spinner animation="border" />
      </div>
    );

  return (
    
    <div className="p-3">
    <style>{`
  /* ------------------------------------------
      GLOBAL TABLE RESPONSIVENESS
  ------------------------------------------ */
  @media (max-width: 768px) {
    .table-responsive {
      overflow-x: auto !important;
      -webkit-overflow-scrolling: touch;
    }

    table th, table td {
      white-space: nowrap !important;
      font-size: 13px;
      padding: 6px;
    }
  }

  /* ------------------------------------------
      FILTERS + HEADER RESPONSIVE
  ------------------------------------------ */
  @media (max-width: 768px) {
    .attendance-header,
    .attendance-filters {
      flex-direction: column !important;
      gap: 10px;
    }

    .attendance-header input[type="date"] {
      width: 100% !important;
    }
  }

  /* ------------------------------------------
      INNER TABS RESPONSIVE
  ------------------------------------------ */
  @media (max-width: 576px) {
    .nav-tabs .nav-link {
      padding: 6px 8px;
      font-size: 13px;
    }
  }

  /* ------------------------------------------
      FIX REQUEST TABLE
  ------------------------------------------ */
  @media (max-width: 576px) {
    td, th {
      font-size: 12px !important;
    }

    button.btn {
      padding: 4px 8px !important;
      font-size: 12px !important;
    }
  }

  /* ------------------------------------------
      MOBILE — STACKED LAYOUT
  ------------------------------------------ */
  @media (max-width: 480px) {
    h3 {
      font-size: 18px !important;
      text-align: center;
    }

    .btn-sm {
      font-size: 12px;
      padding: 3px 6px;
    }

    .attendance-filters {
      flex-direction: column !important;
      align-items: stretch !important;
      gap: 10px;
    }
  }
`}</style>

      <div className="d-flex flex-column flex-md-row justify-content-between mb-3">
        <h3 className="fw-bold">Attendance (Admin)</h3>

        <Form.Control
          type="date"
          style={{ width: "200px" }}
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
        />
      </div>

      <Tabs defaultActiveKey="employees" className="mb-4" fill>
        
        {/* ============================================================
              EMPLOYEES TAB
        ============================================================ */}
        <Tab eventKey="employees" title="Employees">
          <Tabs defaultActiveKey="attendance" className="mb-3">
            
            {/* ================= 1️⃣ EMPLOYEE ATTENDANCE TABLE ================= */}
            <Tab eventKey="attendance" title="Attendance">
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
                      <th>Calendar</th>
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
                          <td>{calculateHours(a)}</td>

                          <td>
                            <Badge bg={a.eveningCheckOut ? "success" : "warning"}>
                              {a.eveningCheckOut ? "Complete" : "In Progress"}
                            </Badge>
                          </td>

                          <td>
                            <Button
                              size="sm"
                              variant="info"
                              onClick={() =>
                                setCalendarEmployee({
                                  id: a.employeeId,
                                  name: a.employeeName,
                                })
                              }
                            >
                              View
                            </Button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={9} className="text-center text-muted py-3">
                          No employee attendance found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </div>
            </Tab>

            {/* ================= 2️⃣ FIX REQUESTS TAB ================= */}
            <Tab eventKey="fix" title="Fix Requests">
              {fixError && <Alert variant="danger">{fixError}</Alert>}

              <div className="table-responsive">
                <Table bordered hover className="shadow-sm">
                  <thead className="table-secondary">
                    <tr>
                      <th>ID</th>
                      <th>Employee</th>
                      <th>Date</th>
                      <th>Reason</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {fixRequests.length > 0 ? (
                      fixRequests.map((req) => (
                        <tr key={req.id}>
                          <td>{req.id}</td>
                          <td>{req.employeeName}</td>
                          <td>{req.date}</td>
                          <td>{req.reason}</td>
                          <td>
                            <Badge
                              bg={
                                req.status === "APPROVED"
                                  ? "success"
                                  : req.status === "REJECTED"
                                  ? "danger"
                                  : "warning"
                              }
                            >
                              {req.status}
                            </Badge>
                          </td>

                          <td>
                            <Button
                              size="sm"
                              variant="success"
                              className="me-2"
                              disabled={req.status !== "PENDING"}
                              onClick={() => handleFixAction(req.id, "approve")}
                            >
                              Approve
                            </Button>

                            <Button
                              size="sm"
                              variant="danger"
                              disabled={req.status !== "PENDING"}
                              onClick={() => handleFixAction(req.id, "reject")}
                            >
                              Reject
                            </Button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="text-center text-muted py-3">
                          No fix requests found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </div>
            </Tab>

          </Tabs>
        </Tab>

        {/* ============================================================
              STUDENTS TAB
        ============================================================ */}
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

      {/* ==================== CALENDAR MODAL ==================== */}
      {calendarEmployee && (
        <EmployeeCalendarModal
          employee={calendarEmployee}
          show={true}
          onHide={() => setCalendarEmployee(null)}
        />
      )}
    </div>
  );
}

export default Attendance;
