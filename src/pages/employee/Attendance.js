import React, { useEffect, useState, useCallback } from "react";
import {
  Table,
  Button,
  Spinner,
  Badge,
  Form,
  Alert,
  Tabs,
  Tab,
  Card,
  Row,
  Col,
} from "react-bootstrap";
import API from "../../api/api";
import { useAuth } from "../../context/AuthContext";
import EmployeeCalendarModal from "../../components/EmployeeCalendarModal";

function EmployeeAttendance() {
  const { user } = useAuth();

  const [attendance, setAttendance] = useState([]);
  const [filteredAttendance, setFilteredAttendance] = useState([]);
  const [fixRequests, setFixRequests] = useState([]);

  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);
  const [error, setError] = useState(null);
  const [leaveBalance, setLeaveBalance] = useState(null);

  const [todayRecord, setTodayRecord] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const [ipAllowed, setIpAllowed] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);

  const todayISO = new Date().toISOString().split("T")[0];
  const [fixForm, setFixForm] = useState({ date: todayISO, reason: "" });
  const [fixSubmitting, setFixSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  /* --------------------- FILTER ATTENDANCE --------------------- */
  const filterData = useCallback((data, month, year) => {
    const filtered = (data || []).filter((a) => {
      if (!a?.date) return false;
      const d = new Date(a.date);
      return d.getMonth() + 1 === +month && d.getFullYear() === +year;
    });

    filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
    setFilteredAttendance(filtered);
  }, []);

  /* ------------------------ IP CHECK ------------------------ */
  const checkIpAccess = useCallback(async () => {
    try {
      const res = await API.get("/auth/validate-ip");
      setIpAllowed(res.data === true);
    } catch {
      setIpAllowed(false);
    }
  }, []);

  /* -------------------- FIX REQUESTS -------------------- */
  const loadFixRequests = useCallback(async (empId) => {
    if (!empId) return;
    try {
      const res = await API.get(`/employee/${empId}/attendance/fix`);
      const arr = Array.isArray(res.data) ? res.data : [];
      arr.sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date));
      setFixRequests(arr);
    } catch {
      setFixRequests([]);
    }
  }, []);

  /* -------------------- ATTENDANCE LOAD -------------------- */
  const fetchAttendance = useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);
    setError(null);

    try {
      const res = await API.get(`/employee/${user.id}/attendance`);
      const data = res.data || [];
      setAttendance(data);

      const today = todayISO;
      const todayEntries = data.filter((a) => a.date === today);
      setTodayRecord(todayEntries.length ? todayEntries[todayEntries.length - 1] : null);

      filterData(data, selectedMonth, selectedYear);
    } catch {
      setError("Failed to load attendance records.");
    } finally {
      setLoading(false);
    }
  }, [user?.id, filterData, selectedMonth, selectedYear, todayISO]);

  /* -------------------- LEAVE BALANCE -------------------- */
  const loadLeaveBalance = useCallback(async (empId, month, year) => {
    try {
      const res = await API.get(`/employee/${empId}/leave-balance?month=${month}&year=${year}`);
      setLeaveBalance(res.data);
    } catch (err) {
      console.error("Leave balance load failed", err);
      setLeaveBalance(null);
    }
  }, []);

  /* ----------------------- LOAD ALL ----------------------- */
  useEffect(() => {
    checkIpAccess();
    fetchAttendance();
    loadFixRequests(user?.id);
    loadLeaveBalance(user?.id, selectedMonth, selectedYear);
  }, [
    checkIpAccess,
    fetchAttendance,
    loadFixRequests,
    loadLeaveBalance,
    user?.id,
    selectedMonth,
    selectedYear,
  ]);

  /* ---------------------- MARK ATTENDANCE ---------------------- */
  const markAttendance = async (action) => {
    if (!ipAllowed) return alert("Only office WiFi allowed.");

    setMarking(true);

    const now = new Date().toLocaleTimeString("en-GB");

    let payload = {
      employee: { id: user.id },
      date: todayISO,
      present: true,
    };

    if (todayRecord) payload = { ...payload, ...todayRecord };

    if (action === "MORNING_IN") payload.morningCheckIn = now;
    if (action === "LUNCH_OUT") payload.lunchCheckOut = now;
    if (action === "LUNCH_IN") payload.lunchCheckIn = now;
    if (action === "EVENING_OUT") payload.eveningCheckOut = now;

    try {
      await API.post("/employee/attendance", payload);
      fetchAttendance();
    } catch {
      alert("Failed to update attendance.");
    } finally {
      setMarking(false);
    }
  };
  const handleMonthYearChange = (type, value) => {
  if (type === "month") {
    setSelectedMonth(value);
    filterData(attendance, value, selectedYear);
    loadLeaveBalance(user?.id, value, selectedYear);
  } else {
    setSelectedYear(value);
    filterData(attendance, selectedMonth, value);
    loadLeaveBalance(user?.id, selectedMonth, value);
  }
};
const renderButtons = () => {
  if (!ipAllowed)
    return (
      <Alert variant="danger" className="py-1 px-2">
        Office WiFi required
      </Alert>
    );

  const a = todayRecord;

  if (marking) return <Spinner size="sm" />;

  if (!a?.morningCheckIn)
    return (
      <Button onClick={() => markAttendance("MORNING_IN")} variant="success">
        Morning Check-In
      </Button>
    );

  if (!a.lunchCheckOut)
    return (
      <Button onClick={() => markAttendance("LUNCH_OUT")} variant="warning">
        Lunch Out
      </Button>
    );

  if (!a.lunchCheckIn)
    return (
      <Button onClick={() => markAttendance("LUNCH_IN")} variant="info">
        Lunch In
      </Button>
    );

  if (!a.eveningCheckOut)
    return (
      <Button onClick={() => markAttendance("EVENING_OUT")} variant="danger">
        Evening Out
      </Button>
    );

  return <Badge bg="success">✔ Complete</Badge>;
};


  /* -------------------- FIX REQUEST SUBMIT -------------------- */
  const submitFixRequest = async (e) => {
    e.preventDefault();

    if (!fixForm.reason.trim()) {
      setMessage({ type: "warning", text: "Reason required" });
      return;
    }

    setFixSubmitting(true);
    try {
      await API.post(`/employee/${user.id}/attendance/fix-request`, fixForm);
      setMessage({ type: "success", text: "Fix request submitted." });
      setFixForm({ date: todayISO, reason: "" });
      loadFixRequests(user.id);
    } catch {
      setMessage({ type: "danger", text: "Fix request failed." });
    } finally {
      setFixSubmitting(false);
    }
  };

  /* ---------------------- HOURS CALC ---------------------- */
  const calculateHours = (a) => {
    if (!a.morningCheckIn || !a.eveningCheckOut) return "—";
    try {
      const start = new Date(`1970-01-01T${a.morningCheckIn}`);
      const end = new Date(`1970-01-01T${a.eveningCheckOut}`);
      const diff = (end - start) / 3600000 - 1;
      return diff > 0 ? diff.toFixed(1) + " hrs" : "—";
    } catch {
      return "—";
    }
  };

  /* ---------------------- RENDER LOADING ---------------------- */
  if (loading)
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: "70vh" }}>
        <Spinner animation="border" />
      </div>
    );

  /* ===============================================================
       FINAL RESPONSIVE UI (BOOTSTRAP ONLY)
  ============================================================== */
  return (
    <div className="container-fluid p-2 p-md-3">

      <h3 className="fw-bold mb-3 text-center text-md-start">Employee Attendance</h3>
      {error && <Alert variant="danger">{error}</Alert>}
      {message && <Alert variant={message.type}>{message.text}</Alert>}

      <Tabs defaultActiveKey="attendance" className="mb-3">

        {/* ====================== ATTENDANCE TAB ====================== */}
        <Tab eventKey="attendance" title="Attendance">

          {/* Month + Year Dropdowns */}
          <Row className="gy-3 mb-3">
            <Col xs={12} md="auto">
              <Form.Select
                value={selectedMonth}
                onChange={(e) => handleMonthYearChange("month", e.target.value)}
              >
                {[
                  "January",
                  "February",
                  "March",
                  "April",
                  "May",
                  "June",
                  "July",
                  "August",
                  "September",
                  "October",
                  "November",
                  "December",
                ].map((m, i) => (
                  <option key={i + 1} value={i + 1}>
                    {m}
                  </option>
                ))}
              </Form.Select>
            </Col>

            <Col xs={12} md="auto">
              <Form.Select
                value={selectedYear}
                onChange={(e) => handleMonthYearChange("year", e.target.value)}
              >
                {Array.from({ length: 5 }).map((_, i) => {
                  const y = new Date().getFullYear() - i;
                  return (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  );
                })}
              </Form.Select>
            </Col>

            <Col xs={12} md="auto">
              {renderButtons()}
            </Col>
          </Row>

          {/* Attendance Table */}
          <div className="table-responsive">
            <Table bordered hover>
              <thead className="table-dark text-center">
                <tr>
                  <th>Date</th>
                  <th>Morning</th>
                  <th>Lunch Out</th>
                  <th>Lunch In</th>
                  <th>Evening</th>
                  <th>Hours</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody className="text-center">
                {filteredAttendance.length ? (
                  filteredAttendance.map((a) => {
                    const complete =
                      a.morningCheckIn &&
                      a.lunchCheckOut &&
                      a.lunchCheckIn &&
                      a.eveningCheckOut;

                    return (
                      <tr key={a.id}>
                        <td>{a.date}</td>
                        <td>{a.morningCheckIn || "—"}</td>
                        <td>{a.lunchCheckOut || "—"}</td>
                        <td>{a.lunchCheckIn || "—"}</td>
                        <td>{a.eveningCheckOut || "—"}</td>
                        <td>{calculateHours(a)}</td>
                        <td>
                          <Badge bg={complete ? "success" : "warning"}>
                            {complete ? "Complete" : "In Progress"}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="text-center text-muted py-3">
                      No attendance found
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>
        </Tab>

        {/* ====================== CALENDAR TAB ====================== */}
        <Tab eventKey="calendar" title="Calendar View">
          {leaveBalance && (
            <Card className="p-3 mb-3 shadow-sm">
              <h6 className="fw-bold mb-3">
                Leave Balance — {selectedMonth}/{selectedYear}
              </h6>

              <Row className="gy-2">
                <Col xs={6} md={3}>
                  <strong>Paid Earned:</strong>
                  <br />
                  {leaveBalance.paidEarned}
                </Col>

                <Col xs={6} md={3}>
                  <strong>Paid Used:</strong>
                  <br />
                  {leaveBalance.paidUsed}
                </Col>

                <Col xs={6} md={3}>
                  <strong>Paid Available:</strong>
                  <br />
                  {leaveBalance.paidAvailable}
                </Col>

                <Col xs={6} md={3}>
                  <strong>OD Used:</strong>
                  <br />
                  {leaveBalance.odUsed}
                </Col>
              </Row>

              <hr />

              <Row className="gy-2">
                <Col xs={6} md={3}>
                  <strong>Sick Leave:</strong> {leaveBalance.sickUsed}
                </Col>

                <Col xs={6} md={3}>
                  <strong>Casual Leave:</strong> {leaveBalance.casualUsed}
                </Col>

                <Col xs={6} md={3}>
                  <strong>Paid Leave Days:</strong>
                  <br />
                  {leaveBalance.paidDays?.length ? leaveBalance.paidDays.join(", ") : "—"}
                </Col>

                <Col xs={6} md={3}>
                  <strong>On Duty Days:</strong>
                  <br />
                  {leaveBalance.odDays?.length ? leaveBalance.odDays.join(", ") : "—"}
                </Col>
              </Row>
            </Card>
          )}

          <Button size="sm" onClick={() => setShowCalendarModal(true)}>
            Open Attendance Calendar
          </Button>

          <EmployeeCalendarModal
            employee={{ id: user?.id, name: user?.name }}
            show={showCalendarModal}
            onHide={() => setShowCalendarModal(false)}
          />
        </Tab>

        {/* ====================== FIX REQUESTS TAB ====================== */}
        <Tab eventKey="fix" title="Fix Requests">
          <Card className="p-3 mb-3">
            <Form onSubmit={submitFixRequest}>
              <Row className="gy-3">

                <Col xs={12} md={4}>
                  <Form.Label>Date</Form.Label>
                  <Form.Control
                    type="date"
                    value={fixForm.date}
                    onChange={(e) => setFixForm({ ...fixForm, date: e.target.value })}
                  />
                </Col>

                <Col xs={12} md={6}>
                  <Form.Label>Reason</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Reason for fix"
                    value={fixForm.reason}
                    onChange={(e) => setFixForm({ ...fixForm, reason: e.target.value })}
                  />
                </Col>

                <Col xs={12} md={2} className="d-grid">
                  <Button type="submit" disabled={fixSubmitting}>
                    {fixSubmitting ? <Spinner size="sm" /> : "Submit"}
                  </Button>
                </Col>

              </Row>
            </Form>
          </Card>

          <div className="table-responsive">
            <Table bordered hover>
              <thead className="table-dark text-center">
                <tr>
                  <th>Date</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th>Admin Comment</th>
                  <th>Submitted</th>
                </tr>
              </thead>

              <tbody className="text-center">
                {fixRequests.length ? (
                  fixRequests.map((r) => (
                    <tr key={r.id}>
                      <td>{r.date}</td>
                      <td>{r.reason}</td>
                      <td>
                        <Badge
                          bg={
                            r.status === "APPROVED"
                              ? "success"
                              : r.status === "REJECTED"
                              ? "danger"
                              : "warning"
                          }
                        >
                          {r.status}
                        </Badge>
                      </td>
                      <td>{r.adminComment || "—"}</td>
                      <td>{r.createdAt ? new Date(r.createdAt).toLocaleString() : "—"}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-3 text-muted">
                      No fix requests found
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

export default EmployeeAttendance;
