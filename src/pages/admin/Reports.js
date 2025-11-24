import React, { useEffect, useState } from "react";
import { Table, Button, Spinner, Alert, Form, Row, Col, Card, Badge } from "react-bootstrap";
import API from "../../api/api";

function Reports() {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [empId, setEmpId] = useState("");
    const [month, setMonth] = useState("");
    const [year, setYear] = useState("");
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");

    // Load ALL REPORTS on mount
    const loadReports = async () => {
        try {
            const res = await API.get("/admin/report/all");
            setReports(res.data);
        } catch (e) {
            setError("Failed to load reports");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadReports();
    }, []);

    // Search by Employee
    const searchByEmployee = async () => {
        if (!empId) return;
        setLoading(true);
        try {
            const res = await API.get(`/admin/report/employee/${empId}`);
            setReports(res.data);
        } catch {
            setError("Could not fetch employee reports");
        } finally {
            setLoading(false);
        }
    };

    // Search Monthly
    const searchMonthly = async () => {
        if (!month || !year) return;
        setLoading(true);
        try {
            const res = await API.get(`/admin/report/employee/${empId}/month`, {
                params: { month, year },
            });
            setReports(res.data);
        } catch {
            setError("Could not fetch monthly reports");
        } finally {
            setLoading(false);
        }
    };

    // Search by Date Range
    const searchRange = async () => {
        if (!fromDate || !toDate) return;
        setLoading(true);
        try {
            const res = await API.get(`/admin/report/employee/${empId}/range`, {
                params: { from: fromDate, to: toDate },
            });
            setReports(res.data);
        } catch {
            setError("Could not fetch range reports");
        } finally {
            setLoading(false);
        }
    };

    // Delete Report
    const deleteReport = async (id) => {
        if (!window.confirm("Delete this report?")) return;

        try {
            await API.delete(`/employee/report/${id}`);
            loadReports();
        } catch {
            alert("Delete failed");
        }
    };

    return (
        <div className="p-3">

            <h3 className="fw-bold mb-3">Admin Reports</h3>

            {error && <Alert variant="danger">{error}</Alert>}

            {/* Filters */}
            <Card className="p-3 shadow-sm mb-3">
                <Row className="gy-3">
                    <Col md={3}>
                        <Form.Control
                            placeholder="Employee ID"
                            value={empId}
                            onChange={(e) => setEmpId(e.target.value)}
                        />
                    </Col>

                    <Col md={3}>
                        <Form.Control type="number" placeholder="Month" value={month} onChange={(e) => setMonth(e.target.value)} />
                    </Col>

                    <Col md={3}>
                        <Form.Control type="number" placeholder="Year" value={year} onChange={(e) => setYear(e.target.value)} />
                    </Col>

                    <Col md={3}>
                        <Button className="w-100" onClick={searchMonthly}>Search Monthly</Button>
                    </Col>

                    <Col md={3}>
                        <Form.Control type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
                    </Col>

                    <Col md={3}>
                        <Form.Control type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
                    </Col>

                    <Col md={3}>
                        <Button className="w-100" onClick={searchRange}>Search Range</Button>
                    </Col>

                    <Col md={3}>
                        <Button className="w-100" variant="secondary" onClick={searchByEmployee}>
                            View All of Employee
                        </Button>
                    </Col>
                </Row>
            </Card>

            {/* Table */}
            {loading ? (
                <div className="text-center py-5">
                    <Spinner />
                </div>
            ) : (
                <Table bordered hover responsive className="shadow-sm">
                    <thead className="table-dark text-center">
                        <tr>
                            <th>ID</th>
                            <th>Date</th>
                            <th>Employee</th>
                            <th>Total Entries</th>
                            <th>Entries</th>
                            <th>Delete</th>
                        </tr>
                    </thead>

                    <tbody>
                        {reports.length ? (
                            reports.map((r) => (
                                <tr key={r.id}>
                                    <td>{r.id}</td>
                                    <td>{r.date}</td>
                                    <td>{r.employeeName} ({r.employeeId})</td>
                                    <td>{r.entries.length}</td>

                                    <td>
                                        {r.entries.map((e, i) => (
                                            <div key={i}>
                                                <Badge bg="info">
                                                    {e.fromTime} - {e.toTime}: {e.description}
                                                </Badge>
                                                <br />
                                            </div>
                                        ))}
                                    </td>

                                    <td className="text-center">
                                        <Button size="sm" variant="danger" onClick={() => deleteReport(r.id)}>
                                            Delete
                                        </Button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={6} className="text-center text-muted py-3">
                                    No reports found
                                </td>
                            </tr>
                        )}
                    </tbody>
                </Table>
            )}
        </div>
    );
}

export default Reports;
