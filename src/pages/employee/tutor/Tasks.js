// src/pages/tutor/TutorTasks.jsx
import { useState, useEffect, useCallback } from "react";
import {
  Row,
  Col,
  Button,
  Modal,
  Form,
  Spinner,
  Alert,
  Accordion,
} from "react-bootstrap";
import API from "../../../api/api";
import { useAuth } from "../../../context/AuthContext";

function TutorTasks() {
  const { user } = useAuth();

  const [batches, setBatches] = useState([]);
  const [tasks, setTasks] = useState({});
  const [availableStudents, setAvailableStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    type: "Assignment",
    dueDate: "",
    assignmentScope: "BATCH",
    studentId: "",
    batchId: null,
  });

  const [showMarksModal, setShowMarksModal] = useState(false);
  const [marksData, setMarksData] = useState({
    taskId: "",
    batchId: "",
    studentId: "",
    studentName: "",
    marks: "",
  });

  /* ------------------------ INTERNAL CSS (UI ONLY) ------------------------ */
  const styles = `
    @import url('https://fonts.googleapis.com/css2?family=Salsa:wght@400;700&display=swap');
    @import url('https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&display=swap');

    .tutor-tasks-page {
      padding: 24px;
      font-family: 'Instrument Sans', sans-serif;
    }

    .tutor-tasks-title {
      font-size: 38px;
      font-weight: 700;
      text-align: center;
      margin-bottom: 26px;
      font-family: 'Salsa', cursive;
    }

    /* ================= BATCH ACCORDION (TOP BOX) ================= */
    .tutor-batch-accordion .accordion-item {
      border: none;
      background: transparent;
      margin-bottom: 16px;
    }

    .tutor-batch-accordion .accordion-header {
      border-radius: 18px;
      overflow: hidden;
    }

    .tutor-batch-accordion .accordion-button {
      background: #fdfdfd;
      border-radius: 18px !important;
      border: 2px solid #3f7bff;
      box-shadow: none;
      padding: 14px 18px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 18px;
      font-weight: 600;
    }

    .tutor-batch-accordion .accordion-button::after {
      margin-left: 12px;
    }

    .tutor-batch-name {
      font-size: 20px;
      font-weight: 700;
    }

    .task-header-btn {
      background: #34c759 !important;
      border-radius: 12px !important;
      border: none !important;
      padding: 10px 18px !important;
      font-size: 17px !important;
      font-weight: 700 !important;
    }

    .task-header-btn:hover {
      filter: brightness(0.97);
    }

    /* ================= TASK CARD ================= */
    .task-card {
      background: #f9f9f9;
      border-radius: 18px;
      border: 2px solid #000;
      padding: 18px 20px;
      margin-top: 14px;
      margin-bottom: 18px;
    }

    .task-card-header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      gap: 8px;
    }

    .task-card-title {
      font-size: 22px;
      font-weight: 700;
      color: #136ced;
      font-family: 'Salsa', cursive;
    }

    .task-card-due {
      font-size: 18px;
      font-weight: 700;
      font-family: 'Salsa', cursive;
    }

    .task-type-pill {
      display: inline-block;
      margin-left: 8px;
      padding: 3px 10px;
      border-radius: 999px;
      background: #136ced;
      color: #fff;
      font-size: 12px;
      font-weight: 600;
      font-family: 'Instrument Sans', sans-serif;
      vertical-align: middle;
    }

    .task-main-text {
      margin-top: 18px;
      margin-bottom: 6px;
      font-size: 17px;
      font-weight: 500;
    }

    .task-desc-text {
      margin-bottom: 14px;
      font-size: 15px;
    }

    .task-divider {
      border-top: 1.5px solid #000;
      margin: 10px 0 16px;
    }

    .task-students-title {
      font-size: 22px;
      font-weight: 700;
      margin-bottom: 10px;
    }

    /* ================= SINGLE STUDENT ROW ================= */
    .task-student-box {
      background: #ffffff;
      border-radius: 10px;
      border: 2px solid #3f7bff;
      padding: 8px 10px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 10px;
      margin-bottom: 10px;
      flex-wrap: wrap;
    }

    .task-student-left {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }

    .task-student-pill {
      padding: 3px 10px;
      border-radius: 999px;
      border: 1.6px solid #3f7bff;
      font-size: 14px;
      font-weight: 500;
      background: #f9fbff;
    }

    .task-status-pill {
      padding: 3px 10px;
      border-radius: 999px;
      background: #34c759;
      color: #fff;
      font-size: 13px;
      font-weight: 600;
    }

    .task-student-right {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .marks-btn {
      border-radius: 6px !important;
      padding: 2px 10px !important;
      font-size: 13px !important;
      font-weight: 600 !important;
      border: 1.6px solid #000 !important;
      background: #f4f4f4 !important;
      color: #000 !important;
    }

    .delete-btn {
      border-radius: 6px !important;
      padding: 2px 10px !important;
      font-size: 13px !important;
      font-weight: 600 !important;
      border: 1.6px solid #000 !important;
      background: #ff4d4d !important;
      color: #fff !important;
    }

    /* ================= MODALS ================= */

    /* shared base */
    .tutor-modal .modal-content {
      border-radius: 18px;
      border: 2px solid #000;
      font-family: 'Instrument Sans', sans-serif;
    }

    .tutor-modal .modal-header {
      border-bottom: 1px solid #e5e5e5;
    }

    .tutor-modal .modal-title {
      font-family: 'Salsa', cursive;
      font-size: 22px;
      font-weight: 700;
      color: #136ced;
    }

    .tutor-modal .btn-close {
      filter: invert(28%) sepia(96%) saturate(5000%) hue-rotate(350deg)
        brightness(100%) contrast(100%);
    }

    .tutor-task-modal .modal-dialog {
      max-width: 720px;
    }

    .tutor-task-modal .modal-body {
      max-height: 70vh;
      overflow-y: auto;
      padding: 18px 22px;
    }

    .tutor-marks-modal .modal-body {
      padding: 18px 22px;
    }

    .tutor-modal-label {
      font-size: 15px;
      font-weight: 500;
      margin-bottom: 4px;
    }

    .tutor-modal-input,
    .tutor-modal-textarea,
    .tutor-modal-select {
      border-radius: 12px !important;
      border: 1.4px solid #d1d1d1 !important;
      font-size: 15px !important;
      padding: 9px 11px !important;
    }

    .tutor-modal-textarea {
      min-height: 110px;
      resize: vertical;
    }

    /* make bottom buttons vertical & full-width like design, but keep existing markup */
    .tutor-task-modal .text-end.mt-3 {
      margin-top: 18px !important;
      display: flex;
      flex-direction: column;
      gap: 10px;
      text-align: center !important;
    }

    .tutor-task-modal .text-end.mt-3 .btn {
      width: 100%;
      border-radius: 12px;
      padding: 10px 12px;
      font-weight: 600;
      font-size: 16px;
    }

    .tutor-task-modal .text-end.mt-3 .btn.btn-secondary {
      background: #ffffff;
      color: #136ced;
      border: 1.4px solid #d1d1d1;
    }

    .tutor-task-modal .text-end.mt-3 .btn.btn-primary {
      background: #34c759;
      border: none;
    }

    /* marks modal buttons – keep more compact */
    .tutor-marks-modal .text-end.mt-3 .btn {
      min-width: 90px;
    }

    /* ================= RESPONSIVE ================= */
    @media (max-width: 768px) {
      .tutor-tasks-page {
        padding: 16px;
      }

      .tutor-tasks-title {
        font-size: 30px;
      }

      .tutor-batch-accordion .accordion-button {
        padding: 12px 14px;
        font-size: 17px;
      }

      .tutor-batch-name {
        font-size: 18px;
      }

      .task-card {
        padding: 14px 14px;
      }

      .task-card-title,
      .task-students-title {
        font-size: 20px;
      }

      .task-card-due {
        font-size: 16px;
      }

      .task-student-box {
        flex-direction: column;
        align-items: stretch;
      }

      .task-student-right {
        justify-content: flex-end;
      }

      .tutor-task-modal .modal-dialog {
        max-width: 96%;
        margin: 0.75rem auto;
      }

      .tutor-task-modal .modal-body {
        max-height: 64vh;
        overflow-y: auto;
      }
    }

    .task-accordion-body-bg {
  background: #f7f9ff;        /* soft light blue-grey */
  padding: 18px !important;
  border: 2px solid #dce6ff;
}


    @media (max-width: 576px) {
      .tutor-task-modal .modal-dialog,
      .tutor-marks-modal .modal-dialog {
        max-width: 95%;
        margin: 0.5rem auto;
      }
    }
  `;

  /* ------------------------ FETCH DATA ------------------------ */
  const fetchBatches = useCallback(async () => {
    try {
      const res = await API.get(`/employee/${user.id}/batches`);
      setBatches(res.data || []);
    } catch {
      setError("Failed to load batches.");
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  const fetchTasksForBatch = useCallback(
    async (batchId) => {
      try {
        const res = await API.get(`/employee/${user.id}/batch/${batchId}/tasks`);
        setTasks((prev) => ({ ...prev, [batchId]: res.data || [] }));
      } catch (err) {
        console.error("Error fetching tasks:", err);
      }
    },
    [user.id]
  );

  const fetchAvailableStudents = useCallback(
    async (batchId) => {
      try {
        const res = await API.get(
          `/employee/${user.id}/batch/${batchId}/students`
        );
        setAvailableStudents(res.data || []);
      } catch {
        setAvailableStudents([]);
      }
    },
    [user.id]
  );

  /* ------------------------ INIT LOAD ------------------------ */
  useEffect(() => {
    fetchBatches();
  }, [fetchBatches]);

  useEffect(() => {
    batches.forEach((b) => fetchTasksForBatch(b.id));
  }, [batches, fetchTasksForBatch]);

  /* ------------------------ OPEN TASK MODAL ------------------------ */
  const openTaskModal = async (batch) => {
    setSelectedBatch(batch);

    await fetchAvailableStudents(batch.id);

    setForm({
      title: "",
      description: "",
      type: "Assignment",
      dueDate: "",
      assignmentScope: "BATCH",
      batchId: batch.id,
      studentId: "",
    });

    setShowTaskModal(true);
  };

  /* ------------------------ CREATE TASK ------------------------ */
  const handleCreateTask = async (e) => {
    e.preventDefault();

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      type: form.type,
      dueDate: form.dueDate,
    };

    try {
      let endpoint =
        form.assignmentScope === "BATCH"
          ? `/employee/${user.id}/batch/${form.batchId}/task`
          : `/employee/${user.id}/batch/${form.batchId}/student/${form.studentId}/task`;

      await API.post(endpoint, payload);

      alert("Task assigned successfully!");
      setShowTaskModal(false);

      fetchTasksForBatch(form.batchId);
    } catch {
      alert("Failed to assign task.");
    }
  };

  /* ------------------------ DELETE TASK ------------------------ */
  const deleteTask = async (taskId, batchId) => {
    if (!window.confirm("Delete this task?")) return;

    try {
      await API.delete(`/employee/${user.id}/task/${taskId}`);
      fetchTasksForBatch(batchId);
    } catch {
      alert("Failed to delete task");
    }
  };

  /* ------------------------ OPEN MARKS MODAL ------------------------ */
  const openMarksModal = (task, s, batchId) => {
    setMarksData({
      taskId: task.id,
      batchId,
      studentId: s.studentId,
      studentName: s.studentName,
      marks: s.marks ?? "",
    });

    setShowMarksModal(true);
  };

  /* ------------------------ SAVE MARKS ------------------------ */
  const handleSaveMarks = async () => {
    if (marksData.marks === "" || isNaN(marksData.marks))
      return alert("Enter valid marks");

    try {
      await API.put(
        `/employee/${user.id}/task/${marksData.taskId}/student/${marksData.studentId}/marks/${marksData.marks}`
      );

      alert("Marks updated!");
      setShowMarksModal(false);
      fetchTasksForBatch(marksData.batchId);
    } catch {
      alert("Failed to update marks");
    }
  };

  /* ------------------------ UI RENDER ------------------------ */

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
    <div className="tutor-tasks-page">
      <style>{styles}</style>

      <h2 className="tutor-tasks-title">Assign Task to Students</h2>

      {error && <Alert variant="danger">{error}</Alert>}

      <Accordion alwaysOpen className="tutor-batch-accordion">
        {batches.map((batch) => (
          <Accordion.Item key={batch.id} eventKey={batch.id.toString()}>
            <Accordion.Header>
              <div className="d-flex justify-content-between w-100 align-items-center">
                <span className="tutor-batch-name">{batch.name}</span>

                <Button
                  className="task-header-btn"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    openTaskModal(batch);
                  }}
                >
                  Assign Task
                </Button>
              </div>
            </Accordion.Header>

            <Accordion.Body className="task-accordion-body-bg">
              {tasks[batch.id]?.length > 0 ? (
                tasks[batch.id].map((t) => (
                  <div key={t.id} className="task-card">
                    <div className="task-card-header">
                      <div>
                        <span className="task-card-title">Task Name</span>
                        <span className="task-type-pill">{t.type}</span>
                      </div>
                      <div className="task-card-due">Due: {t.dueDate}</div>
                    </div>

                    <p className="task-main-text">{t.title}</p>
                    {t.description && (
                      <p className="task-desc-text">{t.description}</p>
                    )}

                    <hr className="task-divider" />

                    <div className="task-students-title">Students</div>

                    {t.studentStatuses.map((s) => (
                      <div key={s.studentId} className="task-student-box">
                        <div className="task-student-left">
                          <span className="task-student-pill">
                            {s.studentName} ({s.studentId})
                          </span>

                          {/* Optional completed pill if backend sends it */}
                          {s.completed && (
                            <span className="task-status-pill">Completed</span>
                          )}
                        </div>

                        <div className="task-student-right">
                          <Button
                            size="sm"
                            className="marks-btn"
                            onClick={() => openMarksModal(t, s, batch.id)}
                          >
                            Update Mark
                          </Button>

                          <Button
                            size="sm"
                            className="delete-btn"
                            onClick={() => deleteTask(t.id, batch.id)}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ))
              ) : (
                <p className="text-muted mb-0">No tasks assigned.</p>
              )}
            </Accordion.Body>
          </Accordion.Item>
        ))}
      </Accordion>

      {/* ------------------------ MARKS MODAL ------------------------ */}
      <Modal
        show={showMarksModal}
        onHide={() => setShowMarksModal(false)}
        centered
        dialogClassName="tutor-modal tutor-marks-modal"
      >
        <Modal.Header closeButton>
          <Modal.Title>Update Marks</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            <strong>Student:</strong> {marksData.studentName} (
            {marksData.studentId})
          </p>

          <Form.Group>
            <Form.Label className="tutor-modal-label">Marks</Form.Label>
            <Form.Control
              type="number"
              className="tutor-modal-input"
              value={marksData.marks}
              min={0}
              max={100}
              onChange={(e) =>
                setMarksData({ ...marksData, marks: e.target.value })
              }
              placeholder="Enter marks"
            />
          </Form.Group>

          <div className="text-end mt-3">
            <Button
              variant="secondary"
              onClick={() => setShowMarksModal(false)}
              className="me-2"
            >
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSaveMarks}>
              Save
            </Button>
          </div>
        </Modal.Body>
      </Modal>

      {/* ------------------------ CREATE TASK MODAL ------------------------ */}
      <Modal
        show={showTaskModal}
        onHide={() => setShowTaskModal(false)}
        centered
        size="lg"
        backdrop="static"
        dialogClassName="tutor-modal tutor-task-modal"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            Assign Task — {selectedBatch?.name || selectedBatch?.batchName}
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <Form onSubmit={handleCreateTask}>
            <Row>
              <Col md={form.assignmentScope === "STUDENT" ? 7 : 12}>
                <Form.Group className="mb-2">
                  <Form.Label className="tutor-modal-label">
                    Task Title
                  </Form.Label>
                  <Form.Control
                    className="tutor-modal-input"
                    value={form.title}
                    onChange={(e) =>
                      setForm({ ...form, title: e.target.value })
                    }
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-2">
                  <Form.Label className="tutor-modal-label">
                    Description
                  </Form.Label>
                  <Form.Control
                    as="textarea"
                    className="tutor-modal-textarea"
                    rows={3}
                    value={form.description}
                    onChange={(e) =>
                      setForm({ ...form, description: e.target.value })
                    }
                    required
                  />
                </Form.Group>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-2">
                      <Form.Label className="tutor-modal-label">
                        Type
                      </Form.Label>
                      <Form.Select
                        className="tutor-modal-select"
                        value={form.type}
                        onChange={(e) =>
                          setForm({ ...form, type: e.target.value })
                        }
                      >
                        <option>Assignment</option>
                        <option>Project</option>
                        <option>Daily Task</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group className="mb-2">
                      <Form.Label className="tutor-modal-label">
                        Due Date
                      </Form.Label>
                      <Form.Control
                        type="date"
                        className="tutor-modal-input"
                        value={form.dueDate}
                        onChange={(e) =>
                          setForm({ ...form, dueDate: e.target.value })
                        }
                        required
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-2">
                  <Form.Label className="tutor-modal-label">
                    Assign To
                  </Form.Label>
                  <Form.Select
                    className="tutor-modal-select"
                    value={form.assignmentScope}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        assignmentScope: e.target.value,
                        studentId: "",
                      })
                    }
                  >
                    <option value="BATCH">Entire Batch</option>
                    <option value="STUDENT">Specific Student</option>
                  </Form.Select>
                </Form.Group>

                {form.assignmentScope === "STUDENT" && (
                  <Form.Group className="mb-3">
                    <Form.Label className="tutor-modal-label">
                      Select Student
                    </Form.Label>
                    <Form.Select
                      className="tutor-modal-select"
                      value={form.studentId}
                      onChange={(e) =>
                        setForm({ ...form, studentId: e.target.value })
                      }
                      required
                    >
                      <option value="">Choose student</option>
                      {availableStudents.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.id})
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                )}

                {/* Footer buttons – styled via CSS to match Figma-style full width */}
                <div className="text-end mt-3">
                  <Button
                    variant="secondary"
                    onClick={() => setShowTaskModal(false)}
                    className="me-2"
                    type="button"
                  >
                    Cancel
                  </Button>
                  <Button variant="primary" type="submit">
                    Assign Task
                  </Button>
                </div>
              </Col>

              {/* RIGHT PANEL WHEN ASSIGNING TO SINGLE STUDENT */}
              {form.assignmentScope === "STUDENT" && (
                <Col md={5} className="mt-3 mt-md-0">
                  <div
                    className="border rounded p-2"
                    style={{ maxHeight: 350, overflowY: "auto" }}
                  >
                    <h6 className="mb-2">Pick Student</h6>

                    {availableStudents.map((s) => (
                      <div
                        key={s.id}
                        className="d-flex justify-content-between align-items-center border rounded p-2 mb-2"
                      >
                        <div>
                          <strong>{s.name}</strong>
                          <div className="small text-muted">{s.id}</div>
                        </div>

                        <Button
                          size="sm"
                          className={
                            form.studentId === s.id
                              ? "btn-dark"
                              : "btn-outline-primary"
                          }
                          onClick={() =>
                            setForm({ ...form, studentId: s.id })
                          }
                        >
                          {form.studentId === s.id ? "Selected" : "Select"}
                        </Button>
                      </div>
                    ))}
                  </div>
                </Col>
              )}
            </Row>
          </Form>
        </Modal.Body>
      </Modal>
    </div>
  );
}

export default TutorTasks;
