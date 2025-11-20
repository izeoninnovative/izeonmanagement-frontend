import React, { useEffect, useState, useCallback } from "react";
import { Modal, Button, Spinner, Badge, Card } from "react-bootstrap";
import API from "../api/api";

function EmployeeCalendarModal({ employee, show, onHide }) {
  const [records, setRecords] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [leaveBalance, setLeaveBalance] = useState(null);
  const [holidays, setHolidays] = useState([]); // ⭐ Admin holidays
  const [loading, setLoading] = useState(true);

  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth()); // 0–11

  /* ---------------------------------------------------------
     FETCH DATA
  --------------------------------------------------------- */
  const fetchData = useCallback(async () => {
    if (!employee?.id) return;

    setLoading(true);

    try {
      // Attendance
      const attRes = await API.get(`/employee/${employee.id}/attendance`);
      setRecords(attRes.data || []);

      // Leaves
      const leaveRes = await API.get(`/employee/${employee.id}/leaves`);
      setLeaves(leaveRes.data || []);

      // Leave balance
      const lbRes = await API.get(
        `/employee/${employee.id}/leave-balance?month=${month + 1}&year=${year}`
      );
      setLeaveBalance(lbRes.data || null);

      // ⭐ Admin Holidays
      const hRes = await API.get("/admin/holidays");
      const activeHolidays = (hRes.data || [])
        .filter((h) => h.active)
        .map((h) => h.date);
      setHolidays(activeHolidays);

    } catch (err) {
      console.error("Calendar load failed:", err);
    } finally {
      setLoading(false);
    }
  }, [employee?.id, month, year]);

  useEffect(() => {
    if (show) fetchData();
  }, [show, month, year, fetchData]);

  /* ---------------------------------------------------------
     CALENDAR HELPERS
  --------------------------------------------------------- */
  const generateCalendar = () => {
    const first = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const arr = [];
    for (let i = 0; i < first; i++) arr.push(null);
    for (let d = 1; d <= daysInMonth; d++) arr.push(d);
    return arr;
  };

  const formatDate = (day) =>
    `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  /* ---------------------------------------------------------
     STATUS LOGIC (HOLIDAY TOP PRIORITY)
  --------------------------------------------------------- */
  const getStatus = (dateStr) => {
    // ⭐ A. Holiday from Admin
    if (holidays.includes(dateStr)) return "HOLIDAY";

    // B. Attendance record might already mark holiday
    const att = records.find((a) => a.date === dateStr);
    if (att) {
      if (att.holiday === true) return "HOLIDAY";
      if (att.present === true) return "PRESENT";
      if (att.present === false) return "ABSENT";
    }

    // C. Leave
    const leave = leaves.find(
      (l) =>
        l.status === "APPROVED" &&
        dateStr >= l.fromDate &&
        dateStr <= l.toDate
    );
    if (leave) return `LEAVE_${leave.type}`;

    return null;
  };

  const nextMonth = () => {
    if (month === 11) {
      setMonth(0);
      setYear((p) => p + 1);
    } else setMonth((p) => p + 1);
  };

  const prevMonth = () => {
    if (month === 0) {
      setMonth(11);
      setYear((p) => p - 1);
    } else setMonth((p) => p - 1);
  };

  /* ---------------------------------------------------------
     RENDER UI
  --------------------------------------------------------- */
  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Attendance Calendar – {employee?.name}</Modal.Title>
      </Modal.Header>

      <Modal.Body style={{ maxHeight: "75vh", overflowY: "auto" }}>
        
        {/* LEAVE BALANCE */}
        {leaveBalance && (
          <Card className="p-2 mb-3 shadow-sm">
            <h6 className="fw-bold mb-2">
              Leave Days — {month + 1}/{year}
            </h6>

            <div className="small">
              <div><strong>Sick Leave:</strong> {leaveBalance.sickDays.join(", ") || "None"}</div>
              <div><strong>Casual Leave:</strong> {leaveBalance.casualDays.join(", ") || "None"}</div>
              <div><strong>Paid Leave:</strong> {leaveBalance.paidDays.join(", ") || "None"}</div>
              <div><strong>On Duty:</strong> {leaveBalance.odDays.join(", ") || "None"}</div>
            </div>
          </Card>
        )}

        {/* MONTH SWITCH */}
        <div className="d-flex justify-content-between mb-3">
          <Button size="sm" onClick={prevMonth} variant="outline-primary">◀ Prev</Button>

          <h5 className="fw-bold">
            {new Date(year, month).toLocaleString("default", { month: "long", year: "numeric" })}
          </h5>

          <Button size="sm" onClick={nextMonth} variant="outline-primary">Next ▶</Button>
        </div>

        {/* WEEK HEADERS */}
        <div className="calendar-weekdays mb-2">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d} className="weekday-cell fw-bold small">{d}</div>
          ))}
        </div>

        {/* GRID */}
        {loading ? (
          <div className="text-center py-4">
            <Spinner animation="border" />
          </div>
        ) : (
          <div className="calendar-grid">
            {generateCalendar().map((day, idx) => {
              if (!day) return <div key={idx} className="empty-cell"></div>;

              const dateStr = formatDate(day);
              const status = getStatus(dateStr);

              const dayObj = new Date(year, month, day);
              const isSunday = dayObj.getDay() === 0;

              let cls = "day-default";

              // ⭐ PRIORITY ORDER
              if (status === "HOLIDAY") cls = "day-holiday";
              else if (isSunday) cls = "day-sunday";
              else if (status === "PRESENT") cls = "day-present";
              else if (status === "ABSENT") cls = "day-absent";
              else if (status?.startsWith("LEAVE_")) cls = "day-leave";

              return (
                <div key={idx} className={`calendar-cell-small ${cls}`}>
                  {day}
                </div>
              );
            })}
          </div>
        )}
      </Modal.Body>

      <Modal.Footer>
        <div className="me-auto small">
          <b>Legend:</b>&nbsp;
          <Badge bg="info">Holiday</Badge>&nbsp;
          <Badge bg="secondary">Sunday</Badge>&nbsp;
          <Badge bg="success">Present</Badge>&nbsp;
          <Badge bg="danger">Absent</Badge>&nbsp;
          <Badge bg="warning" text="dark">Leave</Badge>
        </div>

        <Button variant="secondary" onClick={onHide}>Close</Button>
      </Modal.Footer>

      {/* STYLES */}
      <style jsx>{`
        .calendar-weekdays {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 6px;
        }
        .weekday-cell {
          padding: 5px;
          background: #e9ecef;
          border-radius: 4px;
        }
        .calendar-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 6px;
        }
        .calendar-cell-small,
        .empty-cell {
          padding: 6px 0;
          height: 30px;
          border-radius: 4px;
          text-align: center;
          font-size: 0.8rem;
          font-weight: 600;
        }

        /* COLORS */
        .day-default { background: #f8f9fa; }
        .day-holiday { background: #17a2b8; color: #fff; }   /* BLUE HOLIDAY */
        .day-sunday  { background: #6c757d; color: #fff; }
        .day-present { background: #198754; color: #fff; }
        .day-absent  { background: #dc3545; color: #fff; }
        .day-leave   { background: #ffc107; color: #000; }
      `}</style>
    </Modal>
  );
}

export default EmployeeCalendarModal;
