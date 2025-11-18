import React, { useEffect, useState, useCallback } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Spinner,
  Alert,
  Collapse,
  Card,
  Row,
  Col,
} from "react-bootstrap";
import API from "../../api/api";
import Loader from "../../components/Loader";

function Batches() {
  const [batches, setBatches] = useState([]);
  const [filteredBatches, setFilteredBatches] = useState([]);
  const [students, setStudents] = useState([]);
  const [tutors, setTutors] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // UI States
  const [expandedBatch, setExpandedBatch] = useState(null);

  // Modals
  const [showForm, setShowForm] = useState(false);
  const [editingBatch, setEditingBatch] = useState(null);

  const [showStudentModal, setShowStudentModal] = useState(false);
  const [selectedBatchForStudent, setSelectedBatchForStudent] = useState(null);
  const [selectedStudentId, setSelectedStudentId] = useState("");

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [selectedTutorFilter, setSelectedTutorFilter] = useState("ALL");

  // -------------------------------------------------------------
  // Fetchers
  // -------------------------------------------------------------
  const fetchBatches = useCallback(async () => {
    try {
      const res = await API.get("/admin/batches");
      const data = Array.isArray(res.data) ? res.data : [];
      setBatches(data);

      setFilteredBatches(
        selectedTutorFilter === "ALL"
          ? data
          : data.filter((b) => b.tutorId === selectedTutorFilter)
      );
    } catch (err) {
      console.error("fetchBatches:", err);
      setError("Failed to load batches.");
    }
  }, [selectedTutorFilter]);

  const fetchStudents = useCallback(async () => {
    try {
      const res = await API.get("/admin/students");
      setStudents(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("fetchStudents:", err);
    }
  }, []);

  const fetchTutors = useCallback(async () => {
    try {
      const res = await API.get("/admin/employees");
      const all = Array.isArray(res.data) ? res.data : [];
      setTutors(all.filter((e) => (e.role || "").toUpperCase() === "TUTOR"));
    } catch (err) {
      console.error("fetchTutors:", err);
    }
  }, []);

  useEffect(() => {
    setLoading(true);

    Promise.all([fetchBatches(), fetchStudents(), fetchTutors()])
      .catch(() => setError("Failed to load data"))
      .finally(() => setLoading(false));
  }, [fetchBatches, fetchStudents, fetchTutors]);


  useEffect(() => {
    setFilteredBatches(
      selectedTutorFilter === "ALL"
        ? batches
        : batches.filter((b) => b.tutorId === selectedTutorFilter)
    );
  }, [selectedTutorFilter, batches]);

  // -------------------------------------------------------------
  const formatTime = (t) => {
    if (!t) return "—";
    return t.substring(0, 5);
  };

  // -------------------------------------------------------------
  // Add/Edit Batch
  // -------------------------------------------------------------
  const openAddBatch = () => {
    setEditingBatch({ name: "", startTime: "", endTime: "", tutorId: "" });
    setShowForm(true);
  };

  const openEditBatch = (b) => {
    setEditingBatch({
      id: b.id,
      name: b.name,
      startTime: b.startTime,
      endTime: b.endTime,
      tutorId: b.tutorId || "",
      tutorName: b.tutorName || "",
    });
    setShowForm(true);
  };

  const handleSaveBatch = async (e) => {
    e.preventDefault();

    const payload = {
      name: editingBatch.name,
      startTime: editingBatch.startTime,
      endTime: editingBatch.endTime,
      tutor: editingBatch.tutorId ? { id: editingBatch.tutorId } : null,
    };

    try {
      if (editingBatch.id) {
        await API.put(`/admin/batch/${editingBatch.id}`, payload);
      } else {
        await API.post("/admin/batch", payload);
      }
      await fetchBatches();
      setShowForm(false);
      setEditingBatch(null);
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to save batch.");
    }
  };

  // -------------------------------------------------------------
  // Add/Remove Student
  // -------------------------------------------------------------
  const addStudentToBatch = async () => {
    if (!selectedBatchForStudent || !selectedStudentId) return;

    try {
      await API.post(
        `/admin/batch/${selectedBatchForStudent.id}/add-student/${selectedStudentId}`
      );
      await fetchBatches();
      setShowStudentModal(false);
      setSelectedStudentId("");
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to add student.");
    }
  };

  const removeStudentFromBatch = async (batchId, studentId) => {
    if (!window.confirm("Remove student from batch?")) return;

    try {
      await API.delete(`/admin/batch/${batchId}/remove-student/${studentId}`);
      await fetchBatches();
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to remove student.");
    }
  };

  // -------------------------------------------------------------
  // Delete Batch
  // -------------------------------------------------------------
  const confirmDeleteBatch = (batch) => {
    setDeleteTarget(batch);
    setShowDeleteModal(true);
  };

  const handleDeleteBatch = async () => {
    setDeleteLoading(true);

    try {
      await API.delete(`/admin/batch/${deleteTarget.id}`);
      setShowDeleteModal(false);
      setDeleteTarget(null);
      await fetchBatches();
    } catch (err) {
      setError(
        err?.response?.data?.message ||
        "Failed to delete batch. It may have linked tasks or attendance."
      );
    } finally {
      setDeleteLoading(false);
    }
  };

  // -------------------------------------------------------------
  if (loading) return <Loader />;

  return (
    <div className="p-3">

      {/* HEADER */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-3">
        <h3 className="fw-bold mb-2 mb-md-0">Manage Batches</h3>

        <Button variant="outline-secondary" onClick={openAddBatch}>
          + Add Batch
        </Button>
      </div>

      {/* ERRORS */}
      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* FILTER */}
      <Row className="mb-3">
        <Col xs={12} sm={8} md={6} lg={4}>
          <Form.Select
            className="w-100"
            value={selectedTutorFilter}
            onChange={(e) => setSelectedTutorFilter(e.target.value)}
            style={{ minHeight: "45px" }}
          >
            <option value="ALL">All Tutors</option>
            {tutors.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.id})
              </option>
            ))}
          </Form.Select>
        </Col>
      </Row>


      {/* MAIN CARD */}
      <Card className="shadow-sm">
        <Card.Body className="p-0">

          <div className="table-responsive">
            <Table bordered hover className="m-0">
              <thead className="table-dark">
                <tr>
                  <th>Batch Name</th>
                  <th>Timings</th>
                  <th>Tutor</th>
                  <th>Students</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredBatches.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center text-muted py-3">
                      No batches found.
                    </td>
                  </tr>
                ) : (
                  filteredBatches.map((b) => (
                    <React.Fragment key={b.id}>
                      <tr>
                        <td>{b.name}</td>
                        <td>{formatTime(b.startTime)} - {formatTime(b.endTime)}</td>
                        <td>{b.tutorName || "Not assigned"}</td>
                        <td>{b.students?.length || 0}</td>

                        <td className="text-nowrap">

                          <Button
                            size="sm"
                            variant="secondary"
                            className="me-1 mb-1"
                            onClick={() =>
                              setExpandedBatch(expandedBatch === b.id ? null : b.id)
                            }
                          >
                            View
                          </Button>

                          <Button
                            size="sm"
                            variant="warning"
                            className="me-1 mb-1"
                            onClick={() => openEditBatch(b)}
                          >
                            Edit
                          </Button>

                          <Button
                            size="sm"
                            variant="success"
                            className="me-1 mb-1"
                            onClick={() => {
                              setSelectedBatchForStudent(b);
                              setShowStudentModal(true);
                            }}
                          >
                            Add Student
                          </Button>

                          <Button
                            size="sm"
                            variant="danger"
                            className="mb-1"
                            onClick={() => confirmDeleteBatch(b)}
                          >
                            Delete
                          </Button>

                        </td>
                      </tr>

                      {/* COLLAPSE SECTION */}
                      <tr>
                        <td colSpan="5" style={{ padding: 0 }}>
                          <Collapse in={expandedBatch === b.id}>
                            <div className="p-3 bg-light border-top">

                              {b.students?.length > 0 ? (
                                <div className="table-responsive">
                                  <Table bordered hover size="sm" className="m-0">
                                    <thead>
                                      <tr>
                                        <th>ID</th>
                                        <th>Name</th>
                                        <th>Email</th>
                                        <th>Contact</th>
                                        <th>Action</th>
                                      </tr>
                                    </thead>

                                    <tbody>
                                      {b.students.map((s) => (
                                        <tr key={s.id}>
                                          <td>{s.id}</td>
                                          <td>{s.name}</td>
                                          <td>{s.email || "—"}</td>
                                          <td>{s.contact || "—"}</td>

                                          <td>
                                            <Button
                                              size="sm"
                                              variant="danger"
                                              onClick={() =>
                                                removeStudentFromBatch(b.id, s.id)
                                              }
                                            >
                                              Remove
                                            </Button>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </Table>
                                </div>
                              ) : (
                                <p className="text-muted m-0">No students assigned.</p>
                              )}

                            </div>
                          </Collapse>
                        </td>
                      </tr>
                    </React.Fragment>
                  ))
                )}
              </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>

      {/* ---------------- ADD / EDIT BATCH MODAL ---------------- */}
      <Modal show={showForm} onHide={() => setShowForm(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>{editingBatch?.id ? "Edit Batch" : "Add Batch"}</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <Form onSubmit={handleSaveBatch}>
            <Form.Group className="mb-3">
              <Form.Label>Batch Name</Form.Label>
              <Form.Control
                value={editingBatch?.name || ""}
                onChange={(e) => setEditingBatch({ ...editingBatch, name: e.target.value })}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Start Time</Form.Label>
              <Form.Control
                type="time"
                value={editingBatch?.startTime || ""}
                onChange={(e) => setEditingBatch({ ...editingBatch, startTime: e.target.value })}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>End Time</Form.Label>
              <Form.Control
                type="time"
                value={editingBatch?.endTime || ""}
                onChange={(e) => setEditingBatch({ ...editingBatch, endTime: e.target.value })}
                required
              />
            </Form.Group>

            <Form.Group>
              <Form.Label>Tutor</Form.Label>
              <Form.Select
                value={editingBatch?.tutorId || ""}
                onChange={(e) => {
                  const tutorId = e.target.value;
                  const tutor = tutors.find((t) => t.id === tutorId);
                  setEditingBatch({
                    ...editingBatch,
                    tutorId,
                    tutorName: tutor?.name || "",
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

            <div className="text-end mt-3">
              <Button variant="secondary" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit" className="ms-2">
                Save
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* ---------------- ADD STUDENT MODAL ---------------- */}
      <Modal show={showStudentModal} onHide={() => setShowStudentModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            Add Student {selectedBatchForStudent ? `to ${selectedBatchForStudent.name}` : ""}
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <Form.Select
            value={selectedStudentId}
            onChange={(e) => setSelectedStudentId(e.target.value)}
          >
            <option value="">Select Student</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.id})
              </option>
            ))}
          </Form.Select>

          <div className="text-end mt-3">
            <Button variant="secondary" onClick={() => setShowStudentModal(false)}>
              Cancel
            </Button>
            <Button variant="success" onClick={addStudentToBatch} className="ms-2">
              Add
            </Button>
          </div>
        </Modal.Body>
      </Modal>

      {/* ---------------- DELETE CONFIRMATION ---------------- */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Delete Batch</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {deleteTarget ? (
            <>
              <p>
                <strong>Batch:</strong> {deleteTarget.name}
              </p>

              <p className="text-danger">
                Deleting this batch may fail if linked tasks or attendance exist.
              </p>

              <p>
                <strong>Students assigned:</strong> {deleteTarget.students?.length || 0}
              </p>
            </>
          ) : (
            "Confirm delete?"
          )}
        </Modal.Body>

        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowDeleteModal(false)}
            disabled={deleteLoading}
          >
            Cancel
          </Button>

          <Button
            variant="danger"
            onClick={handleDeleteBatch}
            disabled={deleteLoading}
          >
            {deleteLoading ? (
              <Spinner animation="border" size="sm" />
            ) : (
              "Delete"
            )}
          </Button>
        </Modal.Footer>
      </Modal>

    </div>
  );
}

export default Batches;
