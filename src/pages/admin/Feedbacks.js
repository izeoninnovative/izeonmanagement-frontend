import React, { useEffect, useState } from "react";
import { Table, Spinner, Alert } from "react-bootstrap";
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
    } catch (err) {
      console.error(err);
      setError("Failed to fetch feedbacks.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  // ---------------------------
  // LOADING SCREEN
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

      {/* Internal Styling */}
      <style>{`
        .feedback-title {
          font-size: 1.8rem;
        }

        @media (max-width: 576px) {
          .feedback-title {
            font-size: 1.3rem;
          }
        }

        .feedback-table-wrapper {
          width: 100%;
          overflow-x: auto;
        }

        table td {
          vertical-align: middle;
        }
      `}</style>

      <h3 className="fw-bold mb-3 feedback-title">Student Feedbacks</h3>

      {error && <Alert variant="danger">{error}</Alert>}

      <div className="feedback-table-wrapper">
        <Table bordered hover responsive className="shadow-sm text-center">
          <thead className="table-dark">
            <tr>
              <th>#</th>
              <th>Student</th>
              <th>Student ID</th>
              <th>Feedback</th>
              <th>Submitted On</th>
            </tr>
          </thead>

          <tbody>
            {feedbacks.length > 0 ? (
              feedbacks
                .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                .map((fb, index) => (
                  <tr key={fb.id}>
                    <td>{index + 1}</td>

                    {/* Student Name */}
                    <td>{fb.studentName || "Unknown"}</td>

                    {/* Student ID */}
                    <td>{fb.studentId || "—"}</td>

                    {/* Feedback */}
                    <td style={{ textAlign: "left" }}>{fb.content || "—"}</td>

                    {/* Timestamp */}
                    <td>
                      {fb.timestamp
                        ? new Date(fb.timestamp).toLocaleString()
                        : "—"}
                    </td>
                  </tr>
                ))
            ) : (
              <tr>
                <td colSpan={5} className="text-muted">
                  No feedback records found.
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </div>
    </div>
  );
}

export default Feedback;
