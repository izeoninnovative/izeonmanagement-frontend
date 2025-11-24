import { useEffect, useState } from "react";
import { Table, Button, Spinner, Alert, Badge, Form, Row, Col } from "react-bootstrap";
import API from "../../api/api";

function Leaves() {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");

  // ---------------------------------------------------------
  // FETCH LEAVES
  // ---------------------------------------------------------
  const fetchLeaves = async () => {
    try {
      const res = await API.get("/admin/leaves");
      setLeaves(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Error loading leaves:", err);
      setError("Failed to fetch leave requests.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  // ---------------------------------------------------------
  // UPDATE STATUS
  // ---------------------------------------------------------
  const updateStatus = async (leaveId, status) => {
    if (!window.confirm(`Confirm ${status.toLowerCase()}?`)) return;

    try {
      if (status === "APPROVED") {
        await API.put(`/admin/leave/${leaveId}/approve`);
      } else {
        await API.put(`/admin/leave/${leaveId}/reject`);
      }

      fetchLeaves();
    } catch (err) {
      console.error(err);
      alert("Failed to update leave status.");
    }
  };


  // ---------------------------------------------------------
  // BADGE COMPONENT
  // ---------------------------------------------------------
  const StatusBadge = ({ status }) => {
    const s = status?.toUpperCase();
    if (s === "APPROVED") return <Badge bg="success">Approved</Badge>;
    if (s === "REJECTED") return <Badge bg="danger">Rejected</Badge>;
    return <Badge bg="warning" text="dark">Pending</Badge>;
  };

  // ---------------------------------------------------------
  // FILTERS
  // ---------------------------------------------------------
  const filterByDate = (leave) => {
    if (!fromDate && !toDate) return true;

    const leaveStart = new Date(leave.fromDate);
    const from = fromDate ? new Date(fromDate) : null;
    const to = toDate ? new Date(toDate) : null;

    if (from && leaveStart < from) return false;
    if (to && leaveStart > to) return false;

    return true;
  };

  const filterByRole = (leave) => {
    const isEmployee = !!leave.employeeId;
    const isStudent = !!leave.studentId;

    if (roleFilter === "ALL") return true;
    if (roleFilter === "EMPLOYEE" && isEmployee) return true;
    if (roleFilter === "STUDENT" && isStudent) return true;

    return false;
  };
  const filteredLeaves = leaves
    .filter((l) => filterByDate(l) && filterByRole(l))
    .sort((a, b) => {
      const dateA = new Date(a.fromDate);
      const dateB = new Date(b.fromDate);

      if (dateA > dateB) return -1;
      if (dateA < dateB) return 1;

      // If dates are same → sort by ID descending
      return b.id - a.id;
    });


  const getApplicant = (l) => {
    if (l.employeeId) return { name: l.employeeName, role: "EMPLOYEE" };
    if (l.studentId) return { name: l.studentName, role: "STUDENT" };
    return { name: "Unknown", role: "Invalid" };
  };

  // ---------------------------------------------------------
  // LOADING UI
  // ---------------------------------------------------------
  if (loading)
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: "60vh" }}>
        <Spinner animation="border" />
      </div>
    );

  // ---------------------------------------------------------
  // MAIN UI
  // ---------------------------------------------------------
  return (
    <div className="p-3">

      {/* Internal Styling */}
      <style>{`
        .filter-label {
          font-weight: 600;
        }
        @media (max-width: 576px) {
          .filter-col {
            margin-bottom: 12px;
          }
        }
      `}</style>

      <h3 className="fw-bold mb-3">Leave Requests</h3>

      {error && <Alert variant="danger">{error}</Alert>}

      {/* FILTERS */}
      <Row className="mb-3">
        <Col xs={12} sm={6} md={3} className="filter-col">
          <Form.Label className="filter-label">From Date</Form.Label>
          <Form.Control
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
          />
        </Col>

        <Col xs={12} sm={6} md={3} className="filter-col">
          <Form.Label className="filter-label">To Date</Form.Label>
          <Form.Control
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
          />
        </Col>

        <Col xs={12} sm={6} md={3} className="filter-col mt-2 mt-md-0">
          <Form.Label className="filter-label">Filter By Role</Form.Label>
          <Form.Select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="ALL">All</option>
            <option value="EMPLOYEE">Employees</option>
            <option value="STUDENT">Students</option>
          </Form.Select>
        </Col>
      </Row>

      {/* TABLE */}
      <Table bordered hover responsive className="shadow-sm">
        <thead className="table-dark text-center">
          <tr>
            <th>ID</th>
            <th>Applicant</th>
            <th>Role</th>
            <th>From</th>
            <th>To</th>
            <th>Type</th>
            <th>Reason</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {filteredLeaves.length ? (
            filteredLeaves.map((l) => {
              const applicant = getApplicant(l);
              return (
                <tr key={l.id}>
                  <td>{l.id}</td>
                  <td>{applicant.name}</td>
                  <td>{applicant.role}</td>
                  <td>{l.fromDate}</td>
                  <td>{l.toDate}</td>
                  <td>{l.type}</td>
                  <td>{l.reason}</td>
                  <td><StatusBadge status={l.status} /></td>
                  <td className="text-center">
                    {l.status === "PENDING" ? (
                      <div className="d-flex justify-content-center gap-2 flex-wrap">
                        <Button
                          size="sm"
                          variant="success"
                          onClick={() => updateStatus(l.id, "APPROVED")}
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => updateStatus(l.id, "REJECTED")}
                        >
                          Reject
                        </Button>
                      </div>
                    ) : (
                      <Button size="sm" variant="secondary" disabled>
                        {l.status}
                      </Button>
                    )}
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan={9} className="text-center text-muted">
                No leave requests found.
              </td>
            </tr>
          )}
        </tbody>
      </Table>
    </div>
  );
}

export default Leaves;
