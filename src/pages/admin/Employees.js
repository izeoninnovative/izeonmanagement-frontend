import { useState, useEffect } from "react";
import { Button, Alert, Modal, Form, Table } from "react-bootstrap";
import API from "../../api/api";

import Loader from "../../components/Loader";
import TableComponent from "../../components/TableComponent";
import FormModal from "../../components/FormModal";
import MessageModal from "../../components/MessageModal";

function Employees() {
  const [employees, setEmployees] = useState([]);
  const [students, setStudents] = useState([]); // <-- NEW
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [formErrors, setFormErrors] = useState({});

  const [showViewModal, setShowViewModal] = useState(false);
  const [viewEmployee, setViewEmployee] = useState(null);

  const [showMsgModal, setShowMsgModal] = useState(false);
  const [recipients, setRecipients] = useState([]);

  const [showMessageAllModal, setShowMessageAllModal] = useState(false);
  const [msgAll, setMsgAll] = useState({ subject: "", body: "" });

  // ---------------------- FETCH EMPLOYEES ----------------------
  const fetchEmployees = async () => {
    try {
      const res = await API.get("/admin/employees");
      setEmployees(res.data || []);
    } catch {
      setError("Failed to fetch employees.");
    } finally {
      setLoading(false);
    }
  };

  // ---------------------- FETCH STUDENTS (GLOBAL CHECK) ----------------------
  const fetchStudents = async () => {
    try {
      const res = await API.get("/admin/students");
      setStudents(res.data || []);
    } catch {
      console.log("Failed to load students for validation");
    }
  };

  useEffect(() => {
    fetchEmployees();
    fetchStudents(); // <-- IMPORTANT
  }, []);

  // ---------------------- VALIDATION ----------------------
  const validateEmployee = (data) => {
    let errors = {};
    const clean = (v) => v?.trim() || "";

    // GLOBAL CHECKS
    const idExistsStudents = students.some(
      (s) => s.id === data.id && (!editingEmployee || editingEmployee.id !== data.id)
    );

    const emailExistsStudents = students.some(
      (s) =>
        s.email === data.email &&
        (!editingEmployee || editingEmployee.email !== data.email)
    );

    const contactExistsStudents = students.some(
      (s) =>
        s.contact === data.contact &&
        (!editingEmployee || editingEmployee.contact !== data.contact)
    );

    // ---------------------- ID ----------------------
    if (!clean(data.id)) {
      errors.id = "ID is required";
    } else {
      const existsInEmp = employees.some(
        (emp) =>
          emp.id === data.id &&
          (!editingEmployee || editingEmployee.id !== data.id)
      );

      if (existsInEmp) errors.id = "ID already exists";
      if (idExistsStudents) errors.id = "ID already used by a student";
    }

    // ---------------------- NAME ----------------------
    if (!clean(data.name)) errors.name = "Name is required";

    // ---------------------- EMAIL ----------------------
    if (!clean(data.email)) {
      errors.email = "Email is required";
    } else if (!/^\S+@\S+\.\S+$/.test(data.email)) {
      errors.email = "Invalid email format";
    } else {
      const existsInEmp = employees.some(
        (emp) =>
          emp.email === data.email &&
          (!editingEmployee || editingEmployee.email !== data.email)
      );

      if (existsInEmp) errors.email = "Email already exists";
      if (emailExistsStudents)
        errors.email = "Email already used by a student";
    }

    // ---------------------- PASSWORD ----------------------
    if (!editingEmployee && !clean(data.password)) {
      errors.password = "Password is required";
    }

    // ---------------------- CONTACT ----------------------
    if (!clean(data.contact)) {
      errors.contact = "Contact is required";
    } else if (!/^[0-9]{10}$/.test(data.contact)) {
      errors.contact = "Contact must be 10 digits";
    } else {
      const existsInEmp = employees.some(
        (emp) =>
          emp.contact === data.contact &&
          (!editingEmployee || editingEmployee.contact !== data.contact)
      );

      if (existsInEmp) errors.contact = "Contact already exists";
      if (contactExistsStudents)
        errors.contact = "Contact already used by a student";
    }

    // ---------------------- ROLE ----------------------
    if (!clean(data.role)) errors.role = "Role is required";

    // ---------------------- DESIGNATION ----------------------
    if (!clean(data.designation))
      errors.designation = "Designation is required";

    return errors;
  };

  // ---------------------- OPEN FORM ----------------------
  const openForm = (emp = null) => {
    setEditingEmployee(emp);
    setFormErrors({});
    setShowForm(true);
  };

  // ---------------------- SAVE EMPLOYEE ----------------------
  const handleSaveEmployee = async (data) => {
    const errors = validateEmployee(data);
    setFormErrors(errors);

    if (Object.keys(errors).length > 0) return;

    try {
      if (editingEmployee) {
        if (!data.password?.trim()) delete data.password;
        await API.put(`/admin/employee/${editingEmployee.id}`, data);
      } else {
        await API.post("/admin/employee", data);
      }

      fetchEmployees();
      setShowForm(false);
    } catch {
      setFormErrors({ submit: "Failed to save employee. Please try again." });
    }
  };

  // ---------------------- DELETE EMPLOYEE ----------------------
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this employee?")) return;

    try {
      await API.delete(`/admin/employee/${id}`);
      fetchEmployees();
    } catch {
      alert("Failed to delete employee.");
    }
  };

  // ---------------------- VIEW EMPLOYEE ----------------------
  const handleViewEmployee = async (emp) => {
    try {
      const res = await API.get(`/admin/employee/${emp.id}`);
      setViewEmployee(res.data);
    } catch {
      setViewEmployee(emp);
    }
    setShowViewModal(true);
  };

  // ---------------------- SEND MESSAGE ----------------------
  const handleSendMessage = (list) => {
    setRecipients(
      list.map((e) => ({
        id: e.id,
        name: e.name,
        role: "EMPLOYEE",
      }))
    );

    setShowMsgModal(true);
  };

  // ---------------------- MESSAGE ALL ----------------------
  const sendMessageAll = async (e) => {
    e.preventDefault();

    if (!msgAll.subject.trim() || !msgAll.body.trim()) {
      alert("Fill all fields");
      return;
    }

    try {
      await API.post("/admin/message/send-all-employees", msgAll);
      alert("Message sent!");
      setShowMessageAllModal(false);
      setMsgAll({ subject: "", body: "" });
    } catch {
      alert("Failed to send messages.");
    }
  };

  const columns = [
    { key: "id", label: "ID" },
    { key: "name", label: "Name" },
    { key: "email", label: "Email" },
    { key: "contact", label: "Contact" },
    { key: "role", label: "Role" },
    { key: "designation", label: "Designation" },
  ];

  const actions = (e) => (
    <div className="d-flex gap-2 flex-wrap">
      <Button size="sm" variant="secondary" onClick={() => handleViewEmployee(e)}>
        View
      </Button>

      <Button size="sm" variant="info" onClick={() => openForm(e)}>
        Edit
      </Button>

      <Button
        size="sm"
        variant="outline-primary"
        onClick={() => handleSendMessage([e])}
      >
        Message
      </Button>

      <Button size="sm" variant="danger" onClick={() => handleDelete(e.id)}>
        Delete
      </Button>
    </div>
  );

  if (loading) return <Loader />;

  return (
    <div className="p-3">
      <div className="d-flex justify-content-between mb-3">
        <h3 className="fw-bold">Manage Employees</h3>

        <div className="d-flex gap-2">
          <Button variant="outline-primary" onClick={() => setShowMessageAllModal(true)}>
            Message All
          </Button>

          <Button variant="primary" onClick={() => openForm()}>
            + Add Employee
          </Button>
        </div>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      <TableComponent columns={columns} data={employees} actions={actions} />

      {/* FORM */}
      <FormModal
        show={showForm}
        onHide={() => {
          setShowForm(false);
          setFormErrors({});
        }}
        title={editingEmployee ? "Edit Employee" : "Add Employee"}
        formFields={[
          { name: "id", label: "ID", type: "text", disabled: !!editingEmployee },
          { name: "name", label: "Name", type: "text" },
          { name: "email", label: "Email", type: "email" },
          {
            name: "password",
            label: "Password",
            type: "password",
            placeholder: editingEmployee ? "Leave blank to retain" : "",
          },
          { name: "role", label: "Role", type: "text" },
          { name: "designation", label: "Designation", type: "text" },
          { name: "contact", label: "Contact", type: "text" },
        ]}
        initialData={editingEmployee || {}}
        onSubmit={handleSaveEmployee}
        errors={formErrors}
      />

      {/* VIEW */}
      {viewEmployee && (
        <Modal show={showViewModal} onHide={() => setShowViewModal(false)} centered size="lg">
          <Modal.Header closeButton>
            <Modal.Title>Employee Details</Modal.Title>
          </Modal.Header>

          <Modal.Body style={{ maxHeight: "70vh", overflowY: "auto" }}>
            <p><strong>ID:</strong> {viewEmployee.id}</p>
            <p><strong>Name:</strong> {viewEmployee.name}</p>
            <p><strong>Email:</strong> {viewEmployee.email}</p>
            <p><strong>Contact:</strong> {viewEmployee.contact}</p>
            <p><strong>Role:</strong> {viewEmployee.role}</p>
            <p><strong>Designation:</strong> {viewEmployee.designation}</p>

            {viewEmployee.role === "TUTOR" && (
              <>
                <hr />
                <h5>Assigned Batches</h5>

                {viewEmployee.batches?.length > 0 ? (
                  <Table bordered hover responsive size="sm">
                    <thead>
                      <tr>
                        <th>Batch</th>
                        <th>Start</th>
                        <th>End</th>
                        <th>Students</th>
                      </tr>
                    </thead>

                    <tbody>
                      {viewEmployee.batches.map((b, i) => (
                        <tr key={i}>
                          <td>{b.name}</td>
                          <td>{b.startTime?.substring(0, 5)}</td>
                          <td>{b.endTime?.substring(0, 5)}</td>
                          <td>{b.students?.length || 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                ) : (
                  <p className="text-muted">No batches assigned.</p>
                )}
              </>
            )}
          </Modal.Body>
        </Modal>
      )}

      <MessageModal show={showMsgModal} onHide={() => setShowMsgModal(false)} recipients={recipients} senderRole="ADMIN" />

      <Modal show={showMessageAllModal} onHide={() => setShowMessageAllModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Message All Employees</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <Form onSubmit={sendMessageAll}>
            <Form.Group className="mb-3">
              <Form.Label>Subject</Form.Label>
              <Form.Control
                value={msgAll.subject}
                onChange={(e) => setMsgAll({ ...msgAll, subject: e.target.value })}
              />
            </Form.Group>

            <Form.Group>
              <Form.Label>Message</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                value={msgAll.body}
                onChange={(e) => setMsgAll({ ...msgAll, body: e.target.value })}
              />
            </Form.Group>

            <div className="text-end mt-3">
              <Button variant="secondary" onClick={() => setShowMessageAllModal(false)}>
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

export default Employees;
