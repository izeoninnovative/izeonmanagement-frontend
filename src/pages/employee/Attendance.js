// src/pages/employee/EmployeeAttendance.jsx
import React, { useEffect, useState, useCallback } from "react";
import {
  Table,
  Button,
  Spinner,
  Badge,
  Form,
  Row,
  Col,
  Alert
} from "react-bootstrap";
import API from "../../api/api";
import { useAuth } from "../../context/AuthContext";
import EmployeeCalendarModal from "../../components/EmployeeCalendarModal";

function EmployeeAttendance() {
  const { user } = useAuth();

  /* ====================== STATE ====================== */
  const [attendance, setAttendance] = useState([]);
  const [filteredAttendance, setFilteredAttendance] = useState([]);
  const [todayRecord, setTodayRecord] = useState(null);

  const [ipAllowed, setIpAllowed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("attendance");

  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    return `${d.getFullYear()}-${m}`;
  });

  const [calendarModal, setCalendarModal] = useState(false);
  const [fixRequests, setFixRequests] = useState([]);
  const [fixSubmitting, setFixSubmitting] = useState(false);
  const [fixForm, setFixForm] = useState({
    date: new Date().toISOString().split("T")[0],
    reason: "",
  });

  const [leaveBalance, setLeaveBalance] = useState(null);

  const todayISO = new Date().toISOString().split("T")[0];

  /* ================= NORMALIZE ================= */
  const normalize = (r) => ({
    id: r.id,
    date: r.date,
    morningCheckIn: r.morningCheckIn,
    lunchCheckOut: r.lunchCheckOut,
    lunchCheckIn: r.lunchCheckIn,
    eveningCheckOut: r.eveningCheckOut,
  });

  /* =============== FILTER BY MONTH (YYYY-MM) =============== */
  const filterByMonth = useCallback((data, monthStr) => {
    if (!monthStr) {
      setFilteredAttendance(data || []);
      return;
    }

    const filtered = (data || [])
      .filter((a) => a.date && a.date.startsWith(monthStr))
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    setFilteredAttendance(filtered);
  }, []);

  /* ================= IP CHECK ================= */
  const checkIpAccess = useCallback(async () => {
    try {
      const res = await API.get("/auth/validate-ip");
      setIpAllowed(res.data === true);
    } catch {
      setIpAllowed(false);
    }
  }, []);

  /* =============== LOAD ATTENDANCE =============== */
  const fetchAttendance = useCallback(async () => {
    try {
      const res = await API.get(`/employee/${user.id}/attendance`);
      const arr = (res.data || []).map(normalize);

      setAttendance(arr);

      const today = arr.find((a) => a.date === todayISO) || null;
      setTodayRecord(today);
    } catch {
      setAttendance([]);
    } finally {
      setLoading(false);
    }
  }, [user.id, todayISO]);

  /* =============== LOAD FIX REQUESTS =============== */
  const loadFixRequests = useCallback(async () => {
    try {
      const res = await API.get(`/employee/${user.id}/attendance/fix`);
      const list = Array.isArray(res.data) ? res.data : [];
      setFixRequests(
        list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      );
    } catch {
      setFixRequests([]);
    }
  }, [user.id]);

  /* =============== LOAD LEAVE BALANCE =============== */
  const loadLeaveBalance = useCallback(
    async (monthStr) => {
      try {
        if (!monthStr) {
          setLeaveBalance(null);
          return;
        }

        const [yearStr, monthNumStr] = monthStr.split("-");
        const year = Number(yearStr);
        const month = Number(monthNumStr);

        if (!year || !month) {
          setLeaveBalance(null);
          return;
        }

        const res = await API.get(
          `/employee/${user.id}/leave-balance?month=${month}&year=${year}`
        );
        setLeaveBalance(res.data);
      } catch {
        setLeaveBalance(null);
      }
    },
    [user.id]
  );

  /* ================= INITIAL LOAD ================= */
  useEffect(() => {
    checkIpAccess();
    fetchAttendance();
    loadFixRequests();
  }, [checkIpAccess, fetchAttendance, loadFixRequests]);

  /* ================= FILTER + LEAVE ON CHANGE ================= */
  useEffect(() => {
    filterByMonth(attendance, selectedMonth);
    loadLeaveBalance(selectedMonth);
  }, [attendance, selectedMonth, filterByMonth, loadLeaveBalance]);

  /* ================= MARK ATTENDANCE ================= */
  const markAttendance = async (type) => {
    if (!ipAllowed) {
      alert("Office WiFi required.");
      return;
    }

    const now = new Date().toLocaleTimeString("en-GB");

    const body = {
      employee: { id: user.id },
      date: todayISO,
      ...(type === "MORNING_IN" && { morningCheckIn: now }),
      ...(type === "LUNCH_OUT" && { lunchCheckOut: now }),
      ...(type === "LUNCH_IN" && { lunchCheckIn: now }),
      ...(type === "EVENING_OUT" && { eveningCheckOut: now }),
    };

    try {
      await API.post("/employee/attendance", body);
      fetchAttendance();
    } catch {
      alert("Failed to update attendance.");
    }
  };

  /* ================= SUBMIT FIX REQUEST ================= */
  const submitFixRequest = async (e) => {
    e.preventDefault();
    if (!fixForm.reason.trim()) return alert("Reason required");

    setFixSubmitting(true);

    try {
      await API.post(`/employee/${user.id}/attendance/fix-request`, fixForm);
      setFixForm({ date: todayISO, reason: "" });
      loadFixRequests();
    } catch {
      alert("Failed to submit.");
    } finally {
      setFixSubmitting(false);
    }
  };

  /* ================= RENDER TOP BUTTONS ================= */
  const renderButtons = () => {
    const a = todayRecord || {};

    const morningDone = !!a.morningCheckIn;
    const lunchOutDone = !!a.lunchCheckOut;
    const lunchInDone = !!a.lunchCheckIn;
    const eveningDone = !!a.eveningCheckOut;

    const completed =
      morningDone && lunchOutDone && lunchInDone && eveningDone;

    const allDisabled = !ipAllowed;

    return (
      <div className="att-btn-row">
        <Button
          className="top-btn btn-checkin"
          disabled={allDisabled || morningDone}
          onClick={() => markAttendance("MORNING_IN")}
        >
          Check-in
        </Button>

        <Button
          className="top-btn btn-lunchout"
          disabled={allDisabled || !morningDone || lunchOutDone}
          onClick={() => markAttendance("LUNCH_OUT")}
        >
          Lunch-Out
        </Button>

        <Button
          className="top-btn btn-lunchin"
          disabled={allDisabled || !lunchOutDone || lunchInDone}
          onClick={() => markAttendance("LUNCH_IN")}
        >
          Lunch-in
        </Button>

        <Button
          className="top-btn btn-logout"
          disabled={allDisabled || !lunchInDone || eveningDone}
          onClick={() => markAttendance("EVENING_OUT")}
        >
          Logout
        </Button>

        {completed && (
          <Badge bg="success" className="ms-2 mt-2 mt-md-0">
            ✔ Completed
          </Badge>
        )}

        {!ipAllowed && (
          <div className="w-100 mt-2">
            <Alert variant="danger" className="py-1 px-2 mb-0 small">
              Office WiFi required to mark attendance.
            </Alert>
          </div>
        )}
      </div>
    );
  };

  /* ================= INLINE CSS (SCOPED) ================= */
  const CSS = `
    @import url('https://fonts.googleapis.com/css2?family=Salsa&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&display=swap');

/* GLOBAL FONT */
.employee-attendance-page,
.employee-attendance-page * {
  font-family: 'Instrument Sans', sans-serif;
}

/* PAGE TITLE */
.employee-attendance-page .ea-title {
  font-family: 'Salsa', cursive;
  font-size: 34px;
  font-weight: 700;
  text-align: center;
  margin-bottom: 20px;
}

/* ───────────────────────────────
   SUB TABS BAR
─────────────────────────────── */
.employee-attendance-page .sub-tab-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 44px 2px 0 2px;
  gap: 12px;
  flex-wrap: wrap;
}

.employee-attendance-page .sub-tab1,
.employee-attendance-page .sub-tab2,
.employee-attendance-page .sub-tab3 {
  border-radius: 8px;
  border: 1px solid #E0E0E0;
  background: #fff;
  padding: 12px 32px;
  font-weight: 600;
  font-size: 18px;
  color: #000;
  cursor: pointer;
  box-shadow: inset 0 2px 4px rgba(0,0,0,0.18);
  transition: 0.2s;
}

.employee-attendance-page .sub-tab1.active,
.employee-attendance-page .sub-tab2.active,
.employee-attendance-page .sub-tab3.active {
  color: #2D68FE;
}

.employee-attendance-page .sub-tab1:hover,
.employee-attendance-page .sub-tab2:hover,
.employee-attendance-page .sub-tab3:hover {
  background: #f0f4ff;
}

/* MOBILE SUB TABS */
@media (max-width: 768px) {
  .employee-attendance-page .sub-tab-row {
    justify-content: center;
  }
  .employee-attendance-page .sub-tab1,
  .employee-attendance-page .sub-tab2,
  .employee-attendance-page .sub-tab3 {
    flex: 1 0 30%;
    padding: 10px 8px;
    font-size: 16px;
    text-align: center;
  }
}

/* ───────────────────────────────
   GREY BOX
─────────────────────────────── */
.employee-attendance-page .grey-box {
  background: #E1E1E1;
  padding: 20px;
  margin-top: 18px;
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

/* CENTER CONTENT ONLY ON MOBILE */
@media (max-width: 768px) {
  .employee-attendance-page .grey-box {
    align-items: center;
    justify-content: center;
    text-align: center;
  }
}

/* MONTH FILTER */
.employee-attendance-page .filter-input {
  max-width: 220px;
  background: #E1E1E1 !important;
}

/* ───────────────────────────────
   ATTENDANCE BUTTONS
─────────────────────────────── */
.employee-attendance-page .att-btn-row {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  align-items: center;
}

/* Desktop → single row */
@media (min-width: 769px) {
  .employee-attendance-page .att-btn-row {
    flex-wrap: nowrap;
    justify-content: flex-start;
  }
}

/* Mobile → 2×2 grid */
@media (max-width: 768px) {
  .employee-attendance-page .att-btn-row .top-btn {
    flex: 0 0 48%;
    text-align: center;
  }
}

/* COMMON BUTTON STYLE */
.employee-attendance-page .top-btn {
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 600;
  border: none;
  font-size: 15px;
}

/* DISABLED BUTTON STYLE */
.employee-attendance-page .top-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Button colors */
.employee-attendance-page .btn-checkin {
  background: #34C759;
  color: #fff;
}
.employee-attendance-page .btn-lunchout {
  background: #FFCC00;
  color: #000;
}
.employee-attendance-page .btn-lunchin {
  background: #14B33CBF;
  color: #fff;
}
.employee-attendance-page .btn-logout {
  background: #FF383C;
  color: #fff;
}

/* ───────────────────────────────
   ATTENDANCE TABLE WITH OVERFLOW
─────────────────────────────── */
.employee-attendance-page .att-table-wrapper {
  width: 100%;
  overflow-x: auto;
}

.employee-attendance-page .att-table {
  min-width: 750px;
}

.employee-attendance-page .att-table th {
  background: #136CED !important;
  color: #fff;
  border: 1px solid #000 !important;
  padding: 10px;
  text-align: center;
}

.employee-attendance-page .att-table td {
  border: 1px solid #000 !important;
  text-align: center;
  padding: 9px;
}

/* STATUS BADGES */
.employee-attendance-page .badge-approved {
  background: #34C759;
  color: #fff;
  padding: 6px 14px;
  border-radius: 8px;
}
.employee-attendance-page .badge-rejected {
  background: #FF383C;
  color: #fff;
  padding: 6px 14px;
  border-radius: 8px;
}
.employee-attendance-page .badge-pending {
  background: #FFD43B;
  color: #000;
  padding: 6px 14px;
  border-radius: 8px;
}

/* FIX BOX */
.employee-attendance-page .fix-box {
  border: 2px solid #000;
  padding: 18px;
  border-radius: 12px;
  background: #E1E1E1;
}

/* CALENDAR BUTTON */
.employee-attendance-page .bottom-right {
  display: flex;
  justify-content: flex-end;
  width: 100%;
}

/* FIX REQUEST TABLE */
.employee-attendance-page .fix-table-wrapper {
  width: 100%;
  overflow-x: auto;
  border-radius: 8px;
  border: 1px solid #ccc;
}

.employee-attendance-page .fix-table {
  min-width: 720px;
}

  `;

  const labelMonthYear = selectedMonth
    ? new Date(`${selectedMonth}-01`).toLocaleString("en-US", {
        month: "long",
        year: "numeric",
      })
    : "";

  /* ================= LOADING ================= */
  if (loading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ height: "60vh" }}
      >
        <Spinner animation="border" />
      </div>
    );
  }

  /* ================= RENDER ================= */
  return (
    <div className="employee-attendance-page container-fluid p-3">
      <style>{CSS}</style>

      <h2 className="ea-title">Employee Attendance</h2>

      {/* TABS */}
      <div className="sub-tab-row">
        <button
          className={`sub-tab1 ${activeTab === "attendance" ? "active" : ""}`}
          onClick={() => setActiveTab("attendance")}
        >
          Attendance
        </button>

        <button
          className={`sub-tab2 ${activeTab === "calendar" ? "active" : ""}`}
          onClick={() => setActiveTab("calendar")}
        >
          Calendar View
        </button>

        <button
          className={`sub-tab3 ${activeTab === "fix" ? "active" : ""}`}
          onClick={() => setActiveTab("fix")}
        >
          Fix Request
        </button>
      </div>

      {/* ATTENDANCE TAB */}
      {activeTab === "attendance" && (
        <div className="grey-box">
          <div className="d-flex align-items-end flex-wrap gap-3 mb-3">
            <div>
              <Form.Control
                type="month"
                className="filter-input"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                style={{
                  background: "#fff",
                  borderRadius: "8px",
                  border: "1.5px solid #000",
                  padding: "8px 12px",
                }}
              />
            </div>

            {renderButtons()}
          </div>

          {/* Attendance Table with horizontal overflow */}
          <div className="att-table-wrapper">
            <Table bordered hover className="att-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Morning</th>
                  <th>Lunch Out</th>
                  <th>Lunch In</th>
                  <th>Logout</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredAttendance.length ? (
                  filteredAttendance.map((a) => {
                    const done =
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
                        <td>
                          <span
                            className={
                              done ? "badge-approved" : "badge-rejected"
                            }
                          >
                            {done ? "Completed" : "Absent"}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="6" className="text-muted">
                      No attendance available
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>
        </div>
      )}

      {/* CALENDAR TAB */}
      {activeTab === "calendar" && (
        <div className="grey-box">
          {leaveBalance ? (
            <div className="fix-box mt-1 mb-3">
              <h4 className="fw-bold mb-4">
                Leave Balance — {labelMonthYear || "N/A"}
              </h4>

              <Row className="mb-3">
                <Col md={4}>
                  <strong>Paid Earned:</strong> {leaveBalance.paidEarned}
                </Col>
                <Col md={4}>
                  <strong>Paid Used:</strong> {leaveBalance.paidUsed}
                </Col>
                <Col md={4}>
                  <strong>Available:</strong> {leaveBalance.paidAvailable}
                </Col>
              </Row>

              <Row>
                <Col md={6}>
                  <strong>Sick Leave Used:</strong> {leaveBalance.sickUsed}
                  <br />
                  <strong>Days:</strong>{" "}
                  {leaveBalance.sickDays?.length
                    ? leaveBalance.sickDays.join(", ")
                    : "—"}
                </Col>

                <Col md={6}>
                  <strong>Casual Leave Used:</strong> {leaveBalance.casualUsed}
                  <br />
                  <strong>Days:</strong>{" "}
                  {leaveBalance.casualDays?.length
                    ? leaveBalance.casualDays.join(", ")
                    : "—"}
                </Col>
              </Row>

              <hr />

              <Row>
                <Col md={6}>
                  <strong>Paid Leave Days:</strong>{" "}
                  {leaveBalance.paidDays?.length
                    ? leaveBalance.paidDays.join(", ")
                    : "—"}
                </Col>

                <Col md={6}>
                  <strong>On Duty Days:</strong>{" "}
                  {leaveBalance.odDays?.length
                    ? leaveBalance.odDays.join(", ")
                    : "—"}
                </Col>
              </Row>
            </div>
          ) : (
            <p>No leave balance data.</p>
          )}

          <div className="bottom-right">
            <Button
              className="top-btn btn-checkin no-border mb-3"
              onClick={() => setCalendarModal(true)}
            >
              Open Attendance Calendar
            </Button>
          </div>

          <EmployeeCalendarModal
            employee={{ id: user.id, name: user.name }}
            show={calendarModal}
            onHide={() => setCalendarModal(false)}
          />
        </div>
      )}

      {/* FIX REQUEST TAB */}
      {activeTab === "fix" && (
        <div className="grey-box">
          <h4 className="fw-bold mb-3">Fix Request — Today</h4>

          <div className="fix-box mb-3">
            <Form onSubmit={submitFixRequest}>
              <Row>
                <Col md={4}>
                  <Form.Label>Date</Form.Label>
                  <Form.Control
                    type="date"
                    value={fixForm.date}
                    className="fix-input"
                    onChange={(e) =>
                      setFixForm({ ...fixForm, date: e.target.value })
                    }
                  />
                </Col>

                <Col md={6}>
                  <Form.Label>Reason</Form.Label>
                  <Form.Control
                    value={fixForm.reason}
                    className="fix-input"
                    placeholder="Reason"
                    onChange={(e) =>
                      setFixForm({ ...fixForm, reason: e.target.value })
                    }
                  />
                </Col>

                <Col md={2} className="d-grid align-items-end">
                  <Button
                    type="submit"
                    disabled={fixSubmitting}
                    className="top-btn btn-checkin"
                  >
                    {fixSubmitting ? <Spinner size="sm" /> : "Submit"}
                  </Button>
                </Col>
              </Row>
            </Form>
          </div>

          {/* Fix request table with overflow */}
          <div className="fix-table-wrapper">
            <Table bordered hover className="att-table fix-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th>Admin Comment</th>
                  <th>Submitted</th>
                </tr>
              </thead>

              <tbody>
                {fixRequests.length ? (
                  fixRequests.map((r) => (
                    <tr key={r.id}>
                      <td>{r.date}</td>
                      <td>{r.reason}</td>
                      <td>
                        <span
                          className={
                            r.status === "APPROVED"
                              ? "badge-approved"
                              : r.status === "REJECTED"
                              ? "badge-rejected"
                              : "badge-pending"
                          }
                        >
                          {r.status}
                        </span>
                      </td>
                      <td>{r.adminComment || "—"}</td>
                      <td>
                        {r.createdAt
                          ? new Date(r.createdAt).toLocaleString()
                          : "—"}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="text-muted text-center">
                      No fix requests
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}

export default EmployeeAttendance;
