// src/pages/admin/Employees.jsx
import { useState, useEffect, useCallback } from "react";
import { Button, Modal, Form } from "react-bootstrap";
import API from "../../api/api";

import Loader from "../../components/Loader";
import MessageModal from "../../components/MessageModal";
import TableComponent from "../../components/TableComponent";

function Employees() {
  const [employees, setEmployees] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");

  // Add / Edit modal
  const [showForm, setShowForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [formData, setFormData] = useState({
    id: "",
    name: "",
    email: "",
    password: "",
    role: "",
    designation: "",
    contact: "",
  });
  const [formErrors, setFormErrors] = useState({});

  // View modal
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewEmployee, setViewEmployee] = useState(null);

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
  const fetchEmployees = useCallback(async () => {
    try {
      const res = await API.get("/admin/employees");
      setEmployees(res.data || []);
    } catch (err) {
      console.error("Failed to fetch employees", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStudents = useCallback(async () => {
    try {
      const res = await API.get("/admin/students");
      setStudents(res.data || []);
    } catch (err) {
      console.error("Failed to fetch students", err);
    }
  }, []);

  /* ---------------- EFFECT: Fonts + polling + initial data ---------------- */
  useEffect(() => {
    const styleElement = document.createElement("style");
    styleElement.innerHTML = fontStyles;
    document.head.appendChild(styleElement);

    fetchEmployees();
    fetchStudents();

    const interval = setInterval(fetchEmployees, 30000);
    return () => clearInterval(interval);
  }, [fontStyles, fetchEmployees, fetchStudents]);

  /* ---------------- VALIDATION ---------------- */
  const validateEmployee = (data) => {
    let errors = {};
    const clean = (v) => v?.trim() || "";

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

    // ID
    if (!clean(data.id)) errors.id = "ID is required";
    else {
      const existsInEmp = employees.some(
        (emp) =>
          emp.id === data.id &&
          (!editingEmployee || editingEmployee.id !== data.id)
      );
      if (existsInEmp) errors.id = "ID already exists";
      if (idExistsStudents) errors.id = "ID already used by a student";
    }

    // NAME
    if (!clean(data.name)) errors.name = "Name is required";

    // EMAIL
    if (!clean(data.email)) errors.email = "Email is required";
    else if (!/^\S+@\S+\.\S+$/.test(data.email))
      errors.email = "Invalid email format";
    else {
      const existsInEmp = employees.some(
        (emp) =>
          emp.email === data.email &&
          (!editingEmployee || editingEmployee.email !== data.email)
      );
      if (existsInEmp) errors.email = "Email already exists";
      if (emailExistsStudents) errors.email = "Email already used by a student";
    }

    // PASSWORD
    if (!editingEmployee && !clean(data.password))
      errors.password = "Password is required";

    // CONTACT
    if (!clean(data.contact)) errors.contact = "Contact is required";
    else if (!/^[0-9]{10}$/.test(data.contact))
      errors.contact = "Contact must be 10 digits";
    else {
      const existsInEmp = employees.some(
        (emp) =>
          emp.contact === data.contact &&
          (!editingEmployee || editingEmployee.contact !== data.contact)
      );
      if (existsInEmp) errors.contact = "Contact already exists";
      if (contactExistsStudents)
        errors.contact = "Contact already used by a student";
    }

    // ROLE
    if (!clean(data.role)) errors.role = "Role is required";

    // DESIGNATION
    if (!clean(data.designation))
      errors.designation = "Designation is required";

    return errors;
  };

  /* ---------------- OPEN ADD / EDIT MODAL ---------------- */
  const openForm = (emp = null) => {
    setEditingEmployee(emp);
    setFormErrors({});
    setFormData(
      emp || {
        id: "",
        name: "",
        email: "",
        password: "",
        role: "",
        designation: "",
        contact: "",
      }
    );
    setShowForm(true);
  };

  /* ---------------- SAVE EMPLOYEE ---------------- */
  const handleSaveEmployee = async (e) => {
    e.preventDefault();
    const errors = validateEmployee(formData);
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    const finalData = {
      ...formData,
      id: formData.id.trim(),
      email: formData.email.trim(),
      contact: formData.contact.trim(),
      role: formData.role.trim(),
    };

    try {
      if (editingEmployee) {
        if (!finalData.password?.trim()) delete finalData.password;
        await API.put(`/admin/employee/${editingEmployee.id}`, finalData);
      } else {
        await API.post("/admin/employee", finalData);
      }
      await fetchEmployees();
      setShowForm(false);
    } catch (err) {
      console.error("Save employee failed", err);
      setFormErrors({ submit: "Failed to save employee." });
    }
  };

  /* ---------------- DELETE ---------------- */
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this employee?")) return;
    try {
      await API.delete(`/admin/employee/${id}`);
      await fetchEmployees();
    } catch {
      alert("Failed to delete employee.");
    }
  };

  /* ---------------- VIEW EMPLOYEE ---------------- */
  const handleViewEmployee = async (emp) => {
    try {
      const res = await API.get(`/admin/employee/${emp.id}`);
      setViewEmployee(res.data);
    } catch {
      setViewEmployee(emp);
    }
    setShowViewModal(true);
  };

  /* ---------------- MESSAGE (single) ---------------- */
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

  /* ---------------- MESSAGE ALL ---------------- */
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

  /* ---------------- FILTER ---------------- */
  const filteredEmployees = employees.filter((emp) => {
    if (!search.trim()) return true;
    const s = search.toLowerCase();

    return (
      emp.id?.toString().toLowerCase().includes(s) ||
      emp.name?.toLowerCase().includes(s) ||
      emp.email?.toLowerCase().includes(s) ||
      emp.contact?.toString().toLowerCase().includes(s) ||
      emp.role?.toLowerCase().includes(s) ||
      emp.designation?.toLowerCase().includes(s)
    );
  });

  /* ---------------- TABLE CONFIG ---------------- */
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
      <Button
        size="sm"
        style={{ background: "#5B5B5B", borderColor: "#5B5B5B", color: "#fff" }}
        onClick={() => handleViewEmployee(e)}
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
        onClick={() => openForm(e)}
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
        onClick={() => handleSendMessage([e])}
      >
        Message
      </Button>

      <Button
        size="sm"
        style={{ background: "#FF383C", borderColor: "#FF383C", color: "#fff" }}
        onClick={() => handleDelete(e.id)}
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
/*                       🔵 VIEW MODAL (FIXED UI)                */
/* ============================================================= */

.figma-view-modal .modal-dialog {
  max-width: 900px !important;  /* CMD — change width */
}

.figma-view-modal .modal-content {
  border-radius: 16px;
  border: 1.6px solid #000;
  font-family: 'Instrument Sans', sans-serif;
  padding: 0;
}

/* Header */
.figma-view-header {
  padding: 16px 24px;
  border-bottom: 1px solid #ddd;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.figma-view-title {
  font-size: 24px;
  color: #136CED;
  font-weight: 700;
  font-family: 'Salsa', cursive;
}

.figma-view-close {
  font-size: 24px;
  color: #ff383c;
  cursor: pointer;
  font-weight: bold;
}

/* Body */
.figma-view-body {
  padding: 20px 24px;
}

.view-row {
  margin-bottom: 12px;
}

.view-cell {
  flex: 1;
  font-size: 16px;
}


/* ============================================================= */
/*               🔵 MOBILE VIEW — VIEW MODAL FIX                 */
/* ============================================================= */

@media (max-width: 576px) {

  .figma-view-modal .modal-dialog {
    max-width: 92% !important; /* CMD — mobile width */
  }

  .figma-view-title {
    font-size: 20px !important;
  }

  .figma-view-body {
    padding: 16px !important;
  }

  .view-row {
    flex-direction: column;
    gap: 10px;
  }

  .view-cell {
    font-size: 15px;
  }
}


/* ============================================================= */
/*                   🔵 GENERAL FIGMA MODALS                     */
/*           (Add/Edit Employee • Message All • etc.)            */
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
  background: #136CED;
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
/*   🔵 RESPONSIVE FIX — ADD/EDIT EMPLOYEE MODAL (Mobile Only)   */
/* ============================================================= */

@media (max-width: 992px) {

  /* CMD — modal width */
  .figma-modal .modal-dialog {
    max-width: 85% !important;
    margin: 0 auto;
  }

  /* CMD — modal height + enable internal scroll */
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

  /* For view modal rows */
  .figma-detail-row {
    flex-wrap: wrap;
    gap: 12px;
  }

  .figma-detail-cell {
    flex: 1 1 45%;
    font-size: 14px;
  }
}

`}</style>


      {/* =================== HEADING =================== */}
      <div className="heading-main">Manage Employees</div>

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
            + Add Employee
          </Button>
        </div>
      </div>

      {/* =================== TABLE =================== */}
      <TableComponent columns={columns} data={filteredEmployees} actions={actions} />

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
            {editingEmployee ? "Edit Employee" : "Add Employee"}
          </div>
          <span className="figma-close" onClick={() => setShowForm(false)}>
            ×
          </span>
        </div>

        <Form onSubmit={handleSaveEmployee}>
          <div className="figma-modal-body">
            <div className="row">
              {/* LEFT COLUMN */}
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label className="figma-label">Employee ID</Form.Label>
                  <Form.Control
                    className="figma-input"
                    placeholder="Enter ID (E101, E102)"
                    type="text"
                    value={formData.id}
                    disabled={!!editingEmployee}
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

                <Form.Group className="mb-3">
                  <Form.Label className="figma-label">Role</Form.Label>
                  <Form.Control
                    className="figma-input"
                    placeholder="Enter Role"
                    type="text"
                    value={formData.role}
                    onChange={(e) =>
                      setFormData({ ...formData, role: e.target.value })
                    }
                  />
                  {formErrors.role && (
                    <small className="text-danger">{formErrors.role}</small>
                  )}
                </Form.Group>

                <Form.Group className="mb-2">
                  <Form.Label className="figma-label">Contact No</Form.Label>
                  <Form.Control
                    className="figma-input"
                    placeholder="Enter Contact"
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
                    placeholder="Enter Name"
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
                      editingEmployee ? "Leave blank to retain" : "Enter Password"
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
                  <Form.Label className="figma-label">Designation</Form.Label>
                  <Form.Control
                    className="figma-input"
                    placeholder="Enter Designation"
                    type="text"
                    value={formData.designation}
                    onChange={(e) =>
                      setFormData({ ...formData, designation: e.target.value })
                    }
                  />
                  {formErrors.designation && (
                    <small className="text-danger">
                      {formErrors.designation}
                    </small>
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
{/*                           VIEW EMPLOYEE MODAL (UPDATED)               */}
{/* ===================================================================== */}
{viewEmployee && (
  <Modal
    show={showViewModal}
    onHide={() => setShowViewModal(false)}
    centered
    dialogClassName="figma-view-modal"
  >
    <div className="figma-view-header">
      <div className="figma-view-title">Employee Details</div>
      <span className="figma-view-close" onClick={() => setShowViewModal(false)}>
        ×
      </span>
    </div>

    <div className="figma-view-body">

      {/* BASIC DETAILS (common for all roles) */}
      <div className="view-row flex-wrap">
        <div className="view-cell"><strong>ID:</strong> {viewEmployee.id}</div>
        <div className="view-cell"><strong>Name:</strong> {viewEmployee.name}</div>
        <div className="view-cell"><strong>Email:</strong> {viewEmployee.email}</div>
        <div className="view-cell"><strong>Contact:</strong> {viewEmployee.contact}</div>
        <div className="view-cell"><strong>Role:</strong> {viewEmployee.role}</div>
        <div className="view-cell"><strong>Designation:</strong> {viewEmployee.designation}</div>
      </div>

      {/* ======================= TUTOR ONLY DETAILS ======================= */}
      {viewEmployee.role === "TUTOR" && (
        <>
          <hr />

          {/* COUNT SUMMARY */}
          <div className="view-row d-flex gap-3 flex-wrap">
            <div className="view-cell">
              <strong>Total Batches:</strong> {viewEmployee.numberOfBatches}
            </div>
            <div className="view-cell">
              <strong>Total Students:</strong> {viewEmployee.numberOfStudents}
            </div>
          </div>

          <hr />

          {/* BATCH DETAILS */}
          <strong style={{ fontSize: 17 }}>Assigned Batches:</strong>

          {viewEmployee.batches?.length > 0 ? (
            viewEmployee.batches.map((batch) => (
              <div
                key={batch.id}
                style={{
                  padding: "10px 14px",
                  border: "1px solid #ccc",
                  borderRadius: "10px",
                  marginTop: "10px",
                }}
              >
                <div><strong>Batch:</strong> {batch.name}</div>
                <div><strong>Time:</strong> {batch.startTime} – {batch.endTime}</div>
                <div><strong>Tutor:</strong> {batch.tutorName}</div>

                {/* STUDENTS */}
                <div className="mt-2">
                  <strong>Students:</strong>
                  {batch.students.length > 0 ? (
                    <ul style={{ marginTop: 6 }}>
                      {batch.students.map((stu) => (
                        <li key={stu.id}>
                          {stu.name} ({stu.id}) – {stu.email}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div>No students assigned.</div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div>No batches assigned.</div>
          )}
        </>
      )}

      {/* =================== END TUTOR BLOCK =================== */}

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
      {/*                         MESSAGE ALL EMPLOYEES MODAL                   */}
      {/* ===================================================================== */}
      <Modal
        show={showMessageAllModal}
        onHide={() => setShowMessageAllModal(false)}
        centered
        dialogClassName="figma-modal"
      >
        <div className="figma-modal-header">
          <div className="figma-modal-title">Message All Employees</div>
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

export default Employees;
