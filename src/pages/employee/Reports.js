// src/pages/employee/EmployeeReports.jsx
import React, { useEffect, useState } from "react";
import {
    Table,
    Button,
    Spinner,
    Alert,
    Form,
    Row,
    Col,
    Card,
    Modal,
} from "react-bootstrap";
import API from "../../api/api";
import { useAuth } from "../../context/AuthContext";

function EmployeeReports() {
    const { user } = useAuth();
    const employeeId = user?.id;

    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState(null);

    // modal state (used for add/edit)
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState("add"); // 'add' or 'edit'
    const [modalReportId, setModalReportId] = useState(null); // which report (for add to existing) or null
    const [modalDate, setModalDate] = useState(""); // date of the report being edited/added
    const [modalFrom, setModalFrom] = useState("");
    const [modalTo, setModalTo] = useState("");
    const [modalDesc, setModalDesc] = useState("");
    const [modalEditIndex, setModalEditIndex] = useState(null); // for edit: index of entry to update

    // Utility: today's ISO date string
    const todayISO = new Date().toISOString().split("T")[0];

    // Load reports
    const loadReports = async () => {
        if (!employeeId) {
            setError("Not logged in");
            setLoading(false);
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const res = await API.get(`/employee/report/${employeeId}`);
            setReports(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            console.error(err);
            setError("Failed to load reports");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadReports();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [employeeId]);

    // Open modal for adding an entry to a report or today's report
    // mode: 'add' or 'edit'
    // if adding to an existing report, pass reportId and date; if adding to new/today, reportId can be null and date set
    const openModal = ({ mode = "add", reportId = null, date = todayISO, editIndex = null, existingEntry = null } = {}) => {
        setModalMode(mode);
        setModalReportId(reportId);
        setModalDate(date);
        if (mode === "edit" && existingEntry) {
            setModalFrom(existingEntry.fromTime || "");
            setModalTo(existingEntry.toTime || "");
            setModalDesc(existingEntry.description || "");
            setModalEditIndex(editIndex);
        } else {
            setModalFrom("");
            setModalTo("");
            setModalDesc("");
            setModalEditIndex(null);
        }
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setModalFrom("");
        setModalTo("");
        setModalDesc("");
        setModalEditIndex(null);
    };

    // Add entry: POST to /api/employee/report — backend will merge with existing report for same employee+date
    // Body shape: { date, employeeId, employeeName, entries: [{fromTime,toTime,description}] }
    const addEntryToDate = async (date) => {
        if (!modalFrom || !modalTo || !modalDesc) {
            alert("Please fill all fields");
            return;
        }

        setActionLoading(true);
        try {
            await API.post("/employee/report", {
                date,
                employeeId,
                employeeName: user?.name || user?.username || "",
                entries: [{ fromTime: modalFrom, toTime: modalTo, description: modalDesc }],
            });
            await loadReports();
            closeModal();
        } catch (err) {
            console.error(err);
            alert("Failed to add entry");
        } finally {
            setActionLoading(false);
        }
    };

    // Edit entry: we don't have a dedicated 'update entry' endpoint; implement by:
    // 1) delete the old entry (DELETE /report/{id}/entry/{index})
    // 2) add the edited entry (POST /employee/report) — server merges
    const updateEntry = async (reportId, date, index) => {
        if (!modalFrom || !modalTo || !modalDesc) {
            alert("Please fill all fields");
            return;
        }

        setActionLoading(true);
        try {
            // Delete the old entry
            await API.delete(`/employee/report/${reportId}/entry/${index}`);

            // Add the updated entry (server will merge into the existing report)
            await API.post("/employee/report", {
                date,
                employeeId,
                employeeName: user?.name || user?.username || "",
                entries: [{ fromTime: modalFrom, toTime: modalTo, description: modalDesc }],
            });

            await loadReports();
            closeModal();
        } catch (err) {
            console.error(err);
            alert("Failed to update entry");
        } finally {
            setActionLoading(false);
        }
    };

    // Delete single entry
    const deleteEntry = async (reportId, index) => {
        if (!window.confirm("Delete this entry?")) return;
        setActionLoading(true);
        try {
            await API.delete(`/employee/report/${reportId}/entry/${index}`);
            await loadReports();
        } catch (err) {
            console.error(err);
            alert("Delete entry failed");
        } finally {
            setActionLoading(false);
        }
    };

    // Delete entire report
    const deleteReport = async (reportId) => {
        if (!window.confirm("Delete this entire report?")) return;
        setActionLoading(true);
        try {
            await API.delete(`/employee/report/${reportId}`);
            await loadReports();
        } catch (err) {
            console.error(err);
            alert("Delete report failed");
        } finally {
            setActionLoading(false);
        }
    };

    // Handler for modal submit depending on mode
    const handleModalSubmit = async () => {
        if (modalMode === "add") {
            // if modalReportId provided, add to that date (date value used)
            await addEntryToDate(modalDate);
        } else if (modalMode === "edit") {
            if (modalReportId == null || modalEditIndex == null) {
                alert("Invalid edit state");
                return;
            }
            await updateEntry(modalReportId, modalDate, modalEditIndex);
        }
    };

    // UI rendering helpers
    const renderEntries = (report) => {
        if (!report.entries || !report.entries.length) {
            return <div className="text-muted">No entries</div>;
        }

        return report.entries.map((e, idx) => (
            <Card key={idx} className="mb-2 p-2">
                <div className="d-flex align-items-start">
                    <div className="flex-grow-1">
                        <div className="fw-bold">
                            {e.fromTime} — {e.toTime}
                        </div>
                        <div>{e.description}</div>
                    </div>

                    <div className="ms-2 d-flex flex-column gap-2">
                        <Button
                            size="sm"
                            variant="outline-primary"
                            onClick={() => openModal({ mode: "edit", reportId: report.id, date: report.date, editIndex: idx, existingEntry: e })}
                        >
                            Update
                        </Button>

                        <Button size="sm" variant="outline-danger" onClick={() => deleteEntry(report.id, idx)}>
                            Delete
                        </Button>
                    </div>
                </div>
            </Card>
        ));
    };

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ height: "60vh" }}>
                <Spinner animation="border" />
            </div>
        );
    }

    return (
        <div className="p-3">
            <h3 className="fw-bold mb-3">My Reports</h3>

            {error && <Alert variant="danger">{error}</Alert>}

            {/* Quick add to today's report */}
            <Card className="p-3 mb-3 shadow-sm">
                <Row className="gy-2 align-items-center">
                    <Col xs={12} md={3}>
                        <Form.Control
                            type="time"
                            value={modalFrom}
                            onChange={(e) => setModalFrom(e.target.value)}
                            placeholder="From"
                        />
                    </Col>

                    <Col xs={12} md={3}>
                        <Form.Control
                            type="time"
                            value={modalTo}
                            onChange={(e) => setModalTo(e.target.value)}
                            placeholder="To"
                        />
                    </Col>

                    <Col xs={12} md={4}>
                        <Form.Control
                            placeholder="Description"
                            value={modalDesc}
                            onChange={(e) => setModalDesc(e.target.value)}
                        />
                    </Col>

                    <Col xs={12} md={2} className="d-grid">
                        <Button
                            variant="primary"
                            onClick={async () => {
                                if (!modalFrom || !modalTo || !modalDesc) {
                                    alert("All fields are required");
                                    return;
                                }

                                try {
                                    setActionLoading(true);

                                    await API.post("/employee/report", {
                                        date: todayISO,
                                        employeeId,
                                        employeeName: user?.name || "",
                                        entries: [
                                            {
                                                fromTime: modalFrom,
                                                toTime: modalTo,
                                                description: modalDesc,
                                            },
                                        ],
                                    });

                                    setModalFrom("");
                                    setModalTo("");
                                    setModalDesc("");

                                    loadReports(); // refresh

                                } catch (err) {
                                    console.error(err);
                                    alert("Failed to add today's entry");
                                } finally {
                                    setActionLoading(false);
                                }
                            }}
                        >
                            {actionLoading ? <Spinner size="sm" /> : "Add to Today"}
                        </Button>
                    </Col>
                </Row>

                <div className="small text-muted mt-2">
                    Automatically adds to today’s report if exists, otherwise creates new.
                </div>
            </Card>

            {/* Reports table */}
            <Table responsive bordered hover className="shadow-sm">
                <thead className="table-dark text-center">
                    <tr>
                        <th style={{ width: "180px" }}>Date</th>
                        <th>Entries</th>
                        <th style={{ width: "170px" }}>Actions</th>
                    </tr>
                </thead>

                <tbody>
                    {reports.length === 0 && (
                        <tr>
                            <td colSpan={3} className="text-center text-muted py-4">
                                No reports yet
                            </td>
                        </tr>
                    )}

                    {reports.map((r) => (
                        <tr key={r.id}>
                            <td className="align-middle text-center">
                                <div className="fw-bold">{r.date}</div>
                                <div className="small text-muted">{r.employeeName}</div>
                            </td>

                            <td>{renderEntries(r)}</td>

                            <td className="align-middle text-center">
                                <div className="d-grid gap-2">
                                    <Button variant="success" size="sm" onClick={() => openModal({ mode: "add", reportId: r.id, date: r.date })}>
                                        Add entry
                                    </Button>

                                    <Button variant="outline-secondary" size="sm" onClick={() => {
                                        // open modal prefilled for adding an entry to date
                                        openModal({ mode: "add", reportId: r.id, date: r.date });
                                    }}>
                                        Quick Add
                                    </Button>

                                    <Button variant="danger" size="sm" onClick={() => deleteReport(r.id)}>
                                        Delete report
                                    </Button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </Table>

            {/* Modal for Add / Edit */}
            <Modal show={showModal} onHide={closeModal} centered>
                <Modal.Header closeButton>
                    <Modal.Title>{modalMode === "add" ? `Add entry — ${modalDate}` : `Edit entry — ${modalDate}`}</Modal.Title>
                </Modal.Header>

                <Modal.Body>
                    <Form>
                        <Form.Group className="mb-2">
                            <Form.Label>From</Form.Label>
                            <Form.Control type="time" value={modalFrom} onChange={(e) => setModalFrom(e.target.value)} />
                        </Form.Group>

                        <Form.Group className="mb-2">
                            <Form.Label>To</Form.Label>
                            <Form.Control type="time" value={modalTo} onChange={(e) => setModalTo(e.target.value)} />
                        </Form.Group>

                        <Form.Group className="mb-2">
                            <Form.Label>Description</Form.Label>
                            <Form.Control as="textarea" rows={2} value={modalDesc} onChange={(e) => setModalDesc(e.target.value)} />
                        </Form.Group>
                    </Form>
                </Modal.Body>

                <Modal.Footer>
                    <Button variant="secondary" onClick={closeModal}>Cancel</Button>
                    <Button variant="primary" disabled={actionLoading} onClick={handleModalSubmit}>
                        {actionLoading ? <Spinner size="sm" /> : modalMode === "add" ? "Add Entry" : "Save Changes"}
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
}

export default EmployeeReports;
