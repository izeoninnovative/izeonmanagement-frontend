import { useState, useEffect, useCallback } from "react";
import { Table, Spinner, Alert } from "react-bootstrap";
import API from "../../api/api";
import { useAuth } from "../../context/AuthContext";

function StudentTasks() {
  const { user } = useAuth();

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /* ------------------------ CSS (REWORKED UI) ------------------------ */
  const CSS = `
    @import url('https://fonts.googleapis.com/css2?family=Salsa:wght@400;700&display=swap');
    @import url('https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&display=swap');

    * {
      font-family: 'Instrument Sans', sans-serif !important;
    }

    .title {
      font-size: 38px;
      font-weight: 700;
      text-align: center;
      margin-bottom: 25px;
      font-family: 'Salsa', cursive !important;
      color: #000;
    }

    .task-table {
      background: #ffffff;
      overflow: hidden;
    }

    .task-table th {
      background: #136CED !important;
      color: #fff !important;
      border: 1px solid #000 !important;
      text-align: center;
      padding: 12px;
      font-size: 17px;
      font-weight: 600;
      font-family: 'Salsa', cursive !important;
    }

    .task-table td {
      border: 1px solid #000 !important;
      text-align: center;
      padding: 12px;
      font-size: 15px;
      background: #ffffff;
      font-weight: 500;
    }

    .badge-type {
      background: #E8E8E8;
      color: #000;
      padding: 5px 12px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 14px;
      display: inline-block;
    }

    .badge-pending {
      background: #FFD43B;
      color: #000;
      padding: 6px 14px;
      border-radius: 8px;
      font-weight: 700;
      font-size: 14px;
    }

    .badge-complete {
      background: #34C759;
      color: #fff;
      padding: 6px 14px;
      border-radius: 8px;
      font-weight: 700;
      font-size: 14px;
    }

    /* MOBILE */
    @media (max-width: 576px) {
      .task-table th,
      .task-table td {
        font-size: 13px !important;
        padding: 8px !important;
      }

      .title {
        font-size: 30px;
      }
    }
  `;

  /* ------------------------ FETCH TASKS ------------------------ */
  const fetchTasks = useCallback(async () => {
    try {
      const res = await API.get(`/student/${user.id}/tasks`);
      const data = Array.isArray(res.data) ? res.data : [];

      // Sort DESC by assigned date
      const sorted = [...data].sort(
        (a, b) => new Date(b.assignedDate) - new Date(a.assignedDate)
      );

      setTasks(sorted);
    } catch {
      setError("Failed to load tasks.");
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  /* ------------------------ DATE FORMAT ------------------------ */
  const formatDate = (d) => (d ? d.split("T")[0] : "—");

  /* ------------------------ STATUS BADGE ------------------------ */
  const statusBadge = (status) => {
    if (status === "COMPLETED" || status === "REVIEWED") {
      return <span className="badge-complete">Complete</span>;
    }
    return <span className="badge-pending">Pending</span>;
  };

  /* ------------------------ LOADING ------------------------ */
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

  return (
    <div className="p-3 p-md-4">
      <style>{CSS}</style>

      <h2 className="title">My Tasks</h2>

      {error && <Alert variant="danger">{error}</Alert>}

      <Table bordered hover responsive className="task-table shadow-sm">
        <thead>
          <tr>
            <th>S.NO</th>
            <th>Description</th>
            <th>Type</th>
            <th>Assigned</th>
            <th>Due</th>
            <th>Status</th>
            <th>Marks</th>
          </tr>
        </thead>

        <tbody>
          {tasks.length > 0 ? (
            tasks.map((t, index) => (
              <tr key={t.taskId}>
                <td>{String(index + 1).padStart(2, "0")}</td>
                <td>{t.description}</td>

                <td>
                  <span className="badge-type">{t.type}</span>
                </td>

                <td>{formatDate(t.assignedDate)}</td>
                <td>{formatDate(t.dueDate)}</td>

                <td>{statusBadge(t.status)}</td>

                <td>{t.marks ?? 0}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={7} className="text-muted text-center py-3">
                No tasks assigned.
              </td>
            </tr>
          )}
        </tbody>
      </Table>
    </div>
  );
}

export default StudentTasks;
