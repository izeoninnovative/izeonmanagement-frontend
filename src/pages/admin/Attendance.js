// src/pages/admin/Attendance.jsx
import { useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { Spinner, Alert, Form, Button } from "react-bootstrap";
import API from "../../api/api";
import EmployeeCalendarModal from "../../components/EmployeeCalendarModal";

function Attendance() {
  const [attendance, setAttendance] = useState({ employees: [], students: [] });
  const [fixRequests, setFixRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fixError, setFixError] = useState(null);

  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  // Calendar modal
  const [calendarEmployee, setCalendarEmployee] = useState(null);

  // TABS
  const location = useLocation();
  const [activeMainTab, setActiveMainTab] = useState(
    localStorage.getItem("att_main_tab") || "employees"
  );
  const [activeSubTab, setActiveSubTab] = useState(
    localStorage.getItem("att_sub_tab") || "attendance"
  );

  /* Read URL param ( ?tab=students ) */
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get("tab");

    if (tab === "employees") {
      setActiveMainTab("employees");
      setActiveSubTab("attendance");
      localStorage.setItem("att_main_tab", "employees");
      localStorage.setItem("att_sub_tab", "attendance");
    }

    if (tab === "students") {
      setActiveMainTab("students");
      setActiveSubTab("attendance");
      localStorage.setItem("att_main_tab", "students");
      localStorage.setItem("att_sub_tab", "attendance");
    }
  }, [location.search]);

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

  useEffect(() => {
    fetchAttendance(selectedDate);
    fetchFixRequests();
  }, [selectedDate]);

  /* --------------------------------------------
     HOURS CALC
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
     STATUS PILLS
  -------------------------------------------- */
  const pill = (type) => {
    const map = {
      complete: "status-complete",
      progress: "status-progress",
      absent: "status-absent",
    };
    return map[type] || "status-progress";
  };

  if (loading)
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ height: "60vh" }}
      >
        <Spinner animation="border" />
      </div>
    );

  return (
    <div className="p-3">

      {/* ==================== GLOBAL STYLES  ==================== */}
      <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Salsa&display=swap');
      @import url('https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&display=swap');

      * {
        font-family: 'Instrument Sans', sans-serif;
      }

      .att-title {
        font-size: 34px;
        font-weight: 700;
        font-family: 'Salsa', cursive;
        text-align: center;
        margin-bottom: 22px;
      }

      /* Date Input */
      .date-input {
        width: 260px;
        height: 48px;
        border-radius: 12px;
        border: 1.6px solid #000;
        padding: 8px 14px;
        font-size: 16px;
      }

      @media (max-width: 576px) {
        .date-input {
          width: 100%;
        }
      }

      /* MAIN TABS */
      .main-tabs {
        margin-top: 14px;
        display: flex;
        border-radius: 14px;
        border: 1.6px solid #000;
        overflow: hidden;
      }
      .main-tab {
        flex: 1;
        padding: 10px 0;
        text-align: center;
        cursor: pointer;
        font-weight: 600;
        background: #fff;
        border: none;
        font-size: 16px;
        font-family:'Salsa', cursive;
        border-radius:12px;
      }
      .main-tab.active {
        background: #136CED;
        color: #fff;
      }

      /* SUB TABS */
      .sub-tabs {
        display: flex;
        justify-content: space-between;
        margin-top: 22px;
      }
      .sub-btn {
        padding: 12px 28px;
        border-radius: 10px;
        border: 1px solid #E0E0E0;
        background: #fff;
        font-weight: 500;
        cursor: pointer;
        box-shadow: inset 0 2px 4px rgba(0,0,0,0.25);
      }
      .sub-btn.active {
        color: #136CED;
        background: #fff;
      }

      @media (max-width: 576px) {
        .sub-tabs {
          flex-direction: column;
          gap: 10px;
        }
        .sub-btn {
          width: 100%;
        }
      }

      /* TABLE OUTER WRAPPER (for mobile scrolling) */
      .table-wrap {
        margin-top: 24px;
        border: 2px solid #000;
        border-radius: 16px;
        overflow-x: auto;
      }

      table.att-table {
        width: 100%;
        min-width: 750px;
        border-collapse: collapse;
      }

      .att-table thead th {
        background: #136CED;
        padding: 12px;
        text-align: center;
        color: #fff;
        border: 1px solid #000;
        font-weight: 600;
        font-size: 15px;
        font-family: 'Salsa', cursive;
      }

      .att-table tbody td {
        padding: 13px;
        text-align: center;
        border: 1px solid #000;
        font-size: 14px;
      }

      /* STATUS PILLS */
      .status-pill {
        padding: 6px 14px;
        border-radius: 8px;
        color: #fff;
        font-size: 13px;
        font-weight: 600;
        display: inline-block;
      }
      .status-progress { background: #FFCC00; color: #000; }
      .status-complete { background: #34C759; }
      .status-absent { background: #FF383C; }

      /* VIEW BUTTON */
      .view-btn {
        padding: 7px 14px;
        border-radius: 10px;
        background: #8E8E93;
        border: none;
        color: white;
        font-size: 12px;
        font-weight: 600;
      }

      .fix-btn {
        padding: 6px 12px;
        border-radius: 8px;
        font-weight: 600;
        font-size: 12px;
        color: white;
        border: none;
      }
      .approve-btn { background: #34C759; }
      .reject-btn { background: #FF383C; }

      `}</style>

      {/* ========== HEADER ========== */}
      <div className="d-flex justify-content-between align-items-center flex-wrap mb-3">
        <h3 className="att-title m-0">Attendance (Admin)</h3>

        <Form.Control
          type="date"
          className="date-input mt-2 mt-md-0"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
        />
      </div>

      {/* ========== MAIN TABS ========== */}
      <div className="main-tabs">
        <button
          className={`main-tab ${activeMainTab === "employees" ? "active" : ""}`}
          onClick={() => {
            setActiveMainTab("employees");
            localStorage.setItem("att_main_tab", "employees");
          }}
        >
          Employees
        </button>

        <button
          className={`main-tab ${activeMainTab === "students" ? "active" : ""}`}
          onClick={() => {
            setActiveMainTab("students");
            localStorage.setItem("att_main_tab", "students");
          }}
        >
          Students
        </button>
      </div>

      {/* ================= EMPLOYEES ================= */}
      {activeMainTab === "employees" && (
        <>
          {/* SUB TABS */}
          <div className="sub-tabs">
            <button
              className={`sub-btn ${activeSubTab === "attendance" ? "active" : ""}`}
              onClick={() => {
                setActiveSubTab("attendance");
                localStorage.setItem("att_sub_tab", "attendance");
              }}
            >
              Attendance
            </button>

            <button
              className={`sub-btn ${activeSubTab === "fix" ? "active" : ""}`}
              onClick={() => {
                setActiveSubTab("fix");
                localStorage.setItem("att_sub_tab", "fix");
              }}
            >
              Fix Request
            </button>
          </div>

          {/* EMPLOYEE ATTENDANCE TABLE */}
          {activeSubTab === "attendance" && (
            <div className="table-wrap">
              <table className="att-table">
                <thead>
                  <tr>
                    <th>ID</th>
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
                  {attendance.employees.length ? (
                    attendance.employees.map((a) => {
                      const complete = !!a.eveningCheckOut;
                      return (
                        <tr key={a.id}>
                          <td>{a.employeeId}</td>
                          <td>{a.employeeName}</td>
                          <td>{a.morningCheckIn || "—"}</td>
                          <td>{a.lunchCheckOut || "—"}</td>
                          <td>{a.lunchCheckIn || "—"}</td>
                          <td>{a.eveningCheckOut || "—"}</td>
                          <td>{calculateHours(a)}</td>
                          <td>
                            <span
                              className={`status-pill ${pill(
                                complete ? "complete" : "progress"
                              )}`}
                            >
                              {complete ? "Complete" : "In Progress"}
                            </span>
                          </td>
                          <td>
                            <button
                              className="view-btn"
                              onClick={() =>
                                setCalendarEmployee({
                                  id: a.employeeId,
                                  name: a.employeeName,
                                })
                              }
                            >
                              View Details
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={9} style={{ padding: "16px", color: "#555" }}>
                        No employee attendance found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* FIX REQUEST TABLE */}
          {activeSubTab === "fix" && (
            <>
              {fixError && (
                <Alert variant="danger" className="mt-3">
                  {fixError}
                </Alert>
              )}

              <div className="table-wrap">
                <table className="att-table">
                  <thead>
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
                    {fixRequests.length ? (
                      fixRequests.map((req) => (
                        <tr key={req.id}>
                          <td>{req.id}</td>
                          <td>{req.employeeName}</td>
                          <td>{req.date}</td>
                          <td>{req.reason}</td>
                          <td>
                            <span
                              className={`status-pill ${pill(
                                req.status === "APPROVED"
                                  ? "complete"
                                  : req.status === "REJECTED"
                                  ? "absent"
                                  : "progress"
                              )}`}
                            >
                              {req.status}
                            </span>
                          </td>
                          <td>
                            <Button
                              size="sm"
                              className="fix-btn approve-btn me-2"
                              disabled={req.status !== "PENDING"}
                              onClick={() => handleFixAction(req.id, "approve")}
                            >
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              className="fix-btn reject-btn"
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
                        <td colSpan={6} style={{ padding: "16px", color: "#555" }}>
                          No fix requests found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}

      {/* ================= STUDENTS ================= */}
      {activeMainTab === "students" && (
        <div className="table-wrap">
          <table className="att-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Name</th>
                <th>Batch</th>
                <th>Tutor</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {attendance.students.length ? (
                attendance.students.map((s) => {
                  const done =
                    s.status === "COMPLETE" ||
                    s.present ||
                    !!s.eveningCheckOut;

                  return (
                    <tr key={s.id}>
                      <td>{s.date}</td>
                      <td>{s.studentName}</td>
                      <td>{s.batchName || "—"}</td>
                      <td>{s.tutorName || "—"}</td>
                      <td>
                        <span
                          className={`status-pill ${pill(
                            done ? "complete" : "progress"
                          )}`}
                        >
                          {done ? "Complete" : "In Progress"}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} style={{ padding: "16px", color: "#555" }}>
                    No student attendance found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* CALENDAR MODAL */}
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
