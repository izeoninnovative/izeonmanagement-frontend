// src/pages/employee/EmployeeReports.jsx
import React, { useEffect, useState } from "react";
import {
    Button,
    Spinner,
    Alert,
    Form,
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
    const [modalReportId, setModalReportId] = useState(null);
    const [modalDate, setModalDate] = useState("");
    const [modalFrom, setModalFrom] = useState("");
    const [modalTo, setModalTo] = useState("");
    const [modalDesc, setModalDesc] = useState("");
    const [modalEditIndex, setModalEditIndex] = useState(null);

    const todayISO = new Date().toISOString().split("T")[0];

    /* ============== INTERNAL STYLES ============== */
    const styles = `
    @import url('https://fonts.googleapis.com/css2?family=Salsa&display=swap');
    @import url('https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&display=swap');
    @import url('https://fonts.googleapis.com/css2?family=Inclusive+Sans:wght@400;600&display=swap');

    * {
      font-family: 'Instrument Sans', sans-serif;
    }
/* =========================================================
   PAGE + TITLE
========================================================= */
.reports-page {
  padding: 24px;
}

.reports-title {
  font-size: 38px;
  font-weight: 700;
  text-align: center;
  margin-bottom: 28px;
  font-family: 'Salsa', cursive;
}


/* =========================================================
   FORM BOX
========================================================= */
.reports-form-box {
  border: 2px solid #136CED;
  border-radius: 16px;
  padding: 22px 24px;
  background: #ffffff;
  margin-bottom: 30px;
}

/* Labels + Inputs */
.reports-label {
  font-weight: 500;
  font-size: 15px;
  margin-bottom: 6px;
}

.reports-input,
.reports-textarea {
  background: #F4F4F4;
  border-radius: 10px;
  border: 1.5px solid #000;
  font-size: 14px;
  padding: 10px 12px;
}

.reports-input {
  height: 44px;
  font-family:'Instrument Sans', sans-serif !important;
}

.reports-textarea {
  resize: none;
  min-height: 70px;
}

/* =========================================================
   CUSTOM DIV LAYOUT (YOUR REQUIRED STRUCTURE)
========================================================= */

.reports-add-wrapper {
  display: flex;
  gap: 24px;
  width: 100%;
}

/* LEFT SIDE (rows) */
.left-box {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* ROW 1: start + end */
.time-row {
  display: flex;
  gap: 16px;
}

/* ROW 2: description spans full width */
.desc-row {
  width: 100%;
}

/* Ensure start and end fill evenly */
.start-box,
.end-box {
  flex: 1;
}

/* RIGHT SIDE BUTTON COLUMN */
.btn-box {
  width: 220px;
  display: flex;
  justify-content: center;
  align-items: center; /* vertical perfect centering */
}

/* Add To Today button */
.reports-add-today-btn {
  width: 100%;
  height: 64px;
  font-size: 18px;
  font-weight: 600;
  border-radius: 12px;
  background: #34C759;
  border: none;
  font-family:'Salsa', cursive;
}

/* =========================================================
   RESPONSIVENESS
========================================================= */
@media (max-width: 768px) {
  .reports-add-wrapper {
    flex-direction: column;
  }

  .btn-box {
    width: 100%;
  }

  .reports-add-today-btn {
    height: 54px;
  }

  .time-row {
    flex-direction: column;
  }
}

/* =========================================================
   TABLE WRAPPER
========================================================= */
.reports-table-wrapper {
  border: 2px solid #136CED;
  border-radius: 16px;
  overflow-x: auto;
  margin-top: 24px;
  background: #ffffff;
}

table.reports-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 700px;
}

table.reports-table thead th {
  padding: 12px;
  text-align: center;
  font-size: 18px;
  font-weight: 700;
  background: #F8F8F8;
  border-bottom: 2px solid #aaa;
  border-right: 1px solid #aaa;
  font-family:'Salsa', cursive;
}

table.reports-table thead th:last-child {
  border-right: none;
}

table.reports-table tbody td {
  border-top: 1px solid #E0E0E0;
  border-right: 1px solid #aaa;
  padding: 12px;
  font-size: 14px;
  
}

table.reports-table tbody td:last-child {
  border-right: none;
}

/* =========================================================
   DATE COLUMN
========================================================= */
.reports-date-cell {
  text-align: center;
}

.reports-date-main {
  font-weight: 700;
  margin-bottom: 4px;
}

.reports-date-sub {
  font-size: 12px;
  color: #555;
}

/* =========================================================
   ENTRY PILL STYLES
========================================================= */
.report-entry-pill {
  display: flex;
  background: #E1E1E1;
  border-radius: 4px;
  border: 1px solid #000;
  overflow: hidden;
  margin-bottom: 6px;
}

.report-entry-time {
  min-width: 80px;
  padding: 6px 10px;
  border-right: 1px solid #000;
  font-weight: 500;
  font-size: 13px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.report-entry-desc {
  flex: 1;
  padding: 6px 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}

.report-entry-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.report-entry-actions {
  display: flex;
  gap: 8px;
}

.report-entry-actions button {
  padding: 2px 6px;
  font-size: 14px;
  border-radius: 4px;
}

/* =========================================================
   ACTION COLUMN
========================================================= */
.reports-actions-col {
  text-align: center;
}

.reports-add-entry-btn {
  background: #34C759;
  border: none;
  padding: 10px 14px;
  border-radius: 10px;
  font-weight: 400;
  font-size: 14px;
  font-family:'Salsa', cursive;
}

.reports-delete-report-btn {
  margin-top: 6px;
  font-size: 12px;
}

/* =========================================================
   EMPTY STATE
========================================================= */
.reports-empty {
  padding: 28px 12px;
  text-align: center;
  color: #777;
}

`;

    /* ============== LOAD REPORTS ============== */
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

    /* ============== MODAL HELPERS ============== */
    const openModal = ({
        mode = "add",
        reportId = null,
        date = todayISO,
        editIndex = null,
        existingEntry = null,
    } = {}) => {
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

    /* ============== API OPERATIONS ============== */
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

    const updateEntry = async (reportId, date, index) => {
        if (!modalFrom || !modalTo || !modalDesc) {
            alert("Please fill all fields");
            return;
        }
        setActionLoading(true);
        try {
            await API.delete(`/employee/report/${reportId}/entry/${index}`);
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

    const handleModalSubmit = async () => {
        if (modalMode === "add") {
            await addEntryToDate(modalDate);
        } else if (modalMode === "edit") {
            if (modalReportId == null || modalEditIndex == null) {
                alert("Invalid edit state");
                return;
            }
            await updateEntry(modalReportId, modalDate, modalEditIndex);
        }
    };

    /* ============== RENDER HELPERS ============== */
    const renderEntries = (report) => {
        if (!report.entries || !report.entries.length) {
            return <div className="text-muted">No entries</div>;
        }

        return report.entries.map((e, idx) => (
            <div key={idx} className="report-entry-pill">
                <div className="report-entry-time">
                    {e.fromTime} — {e.toTime}
                </div>
                <div className="report-entry-desc">
                    <span className="report-entry-text">{e.description}</span>
                    <div className="report-entry-actions">
                        <Button
                            variant="light"
                            size="sm"
                            onClick={() =>
                                openModal({
                                    mode: "edit",
                                    reportId: report.id,
                                    date: report.date,
                                    editIndex: idx,
                                    existingEntry: e,
                                })
                            }
                        >
                            ✏️
                        </Button>
                        <Button
                            variant="light"
                            size="sm"
                            onClick={() => deleteEntry(report.id, idx)}
                        >
                            🗑️
                        </Button>
                    </div>
                </div>
            </div>
        ));
    };

    /* ============== LOADING STATE ============== */
    if (loading) {
        return (
            <div
                className="d-flex justify-content-center align-items-center"
                style={{ height: "60vh" }}
            >
                <Spinner animation="border" />
            </div>
        );
    }

    /* ============== RENDER ============== */
    return (
        <div className="reports-page">
            <style>{styles}</style>

            <h2 className="reports-title">My Reports</h2>

            {error && <Alert variant="danger">{error}</Alert>}
            <div className="reports-form-box">
            <div className="reports-add-wrapper d-flex">

                {/* LEFT SIDE (Start, End, Description) */}
                <div className="left-box d-flex flex-column">

                    {/* ROW 1 → Start + End */}
                    <div className="time-row d-flex">
                        <div className="start-box">
                            <Form.Label className="reports-label">Start-Time</Form.Label>
                            <Form.Control
                                type="time"
                                className="reports-input"
                                value={modalFrom}
                                onChange={(e) => setModalFrom(e.target.value)}
                            />
                        </div>

                        <div className="end-box">
                            <Form.Label className="reports-label">End-Time</Form.Label>
                            <Form.Control
                                type="time"
                                className="reports-input"
                                value={modalTo}
                                onChange={(e) => setModalTo(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* ROW 2 → Description */}
                    <div className="desc-row">
                        <Form.Label className="reports-label">Description</Form.Label>
                        <Form.Control
                            as="textarea"
                            className="reports-textarea"
                            value={modalDesc}
                            placeholder="Description..."
                            onChange={(e) => setModalDesc(e.target.value)}
                        />
                    </div>

                </div>

                {/* RIGHT SIDE (Button) */}
                <div className="btn-box d-flex justify-content-center align-items-center">
                    <Button
                        className="reports-add-today-btn"
                        onClick={async () => {
                            if (!modalFrom || !modalTo || !modalDesc) {
                                alert("Please fill Start, End & Description");
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
                                loadReports();
                            } catch (err) {
                                console.error(err);
                                alert("Failed to add today's entry");
                            } finally {
                                setActionLoading(false);
                            }
                        }}
                    >
                        {actionLoading ? <Spinner size="sm" /> : "Add To Today"}
                    </Button>
                </div>

            </div>
            </div>




            {/* TABLE */}
            <div className="reports-table-wrapper">
                <table className="reports-table">
                    <thead>
                        <tr>
                            <th style={{ width: "170px" }}>Date</th>
                            <th>Entries</th>
                            <th style={{ width: "170px" }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {reports.length === 0 && (
                            <tr>
                                <td colSpan={3} className="reports-empty">
                                    No reports yet
                                </td>
                            </tr>
                        )}

                        {reports.map((r) => (
                            <tr key={r.id}>
                                <td className="reports-date-cell">
                                    <div className="reports-date-main">{r.date}</div>
                                    <div className="reports-date-sub">{r.employeeName}</div>
                                </td>
                                <td>{renderEntries(r)}</td>

                                <td className="reports-actions-col">
                                    <Button
                                        className="reports-add-entry-btn"
                                        onClick={() =>
                                            openModal({
                                                mode: "add",
                                                reportId: r.id,
                                                date: r.date,
                                            })
                                        }
                                    >
                                        Add Entry
                                    </Button>
                                    <Button
                                        variant="outline-danger"
                                        size="sm"
                                        className="reports-delete-report-btn"
                                        onClick={() => deleteReport(r.id)}
                                    >
                                        Delete Report
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

           {/* MODAL — Figma Style */}
<Modal
  show={showModal}
  onHide={closeModal}
  centered
  dialogClassName="reports-entry-modal"
>
  <style>{`
    .reports-entry-modal .modal-content {
      border-radius: 18px !important;
      border: 2px solid #000 !important;
      font-family: 'Instrument Sans', sans-serif !important;
      overflow: hidden;
    }

    .reports-entry-header {
      padding: 14px 22px;
      border-bottom: 1px solid #e6e6e6;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .reports-entry-title {
      font-size: 22px;
      font-family: 'Salsa', cursive;
      font-weight: 700;
      color: #136CED;
      margin: 0;
    }

    .reports-entry-close-btn {
      font-size: 24px;
      font-weight: 700;
      color: #ff383c;
      cursor: pointer;
      line-height: 1;
    }

    .reports-entry-body {
      padding: 18px 22px 10px;
    }

    .reports-entry-label {
      font-size: 15px;
      font-weight: 600;
      margin-bottom: 4px;
    }

    .reports-entry-input {
      border-radius: 10px !important;
      border: 1.4px solid #d1d1d1 !important;
      padding: 9px 12px !important;
      font-size: 15px !important;
    }

    .reports-entry-textarea {
      border-radius: 12px !important;
      border: 1.4px solid #d1d1d1 !important;
      padding: 10px 12px !important;
      font-size: 15px !important;
      min-height: 110px;
    }

    .reports-entry-footer {
      padding: 14px 22px 22px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .reports-entry-cancel {
      width: 100%;
      padding: 10px;
      border-radius: 12px;
      background: #fff;
      border: 1.4px solid #d1d1d1;
      font-weight: 600;
      color: #136CED;
      font-size: 16px;
    }

    .reports-entry-save {
      width: 100%;
      padding: 12px;
      border-radius: 12px;
      background: #34C759;
      border: none;
      color: #fff;
      font-weight: 700;
      font-size: 17px;
      font-family: 'Salsa', cursive;
    }

    @media (max-width: 992px) {
      .reports-entry-modal .modal-dialog {
        max-width: 94% !important;
      }
    }
  `}</style>

  {/* HEADER */}
  <div className="reports-entry-header">
    <div className="reports-entry-title">
      {modalMode === "add"
        ? `Add Entry — ${modalDate}`
        : `Edit Entry — ${modalDate}`}
    </div>

    <span onClick={closeModal} className="reports-entry-close-btn">
      ×
    </span>
  </div>

  {/* BODY */}
  <div className="reports-entry-body">
    <Form.Group className="mb-3">
      <Form.Label className="reports-entry-label">From</Form.Label>
      <Form.Control
        type="time"
        step="60"
        className="reports-entry-input"
        value={modalFrom}
        onChange={(e) => setModalFrom(e.target.value)}
      />
    </Form.Group>

    <Form.Group className="mb-3">
      <Form.Label className="reports-entry-label">To</Form.Label>
      <Form.Control
        type="time"
        step="60"
        className="reports-entry-input"
        value={modalTo}
        onChange={(e) => setModalTo(e.target.value)}
      />
    </Form.Group>

    <Form.Group>
      <Form.Label className="reports-entry-label">Description</Form.Label>
      <Form.Control
        as="textarea"
        className="reports-entry-textarea"
        value={modalDesc}
        onChange={(e) => setModalDesc(e.target.value)}
      />
    </Form.Group>
  </div>

  {/* FOOTER */}
  <div className="reports-entry-footer">
    <Button className="reports-entry-cancel" onClick={closeModal}>
      Cancel
    </Button>

    <Button
      className="reports-entry-save"
      disabled={actionLoading}
      onClick={handleModalSubmit}
    >
      {actionLoading
        ? "Saving..."
        : modalMode === "add"
        ? "Add Entry"
        : "Save Changes"}
    </Button>
  </div>
</Modal>

        </div>
    );
}

export default EmployeeReports;
