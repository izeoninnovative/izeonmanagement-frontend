// src/pages/admin/Batches.jsx
import React, { useEffect, useState, useCallback } from "react";
import { Table, Button, Modal, Form, Spinner, Collapse } from "react-bootstrap";
import API from "../../api/api";

function Batches() {
  const [batches, setBatches] = useState([]);
  const [filteredBatches, setFilteredBatches] = useState([]);
  const [students, setStudents] = useState([]);
  const [tutors, setTutors] = useState([]);

  const [loading, setLoading] = useState(true);

  const [expandedBatch, setExpandedBatch] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [editingBatch, setEditingBatch] = useState(null);

  const [showStudentModal, setShowStudentModal] = useState(false);
  const [selectedBatchForStudent, setSelectedBatchForStudent] = useState(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [selectedTutorFilter, setSelectedTutorFilter] = useState("ALL");

  const [studentSearch, setStudentSearch] = useState("");

  /* ---------------- FETCHERS ---------------- */
  const fetchBatches = useCallback(async () => {
    try {
      const res = await API.get("/admin/batches");
      const data = res.data || [];
      setBatches(data);
    } catch {
      console.error("Failed loading batches");
    }
  }, []);

  const fetchStudents = useCallback(async () => {
    const res = await API.get("/admin/students");
    setStudents(res.data || []);
  }, []);

  const fetchTutors = useCallback(async () => {
    const res = await API.get("/admin/employees");
    const tutorsOnly = (res.data || []).filter(
      (t) => (t.role || "").toUpperCase() === "TUTOR"
    );
    setTutors(tutorsOnly);
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchBatches(), fetchStudents(), fetchTutors()]).finally(() =>
      setLoading(false)
    );
  }, [fetchBatches, fetchStudents, fetchTutors]);

  /* ---------------- APPLY FILTER ---------------- */
  useEffect(() => {
    setFilteredBatches(
      selectedTutorFilter === "ALL"
        ? batches
        : batches.filter((b) => b.tutorId === selectedTutorFilter)
    );
  }, [selectedTutorFilter, batches]);

  /* ---------------- AVAILABLE STUDENTS FOR CURRENT BATCH ---------------- */
  const availableStudents = students.filter(
    (s) =>
      !(selectedBatchForStudent?.students || []).some(
        (x) => x.id === s.id
      )
  );

  const filteredAvailableStudents = availableStudents.filter((s) => {
    if (!studentSearch.trim()) return true;
    const q = studentSearch.toLowerCase();
    return (
      s.id?.toString().toLowerCase().includes(q) ||
      s.name?.toLowerCase().includes(q) ||
      (s.course || "").toLowerCase().includes(q)
    );
  });

  /* ---------------- FORMAT TIME ---------------- */
  const formatTime = (t) => (t ? t.substring(0, 5) : "—");

  /* ---------------- ADD / EDIT ---------------- */
  const openAddBatch = () => {
    setEditingBatch({
      name: "",
      startTime: "",
      endTime: "",
      tutorId: "",
    });
    setShowForm(true);
  };

  const openEditBatch = (b) => {
    setEditingBatch({ ...b });
    setShowForm(true);
  };

  const handleSaveBatch = async (e) => {
    e.preventDefault();

    const body = {
      name: editingBatch.name,
      startTime: editingBatch.startTime,
      endTime: editingBatch.endTime,
      tutor: editingBatch.tutorId ? { id: editingBatch.tutorId } : null,
    };

    try {
      if (editingBatch.id) {
        await API.put(`/admin/batch/${editingBatch.id}`, body);
      } else {
        await API.post(`/admin/batch`, body);
      }
      setShowForm(false);
      fetchBatches();
    } catch {
      alert("Failed to save batch");
    }
  };

  /* ---------------- DELETE ---------------- */
  const deleteBatch = async () => {
    setDeleteLoading(true);
    try {
      await API.delete(`/admin/batch/${deleteTarget.id}`);
      setShowDeleteModal(false);
      fetchBatches();
    } finally {
      setDeleteLoading(false);
    }
  };

  /* ---------------- CSS ---------------- */
  const CSS = `
    @import url('https://fonts.googleapis.com/css2?family=Salsa&display=swap');
    @import url('https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&display=swap');

    * {
      font-family: 'Instrument Sans', sans-serif !important;
    }

    .batch-header {
      font-family: 'Salsa', cursive !important;
      font-size: 38px;
      font-weight: 700;
      text-align: center;
      margin-bottom: 30px;
    }

    /* Filter */
    .tutor-filter-wrapper {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
      margin-bottom: 25px;
    }

    .tutor-label {
      font-size: 18px;
      font-weight: 600;
      font-family: 'Salsa', cursive !important;
    }

    .tutor-filter {
      width: 300px;
      height: 48px;
      padding: 8px 12px;
      border-radius: 10px;
      background: #f8f8f8;
      border: 1.8px solid #cfcfcf;
      font-size: 16px;
    }

    .btn-add-batch {
      background: #136CED;
      font-family: 'Salsa', cursive !important;
      color: #fff;
      border: none;
      padding: 10px 22px;
      border-radius: 10px;
      font-size: 16px;
      font-weight: 700;
    }

    @media (max-width: 576px) {
      .btn-add-batch { width: 100%; }
    }

    /* Table Wrapper */
    .table-wrapper {
      overflow-x: auto;
      border: 2px solid #000;
      border-radius: 12px;
      -webkit-overflow-scrolling: touch;
    }

    .batch-table {
      min-width: 850px;
    }

    .batch-table thead th {
      background: #136CED;
      color: #fff;
      padding: 12px;
      font-family: 'Salsa', cursive !important;
      font-size: 18px;
      text-align: center;
      border: 1px solid #000;
    }

    .batch-table tbody td {
      padding: 12px;
      border: 1px solid #000;
      font-size: 15px;
      text-align: center;
    }

    /* ACTION CELL */
    .figma-actions {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 8px;
   
      border:none !important;
    }

    .btn-view { background: #5b5b5b; color: #fff; border-radius: 10px; padding: 6px 14px; border: none; }
    .btn-edit { background: #ffcc00; border-radius: 10px; padding: 6px 14px; border: none; }
    .btn-add  { background: #136CED; border-radius: 10px; padding: 6px 14px; color: #fff; border: none; }
    .btn-delete { background: #ff383c; border-radius: 10px; padding: 6px 14px; color: #fff; border: none; }

    @media (max-width: 576px) {
      .figma-actions {
        justify-content: flex-start;
        flex-wrap: nowrap;
        overflow-x: auto;
        padding: 8px;
      }

      .figma-actions .btn-view,
      .figma-actions .btn-edit,
      .figma-actions .btn-add,
      .figma-actions .btn-delete {
        flex: 0 0 auto;
        white-space: nowrap;
      }
    }

    /* ===========================
       FIGMA-LIKE MODAL STYLES
       =========================== */
    .figma-modal .modal-content {
      border-radius: 18px !important;
      border: 2px solid #000 !important;
      font-family: 'Instrument Sans', sans-serif !important;
      overflow: hidden;
    }

    .figma-modal-header {
      padding: 14px 22px;
      border-bottom: 1px solid #e6e6e6;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .figma-modal-title {
      font-size: 22px;
      font-family: 'Salsa', cursive;
      font-weight: 700;
      color: #136CED;
      margin: 0;
    }

    .figma-modal-close {
      font-size: 22px;
      font-weight: 700;
      color: #ff383c;
      cursor: pointer;
      line-height: 1;
    }

    .figma-modal-body {
      padding: 16px 22px 8px;
    }

    .figma-modal-footer {
      padding: 14px 22px 22px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .figma-label {
      font-size: 15px;
      font-weight: 600;
      margin-bottom: 4px;
    }

    .figma-input,
    .figma-select {
      border-radius: 10px !important;
      border: 1.4px solid #d1d1d1 !important;
      padding: 8px 12px !important;
      font-size: 15px !important;
    }

    .figma-btn-secondary {
      width: 100%;
      padding: 10px;
      border-radius: 12px;
      background: #ffffff;
      border: 1.4px solid #d1d1d1;
      font-weight: 600;
      font-size: 16px;
      color: #136CED;
    }

    .figma-btn-primary {
      width: 100%;
      padding: 12px;
      border-radius: 12px;
      background: #136CED;
      border: none;
      color: #fff;
      font-weight: 700;
      font-size: 17px;
    }

    .figma-btn-danger {
      width: 100%;
      padding: 12px;
      border-radius: 12px;
      background: #ff383c;
      border: none;
      color: #fff;
      font-weight: 700;
      font-size: 17px;
    }

    @media (max-width: 576px) {
      .figma-modal .modal-dialog {
        max-width: 94% !important;
        margin: 0 auto;
      }
    }

    /* ===================== ADD STUDENT MODAL STYLES ===================== */
    .figma-student-add-modal .modal-content {
      border-radius: 16px !important;
      border: 2px solid #000 !important;
      font-family: 'Instrument Sans', sans-serif !important;
      overflow: hidden;
    }

    .figma-add-header {
      padding: 14px 22px;
      border-bottom: 1px solid #e6e6e6;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .figma-add-title {
      font-size: 22px;
      font-family: 'Salsa', cursive;
      font-weight: 700;
      color: #136CED;
      margin: 0;
    }

    .figma-add-close {
      font-size: 24px;
      font-weight: 700;
      cursor: pointer;
      color: #FF383C;
    }

    .figma-add-body {
      padding: 18px 22px;
    }

    .student-search {
      border-radius: 10px;
      border: 1.4px solid #d1d1d1;
      padding: 10px 14px;
      font-size: 15px;
      margin-bottom: 16px;
    }

    .student-list-box {
      max-height: 380px;
      overflow-y: auto;
      border: 1px solid #E0E0E0;
      border-radius: 12px;
      padding: 10px;
      background: #fff;
    }

    .student-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 10px;
      border-bottom: 1px solid #EFEFEF;
    }

    .student-item:last-child {
      border-bottom: none;
    }

    .student-info {
      font-size: 15px;
      font-weight: 600;
    }

    .btn-add-student-small {
      background: #136CED;
      border: none;
      padding: 6px 16px;
      border-radius: 10px;
      color: #fff;
      font-weight: 600;
      font-size: 14px;
    }

    @media (max-width: 576px) {
      .figma-student-add-modal .modal-dialog {
        max-width: 94% !important;
      }

      .student-item {
        flex-direction: column;
        align-items: flex-start;
        gap: 10px;
      }

      .btn-add-student-small {
        width: 100%;
      }
    }
  `;

  if (loading)
    return (
      <div className="text-center p-5">
        <Spinner />
      </div>
    );

  return (
    <div className="p-3">
      <style>{CSS}</style>

      <div className="batch-header">Manage Batches</div>

      {/* FILTER */}
      <div className="tutor-filter-wrapper">
        <span className="tutor-label">Tutor–Batch</span>

        <Form.Select
          className="tutor-filter"
          value={selectedTutorFilter}
          onChange={(e) => setSelectedTutorFilter(e.target.value)}
        >
          <option value="ALL">All Tutors</option>
          {tutors.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name} ({t.id})
            </option>
          ))}
        </Form.Select>

        <Button className="btn-add-batch ms-auto" onClick={openAddBatch}>
          + Add Batch
        </Button>
      </div>

      {/* TABLE */}
      {filteredBatches.length > 0 && (
        <div className="table-wrapper">
          <Table bordered className="batch-table m-0">
            <thead>
              <tr>
                <th>Batch Name</th>
                <th>Timings</th>
                <th>Tutor</th>
                <th>Students</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredBatches.map((b) => (
                <React.Fragment key={b.id}>
                  <tr>
                    <td>{b.name}</td>
                    <td>
                      {formatTime(b.startTime)} – {formatTime(b.endTime)}
                    </td>
                    <td>{b.tutorName || "Not Assigned"}</td>
                    <td>{b.students?.length || 0}</td>

                    <td className="figma-actions">
                      <button
                        className="btn-view"
                        onClick={() =>
                          setExpandedBatch(expandedBatch === b.id ? null : b.id)
                        }
                      >
                        View
                      </button>

                      <button
                        className="btn-edit"
                        onClick={() => openEditBatch(b)}
                      >
                        Edit
                      </button>

                      <button
                        className="btn-add"
                        onClick={() => {
                          setSelectedBatchForStudent(b);
                          setStudentSearch("");
                          setShowStudentModal(true);
                        }}
                      >
                        + Add Students
                      </button>

                      <button
                        className="btn-delete"
                        onClick={() => {
                          setDeleteTarget(b);
                          setShowDeleteModal(true);
                        }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>

                  {/* COLLAPSE STUDENT LIST */}
                  <tr>
                    <td colSpan={5} className="p-0">
                      <Collapse in={expandedBatch === b.id}>
                        <div className="p-3 bg-light">
                          {b.students?.length ? (
                            <Table bordered size="sm" className="m-0">
                              <thead>
                                <tr>
                                  <th>ID</th>
                                  <th>Name</th>
                                  <th>Email</th>
                                  <th>Contact</th>
                                  <th>Remove</th>
                                </tr>
                              </thead>

                              <tbody>
                                {b.students.map((s) => (
                                  <tr key={s.id}>
                                    <td>{s.id}</td>
                                    <td>{s.name}</td>
                                    <td>{s.email}</td>
                                    <td>{s.contact}</td>
                                    <td>
                                      <button
                                        className="btn-delete"
                                        onClick={() =>
                                          API.delete(
                                            `/admin/batch/${b.id}/remove-student/${s.id}`
                                          ).then(fetchBatches)
                                        }
                                      >
                                        Remove
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </Table>
                          ) : (
                            <p className="text-muted m-0">
                              No students assigned.
                            </p>
                          )}
                        </div>
                      </Collapse>
                    </td>
                  </tr>
                </React.Fragment>
              ))}
            </tbody>
          </Table>
        </div>
      )}

      {/* ADD STUDENT MODAL – FIGMA STYLE */}
      <Modal
        show={showStudentModal}
        onHide={() => setShowStudentModal(false)}
        centered
        dialogClassName="figma-student-add-modal"
      >
        {/* HEADER */}
        <div className="figma-add-header">
          <div className="figma-add-title">Add Student to Batch</div>
          <span
            className="figma-add-close"
            onClick={() => setShowStudentModal(false)}
          >
            ×
          </span>
        </div>

        {/* BODY */}
        <div className="figma-add-body">
          {/* Search box */}
          <input
            type="text"
            className="student-search w-100"
            placeholder="Search by ID, Name, or Course..."
            value={studentSearch}
            onChange={(e) => setStudentSearch(e.target.value)}
          />

          {/* Student List */}
          <div className="student-list-box">
            {filteredAvailableStudents.length ? (
              filteredAvailableStudents.map((s) => (
                <div key={s.id} className="student-item">
                  <div className="student-info">
                    {s.name} ({s.id})
                    <div className="text-muted" style={{ fontSize: "13px" }}>
                      {s.course || "No Course"}
                    </div>
                  </div>

                  <button
                    className="btn-add-student-small"
                    onClick={async () => {
                      if (!selectedBatchForStudent) return;

                      await API.post(
                        `/admin/batch/${selectedBatchForStudent.id}/add-student/${s.id}`
                      );

                      // Update local state so UI updates instantly
                      const updatedBatch = {
                        ...selectedBatchForStudent,
                        students: [
                          ...(selectedBatchForStudent.students || []),
                          s,
                        ],
                      };

                      setSelectedBatchForStudent(updatedBatch);
                      setBatches((prev) =>
                        prev.map((b) =>
                          b.id === updatedBatch.id ? updatedBatch : b
                        )
                      );
                    }}
                  >
                    Add
                  </button>
                </div>
              ))
            ) : (
              <p className="text-center text-muted m-0 py-3">
                No available students found.
              </p>
            )}
          </div>
        </div>

        {/* FOOTER */}
        <div className="d-flex justify-content-end p-3">
          <Button variant="secondary" onClick={() => setShowStudentModal(false)}>
            Close
          </Button>
        </div>
      </Modal>

      {/* ADD / EDIT BATCH MODAL – FIGMA STYLE */}
      <Modal
        show={showForm}
        onHide={() => setShowForm(false)}
        centered
        dialogClassName="figma-modal"
      >
        <div className="figma-modal-header">
          <div className="figma-modal-title">
            {editingBatch?.id ? "Edit Batch" : "Add Batch"}
          </div>
          <span
            className="figma-modal-close"
            onClick={() => setShowForm(false)}
          >
            ×
          </span>
        </div>

        <Form onSubmit={handleSaveBatch}>
          <div className="figma-modal-body">
            <Form.Group className="mb-3">
              <Form.Label className="figma-label">Batch Name</Form.Label>
              <Form.Control
                className="figma-input"
                value={editingBatch?.name || ""}
                onChange={(e) =>
                  setEditingBatch({ ...editingBatch, name: e.target.value })
                }
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="figma-label">Start Time</Form.Label>
              <Form.Control
                type="time"
                className="figma-input"
                value={editingBatch?.startTime || ""}
                onChange={(e) =>
                  setEditingBatch({
                    ...editingBatch,
                    startTime: e.target.value,
                  })
                }
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="figma-label">End Time</Form.Label>
              <Form.Control
                type="time"
                className="figma-input"
                value={editingBatch?.endTime || ""}
                onChange={(e) =>
                  setEditingBatch({
                    ...editingBatch,
                    endTime: e.target.value,
                  })
                }
                required
              />
            </Form.Group>

            <Form.Group>
              <Form.Label className="figma-label">Select Tutor</Form.Label>
              <Form.Select
                className="figma-select"
                value={editingBatch?.tutorId || ""}
                onChange={(e) => {
                  const tid = e.target.value;
                  const t = tutors.find((x) => x.id === tid);
                  setEditingBatch({
                    ...editingBatch,
                    tutorId: tid,
                    tutorName: t?.name || "",
                  });
                }}
              >
                <option value="">Select Tutor</option>
                {tutors.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.id})
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </div>

          <div className="figma-modal-footer">
            <Button
              type="button"
              className="figma-btn-secondary"
              onClick={() => setShowForm(false)}
            >
              Cancel
            </Button>
            <Button type="submit" className="figma-btn-primary">
              Save
            </Button>
          </div>
        </Form>
      </Modal>

      {/* DELETE MODAL – FIGMA STYLE */}
      <Modal
        show={showDeleteModal}
        onHide={() => setShowDeleteModal(false)}
        centered
        dialogClassName="figma-modal"
      >
        <div className="figma-modal-header">
          <div className="figma-modal-title">Delete Batch</div>
          <span
            className="figma-modal-close"
            onClick={() => setShowDeleteModal(false)}
          >
            ×
          </span>
        </div>

        <div className="figma-modal-body">
          <p className="fw-bold mb-2">
            Batch: {deleteTarget?.name || "—"}
          </p>
          <p className="text-danger mb-0">
            This batch may have linked attendance or tasks. Are you sure you
            want to delete it?
          </p>
        </div>

        <div className="figma-modal-footer">
          <Button
            className="figma-btn-secondary"
            onClick={() => setShowDeleteModal(false)}
          >
            Cancel
          </Button>
          <Button
            className="figma-btn-danger"
            onClick={deleteBatch}
            disabled={deleteLoading}
          >
            {deleteLoading ? <Spinner size="sm" /> : "Delete"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}

export default Batches;
