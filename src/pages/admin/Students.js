import { useState, useEffect } from "react";
import { Button, Modal, Form, Alert, Table } from "react-bootstrap";
import API from "../../api/api";

import Loader from "../../components/Loader";
import TableComponent from "../../components/TableComponent";
import FormModal from "../../components/FormModal";
import MessageModal from "../../components/MessageModal";

function Students() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [employees, setEmployees] = useState([]);


  const [showForm, setShowForm] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [formErrors, setFormErrors] = useState({});

  const [showViewModal, setShowViewModal] = useState(false);
  const [viewStudent, setViewStudent] = useState(null);

  const [showMsgModal, setShowMsgModal] = useState(false);
  const [recipients, setRecipients] = useState([]);

  const [showMessageAllModal, setShowMessageAllModal] = useState(false);
  const [msgAll, setMsgAll] = useState({ subject: "", body: "" });

  /* ------------------ FETCH STUDENTS ------------------ */
  const fetchStudents = async () => {
    try {
      const res = await API.get("/admin/students");
      setStudents(Array.isArray(res.data) ? res.data : []);
    } catch {
      setError("Failed to fetch students.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchEmployees = async () => {
  try {
    const res = await API.get("/admin/employees");
    setEmployees(res.data || []);
  } catch {
    console.log("Failed to fetch employees for validation");
  }
};
useEffect(() => {
  fetchEmployees();
}, []);

  /* ------------------ VALIDATION ------------------ */
  const validateStudent = (data) => {
  let errors = {};
  const clean = (v) => v?.trim() || "";

  // Helper: Check existence globally
  const idExistsInEmployees = employees.some(
    (e) => e.id === data.id && (!editingStudent || editingStudent.id !== data.id)
  );
  
  const emailExistsInEmployees = employees.some(
    (e) => e.email === data.email && (!editingStudent || editingStudent.email !== data.email)
  );

  const contactExistsInEmployees = employees.some(
    (e) => e.contact === data.contact && (!editingStudent || editingStudent.contact !== data.contact)
  );

  // ------------------ ID ------------------
  if (!clean(data.id)) {
    errors.id = "ID is required";
  } else {
    const existsInStudents = students.some(
      (s) => s.id === data.id && (!editingStudent || editingStudent.id !== data.id)
    );

    if (existsInStudents) errors.id = "ID already exists";
    if (idExistsInEmployees) errors.id = "ID already used by an employee";
  }

  // ------------------ NAME ------------------
  if (!clean(data.name)) errors.name = "Name is required";

  // ------------------ EMAIL ------------------
  if (!clean(data.email)) {
    errors.email = "Email is required";
  } else if (!/^\S+@\S+\.\S+$/.test(data.email)) {
    errors.email = "Invalid email format";
  } else {
    const existsInStudents = students.some(
      (s) =>
        s.email === data.email &&
        (!editingStudent || editingStudent.email !== data.email)
    );

    if (existsInStudents) errors.email = "Email already exists";
    if (emailExistsInEmployees) errors.email = "Email already used by an employee";
  }

  // ------------------ PASSWORD ------------------
  if (!editingStudent && !clean(data.password)) {
    errors.password = "Password is required";
  }

  // ------------------ CONTACT ------------------
  if (!clean(data.contact)) {
    errors.contact = "Contact is required";
  } else if (!/^[0-9]{10}$/.test(data.contact)) {
    errors.contact = "Contact must be 10 digits";
  } else {
    const existsInStudents = students.some(
      (s) =>
        s.contact === data.contact &&
        (!editingStudent || editingStudent.contact !== data.contact)
    );

    if (existsInStudents) errors.contact = "Contact already exists";
    if (contactExistsInEmployees) errors.contact = "Contact already used by an employee";
  }

  // ------------------ COURSE ------------------
  if (!clean(data.course)) errors.course = "Course is required";

  return errors;
};

  /* ------------------ OPEN FORM ------------------ */
  const openForm = (student = null) => {
    setEditingStudent(student);
    setFormErrors({});
    setShowForm(true);
  };

  /* ------------------ SAVE STUDENT ------------------ */
  const handleSaveStudent = async (data) => {
    const errors = validateStudent(data);
    setFormErrors(errors);

    if (Object.keys(errors).length > 0) return;

    try {
      if (editingStudent) {
        if (!data.password?.trim()) delete data.password;
        await API.put(`/admin/student/${editingStudent.id}`, data);
      } else {
        data.courseStatus = "ONGOING";
        await API.post("/admin/student", data);
      }

      setShowForm(false);
      fetchStudents();
    } catch {
      setFormErrors({ submit: "Failed to save student. Try again." });
    }
  };

  /* ------------------ DELETE STUDENT ------------------ */
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this student?")) return;

    try {
      await API.delete(`/admin/student/${id}`);
      fetchStudents();
    } catch {
      alert("Failed to delete student.");
    }
  };

  /* ------------------ VIEW STUDENT ------------------ */
  const handleViewStudent = async (s) => {
    try {
      const res = await API.get(`/admin/student/${s.id}`);
      setViewStudent(res.data);
    } catch {
      setViewStudent(s);
    }
    setShowViewModal(true);
  };

  /* ------------------ MESSAGE SELECTED ------------------ */
  const handleSendMessage = (list) => {
    setRecipients(
      list.map((s) => ({
        id: s.id,
        name: s.name,
        role: "STUDENT",
      }))
    );
    setShowMsgModal(true);
  };

  /* ------------------ MESSAGE ALL STUDENTS ------------------ */
  const sendMessageAll = async (e) => {
    e.preventDefault();

    if (!msgAll.subject.trim() || !msgAll.body.trim()) {
      alert("Fill all fields");
      return;
    }

    try {
      await API.post("/admin/message/send-all-students", msgAll);
      alert("Message sent to all students!");
      setShowMessageAllModal(false);
      setMsgAll({ subject: "", body: "" });
    } catch {
      alert("Failed to send messages.");
    }
  };

  /* ------------------ TABLE CONFIG ------------------ */
  const columns = [
    { key: "id", label: "ID" },
    { key: "name", label: "Name" },
    { key: "email", label: "Email" },
    { key: "contact", label: "Contact" },
    { key: "course", label: "Course" },
  ];

  const actions = (s) => (
    <div className="d-flex gap-2 flex-wrap">
      <Button size="sm" variant="secondary" onClick={() => handleViewStudent(s)}>
        View
      </Button>
      <Button size="sm" variant="info" onClick={() => openForm(s)}>
        Edit
      </Button>
      <Button
        size="sm"
        variant="outline-primary"
        onClick={() => handleSendMessage([s])}
      >
        Message
      </Button>
      <Button size="sm" variant="danger" onClick={() => handleDelete(s.id)}>
        Delete
      </Button>
    </div>
  );

  if (loading) return <Loader />;

  return (
    <div className="p-3">
      {/* HEADER */}
      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap">
        <h3 className="fw-bold">Manage Students</h3>

        <div className="d-flex gap-2 flex-wrap">
          <Button
            variant="outline-primary"
            onClick={() => setShowMessageAllModal(true)}
          >
            Message All
          </Button>
          <Button variant="primary" onClick={() => openForm()}>
            + Add Student
          </Button>
        </div>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      {/* TABLE */}
      <TableComponent columns={columns} data={students} actions={actions} />

      {/* FORM MODAL */}
      <FormModal
        show={showForm}
        onHide={() => {
          setShowForm(false);
          setFormErrors({});
        }}
        title={editingStudent ? "Edit Student" : "Add Student"}
        formFields={[
          { name: "id", label: "ID", type: "text", disabled: !!editingStudent },
          { name: "name", label: "Name", type: "text" },
          { name: "email", label: "Email", type: "email" },
          {
            name: "password",
            label: "Password",
            type: "password",
            placeholder: editingStudent ? "Leave blank to retain" : "",
          },
          { name: "contact", label: "Contact", type: "text" },
          { name: "course", label: "Course", type: "text" },
        ]}
        initialData={editingStudent || {}}
        onSubmit={handleSaveStudent}
        errors={formErrors}
      />

      {/* VIEW STUDENT */}
      {viewStudent && (
        <Modal
          show={showViewModal}
          onHide={() => setShowViewModal(false)}
          centered
          size="lg"
        >
          <Modal.Header closeButton>
            <Modal.Title>Student Details</Modal.Title>
          </Modal.Header>

          <Modal.Body style={{ maxHeight: "70vh", overflowY: "auto" }}>
            <h5 className="fw-bold mb-3">Student Info</h5>

            <p><strong>ID:</strong> {viewStudent.id}</p>
            <p><strong>Name:</strong> {viewStudent.name}</p>
            <p><strong>Email:</strong> {viewStudent.email}</p>
            <p><strong>Contact:</strong> {viewStudent.contact}</p>
            <p><strong>Course:</strong> {viewStudent.course}</p>
            <p><strong>Status:</strong> {viewStudent.courseStatus}</p>
            <p><strong>Certificate:</strong> {viewStudent.certificateIssued ? "Yes" : "No"}</p>

            <hr />
            <h5 className="fw-bold mb-3">Batches</h5>

            {viewStudent.batches?.length > 0 ? (
              <Table bordered hover responsive size="sm">
                <thead>
                  <tr>
                    <th>Batch</th>
                    <th>Start</th>
                    <th>End</th>
                    <th>Tutor</th>
                  </tr>
                </thead>
                <tbody>
                  {viewStudent.batches.map((b, i) => (
                    <tr key={i}>
                      <td>{b.name}</td>
                      <td>{b.startTime?.substring(0, 5)}</td>
                      <td>{b.endTime?.substring(0, 5)}</td>
                      <td>{b.tutorName} ({b.tutorId})</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            ) : (
              <p className="text-muted">No batches assigned.</p>
            )}

            <hr />
            <h5 className="fw-bold mb-3">Tasks</h5>

            {viewStudent.tasks?.length > 0 ? (
              <Table bordered hover responsive size="sm">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Description</th>
                    <th>Assigned By</th>
                    <th>Assigned</th>
                    <th>Due</th>
                    <th>Status</th>
                    <th>Marks</th>
                  </tr>
                </thead>
                <tbody>
                  {viewStudent.tasks.map((t, i) => (
                    <tr key={i}>
                      <td>{t.title}</td>
                      <td>{t.description}</td>
                      <td>{t.assignedBy}</td>
                      <td>{t.assignedDate}</td>
                      <td>{t.dueDate}</td>
                      <td>{t.status}</td>
                      <td>{t.marks}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            ) : (
              <p className="text-muted">No tasks assigned.</p>
            )}
          </Modal.Body>
        </Modal>
      )}

      {/* MESSAGE STUDENTS */}
      <MessageModal
        show={showMsgModal}
        onHide={() => setShowMsgModal(false)}
        recipients={recipients}
        senderRole="ADMIN"
      />

      {/* MESSAGE ALL */}
      <Modal
        show={showMessageAllModal}
        onHide={() => setShowMessageAllModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Message All Students</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <Form onSubmit={sendMessageAll}>
            <Form.Group className="mb-3">
              <Form.Label>Subject</Form.Label>
              <Form.Control
                value={msgAll.subject}
                onChange={(e) =>
                  setMsgAll({ ...msgAll, subject: e.target.value })
                }
              />
            </Form.Group>

            <Form.Group>
              <Form.Label>Message</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                value={msgAll.body}
                onChange={(e) =>
                  setMsgAll({ ...msgAll, body: e.target.value })
                }
              />
            </Form.Group>

            <div className="text-end mt-3">
              <Button
                variant="secondary"
                onClick={() => setShowMessageAllModal(false)}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" className="ms-2">
                Send
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </div>
  );
}

export default Students;
