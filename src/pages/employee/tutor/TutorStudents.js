// TutorStudents.jsx
import React, { useCallback, useEffect, useState } from "react";
import { Table, Button, Spinner, Form, Modal, Badge, Row, Col } from "react-bootstrap";
import API from "../../../api/api";
import { useAuth } from "../../../context/AuthContext";

function TutorStudents() {
  const { user } = useAuth();

  const [batches, setBatches] = useState([]);
  const [students, setStudents] = useState([]);
  const [attendanceMap, setAttendanceMap] = useState({});

  const [selectedBatch, setSelectedBatch] = useState("ALL");
  const [loading, setLoading] = useState(true);

  // MODALS
  const [showMsgModal, setShowMsgModal] = useState(false);
  const [msgStudent, setMsgStudent] = useState(null);
  const [msgForm, setMsgForm] = useState({ subject: "", body: "" });

  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskStudent, setTaskStudent] = useState(null);
  const [taskBatchId, setTaskBatchId] = useState(null);
  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    type: "ASSIGNMENT",
    dueDate: "",
  });

  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [attendanceStudent, setAttendanceStudent] = useState(null);

  const today = new Date().toISOString().split("T")[0];

  const fetchBatches = useCallback(async () => {
    try {
      const res = await API.get(`/employee/${user.id}/batches`);
      setBatches(res.data || []);
    } catch (err) {
      console.error(err);
      alert("Failed to load batches");
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      if (selectedBatch === "ALL") {
        let combined = [];
        for (const batch of batches) {
          const res = await API.get(`/employee/${user.id}/batch/${batch.id}/students`);
          const mapped = res.data.map((s) => ({ ...s, batchId: batch.id, batchName: batch.name }));
          combined = [...combined, ...mapped];
        }
        setStudents(combined);
      } else {
        const batch = batches.find((b) => b.id === Number(selectedBatch));
        const res = await API.get(`/employee/${user.id}/batch/${selectedBatch}/students`);
        const mapped = res.data.map((s) => ({ ...s, batchId: batch.id, batchName: batch.name }));
        setStudents(mapped);
      }
    } catch {
      alert("Failed to load students");
    } finally {
      setLoading(false);
    }
  }, [selectedBatch, batches, user.id]);

  const fetchAttendanceForToday = useCallback(async () => {
    try {
      const res = await API.get(`/employee/${user.id}/attendance/${today}`);
      const map = {};
      res.data.forEach((a) => {
        if (!map[a.studentId]) map[a.studentId] = {};
        map[a.studentId][a.batchId] = a.present;
      });
      setAttendanceMap(map);
    } catch (err) {
      console.error("Failed to load attendance", err);
    }
  }, [today, user.id]);

  useEffect(() => {
    fetchBatches();
  }, [fetchBatches]);

  useEffect(() => {
    if (batches.length) fetchStudents();
  }, [batches, selectedBatch, fetchStudents]);

  useEffect(() => {
    if (students.length) fetchAttendanceForToday();
  }, [students, fetchAttendanceForToday]);

  // MESSAGE
  // --------------------------------------------
// MESSAGE — OPEN MODAL
// --------------------------------------------
const openMessageModal = (student) => {
  if (!student || !student.id) {
    alert("Invalid student selected");
    return;
  }

  setMsgStudent({ ...student }); // ensure full object is saved
  setMsgForm({ subject: "", body: "" });
  setShowMsgModal(true);
};

// --------------------------------------------
// MESSAGE — SEND
// --------------------------------------------
const sendMessage = async (e) => {
  e.preventDefault();

  const payload = {
    studentReceiver: { id: msgStudent.id },
    subject: msgForm.subject.trim(),
    body: msgForm.body.trim()
  };

  try {
    await API.post(`/employee/${user.id}/message/send`, payload);

    alert("Message sent!");
    setShowMsgModal(false);
  } catch (err) {
    console.error(err);
    alert("Failed to send message");
  }
};

  // TASK
  const openTaskModal = (student) => {
    setTaskStudent(student);
    setTaskBatchId(student.batchId);
    setTaskForm({ title: "", description: "", type: "ASSIGNMENT", dueDate: "" });
    setShowTaskModal(true);
  };

  const assignTask = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        title: (taskForm.title || "").trim(),
        description: (taskForm.description || "").trim(),
        type: (taskForm.type || "").trim(),
        dueDate: taskForm.dueDate,
      };

      await API.post(`/employee/${user.id}/batch/${taskBatchId}/student/${taskStudent.id}/task`, payload);
      alert("Task Assigned");
      setShowTaskModal(false);
    } catch (err) {
      console.error(err);
      alert("Failed to assign task");
    }
  };

  // ATTENDANCE
  const submitAttendance = async (presentStatus) => {
    try {
      await API.post(`/employee/${user.id}/batch/${attendanceStudent.batchId}/attendance`, {
        student: { id: attendanceStudent.id },
        date: today,
        present: presentStatus,
      });

      setAttendanceMap((prev) => ({
        ...prev,
        [attendanceStudent.id]: {
          ...(prev[attendanceStudent.id] || {}),
          [attendanceStudent.batchId]: presentStatus,
        },
      }));

      alert(`Marked: ${presentStatus ? "Present" : "Absent"}`);
      setShowAttendanceModal(false);
    } catch (err) {
      console.error(err);
      alert("Failed to mark attendance");
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
      <h3 className="fw-bold mb-3">My Students</h3>

      <Row className="mb-3">
        <Col md={4}>
          <Form.Select value={selectedBatch} onChange={(e) => setSelectedBatch(e.target.value)}>
            <option value="ALL">All Batches</option>
            {batches.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </Form.Select>
        </Col>
      </Row>

      <Table bordered hover responsive className="shadow-sm">
        <thead className="table-dark">
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Batch</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {students.length ? (
            students.map((s) => {
              const status = attendanceMap[s.id]?.[s.batchId];
              const isLocked = status !== undefined;

              return (
                <tr key={s.id + "-" + s.batchId}>
                  <td>{s.id}</td>
                  <td>{s.name}</td>
                  <td><Badge bg="info">{s.batchName}</Badge></td>
                  <td>
                    <div className="d-flex gap-2">
                      <Button size="sm" variant="outline-primary" onClick={() => openMessageModal(s)}>Message</Button>
                      <Button size="sm" variant="success" onClick={() => openTaskModal(s)}>Task</Button>
                      <Button
                        size="sm"
                        disabled={isLocked}
                        variant={status === true ? "success" : status === false ? "danger" : "warning"}
                        onClick={() => { setAttendanceStudent(s); setShowAttendanceModal(true); }}
                      >
                        {status === true ? "Present" : status === false ? "Absent" : "Mark"}
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })
          ) : (
            <tr><td colSpan={4} className="text-center text-muted">No students found</td></tr>
          )}
        </tbody>
      </Table>
{/* MESSAGE MODAL */}
<Modal show={showMsgModal} onHide={() => setShowMsgModal(false)} centered>
  <Modal.Header closeButton>
    <Modal.Title>
      Message → {msgStudent?.name} ({msgStudent?.id})
    </Modal.Title>
  </Modal.Header>

  <Modal.Body>
    <Form onSubmit={sendMessage}>
      <Form.Group className="mb-2">
        <Form.Label>Subject</Form.Label>
        <Form.Control
          value={msgForm.subject}
          onChange={(e) =>
            setMsgForm({ ...msgForm, subject: e.target.value })
          }
          placeholder="Enter subject"
          required
        />
      </Form.Group>

      <Form.Group className="mb-2">
        <Form.Label>Message</Form.Label>
        <Form.Control
          as="textarea"
          rows={4}
          value={msgForm.body}
          onChange={(e) =>
            setMsgForm({ ...msgForm, body: e.target.value })
          }
          placeholder="Write your message..."
          required
        />
      </Form.Group>

      <div className="text-end mt-3">
        <Button
          variant="secondary"
          className="me-2"
          onClick={() => setShowMsgModal(false)}
        >
          Cancel
        </Button>
        <Button type="submit" variant="primary">
          Send
        </Button>
      </div>
    </Form>
  </Modal.Body>
</Modal>

      {/* TASK MODAL */}
      <Modal show={showTaskModal} onHide={() => setShowTaskModal(false)} centered>
        <Modal.Header closeButton><Modal.Title>Assign Task → {taskStudent?.name}</Modal.Title></Modal.Header>
        <Modal.Body>
          <Form onSubmit={assignTask}>
            <Form.Group className="mb-2">
              <Form.Label>Title</Form.Label>
              <Form.Control value={taskForm.title} onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })} required />
            </Form.Group>

            <Form.Group className="mb-2">
              <Form.Label>Description</Form.Label>
              <Form.Control as="textarea" rows={3} value={taskForm.description} onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })} required />
            </Form.Group>

            <Form.Group className="mb-2">
              <Form.Label>Type</Form.Label>
              <Form.Select value={taskForm.type} onChange={(e) => setTaskForm({ ...taskForm, type: e.target.value })}>
                <option value="ASSIGNMENT">Assignment</option>
                <option value="HOMEWORK">Homework</option>
                <option value="TEST">Test</option>
                <option value="PROJECT">Project</option>
              </Form.Select>
            </Form.Group>

            <Form.Group>
              <Form.Label>Due Date</Form.Label>
              <Form.Control type="date" min={today} value={taskForm.dueDate} onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })} required />
            </Form.Group>

            <div className="text-end mt-3">
              <Button variant="secondary" onClick={() => setShowTaskModal(false)}>Cancel</Button>
              <Button type="submit" variant="success">Assign Task</Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* ATTENDANCE MODAL */}
      <Modal show={showAttendanceModal} onHide={() => setShowAttendanceModal(false)} centered>
        <Modal.Header closeButton><Modal.Title>Mark Attendance → {attendanceStudent?.name}</Modal.Title></Modal.Header>
        <Modal.Body className="text-center">
          <p className="fw-bold">Date: {today}</p>
          <p>Select status:</p>
          <div className="d-flex justify-content-around mt-3">
            <Button variant="success" onClick={() => submitAttendance(true)}>✔ Present</Button>
            <Button variant="danger" onClick={() => submitAttendance(false)}>✘ Absent</Button>
          </div>
        </Modal.Body>
      </Modal>
    </div>
  );
}

export default TutorStudents;
