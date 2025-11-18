import React, { useState, useEffect, useCallback } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Spinner,
  Alert,
  Badge,
  Tabs,
  Tab,
} from "react-bootstrap";
import API from "../../api/api";

function Messages() {
  const [inbox, setInbox] = useState([]);
  const [sent, setSent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("inbox");
  const [showModal, setShowModal] = useState(false);

  const [form, setForm] = useState({
    receiverRole: "",
    receiverId: "",
    subject: "",
    body: "",
  });

  /* ---------------- INTERNAL RESPONSIVE CSS ---------------- */
  const internalStyles = `
    .messages-wrapper {
      width: 100%;
      overflow-x: auto;
    }

    .messages-title {
      font-size: 1.7rem;
    }

    @media (max-width: 576px) {
      .messages-title {
        font-size: 1.3rem;
      }
      .tab-container {
        font-size: 0.9rem;
      }
      .msg-text {
        text-align: left !important;
      }
    }
  `;

  /* ---------------- FETCH MESSAGES ---------------- */
  const fetchMessages = useCallback(async () => {
    setLoading(true);
    try {
      const [inboxRes, sentRes] = await Promise.all([
        API.get("/admin/messages/received"),
        API.get("/admin/messages/sent"),
      ]);

      setInbox(inboxRes.data || []);
      setSent(sentRes.data || []);
    } catch (err) {
      console.error(err);
      setError("Failed to load messages");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  /* ---------------- FORM HANDLER ---------------- */
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  /* ---------------- SEND MESSAGE ---------------- */
  const handleSend = async (e) => {
    e.preventDefault();

    try {
      await API.post("/admin/message/send", {
        senderRole: "ADMIN",
        ...form,
      });

      alert("Message sent successfully!");
      setShowModal(false);

      setForm({ receiverRole: "", receiverId: "", subject: "", body: "" });

      fetchMessages();
      setActiveTab("sent");
    } catch (err) {
      console.error("Send error:", err);
      alert("Failed to send message");
    }
  };

  /* ---------------- MARK AS READ ---------------- */
  const markAsRead = async (id) => {
    try {
      await API.put(`/admin/messages/${id}/read`);
      fetchMessages();
    } catch (err) {
      console.error("Update failed:", err);
    }
  };

  /* ---------------- LOADING ---------------- */
  if (loading)
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ height: "70vh" }}
      >
        <Spinner animation="border" />
      </div>
    );

  return (
    <div className="p-3">
      <style>{internalStyles}</style>

      <h3 className="fw-bold mb-3 messages-title">Admin Messages</h3>

      {error && <Alert variant="danger">{error}</Alert>}

      <Tabs
        activeKey={activeTab}
        onSelect={setActiveTab}
        className="mb-3 tab-container"
        justify
      >

        {/* ================= INBOX TAB ================= */}
        <Tab eventKey="inbox" title="📥 Inbox">
          <div className="messages-wrapper">
            <Table bordered hover responsive className="shadow-sm text-center">
              <thead className="table-dark">
                <tr>
                  <th>From</th>
                  <th>Role</th>
                  <th>Subject</th>
                  <th className="msg-text">Message</th>
                  <th>Sent At</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>

              <tbody>
                {inbox.length > 0 ? (
                  inbox
                    .sort((a, b) => new Date(b.sentAt) - new Date(a.sentAt))
                    .map((msg) => (
                      <tr key={msg.id}>
                        <td>{msg.senderName || msg.senderId}</td>

                        <td>
                          <Badge
                            bg={
                              msg.senderRole === "STUDENT"
                                ? "info"
                                : msg.senderRole === "EMPLOYEE"
                                ? "secondary"
                                : "dark"
                            }
                          >
                            {msg.senderRole}
                          </Badge>
                        </td>

                        <td>{msg.subject}</td>

                        <td className="msg-text">{msg.body}</td>

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
                    <td colSpan={7} className="text-muted">
                      No messages found.
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>
        </Tab>

        {/* ================= SENT TAB ================= */}
        <Tab eventKey="sent" title="📤 Sent">
          <div className="messages-wrapper">
            <Table bordered hover responsive className="shadow-sm text-center">
              <thead className="table-dark">
                <tr>
                  <th>To</th>
                  <th>Role</th>
                  <th>Subject</th>
                  <th className="msg-text">Message</th>
                  <th>Sent At</th>
                </tr>
              </thead>

              <tbody>
                {sent.length > 0 ? (
                  sent
                    .sort((a, b) => new Date(b.sentAt) - new Date(a.sentAt))
                    .map((msg) => (
                      <tr key={msg.id}>
                        <td>{msg.receiverName || msg.receiverId}</td>

                        <td>
                          <Badge
                            bg={
                              msg.receiverRole === "STUDENT"
                                ? "info"
                                : msg.receiverRole === "EMPLOYEE"
                                ? "secondary"
                                : "dark"
                            }
                          >
                            {msg.receiverRole}
                          </Badge>
                        </td>

                        <td>{msg.subject}</td>

                        <td className="msg-text">{msg.body}</td>

                        <td>{new Date(msg.sentAt).toLocaleString()}</td>
                      </tr>
                    ))
                ) : (
                  <tr>
                    <td colSpan={5} className="text-muted">
                      No sent messages.
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>
        </Tab>

        {/* ================= SEND MESSAGE TAB ================= */}
        <Tab eventKey="send" title="✉️ Send Message">
          <Form
            onSubmit={handleSend}
            className="border p-3 bg-light shadow-sm rounded"
          >
            <Form.Group className="mb-3">
              <Form.Label>Receiver Role</Form.Label>
              <Form.Select
                name="receiverRole"
                value={form.receiverRole}
                onChange={handleChange}
                required
              >
                <option value="">Select Role</option>
                <option value="EMPLOYEE">Employee</option>
                <option value="STUDENT">Student</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Receiver ID</Form.Label>
              <Form.Control
                name="receiverId"
                placeholder="E101 / S102"
                value={form.receiverId}
                onChange={handleChange}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Subject</Form.Label>
              <Form.Control
                name="subject"
                value={form.subject}
                onChange={handleChange}
                required
              />
            </Form.Group>

            <Form.Group>
              <Form.Label>Message</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                name="body"
                value={form.body}
                onChange={handleChange}
                required
              />
            </Form.Group>

            <div className="text-end mt-3">
              <Button variant="primary" type="submit">
                Send Message
              </Button>
            </div>
          </Form>
        </Tab>
      </Tabs>

      {/* ================== MODAL SEND MESSAGE ================= */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Send Message</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <Form onSubmit={handleSend}>
            <Form.Group className="mb-3">
              <Form.Label>Receiver Role</Form.Label>
              <Form.Select
                name="receiverRole"
                value={form.receiverRole}
                onChange={handleChange}
                required
              >
                <option value="">Select Role</option>
                <option value="EMPLOYEE">Employee</option>
                <option value="STUDENT">Student</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Receiver ID</Form.Label>
              <Form.Control
                name="receiverId"
                placeholder="E101 / S102"
                value={form.receiverId}
                onChange={handleChange}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Subject</Form.Label>
              <Form.Control
                name="subject"
                value={form.subject}
                onChange={handleChange}
                required
              />
            </Form.Group>

            <Form.Group>
              <Form.Label>Message</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="body"
                value={form.body}
                onChange={handleChange}
                required
              />
            </Form.Group>

            <div className="text-end mt-3">
              <Button variant="secondary" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit" className="ms-2">
                Send
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </div>
  );
}

export default Messages;
