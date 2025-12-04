// src/pages/admin/Leaves.jsx
import { useEffect, useState } from "react";
import { Spinner, Alert, Form, Row, Col } from "react-bootstrap";
import API from "../../api/api";

function Leaves() {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [fromDate, setFromDate] = useState("");
  const [monthFilter, setMonthFilter] = useState("");
  const [searchId, setSearchId] = useState("");

  /* ---------------- FETCH LEAVES ---------------- */
  const fetchLeaves = async () => {
    try {
      const res = await API.get("/admin/leaves");
      setLeaves(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setError("Failed to fetch leave requests.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  /* ---------------- UPDATE STATUS ---------------- */
  const updateStatus = async (leaveId, status) => {
    if (!window.confirm(`Confirm ${status.toLowerCase()}?`)) return;

    const url =
      status === "APPROVED"
        ? `/admin/leave/${leaveId}/approve`
        : `/admin/leave/${leaveId}/reject`;

    try {
      await API.put(url);
      fetchLeaves();
    } catch {
      alert("Failed to update leave status.");
    }
  };

  /* ---------------- STATUS BADGE ---------------- */
  const StatusBadge = ({ status }) => {
    const s = status?.toUpperCase();

    if (s === "APPROVED")
      return <span className="badge-approved">Approved</span>;

    if (s === "REJECTED")
      return <span className="badge-rejected">Rejected</span>;

    return <span className="badge-pending">Pending</span>;
  };

  /* ---------------- FILTERING ---------------- */
  const filteredLeaves = leaves.filter((l) => {
    if (searchId && !l.employeeId.toLowerCase().includes(searchId.toLowerCase()))
      return false;

    if (fromDate && l.fromDate !== fromDate) return false;

    if (monthFilter) {
      const m = String(new Date(l.fromDate).getMonth() + 1).padStart(2, "0");
      if (m !== monthFilter) return false;
    }

    return true;
  });

  /* ---------------- LOADING ---------------- */
  if (loading)
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: "60vh" }}>
        <Spinner animation="border" />
      </div>
    );

  return (
    <div className="p-3">

      {/* ------------------------------------ */}
      {/*              GLOBAL STYLES           */}
      {/* ------------------------------------ */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Salsa&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&display=swap');

        * {
          font-family: 'Instrument Sans', sans-serif;
        }

        .leaves-title {
          font-size: 34px;
          font-weight: 700;
          text-align: center;
          font-family: 'Salsa', cursive;
          margin-bottom: 25px;
        }

        /* FILTER BOX */
        .leave-filter-box {
          border: 2px solid #2D68FE;
          border-radius: 18px;
          padding: 22px;
          background: #ffffff;
          margin-bottom: 25px;
        }

        .filter-label {
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 6px;
          font-family: 'Instrument Sans', sans-serif;
        }

        /* TABLE WRAPPER — MOBILE NO SCROLL */
        .leaves-table-container {
  border: 2px solid #000;
  border-radius: 16px;
  width: 100%;
  overflow-x: auto;     /* ← ENABLE horizontal scroll */
  overflow-y: hidden;
  -webkit-overflow-scrolling: touch; /* smooth mobile scroll */
}


       table.leaves-table {
  width: 100%;
  min-width: 850px;   /* ← Force full-size table */
  border-collapse: collapse;
}


        table.leaves-table thead th {
          background: #136CED;
          color: #ffffff;
          padding: 12px;
          text-align: center;
          font-weight: 600;
          border: 1px solid #000;
          font-family: 'Salsa', cursive;
        }

        table.leaves-table tbody td {
          padding: 12px;
          text-align: center;
          border: 1px solid #000;
          font-size: 14px;
        }

        /* BADGES */
        .badge-approved {
          background: #34C759;
          color: white;
          padding: 6px 14px;
          border-radius: 8px;
          font-weight: 600;
        }
        .badge-rejected {
          background: #FF383C;
          color: white;
          padding: 6px 14px;
          border-radius: 8px;
          font-weight: 600;
        }
        .badge-pending {
          background: #FFD43B;
          color: black;
          padding: 6px 14px;
          border-radius: 8px;
          font-weight: 600;
        }

        /* ACTION BUTTONS */
        .action-btn {
          border: none;
          padding: 6px 14px;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
        }
        .btn-approve { background: #34C759; color: white; }
        .btn-reject { background: #FF383C; color: white; }
        .btn-disabled { background: #D0D0D0; color: #fff; cursor: not-allowed; }

        /* ---------------------------------------- */
        /* 📱 MOBILE OPTIMIZED TABLE                */
        /* Show ONLY: ID, Name, Type, Reason, Actions */
        /* ---------------------------------------- */

        @media (max-width: 576px) {

          /* Hide columns on mobile */
          .col-from,
          .col-to,
          .col-type,
          .col-status {
            display: none !important;
          }

          table.leaves-table {
            width: 100% !important;
            min-width: 100% !important;
          }

          table.leaves-table thead th,
          table.leaves-table tbody td {
            padding: 10px 6px !important;
            font-size: 13px !important;
          }

          .col-mobile {
            width: 20% !important;
          }

          .col-actions {
            width: 25% !important;
          }

          .action-btn {
            padding: 4px 6px !important;
            font-size: 11px !important;
          }
        }
      `}</style>

      {/* ------------------------------------ */}
      {/*               TITLE                  */}
      {/* ------------------------------------ */}
      <h1 className="leaves-title">Leave Requests</h1>

      {/* ------------------------------------ */}
      {/*             FILTER BOX                */}
      {/* ------------------------------------ */}
      <div className="leave-filter-box">
        <Row>
          <Col xs={12} md={4} className="mb-3">
            <Form.Label className="filter-label">Search Employee ID</Form.Label>
            <Form.Control
              placeholder="E102 / S101"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
            />
          </Col>

          <Col xs={12} md={4} className="mb-3">
            <Form.Label className="filter-label">Date</Form.Label>
            <Form.Control
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
          </Col>

          <Col xs={12} md={4} className="mb-3">
            <Form.Label className="filter-label">Month</Form.Label>
            <Form.Select
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
            >
              <option value="">All</option>
              {["01","02","03","04","05","06","07","08","09","10","11","12"].map(m => (
                <option key={m} value={m}>
                  {["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][parseInt(m)-1]}
                </option>
              ))}
            </Form.Select>
          </Col>
        </Row>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      {/* ------------------------------------ */}
      {/*                TABLE                 */}
      {/* ------------------------------------ */}
      <div className="leaves-table-container">
        <table className="leaves-table">
          <thead>
            <tr>
              <th className="col-mobile">ID</th>
              <th className="col-mobile">Name</th>

              <th className="col-from">From</th>
              <th className="col-to">To</th>

              <th className="col-type">Type</th>
              <th className="col-mobile">Reason</th>

              <th className="col-status">Status</th>

              <th className="col-actions">Actions</th>
            </tr>
          </thead>

          <tbody>
            {filteredLeaves.length ? (
              filteredLeaves.map((l) => (
                <tr key={l.id}>
                  <td className="col-mobile">{l.employeeId}</td>
                  <td className="col-mobile">{l.employeeName}</td>

                  <td className="col-from">{l.fromDate}</td>
                  <td className="col-to">{l.toDate}</td>

                  <td className="col-type">{l.type}</td>
                  <td className="col-mobile">{l.reason}</td>

                  <td className="col-status">
                    <StatusBadge status={l.status} />
                  </td>

                  <td className="col-actions">
                    {l.status === "PENDING" ? (
                      <div className="d-flex justify-content-center gap-1">
                        <button
                          className="action-btn btn-approve"
                          onClick={() => updateStatus(l.id, "APPROVED")}
                        >
                          ✓
                        </button>

                        <button
                          className="action-btn btn-reject"
                          onClick={() => updateStatus(l.id, "REJECTED")}
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <button className="action-btn btn-disabled" disabled>
                        {l.status}
                      </button>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} style={{ padding: "18px", color: "#666", textAlign: "center" }}>
                  No leave requests found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Leaves;
