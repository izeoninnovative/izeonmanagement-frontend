import { useState, useEffect, useCallback } from "react";
import { Table, Button, Spinner, Alert, Badge, Tabs, Tab, Form, Card } from "react-bootstrap";
import API from "../../api/api";
import { useAuth } from "../../context/AuthContext";

function EmployeeMessages() {
  const { user } = useAuth();
  const [inbox, setInbox] = useState([]);
  const [sent, setSent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("inbox");

  const [form, setForm] = useState({
    receiverRole: "",
    receiverId: "",
    subject: "",
    body: "",
  });

  // ------------------ INTERNAL UI STYLES ------------------
  const styles = `
      .msg-header {
        background: linear-gradient(135deg, #1a73e8, #673ab7, #d500f9);
        background-size: 300% 300%;
        animation: gradientMove 7s ease infinite;
        border-radius: 14px;
        color: white;
        padding: 18px 22px;
        margin-bottom: 20px;
        text-align: center;
      }

      @keyframes gradientMove {
        0% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
      }

      .tab-card {
        border-radius: 12px;
        transition: all 0.25s ease;
      }

      .tab-card:hover {
        transform: translateY(-3px);
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      }

      .msg-table td {
        vertical-align: middle;
      }
  `;

  // ------------------ FETCH MESSAGES ------------------
  const fetchMessages = useCallback(async () => {
    try {
      const [receivedRes, sentRes] = await Promise.all([
        API.get(`/employee/${user.id}/messages/received`),
        API.get(`/employee/${user.id}/messages/sent`)
      ]);

      const sortedInbox = (receivedRes.data || []).sort(
        (a, b) => new Date(b.sentAt) - new Date(a.sentAt)
      );

      const sortedSent = (sentRes.data || []).sort(
        (a, b) => new Date(b.sentAt) - new Date(a.sentAt)
      );

      setInbox(sortedInbox);
      setSent(sortedSent);
    } catch (err) {
      console.error(err);
      setError("Failed to load messages");
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // ------------------ SEND MESSAGE ------------------
  const handleSend = async (e) => {
    e.preventDefault();

    if (!form.receiverRole || !form.subject || !form.body) {
      alert("Please fill all fields");
      return;
    }

    try {
      const payload = {
        receiverRole: form.receiverRole,
        receiverId: form.receiverRole === "ADMIN" ? "A001" : form.receiverId,
        subject: form.subject.trim(),
        body: form.body.trim(),
      };

      await API.post(`/employee/${user.id}/message/send`, payload);

      alert("Message sent!");
      setForm({ receiverRole: "", receiverId: "", subject: "", body: "" });
      setActiveTab("sent");
      fetchMessages();

    } catch (err) {
      console.error("Error sending:", err);
      alert("Failed to send");
    }
  };

  // ------------------ MARK AS READ ------------------
  const markAsRead = async (id) => {
    try {
      await API.put(`/employee/messages/${id}/read`);
      fetchMessages();
    } catch (err) {
      console.error("Failed to mark read");
    }
  };

  // ------------------ RECEIVER ROLES ------------------
  const getReceiverRoles = () => {
    const role = user.subRole || "EMPLOYEE";

    if (role === "TUTOR") return ["ADMIN", "EMPLOYEE", "STUDENT"];
    if (role === "ADMIN") return ["EMPLOYEE", "TUTOR", "STUDENT"];

    return ["ADMIN", "EMPLOYEE"];
  };

  // ------------------ LOADING SCREEN ------------------
  if (loading)
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: "60vh" }}>
        <Spinner animation="border" variant="primary" />
      </div>
    );

  return (
    <div className="p-3">
      <style>{styles}</style>

      {/* HEADER */}
      <div className="msg-header shadow-sm">
        <h3 className="fw-bold mb-0">Messages</h3>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      {/* TABS */}
      <Tabs activeKey={activeTab} onSelect={setActiveTab} className="mb-3">

        {/* ---------------- INBOX ---------------- */}
        <Tab eventKey="inbox" title="📥 Inbox">
          <Card className="p-3 shadow-sm tab-card">
            <Table bordered hover responsive className="shadow-sm msg-table">
              <thead className="table-dark">
                <tr>
                  <th>From</th>
                  <th>Subject</th>
                  <th>Message</th>
                  <th>Sent At</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>

              <tbody>
                {inbox.length ? (
                  inbox.map((msg) => (
                    <tr key={msg.id}>
                      <td>{msg.senderName || "Admin"} ({msg.senderRole})</td>
                      <td>{msg.subject}</td>
                      <td>{msg.body}</td>
                      <td>{new Date(msg.sentAt).toLocaleString()}</td>
                      <td>
                        <Badge bg={msg.readStatus ? "success" : "warning"}>
                          {msg.readStatus ? "Read" : "Unread"}
                        </Badge>
                      </td>
                      <td>
                        {!msg.readStatus && (
                          <Button
                            size="sm"
                            variant="outline-success"
                            onClick={() => markAsRead(msg.id)}
                          >
                            Mark Read
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan={6} className="text-center text-muted">No inbox messages</td></tr>
                )}
              </tbody>
            </Table>
          </Card>
        </Tab>

        {/* ---------------- SENT ---------------- */}
        <Tab eventKey="sent" title="📤 Sent">
          <Card className="p-3 shadow-sm tab-card">
            <Table bordered hover responsive className="shadow-sm msg-table">
              <thead className="table-dark">
                <tr>
                  <th>To</th>
                  <th>Subject</th>
                  <th>Message</th>
                  <th>Sent At</th>
                </tr>
              </thead>

              <tbody>
                {sent.length ? (
                  sent.map((msg) => (
                    <tr key={msg.id}>
                      <td>{msg.receiverRole} ({msg.receiverId})</td>
                      <td>{msg.subject}</td>
                      <td>{msg.body}</td>
                      <td>{new Date(msg.sentAt).toLocaleString()}</td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan={4} className="text-center text-muted">No sent messages</td></tr>
                )}
              </tbody>
            </Table>
          </Card>
        </Tab>

        {/* ---------------- SEND ---------------- */}
        <Tab eventKey="send" title="✉️ Send Message">
          <Card className="p-3 shadow-sm bg-light tab-card">

            <Form onSubmit={handleSend}>

              <Form.Group className="mb-3">
                <Form.Label>Receiver Role</Form.Label>
                <Form.Select
                  value={form.receiverRole}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      receiverRole: e.target.value,
                      receiverId: "",
                    })
                  }
                  required
                >
                  <option value="">Select Role</option>
                  {getReceiverRoles().map((r) => (
                    <option key={r}>{r}</option>
                  ))}
                </Form.Select>
              </Form.Group>

              {/* Receiver ID */}
              {form.receiverRole && form.receiverRole !== "ADMIN" && (
                <Form.Group className="mb-3">
                  <Form.Label>Receiver ID</Form.Label>
                  <Form.Control
                    placeholder="Enter ID (E102, S102...)"
                    value={form.receiverId}
                    onChange={(e) =>
                      setForm({ ...form, receiverId: e.target.value })
                    }
                    required
                  />
                </Form.Group>
              )}

              {/* Fixed for Admin */}
              {form.receiverRole === "ADMIN" && (
                <Form.Group className="mb-3">
                  <Form.Label>Receiver ID</Form.Label>
                  <Form.Control value="A001" disabled />
                </Form.Group>
              )}

              <Form.Group className="mb-3">
                <Form.Label>Subject</Form.Label>
                <Form.Control
                  value={form.subject}
                  onChange={(e) =>
                    setForm({ ...form, subject: e.target.value })
                  }
                  required
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Message</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={4}
                  value={form.body}
                  onChange={(e) =>
                    setForm({ ...form, body: e.target.value })
                  }
                  required
                />
              </Form.Group>

              <div className="text-end">
                <Button variant="primary" type="submit">
                  Send
                </Button>
              </div>
            </Form>
          </Card>
        </Tab>

      </Tabs>
    </div>
  );
}

export default EmployeeMessages;
