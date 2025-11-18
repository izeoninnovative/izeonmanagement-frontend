import { useEffect, useState, useCallback } from "react";
import {
    Table,
    Button,
    Spinner,
    Alert,
    Collapse,
    Modal,
    Form,
    Badge,
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

    // ---------------- TASK MODAL ----------------
    const [showTaskModal, setShowTaskModal] = useState(false);
    const [taskBatch, setTaskBatch] = useState(null);
    const [taskForm, setTaskForm] = useState({
        type: "",
        title: "",
        description: "",
        dueDate: "",
    });

    // ---------------- MESSAGE MODAL ----------------
    const [showMsgModal, setShowMsgModal] = useState(false);
    const [msgBatch, setMsgBatch] = useState(null);
    const [msgForm, setMsgForm] = useState({
        subject: "",
        body: "",
    });

    /* ---------------------------------------------------------
       FETCH BATCHES
    --------------------------------------------------------- */
    const fetchBatches = useCallback(async () => {
        try {
            const res = await API.get(`/employee/${user.id}/batches`);
            setBatches(res.data || []);
        } catch (err) {
            setError("Failed to load batches");
        } finally {
            setLoading(false);
        }
    }, [user.id]);

    /* ---------------------------------------------------------
       FETCH STUDENTS OF BATCH
    --------------------------------------------------------- */
    const fetchStudents = async (batchId) => {
        try {
            const res = await API.get(`/employee/${user.id}/batch/${batchId}/students`);
            setStudents((prev) => ({ ...prev, [batchId]: res.data || [] }));
        } catch {
            alert("Failed to fetch students");
        }
    };

    /* ---------------------------------------------------------
       EXPAND / COLLAPSE BATCH
    --------------------------------------------------------- */
    const toggleExpand = (batchId) => {
        if (expanded === batchId) {
            setExpanded(null);
        } else {
            setExpanded(batchId);
            fetchStudents(batchId);
        }
    };

    /* ---------------------------------------------------------
       OPEN TASK MODAL
    --------------------------------------------------------- */
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

    /* ---------------------------------------------------------
       ASSIGN TASK
    --------------------------------------------------------- */
    const assignTask = async () => {
        if (!taskForm.type || !taskForm.title || !taskForm.description)
            return alert("Fill all fields");

        try {
            await API.post(`/employee/${user.id}/batch/${taskBatch.id}/task`, taskForm);
            alert("Task Assigned");
            setShowTaskModal(false);
        } catch {
            alert("Failed to assign task");
        }
    };

    /* ---------------------------------------------------------
       OPEN MESSAGE MODAL
    --------------------------------------------------------- */
    const openMsgModal = async (batch) => {
        try {
            const res = await API.get(`/employee/${user.id}/batch/${batch.id}/students`);
            setStudents((prev) => ({ ...prev, [batch.id]: res.data }));

            setMsgBatch(batch);
            setMsgForm({ subject: "", body: "" });
            setShowMsgModal(true);
        } catch {
            alert("Failed to fetch students for message");
        }
    };

    /* ---------------------------------------------------------
       SEND MESSAGE TO ALL
    --------------------------------------------------------- */
    const sendMessage = async () => {
        if (!msgForm.subject.trim() || !msgForm.body.trim())
            return alert("Fill all fields");

        try {
            await API.post(`/employee/${user.id}/batch/${msgBatch.id}/message-all`, msgForm);

            alert("Message sent");
            setShowMsgModal(false);
        } catch {
            alert("Failed to send");
        }
    };

    /* ---------------------------------------------------------
       INIT LOAD
    --------------------------------------------------------- */
    useEffect(() => {
        fetchBatches();
    }, [fetchBatches]);

    /* ---------------------------------------------------------
       LOADING UI
    --------------------------------------------------------- */
    if (loading)
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ height: "60vh" }}>
                <Spinner animation="border" />
            </div>
        );

    return (

        <div className="p-3">
            <style>
                {`
  @media (max-width: 767px) {
    .batch-actions {
      display: flex;
      flex-direction: column;
      gap: 10px; /* GAP you asked for */
      width: 100%;
    }

    .batch-actions button {
      width: 100%; /* full width buttons for mobile */
    }
  }
`}
            </style>

            <h3 className="fw-bold mb-3 text-center text-md-start">Manage Batches</h3>

            {error && <Alert variant="danger">{error}</Alert>}

            {/* ---------------- BATCH TABLE ---------------- */}
            <Table bordered hover responsive className="shadow-sm">
                <thead className="table-dark">
                    <tr>
                        <th>Batch</th>
                        <th>Timings</th>
                        <th>Students</th>
                        <th>Actions</th>
                    </tr>
                </thead>

                <tbody>
                    {batches.length === 0 && (
                        <tr>
                            <td colSpan="4" className="text-center py-3 text-muted">
                                No batches assigned.
                            </td>
                        </tr>
                    )}

                    {batches.map((b) => (
                        <tr key={b.id}>
                            <td>{b.name}</td>
                            <td>
                                {b.startTime?.slice(0, 5)} - {b.endTime?.slice(0, 5)}
                            </td>
                            <td>
                                <Badge bg="primary">{b.students?.length || 0}</Badge>
                            </td>
                            <td className="text-nowrap batch-actions">
                                <Button
                                    size="sm"
                                    className="me-2 "
                                    variant="secondary"
                                    onClick={() => toggleExpand(b.id)}
                                >
                                    {expanded === b.id ? "Hide" : "View"}
                                </Button>

                                <Button
                                    size="sm"
                                    className="me-2"
                                    variant="outline-primary"
                                    onClick={() => openMsgModal(b)}
                                >
                                    Message All
                                </Button>

                                <Button
                                    size="sm"
                                    variant="success"
                                    onClick={() => openTaskModal(b)}
                                >
                                    Assign Task
                                </Button>
                            </td>


                        </tr>
                    ))}

                    {/* -------------- EXPAND STUDENTS ROW -------------- */}
                    {batches.map((b) =>
                        expanded === b.id ? (
                            <tr key={`expand-${b.id}`}>
                                <td colSpan="4" className="bg-light p-0">
                                    <Collapse in={expanded === b.id}>
                                        <div className="p-3">
                                            <h6 className="fw-bold mb-3">{b.name} — Students</h6>

                                            {students[b.id]?.length > 0 ? (
                                                <Card className="shadow-sm">
                                                    <Table bordered hover size="sm" responsive className="m-0">
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
                                                <p className="text-muted">No students in this batch.</p>
                                            )}
                                        </div>
                                    </Collapse>
                                </td>
                            </tr>
                        ) : null
                    )}
                </tbody>
            </Table>

            {/* ====================== TASK MODAL ====================== */}
            <Modal show={showTaskModal} onHide={() => setShowTaskModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Assign Task — {taskBatch?.name}</Modal.Title>
                </Modal.Header>

                <Modal.Body>
                    <Form>
                        <Form.Group className="mb-3">
                            <Form.Label>Task Type</Form.Label>
                            <Form.Select
                                value={taskForm.type}
                                onChange={(e) => setTaskForm({ ...taskForm, type: e.target.value })}
                                required
                            >
                                <option value="">Select Type</option>
                                <option value="ASSIGNMENT">Assignment</option>
                                <option value="PROJECT">Project</option>
                                <option value="DAILY_TASK">Daily Task</option>
                            </Form.Select>
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Task Title</Form.Label>
                            <Form.Control
                                value={taskForm.title}
                                onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                                placeholder="Enter title"
                                required
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Description</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={3}
                                value={taskForm.description}
                                onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                                placeholder="Write task details"
                                required
                            />
                        </Form.Group>

                        <Form.Group>
                            <Form.Label>Due Date</Form.Label>
                            <Form.Control
                                type="date"
                                value={taskForm.dueDate}
                                onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                                required
                            />
                        </Form.Group>

                        <div className="text-end mt-3">
                            <Button variant="secondary" className="me-2" onClick={() => setShowTaskModal(false)}>
                                Cancel
                            </Button>
                            <Button variant="primary" onClick={assignTask}>
                                Assign Task
                            </Button>
                        </div>
                    </Form>
                </Modal.Body>
            </Modal>

            {/* ====================== MESSAGE MODAL ====================== */}
            <Modal show={showMsgModal} onHide={() => setShowMsgModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Message All — {msgBatch?.name}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group className="mb-2">
                            <Form.Label>Subject</Form.Label>
                            <Form.Control
                                value={msgForm.subject}
                                onChange={(e) => setMsgForm({ ...msgForm, subject: e.target.value })}
                                placeholder="Message subject"
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Message</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={3}
                                value={msgForm.body}
                                onChange={(e) => setMsgForm({ ...msgForm, body: e.target.value })}
                                placeholder="Write message..."
                            />
                        </Form.Group>

                        <div className="text-end">
                            <Button variant="secondary" className="me-2" onClick={() => setShowMsgModal(false)}>
                                Cancel
                            </Button>
                            <Button variant="primary" onClick={sendMessage}>
                                Send Message
                            </Button>
                        </div>
                    </Form>
                </Modal.Body>
            </Modal>
        </div>
    );
}

export default TutorBatches;
