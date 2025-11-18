import { useState, useEffect, useCallback } from "react";
import {
  Table,
  Button,
  Spinner,
  Alert,
  Badge,
  Card,
} from "react-bootstrap";
import API from "../../api/api";
import { useAuth } from "../../context/AuthContext";

function StudentTasks() {
  const { user } = useAuth();

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /* ---------------------------------------------------------
     PREMIUM STYLES (Animated Gradient + Card Hover)
  --------------------------------------------------------- */
  const styles = `
    .tasks-header {
      background: linear-gradient(135deg, #1a73e8, #673ab7, #d500f9);
      background-size: 300% 300%;
      animation: tasksGradient 7s ease infinite;
      border-radius: 14px;
      padding: 20px 25px;
      color: white;
    }
    @keyframes tasksGradient {
      0% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }

    .task-card {
      border-radius: 14px;
      transition: 0.25s ease;
    }
    .task-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 4px 18px rgba(0,0,0,0.15);
    }
  `;

  /* ---------------------------------------------------------
     FETCH STUDENT TASKS
  --------------------------------------------------------- */
  const fetchTasks = useCallback(async () => {
    try {
      const res = await API.get(`/student/${user.id}/tasks`);
      setTasks(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setError("Failed to load tasks.");
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  /* ---------------------------------------------------------
     FORMAT DATE
  --------------------------------------------------------- */
  const formatDate = (d) => {
    if (!d) return "—";
    try {
      return d.split("T")[0];
    } catch {
      return d;
    }
  };

  /* ---------------------------------------------------------
     STATUS BADGE
  --------------------------------------------------------- */
  const statusBadge = (status) => {
    const color =
      status === "COMPLETED"
        ? "success"
        : status === "REVIEWED"
        ? "info"
        : "warning";

    return <Badge bg={color}>{status}</Badge>;
  };

  /* ---------------------------------------------------------
     LOADING SCREEN
  --------------------------------------------------------- */
  if (loading)
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: "60vh" }}>
        <Spinner animation="border" variant="primary" />
      </div>
    );

  /* ---------------------------------------------------------
     UI
  --------------------------------------------------------- */
  return (
    <div className="p-3 p-md-4">
      <style>{styles}</style>

      {/* HEADER */}
      <div className="tasks-header shadow-sm mb-4">
        <div className="d-flex justify-content-between align-items-center">
          <h3 className="fw-bold mb-0">📘 My Tasks</h3>

          <Button size="sm" variant="light" onClick={fetchTasks}>
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="danger" className="shadow-sm fw-semibold">
          {error}
        </Alert>
      )}

      {/* TASK TABLE */}
      <Card className="shadow-sm task-card p-3">
        <Table bordered hover responsive className="mb-0">
          <thead className="table-dark">
            <tr>
              <th>Task</th>
              <th>Description</th>
              <th>Type</th>
              <th>Assigned</th>
              <th>Due</th>
              <th>Status</th>
              <th>Marks</th>
            </tr>
          </thead>

          <tbody>
            {tasks.length ? (
              tasks.map((t) => (
                <tr key={t.taskId}>
                  <td className="fw-semibold">{t.title}</td>
                  <td>{t.description}</td>
                  <td>
                    <Badge bg="secondary">{t.type}</Badge>
                  </td>
                  <td>{formatDate(t.assignedDate)}</td>
                  <td>{formatDate(t.dueDate)}</td>
                  <td>{statusBadge(t.status)}</td>
                  <td>{t.marks ?? "—"}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="text-center text-muted py-3">
                  No tasks assigned yet.
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </Card>
    </div>
  );
}

export default StudentTasks;
