// src/pages/employee/tutor/TutorBatches.jsx
import React, { useCallback, useEffect, useState } from "react";
import {
  Table,
  Button,
  Spinner,
  Alert,
  Collapse,
  Modal,
  Form,
  Card,
} from "react-bootstrap";
import API from "../../../api/api";
import { useAuth } from "../../../context/AuthContext";

function TutorBatches() {
  const { user } = useAuth();

  const [batches, setBatches] = useState([]);
  const [students, setStudents] = useState({});
  const [expanded, setExpanded] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /* ---------------- MODAL STATES ---------------- */
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskBatch, setTaskBatch] = useState(null);
  const [taskForm, setTaskForm] = useState({
    type: "",
    title: "",
    description: "",
    dueDate: "",
  });

  const [showMsgModal, setShowMsgModal] = useState(false);
  const [msgBatch, setMsgBatch] = useState(null);
  const [msgForm, setMsgForm] = useState({ subject: "", body: "" });

  /* ---------------- GLOBAL FONTS + STYLE ---------------- */
  const styles = `
   /* =========================== FONTS =========================== */
@import url('https://fonts.googleapis.com/css2?family=Salsa:wght@400;700&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&display=swap');

* {
  font-family: 'Instrument Sans', sans-serif !important;
}

/* =========================== PAGE TITLE =========================== */
.page-title {
  font-size: 36px;
  font-weight: 700;
  text-align: center;
  margin-bottom: 25px;
  font-family: 'Salsa', cursive !important;
  color: #000;
}

/* =========================== TABLE =========================== */
.batch-table thead th {
  background: #136CED !important;
  color: #fff !important;
  font-size: 18px;
  font-weight: 700;
  text-align: center;
  border: 1px solid #000 !important;
  padding: 14px;
  font-family: 'Salsa', cursive !important;
}

.batch-table td {
  border: 1px solid #000 !important;
  text-align: center;
  padding: 14px !important;
  font-size: 16px;
  font-weight: 500;
}

.student-count {
  font-size: 19px;
  font-weight: 400;
  color: #000;
}

/* Inner student table */
.inner-table th {
  background: #F0F0F0 !important;
  font-weight: 700;
  border: 1px solid #000 !important;
}

.inner-table td {
  border: 1px solid #000 !important;
}

/* =========================== BUTTONS =========================== */
.action-view {
  background: #E0E0E0;
  border: none;
  padding: 6px 14px;
  border-radius: 8px;
  font-weight: 500;
}

.action-message {
  background: #fff;
  border: 2px solid #000;
  padding: 6px 14px;
  border-radius: 8px;
  font-weight: 500;
  color: #136CED;
}

.action-assign {
  background: #34C759;
  border: none;
  padding: 6px 14px;
  border-radius: 8px;
  font-weight: 500;
  color: #fff;
}

/* =========================== MODAL (FIGMA STYLE) =========================== */
.custom-modal .modal-dialog {
  max-width: 520px;
  width: 100%;
}

.custom-modal .modal-content {
  border-radius: 18px !important;
  border: 2px solid #000 !important;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  max-height: 88vh;
}

.custom-header {
  padding: 14px 22px;
  border-bottom: 1px solid #e6e6e6;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
}

.custom-title {
  font-size: 22px;
  font-family: 'Salsa', cursive !important;
  font-weight: 700;
  color: #136CED;
}

.custom-close {
  cursor: pointer;
  font-size: 24px;
  font-weight: 700;
  color: #FF383C;
}

.custom-body {
  padding: 18px 22px;
  overflow-y: auto;
  flex-grow: 1;
}

.custom-label {
  font-size: 15px;
  font-weight: 500;
  margin-bottom: 6px;
}

.custom-input,
.custom-textarea {
  border-radius: 12px !important;
  border: 1.4px solid #d1d1d1 !important;
  font-size: 15px !important;
  padding: 10px !important;
}

.custom-textarea {
  min-height: 120px;
}

.custom-footer {
  padding: 14px 22px 22px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex-shrink: 0;
}

.modal-cancel-btn {
  padding: 12px;
  width: 100%;
  background: #fff;
  border: 1.4px solid #d1d1d1;
  border-radius: 12px;
  font-weight: 600;
  color: #136CED;
}

.modal-submit-btn {
  padding: 12px;
  width: 100%;
  background: #34C759;
  border-radius: 12px;
  font-weight: 600;
  color: #fff;
  border: none;
  font-size: 17px;
}

/* =========================== MOBILE FIX =========================== */
@media (max-width: 576px) {

  .custom-modal .modal-dialog {
    max-width: 94% !important;
    margin: 0 auto;
    height: 86vh; /* Reduced modal height */
  }

  .custom-modal .modal-content {
    max-height: 86vh;
  }

  .custom-body {
    max-height: calc(86vh - 260px); /* header + footer fixed */
    overflow-y: auto !important;
  }

  .custom-title {
    font-size: 20px;
  }

  .custom-input,
  .custom-textarea {
    font-size: 14px !important;
  }
}


  `;
  /* ---------------- FETCH DATA ---------------- */
  const fetchBatches = useCallback(async () => {
    try {
      const res = await API.get(`/employee/${user.id}/batches`);

      // ✅ Sort batches by start time
      const sorted = (res.data || []).sort((a, b) =>
        a.startTime.localeCompare(b.startTime)
      );

      // ✅ Set sorted batches
      setBatches(sorted);

    } catch {
      setError("Failed to load batches");
    } finally {
      setLoading(false);
    }
  }, [user.id]);


  const fetchStudents = async (batchId) => {
    try {
      const res = await API.get(
        `/employee/${user.id}/batch/${batchId}/students`
      );
      setStudents((prev) => ({ ...prev, [batchId]: res.data || [] }));
    } catch {
      alert("Failed to fetch students");
    }
  };

  const toggleExpand = (batchId) => {
    if (expanded === batchId) setExpanded(null);
    else {
      setExpanded(batchId);
      fetchStudents(batchId);
    }
  };

  /* ---------------- TASK MODAL ---------------- */
  const openTaskModal = (batch) => {
    setTaskBatch(batch);
    setTaskForm({
      type: "",
      title: "",
      description: "",
      dueDate: "",
    });
    setShowTaskModal(true);
  };

  const assignTask = async () => {
    if (!taskForm.type || !taskForm.title || !taskForm.description)
      return alert("Fill all fields");

    try {
      await API.post(
        `/employee/${user.id}/batch/${taskBatch.id}/task`,
        taskForm
      );
      alert("Task assigned");
      setShowTaskModal(false);
    } catch {
      alert("Failed to assign task");
    }
  };

  /* ---------------- MESSAGE MODAL ---------------- */
  const openMsgModal = async (batch) => {
    try {
      const res = await API.get(
        `/employee/${user.id}/batch/${batch.id}/students`
      );
      setStudents((prev) => ({ ...prev, [batch.id]: res.data || [] }));
      setMsgBatch(batch);
      setMsgForm({ subject: "", body: "" });
      setShowMsgModal(true);
    } catch {
      alert("Cannot fetch students");
    }
  };

  const sendMessage = async () => {
    if (!msgForm.subject || !msgForm.body)
      return alert("Fill all fields");

    try {
      await API.post(
        `/employee/${user.id}/batch/${msgBatch.id}/message-all`,
        msgForm
      );

      alert("Message Sent");
      setShowMsgModal(false);
    } catch {
      alert("Failed to send message");
    }
  };

  /* ---------------- LOAD ---------------- */
  useEffect(() => {
    fetchBatches();
  }, [fetchBatches]);

  /* ---------------- UI ---------------- */
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
      <style>{styles}</style>

      <h2 className="page-title">Manage Batches</h2>

      {error && <Alert variant="danger">{error}</Alert>}

      <Table bordered responsive hover className="batch-table shadow-sm">
        <thead>
          <tr>
            <th>Batch Name</th>
            <th>Timings</th>
            <th>Students</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {batches.length === 0 && (
            <tr>
              <td colSpan="4" className="text-center text-muted py-4">
                No batches assigned.
              </td>
            </tr>
          )}

          {batches.map((b) => (
            <React.Fragment key={b.id}>
              <tr>
                <td>{b.name}</td>
                <td>
                  {b.startTime?.slice(0, 5)} — {b.endTime?.slice(0, 5)}
                </td>

                <td>
                  <span className="student-count">
                    {String(b?.students?.length || 0).padStart(2, "0")}
                  </span>
                </td>

                <td className="text-nowrap">
                  {/* VIEW BUTTON → Expand/Collapse */}
                  <button
                    className="action-view me-2"
                    onClick={() => toggleExpand(b.id)}
                  >
                    {expanded === b.id ? "Hide" : "View"}
                  </button>

                  {/* MESSAGE ALL */}
                  <button
                    className="action-message me-2"
                    onClick={() => openMsgModal(b)}
                  >
                    Message All
                  </button>

                  {/* ASSIGN TASK */}
                  <button
                    className="action-assign"
                    onClick={() => openTaskModal(b)}
                  >
                    Assign Task
                  </button>
                </td>
              </tr>

              {/* COLLAPSIBLE STUDENT VIEW (Admin Style – No Gap) */}
{expanded === b.id && (
  <tr className="bg-light">
    <td colSpan="4" className="p-0">
      <Collapse in={expanded === b.id} appear>
        <div className="p-3">
          <h5 className="fw-bold mb-3">{b.name} — Students</h5>

          {students[b.id]?.length > 0 ? (
            <Card className="shadow-sm">
              <Table bordered size="sm" className="inner-table m-0">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Contact</th>
                  </tr>
                </thead>

                <tbody>
                  {students[b.id].map((s) => (
                    <tr key={s.id}>
                      <td>{s.id}</td>
                      <td>{s.name}</td>
                      <td>{s.email}</td>
                      <td>{s.contact}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card>
          ) : (
            <p className="text-muted">No students found.</p>
          )}
        </div>
      </Collapse>
    </td>
  </tr>
)}

            </React.Fragment>
          ))}
        </tbody>
      </Table>

      {/* ---------------- TASK MODAL ---------------- */}
      <Modal
        show={showTaskModal}
        onHide={() => setShowTaskModal(false)}
        centered
        dialogClassName="custom-modal"
      >
        <div className="custom-header">
          <div className="custom-title">
            Assign Task — {taskBatch?.name}
          </div>
          <span className="custom-close" onClick={() => setShowTaskModal(false)}>×</span>
        </div>

        <div className="custom-body">
          <Form>
            <Form.Group className="mb-3">
              <Form.Label className="custom-label">Task Type</Form.Label>
              <Form.Select
                className="custom-input"
                value={taskForm.type}
                onChange={(e) =>
                  setTaskForm({ ...taskForm, type: e.target.value })
                }
              >
                <option value="">Select Type</option>
                <option value="ASSIGNMENT">Assignment</option>
                <option value="PROJECT">Project</option>
                <option value="DAILY_TASK">Daily Task</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="custom-label">Title</Form.Label>
              <Form.Control
                className="custom-input"
                value={taskForm.title}
                onChange={(e) =>
                  setTaskForm({ ...taskForm, title: e.target.value })
                }
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="custom-label">Description</Form.Label>
              <Form.Control
                as="textarea"
                className="custom-textarea"
                value={taskForm.description}
                onChange={(e) =>
                  setTaskForm({ ...taskForm, description: e.target.value })
                }
              />
            </Form.Group>

            <Form.Group>
              <Form.Label className="custom-label">Due Date</Form.Label>
              <Form.Control
                type="date"
                className="custom-input"
                value={taskForm.dueDate}
                onChange={(e) =>
                  setTaskForm({ ...taskForm, dueDate: e.target.value })
                }
              />
            </Form.Group>
          </Form>
        </div>

        <div className="custom-footer">
          <Button
            className="modal-cancel-btn"
            onClick={() => setShowTaskModal(false)}
          >
            Cancel
          </Button>

          <Button
            className="modal-submit-btn"
            onClick={assignTask}
          >
            Assign Task
          </Button>
        </div>
      </Modal>

      {/* ---------------- MESSAGE MODAL ---------------- */}
      <Modal
        show={showMsgModal}
        onHide={() => setShowMsgModal(false)}
        centered
        dialogClassName="custom-modal"
      >
        <div className="custom-header">
          <div className="custom-title">
            Message All — {msgBatch?.name}
          </div>
          <span className="custom-close" onClick={() => setShowMsgModal(false)}>×</span>
        </div>

        <div className="custom-body">
          <Form>
            <Form.Group className="mb-3">
              <Form.Label className="custom-label">Subject</Form.Label>
              <Form.Control
                className="custom-input"
                value={msgForm.subject}
                onChange={(e) =>
                  setMsgForm({ ...msgForm, subject: e.target.value })
                }
              />
            </Form.Group>

            <Form.Group>
              <Form.Label className="custom-label">Message</Form.Label>
              <Form.Control
                as="textarea"
                className="custom-textarea"
                value={msgForm.body}
                onChange={(e) =>
                  setMsgForm({ ...msgForm, body: e.target.value })
                }
              />
            </Form.Group>
          </Form>
        </div>

        <div className="custom-footer">
          <Button
            className="modal-cancel-btn"
            onClick={() => setShowMsgModal(false)}
          >
            Cancel
          </Button>

          <Button
            className="modal-submit-btn"
            onClick={sendMessage}
          >
            Send Message
          </Button>
        </div>
      </Modal>
    </div>
  );
}

export default TutorBatches;
