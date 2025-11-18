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
  Badge,
  ListGroup,
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

  // Task Modal (create task)
  const [showTaskModal, setShowTaskModal] = useState(false);
const [selectedBatch, setSelectedBatch] = useState(null);


const [form, setForm] = useState({
  title: "",
  description: "",
  type: "Assignment",
  dueDate: "",
  assignmentScope: "BATCH", // BATCH or STUDENT
  studentId: "",
});


  // MARKS MODAL
  const [showMarksModal, setShowMarksModal] = useState(false);
  const [marksData, setMarksData] = useState({
    taskId: "",
    batchId: "",
    studentId: "",
    studentName: "",
    marks: "",
  });

  // -------------------------------------------------------------
  // FETCH BATCHES
  // -------------------------------------------------------------
  const fetchBatches = useCallback(async () => {
    try {
      const res = await API.get(`/employee/${user.id}/batches`);
      setBatches(res.data);
    } catch (err) {
      setError("Failed to load batches.");
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  // -------------------------------------------------------------
  // FETCH TASKS BY BATCH
  // -------------------------------------------------------------
  const fetchTasksForBatch = useCallback(async (batchId) => {
    try {
      const res = await API.get(`/employee/${user.id}/batch/${batchId}/tasks`);
      setTasks((prev) => ({ ...prev, [batchId]: res.data }));
    } catch (err) {
      console.error("Error fetching tasks:", err);
    }
  }, [user.id]);

  // -------------------------------------------------------------
  // FETCH AVAILABLE STUDENTS
  // -------------------------------------------------------------
  const fetchAvailableStudents = useCallback(async (batchId) => {
  try {
    const res = await API.get(`/employee/${user.id}/batch/${batchId}/students`);
    setAvailableStudents(res.data || []);
  } catch {
    setAvailableStudents([]);
  }
}, [user.id]);


  // -------------------------------------------------------------
  // INIT LOAD
  // -------------------------------------------------------------
  useEffect(() => {
    fetchBatches();
  }, [fetchBatches]);

  useEffect(() => {
    batches.forEach((b) => fetchTasksForBatch(b.id));
  }, [batches, fetchTasksForBatch]);

  // -------------------------------------------------------------
  // HANDLE CREATE TASK
  // -------------------------------------------------------------
  const openTaskModal = async (batch) => {
  setSelectedBatch(batch);

  await fetchAvailableStudents(batch.id); // load batch students

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

  const handleCreateTask = async (e) => {
    e.preventDefault();

    const payload = {
      title: form.title,
      description: form.description,
      type: form.type,
      dueDate: form.dueDate,
    };

    try {
      let endpoint;

      if (form.assignmentScope === "BATCH") {
        endpoint = `/employee/${user.id}/batch/${form.batchId}/task`;
      } else {
        endpoint = `/employee/${user.id}/batch/${form.batchId}/student/${form.studentId}/task`;
      }

      await API.post(endpoint, payload);
      alert("Task assigned successfully!");

      setShowTaskModal(false);
      fetchTasksForBatch(form.batchId);
    } catch (err) {
      alert("Failed to assign task.");
      console.log(err);
    }
  };

  // -------------------------------------------------------------
  // OPEN MARKS MODAL
  // -------------------------------------------------------------
  const openMarksModal = (task, s, batchId) => {
    setMarksData({
      taskId: task.id,
      batchId: batchId,
      studentId: s.studentId,
      studentName: s.studentName,
      marks: s.marks || "",
    });

    setShowMarksModal(true);
  };

  // -------------------------------------------------------------
  // SAVE MARKS
  // -------------------------------------------------------------
  const handleSaveMarks = async () => {
    if (marksData.marks === "" || isNaN(marksData.marks)) {
      return alert("Enter valid marks");
    }

    try {
      await API.put(
        `/employee/${user.id}/task/${marksData.taskId}/student/${marksData.studentId}/marks/${marksData.marks}`
      );

      alert("Marks updated!");

      setShowMarksModal(false);

      fetchTasksForBatch(marksData.batchId);
    } catch (err) {
      alert("Failed to update marks");
    }
  };

  if (loading)
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: "60vh" }}>
        <Spinner animation="border" />
      </div>
    );

  return (
    <div className="p-3">
      <h3 className="fw-bold mb-3">Tutor Tasks</h3>

      {error && <Alert variant="danger">{error}</Alert>}

      <Accordion>
        {batches.map((batch) => (
          <Accordion.Item key={batch.id} eventKey={batch.id.toString()}>
            <Accordion.Header>
              <div className="d-flex justify-content-between w-100">
                <strong>{batch.name}</strong>
                <Button
                  size="sm"
                  variant="success"
                  onClick={(e) => {
                    e.stopPropagation();
                    openTaskModal(batch);
                  }}
                >
                  + Assign Task
                </Button>
              </div>
            </Accordion.Header>

            <Accordion.Body>
              {tasks[batch.id]?.length > 0 ? (
                tasks[batch.id].map((t) => (
                  <div key={t.id} className="border p-3 rounded mb-3 shadow-sm">
                    <h5>{t.title}</h5>
                    <p className="text-muted">{t.description}</p>

                    <p>
                      <strong>Due:</strong> {t.dueDate}
                    </p>

                    <hr />

                    <h6>Students</h6>
                    <ListGroup>
                      {t.studentStatuses.map((s) => (
                        <ListGroup.Item
                          key={s.studentId}
                          className="d-flex justify-content-between align-items-center"
                        >
                          <div>
                            {s.studentName} ({s.studentId})
                            <Badge bg={s.status === "COMPLETED" ? "success" : "warning"} className="ms-2">
                              {s.status}
                            </Badge>
                          </div>

                          <Button
                            size="sm"
                            variant="outline-primary"
                            onClick={() => openMarksModal(t, s, batch.id)}
                          >
                            Update Marks
                          </Button>
                        </ListGroup.Item>
                      ))}
                    </ListGroup>
                  </div>
                ))
              ) : (
                <p className="text-muted">No tasks assigned.</p>
              )}
            </Accordion.Body>
          </Accordion.Item>
        ))}
      </Accordion>

      {/* ---------------- MARKS MODAL ---------------- */}
      <Modal show={showMarksModal} onHide={() => setShowMarksModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Update Marks</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            <strong>Student:</strong> {marksData.studentName} ({marksData.studentId})
          </p>
          <Form.Group className="mb-3">
            <Form.Label>Marks</Form.Label>
            <Form.Control
              type="number"
              value={marksData.marks}
              onChange={(e) => setMarksData({ ...marksData, marks: e.target.value })}
              min="0"
              max="100"
              placeholder="Enter marks"
            />
          </Form.Group>

          <div className="text-end">
            <Button variant="secondary" onClick={() => setShowMarksModal(false)} className="me-2">
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSaveMarks}>
              Save
            </Button>
          </div>
        </Modal.Body>
      </Modal>

      {/* ---------------- TASK MODAL ---------------- */}
      {/* ---------------- TASK MODAL (Updated with Right Panel) ---------------- */}
<Modal show={showTaskModal} onHide={() => setShowTaskModal(false)} size="lg" centered backdrop="static">
  <Modal.Header closeButton>
    <Modal.Title>
      Assign Task {selectedBatch ? `— ${selectedBatch.name || selectedBatch.batchName}` : ""}
    </Modal.Title>
  </Modal.Header>

  <Modal.Body>
    <Form onSubmit={handleCreateTask}>
      <Row>
        <Col md={form.assignmentScope === "STUDENT" ? 7 : 12}>
          <Form.Group className="mb-2">
            <Form.Label>Title</Form.Label>
            <Form.Control
              name="title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Task title"
              required
            />
          </Form.Group>

          <Form.Group className="mb-2">
            <Form.Label>Description</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              name="description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Describe the task"
              required
            />
          </Form.Group>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-2">
                <Form.Label>Type</Form.Label>
                <Form.Select
                  name="type"
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                >
                  <option>Assignment</option>
                  <option>Project</option>
                  <option>Daily Task</option>
                </Form.Select>
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group className="mb-2">
                <Form.Label>Due Date</Form.Label>
                <Form.Control
                  type="date"
                  name="dueDate"
                  value={form.dueDate}
                  onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                  required
                />
              </Form.Group>
            </Col>
          </Row>

          <Form.Group className="mb-2">
            <Form.Label>Assign To</Form.Label>
            <Form.Select
              name="assignmentScope"
              value={form.assignmentScope}
              onChange={(e) =>
                setForm({ ...form, assignmentScope: e.target.value, studentId: "" })
              }
            >
              <option value="BATCH">Entire Batch</option>
              <option value="STUDENT">Specific Student</option>
            </Form.Select>
          </Form.Group>

          {form.assignmentScope === "STUDENT" && (
            <Form.Group className="mb-3">
              <Form.Label>Select Student (or use panel)</Form.Label>
              <Form.Select
                name="studentId"
                value={form.studentId}
                onChange={(e) => setForm({ ...form, studentId: e.target.value })}
                required
              >
                <option value="">Select student</option>
                {availableStudents.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.id})
                  </option>
                ))}
              </Form.Select>
              <Form.Text className="text-muted">
                You can also pick a student from the right panel.
              </Form.Text>
            </Form.Group>
          )}

          <div className="text-end mt-3">
            <Button
              variant="secondary"
              onClick={() => setShowTaskModal(false)}
              className="me-2"
            >
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Assign Task
            </Button>
          </div>
        </Col>

        {/* --- RIGHT-SIDE STUDENT PANEL --- */}
        {form.assignmentScope === "STUDENT" && (
          <Col md={5}>
            <div className="border rounded p-2" style={{ maxHeight: 350, overflowY: "auto" }}>
              <h6 className="mb-3">Available Students</h6>

              {availableStudents.length === 0 ? (
                <p className="text-muted">No students available.</p>
              ) : (
                <ListGroup>
                  {availableStudents.map((s) => (
                    <ListGroup.Item
                      key={s.id}
                      className="d-flex justify-content-between align-items-center"
                    >
                      <div>
                        <strong>{s.name}</strong>
                        <div className="small text-muted">{s.id}</div>
                      </div>

                      <Button
                        size="sm"
                        variant={form.studentId === s.id ? "secondary" : "outline-primary"}
                        onClick={() => setForm((prev) => ({ ...prev, studentId: s.id }))}
                      >
                        {form.studentId === s.id ? "Selected" : "Select"}
                      </Button>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              )}
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

