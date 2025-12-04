// src/pages/admin/Students.jsx
import { useState, useEffect, useCallback } from "react";
import { Button, Modal, Form, Alert, Table } from "react-bootstrap";
import API from "../../api/api";

import Loader from "../../components/Loader";
import MessageModal from "../../components/MessageModal";
import TableComponent from "../../components/TableComponent";

function Students() {
  const [students, setStudents] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");

  // Add / Edit modal
  const [showForm, setShowForm] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [formData, setFormData] = useState({
    id: "",
    name: "",
    email: "",
    password: "",
    contact: "",
    course: "",
  });
  const [formErrors, setFormErrors] = useState({});

  // View modal
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewStudent, setViewStudent] = useState(null);

  // Single message modal (existing reusable component)
  const [showMsgModal, setShowMsgModal] = useState(false);
  const [recipients, setRecipients] = useState([]);

  // Message ALL modal (custom figma UI)
  const [showMessageAllModal, setShowMessageAllModal] = useState(false);
  const [msgAll, setMsgAll] = useState({ subject: "", body: "" });

  /* ---------------- GOOGLE FONTS (Salsa, Instrument Sans, Inclusive Sans) ---------------- */
  const fontStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Salsa&display=swap');
  @import url('https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&display=swap');
  @import url('https://fonts.googleapis.com/css2?family=Inclusive+Sans:wght@400;600&display=swap');
  `;

  /* ---------------- FETCH HELPERS ---------------- */
  const fetchStudents = useCallback(async () => {
    try {
      const res = await API.get("/admin/students");
      setStudents(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to fetch students", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchEmployees = useCallback(async () => {
    try {
      const res = await API.get("/admin/employees");
      setEmployees(res.data || []);
    } catch (err) {
      console.error("Failed to fetch employees for validation", err);
    }
  }, []);

  /* ---------------- EFFECT: Fonts + initial data ---------------- */
  useEffect(() => {
    const styleElement = document.createElement("style");
    styleElement.innerHTML = fontStyles;
    document.head.appendChild(styleElement);

    fetchStudents();
    fetchEmployees();

    return () => {
      document.head.removeChild(styleElement);
    };
  }, [fontStyles, fetchStudents, fetchEmployees]);

  /* ---------------- VALIDATION ---------------- */
  const validateStudent = (data) => {
    let errors = {};
    const clean = (v) => v?.trim() || "";

    const idExistsInEmployees = employees.some(
      (e) => e.id === data.id && (!editingStudent || editingStudent.id !== data.id)
    );

    const emailExistsInEmployees = employees.some(
      (e) =>
        e.email === data.email &&
        (!editingStudent || editingStudent.email !== data.email)
    );

    const contactExistsInEmployees = employees.some(
      (e) =>
        e.contact === data.contact &&
        (!editingStudent || editingStudent.contact !== data.contact)
    );

    // ID
    if (!clean(data.id)) {
      errors.id = "ID is required";
    } else {
      const existsInStudents = students.some(
        (s) =>
          s.id === data.id &&
          (!editingStudent || editingStudent.id !== data.id)
      );
      if (existsInStudents) errors.id = "ID already exists";
      if (idExistsInEmployees) errors.id = "ID already used by an employee";
    }

    // NAME
    if (!clean(data.name)) errors.name = "Name is required";

    // EMAIL
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
      if (emailExistsInEmployees)
        errors.email = "Email already used by an employee";
    }

    // PASSWORD
    if (!editingStudent && !clean(data.password)) {
      errors.password = "Password is required";
    }

    // CONTACT
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
      if (contactExistsInEmployees)
        errors.contact = "Contact already used by an employee";
    }

    // COURSE
    if (!clean(data.course)) errors.course = "Course is required";

    return errors;
  };

  /* ---------------- OPEN ADD / EDIT MODAL ---------------- */
  const openForm = (student = null) => {
    setEditingStudent(student);
    setFormErrors({});
    if (student) {
      setFormData({
        id: student.id || "",
        name: student.name || "",
        email: student.email || "",
        password: "",
        contact: student.contact || "",
        course: student.course || "",
      });
    } else {
      setFormData({
        id: "",
        name: "",
        email: "",
        password: "",
        contact: "",
        course: "",
      });
    }
    setShowForm(true);
  };

  /* ---------------- SAVE STUDENT ---------------- */
  const handleSaveStudent = async (e) => {
    e.preventDefault();
    const errors = validateStudent(formData);
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    const finalData = {
      ...formData,
      id: formData.id.trim(),
      name: formData.name.trim(),
      email: formData.email.trim(),
      contact: formData.contact.trim(),
      course: formData.course.trim(),
    };

    try {
      if (editingStudent) {
        if (!finalData.password?.trim()) delete finalData.password;
        await API.put(`/admin/student/${editingStudent.id}`, finalData);
      } else {
        finalData.courseStatus = "ONGOING";
        await API.post("/admin/student", finalData);
      }
      await fetchStudents();
      setShowForm(false);
    } catch (err) {
      console.error("Failed to save student", err);
      setFormErrors({ submit: "Failed to save student. Try again." });
    }
  };

  /* ---------------- DELETE STUDENT ---------------- */
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this student?")) return;

    try {
      await API.delete(`/admin/student/${id}`);
      await fetchStudents();
    } catch {
      alert("Failed to delete student.");
    }
  };

  /* ---------------- VIEW STUDENT ---------------- */
  const handleViewStudent = async (s) => {
    try {
      const res = await API.get(`/admin/student/${s.id}`);
      setViewStudent(res.data);
    } catch {
      setViewStudent(s);
    }
    setShowViewModal(true);
  };

  /* ---------------- MESSAGE SELECTED ---------------- */
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

  /* ---------------- MESSAGE ALL STUDENTS ---------------- */
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

  /* ---------------- FILTER (ID, NAME, EMAIL, CONTACT, COURSE, STATUS...) ---------------- */
  const filteredStudents = students.filter((s) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();

    return (
      s.id?.toString().toLowerCase().includes(q) ||
      s.name?.toLowerCase().includes(q) ||
      s.email?.toLowerCase().includes(q) ||
      s.contact?.toString().toLowerCase().includes(q) ||
      s.course?.toLowerCase().includes(q) ||
      s.courseStatus?.toLowerCase().includes(q)
    );
  });

  /* ---------------- TABLE CONFIG ---------------- */
  const columns = [
    { key: "id", label: "ID" },
    { key: "name", label: "Name" },
    { key: "email", label: "Email" },
    { key: "contact", label: "Contact" },
    { key: "course", label: "Course" },
  ];

  const actions = (s) => (
    <div className="d-flex gap-2 flex-wrap">
      <Button
        size="sm"
        style={{ background: "#5B5B5B", borderColor: "#5B5B5B", color: "#fff" }}
        onClick={() => handleViewStudent(s)}
      >
        View
      </Button>

      <Button
        size="sm"
        style={{
          background: "#FFCC00",
          borderColor: "#FFCC00",
          color: "#000",
          fontWeight: "600",
        }}
        onClick={() => openForm(s)}
      >
        Edit
      </Button>

      <Button
        size="sm"
        style={{
          background: "#FFFFFF",
          borderColor: "#000000",
          color: "#136CED",
          fontWeight: "600",
        }}
        onClick={() => handleSendMessage([s])}
      >
        Message
      </Button>

      <Button
        size="sm"
        style={{ background: "#FF383C", borderColor: "#FF383C", color: "#fff" }}
        onClick={() => handleDelete(s.id)}
      >
        Delete
      </Button>
    </div>
  );

  if (loading) return <Loader />;

  return (
    <div className="p-3">
      <style>{`

/* ============================================================= */
/*                     🔵 GLOBAL PAGE STYLES                     */
/* ============================================================= */

.heading-main {
  font-size: 34px;
  font-weight: 700;
  text-align: center;
  margin-bottom: 25px;
  font-family: 'Salsa', cursive;
}

.search-box {
  width: 340px;
  height: 48px;
  border-radius: 12px;
  border: 1.4px solid #BEBEBE;
  padding: 10px 16px;
  font-size: 16px;
  font-family: 'Salsa', cursive;
}

.search-box::placeholder {
  color: #9A9A9A;
}

.msg-all-btn {
  border-radius: 12px;
  border: 1.4px solid #000;
  color: #136CED;
  font-weight: 600;
  padding: 10px 18px;
  background: #fff;
  font-family: 'Instrument Sans', sans-serif;
}

.add-btn {
  border-radius: 12px;
  background: #136CED;
  font-weight: 600;
  padding: 10px 18px;
  border: none;
  font-family: 'Instrument Sans', sans-serif;
}


/* ============================================================= */
/*             🔵 RESPONSIVE — PAGE HEADER (SEARCH AREA)         */
/* ============================================================= */

@media (max-width: 992px) {
  .search-actions-wrapper {
    flex-direction: column;
    gap: 12px;
  }

  .search-box {
    width: 100%;
  }

  .top-actions-right {
    width: 100%;
    justify-content: space-between;
  }
}


/* ============================================================= */
/*                   🔵 GENERAL FIGMA MODALS                     */
/*            (Add/Edit Student • Message All • etc.)            */
/* ============================================================= */

.figma-modal .modal-content {
  border-radius: 16px;
  border: 1.6px solid #000;
  font-family: 'Instrument Sans', sans-serif;
}

.figma-modal-header {
  border-bottom: 1px solid #DADADA;
  padding: 12px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.figma-modal-title {
  font-size: 24px;
  font-weight: 700;
  color: #136CED;
  font-family: 'Salsa', cursive;
}

.figma-close {
  font-size: 22px;
  cursor: pointer;
  color: #ff383c;
  line-height: 1;
}

.figma-modal-body {
  padding: 20px 26px 10px;
}

.figma-modal-footer {
  padding: 16px 26px 22px;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

/* Inputs */
.figma-label {
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 4px;
}

.figma-input {
  border-radius: 8px;
  border: 1px solid #D0D0D0;
  font-size: 14px;
  padding: 8px 10px;
}

/* Buttons */
.figma-primary {
  background: #136CED
  border-radius: 10px;
  border: none;
  padding: 8px 26px;
  font-weight: 600;
}

.figma-ghost {
  background: #fff;
  border-radius: 10px;
  border: 1px solid #BEBEBE;
  padding: 8px 26px;
  font-weight: 500;
  color: #333;
}


/* ============================================================= */
/*   🔵 RESPONSIVE FIX — ADD/EDIT STUDENT MODAL (Mobile Only)    */
/* ============================================================= */

@media (max-width: 992px) {

  .figma-modal .modal-dialog {
    max-width: 85% !important;
    margin: 0 auto;
  }

  .figma-modal .modal-content {
    max-height: 75vh !important;
    overflow-y: auto !important;
    padding: 0 !important;
  }

  .figma-modal-header {
    padding: 12px 16px !important;
  }

  .figma-modal-title {
    font-size: 18px !important;
  }

  .figma-modal-body {
    padding: 14px 16px !important;
  }

  .figma-input {
    font-size: 13px !important;
    padding: 6px 8px !important;
  }

  .figma-modal-footer {
    flex-direction: column !important;
    padding: 14px 16px !important;
    gap: 8px;
  }

  .figma-primary,
  .figma-ghost {
    width: 100% !important;
    padding: 10px !important;
  }
}


/* ============================================================= */
/*                 🔵 STUDENT VIEW MODAL — MAIN CARD             */
/* ============================================================= */

.student-view-modal .modal-dialog {
  max-width: 900px !important;
}

.student-view-modal .modal-content {
  background: transparent;
  border: none;
  font-family: 'Instrument Sans', sans-serif;
}

.student-detail-card {
  background: #ffffff;
  border-radius: 16px;
  border: 1.6px solid #000;
  padding: 0;
  overflow: hidden;
}

/* Header row with title + close */
.student-detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 24px;
  border-bottom: 1px solid #DADADA;
}

.student-detail-title {
  flex: 1;
  text-align: center;
  font-size: 26px;
  color: #136CED;
  font-weight: 700;
  font-family: 'Salsa', cursive;
}

.student-detail-close {
  font-size: 24px;
  color: #FF383C;
  cursor: pointer;
  font-weight: 700;
  border: none;
  background: transparent;
}

/* Body */
.student-detail-body {
  padding: 18px 26px 24px;
}

.student-info-title {
  font-size: 20px;
  font-weight: 600;
  text-align: center;
  margin-bottom: 18px;
}

/* Info grid */
.student-info-grid {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  margin-bottom: 16px;
}

.student-info-col {
  flex: 1;
  min-width: 230px;
  font-size: 15px;
}

/* Certificate badge */
.certificate-badge-wrapper {
  display: flex;
  justify-content: center;
  margin: 12px 0 18px;
}

.certificate-badge {
  padding: 8px 28px;
  background: #136CED;
  border-radius: 8px;
  border: none;
  color: #fff;
  font-weight: 600;
}

/* Section titles */
.student-section-divider {
  margin: 12px 0 16px;
  border-color: #000;
}

.student-section-title {
  font-size: 18px;
  font-weight: 600;
  text-align: center;
  margin-bottom: 10px;
}

/* Tables */
.student-table {
  font-size: 14px;
}

.student-table thead th {
  background: #136CED;
  color: #ffffff;
  text-align: center;
  border-color: #ffffff;
  font-family: 'Salsa', cursive;
}

.student-table tbody td {
  vertical-align: middle;
  border-color: #E0E0E0;
  font-family: 'Instrument Sans', sans-serif;
}

/* Task status colors */
.task-status-completed {
  color: #1CA14F;
  font-weight: 600;
}

/* Mobile tweaks */
@media (max-width: 576px) {
  .student-view-modal .modal-dialog {
    max-width: 94% !important;
  }

  .student-detail-body {
    padding: 16px 14px 20px;
  }

  .student-detail-title {
    font-size: 22px;
  }

  .student-info-col {
    min-width: 100%;
  }

  .student-table {
    font-size: 13px;
  }
}

`}</style>

      {/* =================== HEADING =================== */}
      <div className="heading-main">Manage Students</div>

      {/* =================== SEARCH + ACTIONS =================== */}
      <div className="d-flex justify-content-between align-items-center flex-wrap search-actions-wrapper mb-3">
        <input
          className="search-box"
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className="d-flex gap-3 mt-2 mt-md-0 top-actions-right">
          <Button
            className="msg-all-btn"
            onClick={() => setShowMessageAllModal(true)}
          >
            Message All
          </Button>

          <Button className="add-btn" onClick={() => openForm()}>
            + Add Student
          </Button>
        </div>
      </div>

      {formErrors.page && <Alert variant="danger">{formErrors.page}</Alert>}

      {/* =================== TABLE =================== */}
      <TableComponent columns={columns} data={filteredStudents} actions={actions} />

      {/* ===================================================================== */}
      {/*                            ADD / EDIT MODAL                          */}
      {/* ===================================================================== */}
      <Modal
        show={showForm}
        onHide={() => setShowForm(false)}
        centered
        dialogClassName="figma-modal"
      >
        <div className="figma-modal-header">
          <div className="figma-modal-title">
            {editingStudent ? "Edit Student" : "Add Students"}
          </div>
          <span className="figma-close" onClick={() => setShowForm(false)}>
            ×
          </span>
        </div>

        <Form onSubmit={handleSaveStudent}>
          <div className="figma-modal-body">
            <div className="row">
              {/* LEFT COLUMN */}
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label className="figma-label">Student ID</Form.Label>
                  <Form.Control
                    className="figma-input"
                    placeholder="Enter ID (S101, S102)"
                    type="text"
                    value={formData.id}
                    disabled={!!editingStudent}
                    onChange={(e) =>
                      setFormData({ ...formData, id: e.target.value })
                    }
                  />
                  {formErrors.id && (
                    <small className="text-danger">{formErrors.id}</small>
                  )}
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label className="figma-label">Email</Form.Label>
                  <Form.Control
                    className="figma-input"
                    placeholder="Enter Email"
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                  />
                  {formErrors.email && (
                    <small className="text-danger">{formErrors.email}</small>
                  )}
                </Form.Group>

                <Form.Group className="mb-2">
                  <Form.Label className="figma-label">Contact No</Form.Label>
                  <Form.Control
                    className="figma-input"
                    placeholder="Enter Contact No"
                    type="text"
                    value={formData.contact}
                    onChange={(e) =>
                      setFormData({ ...formData, contact: e.target.value })
                    }
                  />
                  {formErrors.contact && (
                    <small className="text-danger">{formErrors.contact}</small>
                  )}
                </Form.Group>
              </div>

              {/* RIGHT COLUMN */}
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label className="figma-label">Name</Form.Label>
                  <Form.Control
                    className="figma-input"
                    placeholder="Enter Student Name"
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                  />
                  {formErrors.name && (
                    <small className="text-danger">{formErrors.name}</small>
                  )}
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label className="figma-label">Password</Form.Label>
                  <Form.Control
                    className="figma-input"
                    placeholder={
                      editingStudent ? "Leave blank to retain" : "Enter Password"
                    }
                    type="password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                  />
                  {formErrors.password && (
                    <small className="text-danger">
                      {formErrors.password}
                    </small>
                  )}
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label className="figma-label">Course</Form.Label>
                  <Form.Control
                    className="figma-input"
                    placeholder="Enter Course"
                    type="text"
                    value={formData.course}
                    onChange={(e) =>
                      setFormData({ ...formData, course: e.target.value })
                    }
                  />
                  {formErrors.course && (
                    <small className="text-danger">{formErrors.course}</small>
                  )}
                </Form.Group>
              </div>
            </div>

            {formErrors.submit && (
              <div className="text-danger mt-2">{formErrors.submit}</div>
            )}
          </div>

          <div className="figma-modal-footer">
            <Button
              type="button"
              className="figma-ghost"
              onClick={() => setShowForm(false)}
            >
              Cancel
            </Button>
            <Button type="submit" className="figma-primary">
              Save
            </Button>
          </div>
        </Form>
      </Modal>

      {/* ===================================================================== */}
      {/*                            VIEW STUDENT MODAL                        */}
      {/* ===================================================================== */}
      {viewStudent && (
        <Modal
          show={showViewModal}
          onHide={() => setShowViewModal(false)}
          centered
          dialogClassName="student-view-modal"
        >
          <div className="student-detail-card">
            <div className="student-detail-header">
              <div style={{ width: 24 }} /> {/* spacer for centering title */}
              <div className="student-detail-title">Student Details</div>
              <button
                className="student-detail-close"
                onClick={() => setShowViewModal(false)}
              >
                ×
              </button>
            </div>

            <div className="student-detail-body">
              <div className="student-info-title">Student Info</div>

              <div className="student-info-grid">
                <div className="student-info-col">
                  <p>
                    <strong>ID:</strong> {viewStudent.id}
                  </p>
                  <p>
                    <strong>Contact:</strong> {viewStudent.contact}
                  </p>
                  <p>
                    <strong>Name:</strong> {viewStudent.name}
                  </p>
                  <p>
                    <strong>Course:</strong> {viewStudent.course}
                  </p>
                  <p>
                    <strong>Email:</strong> {viewStudent.email}
                  </p>
                  <p>
                    <strong>Status:</strong> {viewStudent.courseStatus}
                  </p>
                </div>
              </div>

              <div className="certificate-badge-wrapper">
                <button className="certificate-badge">
                  Certificate: {viewStudent.certificateIssued ? "Yes" : "No"}
                </button>
              </div>

              <hr className="student-section-divider" />
              <div className="student-section-title">Batches</div>

              {viewStudent.batches?.length > 0 ? (
                <Table
                  bordered
                  hover
                  responsive
                  size="sm"
                  className="student-table mb-3"
                >
                  <thead>
                    <tr>
                      <th>Batches</th>
                      <th>Start-Time</th>
                      <th>End-Time</th>
                      <th>Tutor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {viewStudent.batches.map((b, i) => (
                      <tr key={i}>
                        <td>{b.name}</td>
                        <td>{b.startTime?.substring(0, 5)}</td>
                        <td>{b.endTime?.substring(0, 5)}</td>
                        <td>
                          {b.tutorName} ({b.tutorId})
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              ) : (
                <p className="text-muted text-center mb-3">
                  No batches assigned.
                </p>
              )}

              <hr className="student-section-divider" />
              <div className="student-section-title">Tasks Details</div>

              {viewStudent.tasks?.length > 0 ? (
                <Table
                  bordered
                  hover
                  responsive
                  size="sm"
                  className="student-table"
                >
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Description</th>
                      <th>Assigned By</th>
                      <th>Assigned Date</th>
                      <th>Due Date</th>
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
                        <td
                          className={
                            t.status === "COMPLETED"
                              ? "task-status-completed"
                              : ""
                          }
                        >
                          {t.status}
                        </td>
                        <td>{t.marks}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              ) : (
                <p className="text-muted text-center">
                  No tasks assigned.
                </p>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* ===================================================================== */}
      {/*                           MESSAGE MODAL (single)                      */}
      {/* ===================================================================== */}
      <MessageModal
        show={showMsgModal}
        onHide={() => setShowMsgModal(false)}
        recipients={recipients}
        senderRole="ADMIN"
      />

      {/* ===================================================================== */}
      {/*                         MESSAGE ALL STUDENTS MODAL                    */}
      {/* ===================================================================== */}
      <Modal
        show={showMessageAllModal}
        onHide={() => setShowMessageAllModal(false)}
        centered
        dialogClassName="figma-modal"
      >
        <div className="figma-modal-header">
          <div className="figma-modal-title">Message All Students</div>
          <span
            className="figma-close"
            onClick={() => setShowMessageAllModal(false)}
          >
            ×
          </span>
        </div>

        <Form onSubmit={sendMessageAll}>
          <div className="figma-modal-body">
            <Form.Group className="mb-3">
              <Form.Label className="figma-label">Subject</Form.Label>
              <Form.Control
                className="figma-input"
                value={msgAll.subject}
                placeholder="Enter Subject"
                onChange={(e) =>
                  setMsgAll({ ...msgAll, subject: e.target.value })
                }
              />
            </Form.Group>

            <Form.Group>
              <Form.Label className="figma-label">Message</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                className="figma-input"
                value={msgAll.body}
                placeholder="Enter Message"
                onChange={(e) =>
                  setMsgAll({ ...msgAll, body: e.target.value })
                }
              />
            </Form.Group>
          </div>

          <div className="figma-modal-footer">
            <Button
              type="button"
              className="figma-ghost"
              onClick={() => setShowMessageAllModal(false)}
            >
              Cancel
            </Button>
            <Button type="submit" className="figma-primary">
              Send
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
}

export default Students;
