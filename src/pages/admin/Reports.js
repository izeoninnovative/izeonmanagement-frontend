// src/pages/admin/Reports.jsx
import React, { useEffect, useState, useCallback } from "react";
import { Spinner, Alert, Form, Row, Col } from "react-bootstrap";
import API from "../../api/api";

function Reports() {
  const currentYear = new Date().getFullYear();

  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [empId, setEmpId] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState(currentYear);

  /* ---------------- LOAD TODAY'S REPORT ---------------- */
  const loadTodayReports = useCallback(async () => {
    const d = new Date();
    const today =
      `${d.getFullYear()}-` +
      `${String(d.getMonth() + 1).padStart(2, "0")}-` +
      `${String(d.getDate()).padStart(2, "0")}`;

    setLoading(true);

    try {
      const res = await API.get("/admin/report/all", { params: { date: today } });
      setReports(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.log(err);
      setError("Unable to load today's reports.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTodayReports();
  }, [loadTodayReports]);

  /* ---------------------- SEARCH LOGIC ---------------------- */
  const handleSearch = async () => {
    setError("");

    // Employee date range
    if (empId && fromDate && toDate) {
      setLoading(true);
      try {
        const res = await API.get(`/admin/report/employee/${empId}/range`, {
          params: { from: fromDate, to: toDate },
        });
        setReports(res.data);
      } catch {
        setError("Failed to fetch employee range reports.");
      } finally {
        setLoading(false);
      }
      return;
    }

    // Employee monthly
    if (empId && month && year) {
      setLoading(true);
      try {
        const res = await API.get(`/admin/report/employee/${empId}/month`, {
          params: { month, year },
        });
        setReports(res.data);
      } catch {
        setError("Failed to fetch employee monthly reports.");
      } finally {
        setLoading(false);
      }
      return;
    }

    // All employees monthly
    if (!empId && month && year) {
      setLoading(true);
      try {
        const res = await API.get(`/admin/report/month`, {
          params: { month, year },
        });
        setReports(res.data);
      } catch {
        setError("Failed to fetch monthly reports.");
      } finally {
        setLoading(false);
      }
      return;
    }

    loadTodayReports();
  };

  return (
    <div className="p-3">

      {/* ------------------ TITLE ------------------ */}
      <h1
        className="text-center mb-4"
        style={{
          fontSize: "40px",
          fontWeight: 700,
          fontFamily: "'Salsa', cursive",
        }}
      >
        All Reports
      </h1>

      {/* ------------------ CSS ------------------ */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Salsa&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&display=swap');

        * {
          font-family: 'Instrument Sans', sans-serif;
        }

        .filter-box {
          border: 2px solid #2D68FE;
          border-radius: 20px;
          padding: 25px;
          background: #fff;
          margin-bottom: 40px;
        }

        .filter-label {
          font-weight: 600;
          font-family: 'Salsa', cursive;
        }

        /* TABLE CONTAINER */
        .reports-table-container {
          border: 2px solid #2D68FE;
          border-radius: 6px;
          overflow-x: auto;
          overflow-y: hidden;
          -webkit-overflow-scrolling: touch;
          width: 100%;
        }

        table.reports-table {
          width: 100%;
          min-width: 350px;
          border-collapse: collapse;
        }

        table.reports-table thead th {
          padding: 14px;
          font-size: 18px;
          font-weight: 700;
          border: 1px solid #000;
          background: #fff;
          text-align: center;
          font-family: 'Salsa', cursive;
        }

        table.reports-table tbody td {
          padding: 14px;
          border: 1px solid #000;
          text-align: center;
          vertical-align: top;
          font-size: 15px;
        }

        .entry-box {
          background: #E5E5E5;
          padding: 10px 12px;
          border-radius: 8px;
          margin-bottom: 10px;
          display: flex;
        }
        .entry-time {
          font-weight: 700;
          padding-right: 12px;
          margin-right: 12px;
          border-right: 2px solid #000;
        }
        .entry-text {
          flex: 1;
          text-align: left;
          font-size: 14px;
        }

        /* ------------ MOBILE VIEW ------------ */
        @media (max-width: 576px) {
          /* Hide Employee header */
          .reports-table thead th:nth-child(1) {
            display: none;
          }

          /* Hide employee column */
          .reports-table tbody td:nth-child(1) {
            display: none;
          }

          /* Mobile date = date + employee details */
          .mobile-date {
            display: block;
            text-align: left;
            font-weight: 700;
            font-size: 15px;
          }

          .mobile-date-sub {
            display: block;
            font-size: 13px;
            margin-top: 3px;
            color: #555;
            font-weight: 600;
          }

          /* Entries full width */
          .reports-table tbody td:nth-child(3) {
            text-align: left !important;
          }
        }

        /* ------------ DESKTOP VIEW ------------ */
        @media (min-width: 577px) {
          .mobile-date-sub {
            display: none !important;
          }
          .mobile-date {
            text-align: center !important;
            display: block;
          }
        }

        .btn-search {
          background: #34C759;
          padding: 12px 20px;
          border: none;
          border-radius: 10px;
          color: #fff;
          font-weight: 600;
          cursor: pointer;
          width: 100%;
          font-family: 'Salsa', cursive;
        }
      `}</style>

      {error && <Alert variant="danger">{error}</Alert>}

      {/* ------------------ FILTER BOX ------------------ */}
      <div className="filter-box">
        <Row className="gy-3">
          <Col md={4}>
            <Form.Label className="filter-label">Employee ID</Form.Label>
            <Form.Control
              placeholder="Employee ID"
              value={empId}
              onChange={(e) => setEmpId(e.target.value)}
            />
          </Col>

          <Col md={4}>
            <Form.Label className="filter-label">Month</Form.Label>
            <Form.Select value={month} onChange={(e) => setMonth(e.target.value)}>
              <option value="">Select Month</option>
              {["01","02","03","04","05","06","07","08","09","10","11","12"].map((m) => (
                <option key={m} value={m}>
                  {["January","February","March","April","May","June","July","August","September","October","November","December"][parseInt(m)-1]}
                </option>
              ))}
            </Form.Select>
          </Col>

          <Col md={4}>
            <Form.Label className="filter-label">Year</Form.Label>
            <Form.Control
              type="number"
              value={year}
              onChange={(e) => setYear(e.target.value)}
            />
          </Col>

          <Col md={4}>
            <Form.Label className="filter-label">Start Date</Form.Label>
            <Form.Control
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
          </Col>

          <Col md={4}>
            <Form.Label className="filter-label">End Date</Form.Label>
            <Form.Control
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
          </Col>

          <Col md={4} className="d-flex align-items-end">
            <button className="btn-search" onClick={handleSearch}>
              Search
            </button>
          </Col>
        </Row>
      </div>

      {/* ------------------ TABLE ------------------ */}
      {loading ? (
        <div className="text-center py-5"><Spinner /></div>
      ) : (
        <div className="reports-table-container">
          <table className="reports-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Date</th>
                <th>Entries</th>
              </tr>
            </thead>

            <tbody>
              {reports.length ? (
                reports.map((r, idx) => (
                  <tr key={idx}>
                    {/* Employee (hidden on mobile) */}
                    <td>
                      <strong>{r.employeeId}</strong>
                      <div className="employee-sub">{r.employeeName}</div>
                    </td>

                    {/* DATE CELL */}
                    <td>
                      <span className="mobile-date">{r.date}</span>
                      <span className="mobile-date-sub">
                        {r.employeeId} — {r.employeeName}
                      </span>
                    </td>

                    <td>
                      {r.entries.map((e, i) => (
                        <div key={i} className="entry-box">
                          <span className="entry-time">
                            {e.fromTime} — {e.toTime}
                          </span>
                          <span className="entry-text">{e.description}</span>
                        </div>
                      ))}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="text-center text-muted py-3">
                    No reports found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default Reports;
