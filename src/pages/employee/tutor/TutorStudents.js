// src/pages/employee/tutor/TutorStudents.jsx
import React, { useCallback, useEffect, useState } from "react";
import {
  Table,
  Button,
  Spinner,
  Form,
  Modal
} from "react-bootstrap";
import API from "../../../api/api";
import { useAuth } from "../../../context/AuthContext";

function TutorStudents() {
  const { user } = useAuth();

  const [batches, setBatches] = useState([]);
  const [students, setStudents] = useState([]);
  const [attendanceMap, setAttendanceMap] = useState({});
  const [selectedBatch, setSelectedBatch] = useState("ALL");
  const [loading, setLoading] = useState(true);

  /* ---------------- MODALS ---------------- */
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

  /* ---------------- CSS ---------------- */
  const styles = `
@import url('https://fonts.googleapis.com/css2?family=Salsa:wght@400;700&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&display=swap');

* {
  font-family: 'Instrument Sans', sans-serif !important;
}

.page-title {
  font-size: 36px;
  font-weight: 700;
  text-align: center;
  margin-bottom: 25px;
  font-family: 'Salsa', cursive !important;
  color: #000;
}

.blue-header th {
  background: #136CED !important;
  color: white !important;
  font-size: 18px;
  text-align: center;
  padding: 14px;
  border: 1px solid #000 !important;
  font-family: 'Salsa', cursive !important;
}

.students-table td {
  border: 1px solid #000 !important;
  padding: 12px;
  text-align: center;
  font-size: 16px;
}

.btn-task {
  background: #E0E0E0;
  border: none;
  padding: 6px 14px;
  border-radius: 8px;
  font-weight: 500;
}

.btn-message {
  background: #fff;
  border: 2px solid #000;
  padding: 6px 14px;
  border-radius: 8px;
  color: #136CED;
  font-weight: 500;
}

.btn-attendance {
  background: #34C759;
  border: none;
  padding: 6px 14px;
  border-radius: 8px;
  font-weight: 500;
  color: white;
}

/* ==================== MODAL (FIGMA STYLE) ==================== */
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
}

.custom-title {
  font-size: 22px;
  font-family: 'Salsa', cursive !important;
  font-weight: 700;
  color: #136CED;
}

.custom-close {
  color: #FF383C;
  font-size: 26px;
  font-weight: 700;
  cursor: pointer;
}

.custom-body {
  padding: 18px 22px;
  overflow-y: auto;
  flex-grow: 1;
}

.custom-label {
  font-size: 15px;
  font-weight: 600;
}

.custom-input,
.custom-textarea,
.custom-select {
  border-radius: 12px !important;
  border: 1.4px solid #d1d1d1 !important;
  padding: 10px !important;
  font-size: 15px !important;
}

.custom-textarea {
  min-height: 100px;
}

.custom-footer {
  padding: 14px 22px 22px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.modal-cancel-btn {
  padding: 12px;
  width: 100%;
  background: #fff;
  border: 1.4px solid #d1d1d1;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  color: #136CED;
}

.modal-submit-btn {
  padding: 14px;
  width: 100%;
  background: #34C759;
  border-radius: 12px;
  font-size: 17px;
  font-weight: 700;
  color: white;
  border: none;
}

/* Attendance Buttons */
.modal-present-btn {
  width: 45%;
  padding: 14px;
  background: #34C759;
  border-radius: 12px;
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  border: none;
}

.modal-absent-btn {
  width: 45%;
  padding: 14px;
  background: #FF383C;
  border-radius: 12px;
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  border: none;
}

/* Mobile fix */
@media (max-width: 576px) {
  .custom-modal .modal-dialog {
    max-width: 94%;
    height: 86vh;
  }
  .custom-modal .modal-content {
    max-height: 86vh;
  }
  .custom-body {
    max-height: calc(86vh - 260px);
  }
}
`;

  /* ---------------- API CALLS ---------------- */
  const fetchBatches = useCallback(async () => {
    try {
      const res = await API.get(`/employee/${user.id}/batches`);
      setBatches(res.data || []);
    } catch {
      alert("Failed to load batches");
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      if (selectedBatch === "ALL") {
        let all = [];
        for (const b of batches) {
          const res = await API.get(`/employee/${user.id}/batch/${b.id}/students`);
          const mapped = res.data.map((s) => ({ ...s, batchId: b.id, batchName: b.name }));
          all = [...all, ...mapped];
        }
        setStudents(all);
      } else {
        const batch = batches.find((x) => x.id === Number(selectedBatch));
        const res = await API.get(`/employee/${user.id}/batch/${batch.id}/students`);
        const mapped = res.data.map((s) => ({ ...s, batchId: batch.id, batchName: batch.name }));
        setStudents(mapped);
      }
    } catch {
      alert("Failed to load students");
    } finally {
      setLoading(false);
    }
  }, [selectedBatch, batches, user.id]);

  const fetchAttendance = useCallback(async () => {
    try {
      const res = await API.get(`/employee/${user.id}/attendance/${today}`);
      const map = {};
      res.data.forEach((a) => {
        if (!map[a.studentId]) map[a.studentId] = {};
        map[a.studentId][a.batchId] = a.present;
      });
      setAttendanceMap(map);
    } catch { }
  }, [today, user.id]);

  useEffect(() => {
    fetchBatches();
  }, [fetchBatches]);

  useEffect(() => {
    if (batches.length) fetchStudents();
  }, [batches, selectedBatch, fetchStudents]);

  useEffect(() => {
    if (students.length) fetchAttendance();
  }, [students, fetchAttendance]);

  /* ---------------- MESSAGE ---------------- */
  const openMessageModal = (student) => {
    setMsgStudent(student);
    setMsgForm({ subject: "", body: "" });
    setShowMsgModal(true);
  };

  const sendMessage = async () => {
    const payload = {
      studentReceiver: { id: msgStudent.id },
      subject: msgForm.subject.trim(),
      body: msgForm.body.trim(),
    };

    try {
      await API.post(`/employee/${user.id}/message/send`, payload);
      alert("Message sent!");
      setShowMsgModal(false);
    } catch {
      alert("Failed to send message");
    }
  };

  /* ---------------- TASK ---------------- */
  const openTaskModal = (student) => {
    setTaskStudent(student);
    setTaskBatchId(student.batchId);
    setTaskForm({
      title: "",
      description: "",
      type: "ASSIGNMENT",
      dueDate: "",
    });
    setShowTaskModal(true);
  };

  const assignTask = async () => {
    try {
      await API.post(
        `/employee/${user.id}/batch/${taskBatchId}/student/${taskStudent.id}/task`,
        taskForm
      );
      alert("Task Assigned!");
      setShowTaskModal(false);
    } catch {
      alert("Failed to assign task");
    }
  };

  /* ---------------- ATTENDANCE ---------------- */
  const submitAttendance = async (present) => {
    try {
      await API.post(
        `/employee/${user.id}/batch/${attendanceStudent.batchId}/attendance`,
        {
          student: { id: attendanceStudent.id },
          date: today,
          present,
        }
      );

      setAttendanceMap((prev) => ({
        ...prev,
        [attendanceStudent.id]: {
          ...(prev[attendanceStudent.id] || {}),
          [attendanceStudent.batchId]: present,
        },
      }));

      setShowAttendanceModal(false);
    } catch {
      alert("Failed to update attendance");
    }
  };

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

      <h2 className="page-title">My Students</h2>

      {/* BATCH FILTER */}
      <Form.Select
        className="select-batch mb-3"
        value={selectedBatch}
        onChange={(e) => setSelectedBatch(e.target.value)}
      >
        <option value="ALL">All Batches</option>
        {batches.map((b) => (
          <option key={b.id} value={b.id}>{b.name}</option>
        ))}
      </Form.Select>

      {/* TABLE */}
      <Table bordered responsive className="students-table shadow-sm">
        <thead className="blue-header">
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
              return (
                <tr key={s.id + "-" + s.batchId}>
                  <td>{s.id}</td>
                  <td>{s.name}</td>
                  <td>{s.batchName}</td>

                  <td>
                    <div className="d-flex gap-2 justify-content-center">

                      <button className="btn-task" onClick={() => openTaskModal(s)}>Task</button>

                      <button className="btn-message" onClick={() => openMessageModal(s)}>Message</button>

                      {status !== undefined ? (
                        <button
                          className="btn-attendance"
                          style={{ background: "#A9A9A9", cursor: "not-allowed" }}
                          disabled
                        >
                          Marked
                        </button>
                      ) : (
                        <button
                          className="btn-attendance"
                          onClick={() => {
                            setAttendanceStudent(s);
                            setShowAttendanceModal(true);
                          }}
                        >
                          Attendance
                        </button>
                      )}


                    </div>
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan="4" className="text-center text-muted py-4">
                No students found.
              </td>
            </tr>
          )}
        </tbody>
      </Table>

      {/* ===================== MESSAGE MODAL ===================== */}
      <Modal show={showMsgModal} onHide={() => setShowMsgModal(false)} centered dialogClassName="custom-modal">
        <div className="custom-header">
          <div className="custom-title">Message → {msgStudent?.name}</div>
          <span className="custom-close" onClick={() => setShowMsgModal(false)}>×</span>
        </div>

        <div className="custom-body">
          <Form>
            <Form.Group>
              <Form.Label className="custom-label">Subject</Form.Label>
              <Form.Control className="custom-input"
                value={msgForm.subject}
                onChange={(e) => setMsgForm({ ...msgForm, subject: e.target.value })}
              />
            </Form.Group>

            <Form.Group className="mt-3">
              <Form.Label className="custom-label">Message</Form.Label>
              <Form.Control as="textarea" className="custom-textarea"
                value={msgForm.body}
                onChange={(e) => setMsgForm({ ...msgForm, body: e.target.value })}
              />
            </Form.Group>
          </Form>
        </div>

        <div className="custom-footer">
          <Button className="modal-cancel-btn" onClick={() => setShowMsgModal(false)}>Cancel</Button>
          <Button className="modal-submit-btn" onClick={sendMessage}>Send Message</Button>
        </div>
      </Modal>

      {/* ===================== TASK MODAL ===================== */}
      <Modal show={showTaskModal} onHide={() => setShowTaskModal(false)} centered dialogClassName="custom-modal">
        <div className="custom-header">
          <div className="custom-title">Assign Task → {taskStudent?.name}</div>
          <span className="custom-close" onClick={() => setShowTaskModal(false)}>×</span>
        </div>

        <div className="custom-body">
          <Form>
            <Form.Group>
              <Form.Label className="custom-label">Task Title</Form.Label>
              <Form.Control className="custom-input"
                value={taskForm.title}
                onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
              />
            </Form.Group>

            <Form.Group className="mt-3">
              <Form.Label className="custom-label">Description</Form.Label>
              <Form.Control as="textarea" className="custom-textarea"
                value={taskForm.description}
                onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
              />
            </Form.Group>

            <Form.Group className="mt-3">
              <Form.Label className="custom-label">Type</Form.Label>
              <Form.Select className="custom-input"
                value={taskForm.type}
                onChange={(e) => setTaskForm({ ...taskForm, type: e.target.value })}
              >
                <option value="ASSIGNMENT">Assignment</option>
                <option value="PROJECT">Project</option>
                <option value="HOMEWORK">Homework</option>
                <option value="TEST">Test</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mt-3">
              <Form.Label className="custom-label">Due Date</Form.Label>
              <Form.Control type="date" className="custom-input"
                value={taskForm.dueDate}
                onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
              />
            </Form.Group>
          </Form>
        </div>

        <div className="custom-footer">
          <Button className="modal-cancel-btn" onClick={() => setShowTaskModal(false)}>Cancel</Button>
          <Button className="modal-submit-btn" onClick={assignTask}>Assign Task</Button>
        </div>
      </Modal>

      {/* ===================== ATTENDANCE MODAL ===================== */}
      <Modal show={showAttendanceModal} onHide={() => setShowAttendanceModal(false)} centered dialogClassName="custom-modal">
        <div className="custom-header">
          <div className="custom-title">Mark Attendance → {attendanceStudent?.name}</div>
          <span className="custom-close" onClick={() => setShowAttendanceModal(false)}>×</span>
        </div>

        <div className="custom-body text-center">
          <p className="fw-bold">Date: {today}</p>

          <div className="d-flex justify-content-around mt-4">
            <button className="modal-present-btn" onClick={() => submitAttendance(true)}>✔ Present</button>
            <button className="modal-absent-btn" onClick={() => submitAttendance(false)}>✘ Absent</button>
          </div>
        </div>

        <div className="custom-footer">
          <Button className="modal-cancel-btn" onClick={() => setShowAttendanceModal(false)}>
            Close
          </Button>
        </div>
      </Modal>

    </div>
  );
}

export default TutorStudents;
