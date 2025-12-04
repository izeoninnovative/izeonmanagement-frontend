import React, { useEffect, useState, useCallback } from "react";
import { Modal, Button, Spinner, Badge } from "react-bootstrap";
import API from "../api/api";

function EmployeeCalendarModal({ employee, show, onHide }) {
  const [records, setRecords] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [leaveBalance, setLeaveBalance] = useState(null);
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);

  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  /* ==========================================
        FETCH DATA
  ========================================== */
  const fetchData = useCallback(async () => {
    if (!employee?.id) return;

    setLoading(true);

    try {
      const att = await API.get(`/employee/${employee.id}/attendance`);
      setRecords(att.data || []);

      const lv = await API.get(`/employee/${employee.id}/leaves`);
      setLeaves(lv.data || []);

      const lb = await API.get(
        `/employee/${employee.id}/leave-balance?month=${month + 1}&year=${year}`
      );
      setLeaveBalance(lb.data || null);

      const h = await API.get("/admin/holidays");
      const list = (h.data || [])
        .filter((x) => x.active)
        .map((x) => x.date);
      setHolidays(list);
    } catch (e) {
      console.error("Calendar error:", e);
    } finally {
      setLoading(false);
    }
  }, [employee?.id, month, year]);

  useEffect(() => {
    if (show) fetchData();
  }, [show, month, year, fetchData]);

  /* ==========================================
        HELPERS
  ========================================== */
  const generateCalendar = () => {
    const first = new Date(year, month, 1).getDay();
    const total = new Date(year, month + 1, 0).getDate();

    const arr = [];
    for (let i = 0; i < first; i++) arr.push(null);
    for (let d = 1; d <= total; d++) arr.push(d);

    return arr;
  };

  const formatDate = (d) =>
    `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

  const getStatus = (dateStr) => {
    if (holidays.includes(dateStr)) return "HOLIDAY";

    const att = records.find((a) => a.date === dateStr);
    if (att) {
      if (att.holiday) return "HOLIDAY";
      if (att.present === true) return "PRESENT";
      if (att.present === false) return "ABSENT";
    }

    const leave = leaves.find(
      (l) =>
        l.status === "APPROVED" &&
        dateStr >= l.fromDate &&
        dateStr <= l.toDate
    );
    if (leave) return "LEAVE";

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

  /* ==========================================
        UI
  ========================================== */
  return (
    <Modal
      show={show}
      onHide={onHide}
      centered
      size="lg"
      contentClassName="calendar-modal"
    >
      <Modal.Header closeButton className="border-0 pb-0 modal-header-custom">
        <Modal.Title className="title-text">
          Attendance Calendar – {employee?.name}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>

        {leaveBalance && (
          <div className="leave-box">
            <h6 className="leave-header">Leave Days — {month + 1}/{year}</h6>

            <div className="leave-grid">
              <span>• Sick Leave: {leaveBalance.sickDays?.join(", ") || "None"}</span>
              <span>• Casual Leave: {leaveBalance.casualDays?.join(", ") || "None"}</span>
              <span>• Paid Leave: {leaveBalance.paidDays?.join(", ") || "None"}</span>
              <span>• On Duty: {leaveBalance.odDays?.join(", ") || "None"}</span>
              <span>• Total No of Working Dates: {leaveBalance.totalWorkingDays || 0}</span>
            </div>
          </div>
        )}

        {/* Month Navigation */}
        <div className="month-nav">
          <button className="nav-btn" onClick={prevMonth}>◀ Prev</button>

          <h5 className="month-title">
            {new Date(year, month).toLocaleString("default", {
              month: "long",
              year: "numeric",
            })}
          </h5>

          <button className="nav-btn" onClick={nextMonth}>Next ▶</button>
        </div>

        {/* Week Headers */}
        <div className="week-row">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d} className="week-box">{d}</div>
          ))}
        </div>

        {/* Calendar Grid */}
        {loading ? (
          <div className="text-center py-3">
            <Spinner animation="border" />
          </div>
        ) : (
          <div className="grid">
            {generateCalendar().map((day, idx) => {
              if (!day) return <div key={idx} className="cell empty"></div>;

              const dateStr = formatDate(day);
              const st = getStatus(dateStr);
              const dow = new Date(year, month, day).getDay();

              let cls = "cell default";
              if (st === "HOLIDAY") cls = "cell holiday";
              else if (dow === 0) cls = "cell sunday";
              else if (st === "PRESENT") cls = "cell present";
              else if (st === "ABSENT") cls = "cell absent";
              else if (st === "LEAVE") cls = "cell leave";

              return (
                <div key={idx} className={cls}>
                  {day}
                </div>
              );
            })}
          </div>
        )}

      </Modal.Body>

      <Modal.Footer className="footer-custom">
        <div className="small legend">
          <Badge bg="info">Holiday</Badge>&nbsp;
          <Badge bg="secondary">Sunday</Badge>&nbsp;
          <Badge bg="success">Present</Badge>&nbsp;
          <Badge bg="danger">Absent</Badge>&nbsp;
          <Badge bg="warning" text="dark">Leave</Badge>
        </div>

        <Button className="close-btn" onClick={onHide}>
          Close
        </Button>
      </Modal.Footer>

      {/* Styles */}
      <style>{`
        .calendar-modal {
          border-radius: 20px;
          padding: 10px;
        }

        /* Close button red (#FF383C) */
        .modal-header-custom .btn-close {
          filter: invert(35%) sepia(98%) saturate(7499%) hue-rotate(352deg) brightness(97%) contrast(108%);
        }

        .title-text {
          font-weight: 700;
          font-size: 26px;
          font-family: 'Salsa', cursive;

        }

        .leave-box {
          border: 2px solid #000;
          padding: 15px;
          border-radius: 12px;
          margin-bottom: 20px;
        }

        .leave-header {
          font-weight: 700;
          margin-bottom: 10px;
          color: #136CED;
          font-family: 'Salsa', cursive;
        }

        .leave-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 6px;
          font-size: 14px;
        }

        .month-nav {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin: 15px 0 20px;
        }

        .nav-btn {
          border: 1px solid #136CED;
          background: none;
          padding: 5px 12px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          color: #136CED;
        }

        .month-title {
          font-weight: 700;
          font-size: 20px;
          font-family: 'Salsa', cursive;
        }

        .week-row {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 8px;
          margin-bottom: 10px;
        }

        .week-box {
          background: #e9ecef;
          padding: 6px 0;
          text-align: center;
          border-radius: 8px;
          font-weight: 600;
          font-family:'Salsa', cursive;
        }

        .grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 8px;
        }

        .cell {
          height: 40px;
          display: flex;
          justify-content: center;
          align-items: center;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
        }

        .empty {
          background: transparent;
        }

        /* COLORS */
        .default { background: #f8f9fa; }
        .holiday { background: #17a2b8; color: white; }
        .sunday { background: #6c757d; color: white; }
        .present { background: #198754; color: white; }
        .absent { background: #dc3545; color: white; }
        .leave { background: #ffc107; color: black; }

        .footer-custom {
          display: flex;
          justify-content: space-between;
          width: 100%;
        }

        .close-btn {
          background: #FF383C;
          border: none;
        }

        /* =========================
            MOBILE RESPONSIVE 
        ========================= */
        @media (max-width: 600px) {
          .title-text {
            font-size: 20px;
          }

          .leave-grid {
            grid-template-columns: repeat(1, 1fr);
          }

          .week-box,
          .cell {
            font-size: 12px;
            height: 32px;
          }

          .grid {
            gap: 4px;
          }

          .calendar-modal {
            padding: 6px;
          }

          .month-title {
            font-size: 16px;
          }

          .nav-btn {
            padding: 4px 10px;
            font-size: 12px;
          }
        }
      `}</style>
    </Modal>
  );
}

export default EmployeeCalendarModal;
