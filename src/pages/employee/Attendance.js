import { useEffect, useState, useCallback } from "react";
import { Table, Button, Spinner, Badge, Form, Alert } from "react-bootstrap";
import API from "../../api/api";
import { useAuth } from "../../context/AuthContext";

function EmployeeAttendance() {
  const { user } = useAuth();

  const [attendance, setAttendance] = useState([]);
  const [filteredAttendance, setFilteredAttendance] = useState([]);

  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);

  const [error, setError] = useState(null);
  const [todayRecord, setTodayRecord] = useState(null);

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  /* ---------------------------- INTERNAL STYLING ---------------------------- */
  const styles = `
    .attendance-filters {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      align-items: center;
    }

    @media (max-width: 576px) {
      .attendance-filters select {
        width: 100% !important;
      }
      .attendance-actions {
        width: 100%;
        text-align: center;
      }
      h3.fw-bold {
        font-size: 1.3rem;
      }
    }
  `;

  /* ---------------------------- FILTER FUNCTION ---------------------------- */
  const filterData = (data, month, year) => {
    const filtered = data.filter((a) => {
      const d = new Date(a.date);
      return d.getMonth() + 1 === +month && d.getFullYear() === +year;
    });
    setFilteredAttendance(filtered);
  };

  const handleMonthYearChange = (type, value) => {
    if (type === "month") {
      setSelectedMonth(value);
      filterData(attendance, value, selectedYear);
    } else {
      setSelectedYear(value);
      filterData(attendance, selectedMonth, value);
    }
  };

  /* ---------------------------- FETCH ATTENDANCE ---------------------------- */
  const fetchAttendance = useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const res = await API.get(`/employee/${user.id}/attendance`);
      const data = Array.isArray(res.data) ? res.data : [];
      setAttendance(data);

      const today = new Date().toISOString().split("T")[0];
      const todayEntries = data.filter((a) => a.date === today);

      setTodayRecord(todayEntries.length ? todayEntries[todayEntries.length - 1] : null);

      filterData(data, selectedMonth, selectedYear);
      setError(null);
    } catch (err) {
      console.error("Error fetching attendance:", err);
      setError("Failed to load attendance records.");
    } finally {
      setLoading(false);
    }
  }, [user?.id, selectedMonth, selectedYear]);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  /* ---------------------------- MARK ATTENDANCE ---------------------------- */
  const markAttendance = async (action) => {
    setMarking(true);

    const today = new Date().toISOString().split("T")[0];
    const now = new Date().toLocaleTimeString("en-GB");

    let payload = {
      employee: { id: user.id },
      date: today,
      present: true,
    };

    if (todayRecord) {
      payload = { ...payload, ...todayRecord };
    }

    if (action === "MORNING_IN") payload.morningCheckIn = now;
    if (action === "LUNCH_OUT") payload.lunchCheckOut = now;
    if (action === "LUNCH_IN") payload.lunchCheckIn = now;
    if (action === "EVENING_OUT") payload.eveningCheckOut = now;

    try {
      await API.post(`/employee/attendance`, payload);
      fetchAttendance();
    } catch {
      alert("Failed to update attendance.");
    } finally {
      setMarking(false);
    }
  };

  /* ---------------------------- ATTENDANCE BUTTON LOGIC ---------------------------- */
  const renderButtons = () => {
    const a = todayRecord;

    if (marking) return <Spinner size="sm" />;

    if (!a || !a.morningCheckIn)
      return <Button variant="success" onClick={() => markAttendance("MORNING_IN")}>Mark Morning Check-In</Button>;

    if (!a.lunchCheckOut)
      return <Button variant="warning" onClick={() => markAttendance("LUNCH_OUT")}>Mark Lunch Check-Out</Button>;

    if (!a.lunchCheckIn)
      return <Button variant="info" onClick={() => markAttendance("LUNCH_IN")}>Mark Lunch Check-In</Button>;

    if (!a.eveningCheckOut)
      return <Button variant="danger" onClick={() => markAttendance("EVENING_OUT")}>Mark Evening Check-Out</Button>;

    return <Badge bg="success">✔ Attendance Complete</Badge>;
  };

  /* ---------------------------- CALCULATE HOURS ---------------------------- */
  const calculateHours = (a) => {
    if (!a.morningCheckIn || !a.eveningCheckOut) return "—";
    try {
      const start = new Date(`1970-01-01T${a.morningCheckIn}`);
      const end = new Date(`1970-01-01T${a.eveningCheckOut}`);
      const diff = (end - start) / (1000 * 60 * 60) - 1;
      return diff > 0 ? `${diff.toFixed(1)} hrs` : "—";
    } catch {
      return "—";
    }
  };

  /* ---------------------------- LOADING UI ---------------------------- */
  if (loading)
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: "70vh" }}>
        <Spinner animation="border" />
      </div>
    );

  /* ---------------------------- MAIN UI ---------------------------- */
  return (
    <div className="p-3">

      <style>{styles}</style>

      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-3">
        <h3 className="fw-bold">My Attendance</h3>

        {/* FILTERS + BUTTONS */}
        <div className="attendance-filters">
          <Form.Select
            style={{ width: "150px" }}
            value={selectedMonth}
            onChange={(e) => handleMonthYearChange("month", e.target.value)}
          >
            {[
              "January","February","March","April","May","June",
              "July","August","September","October","November","December"
            ].map((m, i) => (
              <option key={i + 1} value={i + 1}>{m}</option>
            ))}
          </Form.Select>

          <Form.Select
            style={{ width: "100px" }}
            value={selectedYear}
            onChange={(e) => handleMonthYearChange("year", e.target.value)}
          >
            {Array.from({ length: 5 }).map((_, i) => {
              const y = new Date().getFullYear() - i;
              return <option key={y}>{y}</option>;
            })}
          </Form.Select>

          <div className="attendance-actions">
            {renderButtons()}
          </div>
        </div>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      {/* ATTENDANCE TABLE */}
      <Table bordered hover responsive className="shadow-sm">
        <thead className="table-dark">
          <tr>
            <th>Date</th>
            <th>Morning In</th>
            <th>Lunch Out</th>
            <th>Lunch In</th>
            <th>Evening Out</th>
            <th>Total Hours</th>
            <th>Status</th>
          </tr>
        </thead>

        <tbody>
          {filteredAttendance.length ? (
            filteredAttendance
              .sort((a, b) => new Date(b.date) - new Date(a.date))
              .map((a) => {
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
              <td colSpan={7} className="text-center text-muted">
                No attendance found.
              </td>
            </tr>
          )}
        </tbody>
      </Table>
    </div>
  );
}

export default EmployeeAttendance;
