// src/pages/admin/Feedback.jsx
import React, { useEffect, useState } from "react";
import { Spinner, Alert } from "react-bootstrap";
import API from "../../api/api";

function Feedback() {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ---------------------------
  // FETCH FEEDBACKS
  // ---------------------------
  const fetchFeedbacks = async () => {
    try {
      const res = await API.get("/admin/feedbacks");
      setFeedbacks(Array.isArray(res.data) ? res.data : []);
    } catch {
      setError("Failed to fetch feedbacks.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  // ---------------------------
  // LOADING
  // ---------------------------
  if (loading)
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ height: "70vh" }}
      >
        <Spinner animation="border" variant="primary" />
      </div>
    );

  return (
    <div className="p-3">

      {/* ------------ INTERNAL STYLING ------------ */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Salsa&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&display=swap');

        * {
          font-family: 'Instrument Sans', sans-serif;
        }

        .page-title {
          font-size: 38px;
          font-weight: 700;
          text-align: center;
          margin-bottom: 35px;
          font-family: 'Salsa', cursive;
        }

        .feedback-table-container {
          border: 2px solid #000;
          border-radius: 14px;
          width: 100%;
          background: #fff;

          /* ENABLE HORIZONTAL OVERFLOW ON MOBILE */
          overflow-x: auto;
          overflow-y: hidden;
          -webkit-overflow-scrolling: touch;
        }

        table.feedback-table {
          width: 100%;
          min-width: 650px; /* important for mobile horizontal scroll */
          border-collapse: collapse;
        }

        table.feedback-table thead th {
          background: #136CED;
          color: #ffffff;
          padding: 14px;
          border: 1px solid #000;
          font-size: 18px;
          font-weight: 700;
          text-align: center;
          white-space: nowrap;
          font-family: 'Salsa', cursive;
        }

        table.feedback-table tbody td {
          padding: 14px;
          border: 1px solid #000;
          font-size: 16px;
          vertical-align: middle;
          text-align: center;
        }

        .feedback-text {
          text-align: left !important;
          font-size: 15px;
          line-height: 20px;
        }

        @media (max-width: 576px) {
          table.feedback-table tbody td {
            font-size: 14px;
            padding: 12px;
          }

          .feedback-text {
            font-size: 14px;
            line-height: 19px;
          }
        }
      `}</style>

      {/* Title */}
      <h1 className="page-title">Student Feedbacks</h1>

      {error && <Alert variant="danger">{error}</Alert>}

      {/* TABLE */}
      <div className="feedback-table-container">
        <table className="feedback-table">
          <thead>
            <tr>
              <th>Student</th>
              <th>Student ID</th>
              <th>Feedback</th>
              <th>Submitted On</th>
            </tr>
          </thead>

          <tbody>
            {feedbacks.length ? (
              feedbacks
                .sort(
                  (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
                )
                .map((fb) => (
                  <tr key={fb.id}>
                    <td>{fb.studentName || "Unknown"}</td>
                    <td>{fb.studentId || "—"}</td>
                    <td className="feedback-text">{fb.content || "—"}</td>
                    <td>
                      {fb.timestamp
                        ? new Date(fb.timestamp).toLocaleString()
                        : "—"}
                    </td>
                  </tr>
                ))
            ) : (
              <tr>
                <td colSpan="4" className="text-muted py-3">
                  No feedback records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}

export default Feedback;
