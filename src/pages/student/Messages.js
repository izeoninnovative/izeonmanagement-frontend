import { useState, useEffect, useCallback } from "react";
import {
  Table,
  Button,
  Spinner,
  Alert,
  Badge,
  Tabs,
  Tab,
  Form,
  Card,
} from "react-bootstrap";
import API from "../../api/api";
import { useAuth } from "../../context/AuthContext";

function StudentMessages() {
  const { user } = useAuth();

  const [inbox, setInbox] = useState([]);
  const [sent, setSent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("inbox");

  const [form, setForm] = useState({
    subject: "",
    body: "",
  });

  /* ---------------------------------------------------------
     PREMIUM STYLES (Gradient Header + Cards)
  --------------------------------------------------------- */
  const styles = `
    .messages-header {
      background: linear-gradient(135deg, #1a73e8, #673ab7, #d500f9);
      background-size: 300% 300%;
      animation: msgGradient 7s ease infinite;
      border-radius: 14px;
      padding: 20px 25px;
      color: white;
    }
    @keyframes msgGradient {
      0% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }
    .msg-card {
      border-radius: 14px;
      transition: 0.25s ease;
    }
    .msg-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 4px 18px rgba(0,0,0,0.15);
    }
  `;

  /* ---------------------------------------------------------
     FETCH ALL MESSAGES (INBOX + SENT)
  --------------------------------------------------------- */
  const fetchAllMessages = useCallback(async () => {
    try {
      const [receivedRes, sentRes] = await Promise.all([
        API.get(`/student/${user.id}/messages/received`),
        API.get(`/student/${user.id}/messages/sent`),
      ]);

      setInbox(
        (receivedRes.data || []).sort(
          (a, b) => new Date(b.sentAt) - new Date(a.sentAt)
        )
      );

      setSent(
        (sentRes.data || []).sort(
          (a, b) => new Date(b.sentAt) - new Date(a.sentAt)
        )
      );
    } catch (err) {
      setError("Failed to load messages.");
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  useEffect(() => {
    fetchAllMessages();
  }, [fetchAllMessages]);

  /* ---------------------------------------------------------
     SEND MESSAGE TO ADMIN
  --------------------------------------------------------- */
  const handleSendMessage = async (e) => {
    e.preventDefault();

    const receiverRole = form.receiverRole;
    const receiverId = form.receiverId?.trim().toUpperCase();
    const subject = form.subject.trim();
    const body = form.body.trim();

    if (!receiverRole || !subject || !body) {
      alert("⚠️ Please fill all fields");
      return;
    }

    // ❌ prevent sending to self
    if (receiverRole === "STUDENT" && receiverId === user.id.toUpperCase()) {
      alert("❌ You cannot send a message to yourself.");
      return;
    }

    // build payload
    let payload = { subject, body };

    if (receiverRole === "ADMIN") {
      payload.adminReceiver = { id: "A001" };
    }
    else if (receiverRole === "TUTOR") {
      payload.employeeReceiver = { id: receiverId };
    }
    else if (receiverRole === "STUDENT") {
      payload.studentReceiver = { id: receiverId };
    }

    try {
      await API.post(`/student/${user.id}/message/send`, payload);

      alert("✅ Message sent successfully!");
      setForm({ receiverRole: "", receiverId: "", subject: "", body: "" });
      setActiveTab("sent");
      fetchAllMessages();
    } catch (err) {
      alert("❌ Failed to send message");
    }
  };

  /* ---------------------------------------------------------
     MARK AS READ
  --------------------------------------------------------- */
  const markAsRead = async (id) => {
    try {
      await API.put(`/student/messages/${id}/read`);
      fetchAllMessages();
    } catch {
      console.error("Failed to mark read");
    }
  };

  /* ---------------------------------------------------------
     LOADING SCREEN
  --------------------------------------------------------- */
  if (loading)
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: "60vh" }}>
        <Spinner animation="border" />
      </div>
    );

  /* ---------------------------------------------------------
     UI
  --------------------------------------------------------- */
  return (
    <div className="p-3 p-md-4">
      <style>{styles}</style>

      {/* HEADER */}
      <div className="messages-header mb-4 shadow-sm">
        <h3 className="fw-bold mb-0">Messages</h3>
      </div>

      {error && (
        <Alert variant="danger" className="shadow-sm fw-semibold">
          {error}
        </Alert>
      )}

      <Tabs
        activeKey={activeTab}
        onSelect={setActiveTab}
        className="mb-3"
        fill
      >
        {/* ---------------------------------------------------
           📥 INBOX TAB
        --------------------------------------------------- */}
        <Tab eventKey="inbox" title="📥 Inbox">
          <Card className="shadow-sm msg-card p-3">
            <Table responsive bordered hover className="mb-0">
              <thead className="table-dark">
                <tr>
                  <th>From</th>
                  <th>Subject</th>
                  <th>Message</th>
                  <th>Sent At</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {inbox.length ? (
                  inbox.map((msg) => (
                    <tr key={msg.id}>
                      <td>{msg.senderName || "Admin"}</td>
                      <td className="fw-bold">{msg.subject}</td>
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
                  <tr>
                    <td colSpan={6} className="text-center text-muted">
                      No messages in your inbox.
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </Card>
        </Tab>

        {/* ---------------------------------------------------
           📤 SENT TAB
        --------------------------------------------------- */}
        <Tab eventKey="sent" title="📤 Sent">
          <Card className="shadow-sm msg-card p-3">
            <Table responsive bordered hover className="mb-0">
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
                      <td>{msg.receiverName} ({msg.receiverRole})</td>
                      <td>{msg.subject}</td>
                      <td>{msg.body}</td>
                      <td>{new Date(msg.sentAt).toLocaleString()}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="text-center text-muted">
                      No sent messages.
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </Card>
        </Tab>

        {/* ---------------------------------------------------
           ✉️ SEND MESSAGE TAB
        --------------------------------------------------- */}
        <Tab eventKey="send" title="✉️ Send Message">
          <Card className="p-4 shadow-sm msg-card bg-light">
            <Form onSubmit={handleSendMessage}>

              {/* Select Role */}
              <Form.Group className="mb-3">
                <Form.Label>Send To</Form.Label>
                <Form.Select
                  value={form.receiverRole || ""}
                  onChange={(e) => {
                    const role = e.target.value;
                    setForm({
                      ...form,
                      receiverRole: role,
                      receiverId: role === "ADMIN" ? "A001" : "",
                    });
                  }}
                  required
                >
                  <option value="">Select Role</option>
                  <option value="ADMIN">Admin</option>
                  <option value="TUTOR">Tutor</option>
                  <option value="STUDENT">Another Student</option>
                </Form.Select>
              </Form.Group>

              {/* Admin fixed ID */}
              {form.receiverRole === "ADMIN" && (
                <Form.Group className="mb-3">
                  <Form.Label>Receiver ID</Form.Label>
                  <Form.Control disabled value="A001" />
                </Form.Group>
              )}

              {/* Tutor/Student ID input */}
              {(form.receiverRole === "TUTOR" || form.receiverRole === "STUDENT") && (
                <Form.Group className="mb-3">
                  <Form.Label>Receiver ID</Form.Label>
                  <Form.Control
                    placeholder={
                      form.receiverRole === "TUTOR"
                        ? "Enter Tutor ID (E101, E202...)"
                        : "Enter Student ID (S103...)"
                    }
                    value={form.receiverId}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        receiverId: e.target.value.toUpperCase().trim(),
                      })
                    }
                    required
                  />
                </Form.Group>
              )}

              {/* Subject */}
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

              {/* Body */}
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
                <Button variant="primary" type="submit" className="px-4">
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

export default StudentMessages;
