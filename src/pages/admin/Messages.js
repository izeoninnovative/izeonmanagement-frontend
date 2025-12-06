import React, { useState, useEffect, useCallback } from "react";
import { Table, Button, Form, Spinner, Alert } from "react-bootstrap";
import API from "../../api/api";

function Messages() {
  const [inbox, setInbox] = useState([]);
  const [sent, setSent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [active, setActive] = useState("inbox");

  const [form, setForm] = useState({
    receiverRole: "",
    receiverId: "",
    subject: "",
    body: "",
  });

  /* -------------------------------
         FORMAT DATETIME (IST)
  --------------------------------*/
  const formatDateTime = (value) => {
  if (!value) return "—";

  const original = new Date(value);

  // 🔥 Manually shift by +5.5 hours (UTC → IST)
  const istTime = new Date(original.getTime() + 5.5 * 60 * 60 * 1000);

  return istTime.toLocaleString("en-IN", {
    year: "2-digit",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

  /* -------------------------------
        FETCH MESSAGES
  --------------------------------*/
  const fetchMessages = useCallback(async () => {
    try {
      const [inboxRes, sentRes] = await Promise.all([
        API.get("/admin/messages/received"),
        API.get("/admin/messages/sent"),
      ]);

      setInbox(inboxRes.data || []);
      setSent(sentRes.data || []);
      setError(null);
    } catch (err) {
      setError("Failed to load messages");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  /* -------------------------------
        SEND MESSAGE FIXED
  --------------------------------*/
  const handleSend = async (e) => {
    e.preventDefault();

    try {
      let payload = {
        subject: form.subject,
        body: form.body,
      };

      if (form.receiverRole === "STUDENT") {
        payload.studentReceiver = { id: form.receiverId };
      } else if (form.receiverRole === "EMPLOYEE") {
        payload.employeeReceiver = { id: form.receiverId };
      }

      await API.post("/admin/message/send", payload);

      alert("Message sent!");
      setForm({ receiverRole: "", receiverId: "", subject: "", body: "" });
      fetchMessages();
      setActive("sent");
    } catch (err) {
      alert("Failed to send message");
    }
  };

  /* -------------------------------
        MARK AS READ
  --------------------------------*/
  const markAsRead = async (id) => {
    try {
      await API.put(`/admin/messages/${id}/read`);
      fetchMessages();
    } catch {}
  };

  /* -------------------------------
        LOADING UI
  --------------------------------*/
  if (loading)
    return (
      <div style={styles.loader}>
        <Spinner animation="border" />
      </div>
    );

  /* -------------------------------
        TABLE UI
  --------------------------------*/
  const renderTable = (rows, type) => (
    <Table bordered hover style={styles.table} className="d-none d-md-table">
      <thead>
        <tr>
          {type === "inbox" && <th style={styles.th}>From</th>}
          {type === "sent" && <th style={styles.th}>To</th>}
          <th style={styles.th}>Subject</th>
          <th style={styles.th}>Message</th>
          <th style={styles.th}>Sent At</th>
          {type === "inbox" && <th style={styles.th}>Status</th>}
        </tr>
      </thead>

      <tbody>
        {rows.length ? (
          rows
            .sort((a, b) => new Date(b.sentAt) - new Date(a.sentAt))
            .map((m) => (
              <tr key={m.id}>
                <td style={styles.td}>
                  {type === "inbox" ? m.senderName : m.receiverName}
                </td>
                <td style={styles.td}>{m.subject}</td>
                <td style={{ ...styles.td, textAlign: "left" }}>{m.body}</td>
                <td style={styles.td}>{formatDateTime(m.sentAt)}</td>

                {type === "inbox" && (
                  <td style={styles.td}>
                    {m.readStatus ? (
                      <span style={styles.readBtn}>Read</span>
                    ) : (
                      <button
                        style={styles.markReadBtn}
                        onClick={() => markAsRead(m.id)}
                      >
                        Mark as Read
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))
        ) : (
          <tr>
            <td colSpan={type === "inbox" ? 5 : 4} style={styles.noMsg}>
              No messages
            </td>
          </tr>
        )}
      </tbody>
    </Table>
  );

  /* -------------------------------
        MOBILE TABLE
  --------------------------------*/
  const renderMobileTable = (rows, type) => (
    <div className="d-md-none" style={styles.mobileCard}>
      <table style={styles.mobileTable}>
        <thead>
          <tr>
            <th style={styles.mobileTh}>{type === "inbox" ? "From" : "To"}</th>
            <th style={styles.mobileTh}>Subject</th>
          </tr>
        </thead>
        <tbody>
          {rows.length ? (
            rows.map((m) => (
              <tr key={m.id}>
                <td style={styles.mobileTd}>
                  {type === "inbox" ? m.senderName : m.receiverName}
                </td>
                <td style={styles.mobileTd}>{m.subject}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={2} style={styles.noMsg}>
                No messages
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );

  /* -------------------------------
        MAIN UI
  --------------------------------*/
  return (
    <div style={{ padding: "20px" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Salsa&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&display=swap');

        * {
          font-family: 'Instrument Sans', sans-serif !important;
        }
        .salsa {
          font-family: 'Salsa', cursive !important;
        }
      `}</style>

      <h1 style={styles.title} className="salsa">
        Messages
      </h1>

      {/* MOBILE TABS */}
      <div className="d-md-none" style={styles.mobileTabs}>
        {["inbox", "sent"].map((tab) => (
          <button
            key={tab}
            style={{
              ...styles.mobileTabBtn,
              ...(active === tab ? styles.mobileTabActive : {}),
            }}
            onClick={() => setActive(tab)}
          >
            {tab === "inbox" ? "📥 Inbox" : "📤 Sent"}
          </button>
        ))}
      </div>

      {/* MOBILE SEND */}
      <div className="d-md-none" style={styles.sendBox}>
        <button style={styles.sendBtnMobile} onClick={() => setActive("send")}>
          ➤ Send Message
        </button>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      {/* DESKTOP VIEW */}
      <div className="msg-main-box d-none d-md-flex" style={styles.desktopBox}>
        <div style={styles.sidebar}>
          <button
            style={{
              ...styles.sidebarBtn,
              ...(active === "inbox" ? styles.sidebarActive : {}),
            }}
            onClick={() => setActive("inbox")}
          >
            📥 Inbox
          </button>

          <button
            style={{
              ...styles.sidebarBtn,
              ...(active === "sent" ? styles.sidebarActive : {}),
            }}
            onClick={() => setActive("sent")}
          >
            📤 Sent
          </button>

          <button
            style={{
              ...styles.sidebarBtn,
              ...(active === "send" ? styles.sidebarActive : {}),
            }}
            onClick={() => setActive("send")}
          >
            ✉ Send Message
          </button>
        </div>

        <div style={styles.desktopContent}>
          <h2 style={styles.sectionTitle} className="salsa">
            {active === "inbox"
              ? "Inbox Messages"
              : active === "sent"
              ? "Sent Messages"
              : "Send Message"}
          </h2>

          {active === "inbox" && renderTable(inbox, "inbox")}
          {active === "sent" && renderTable(sent, "sent")}

          {active === "send" && (
            <Form onSubmit={handleSend} style={styles.sendForm}>
              <Form.Group className="mb-3">
                <Form.Label>Receiver Role</Form.Label>
                <Form.Select
                  value={form.receiverRole}
                  onChange={(e) =>
                    setForm({ ...form, receiverRole: e.target.value })
                  }
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
                  value={form.receiverId}
                  onChange={(e) =>
                    setForm({ ...form, receiverId: e.target.value })
                  }
                  required
                />
              </Form.Group>

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

              <div className="d-flex justify-content-center">
                <Button type="submit" style={styles.sendSubmitBtn}>
                  Send
                </Button>
              </div>
            </Form>
          )}
        </div>
      </div>

      {/* MOBILE VIEW */}
      {active === "inbox" && renderMobileTable(inbox, "inbox")}
      {active === "sent" && renderMobileTable(sent, "sent")}

      {active === "send" && (
        <Form
          onSubmit={handleSend}
          className="d-md-none"
          style={styles.mobileSendForm}
        >
          <Form.Group className="mb-2">
            <Form.Label>Receiver Role</Form.Label>
            <Form.Select
              value={form.receiverRole}
              onChange={(e) =>
                setForm({ ...form, receiverRole: e.target.value })
              }
            >
              <option value="">Select Role</option>
              <option value="EMPLOYEE">Employee</option>
              <option value="STUDENT">Student</option>
            </Form.Select>
          </Form.Group>

          <Form.Group className="mb-2">
            <Form.Label>Receiver ID</Form.Label>
            <Form.Control
              value={form.receiverId}
              onChange={(e) =>
                setForm({ ...form, receiverId: e.target.value })
              }
            />
          </Form.Group>

          <Form.Group className="mb-2">
            <Form.Label>Subject</Form.Label>
            <Form.Control
              value={form.subject}
              onChange={(e) =>
                setForm({ ...form, subject: e.target.value })
              }
            />
          </Form.Group>

          <Form.Group className="mb-2">
            <Form.Label>Message</Form.Label>
            <Form.Control
              as="textarea"
              rows={4}
              value={form.body}
              onChange={(e) =>
                setForm({ ...form, body: e.target.value })
              }
            />
          </Form.Group>

          <div className="d-flex justify-content-end">
            <Button type="submit" style={styles.sendSubmitBtn}>
              Send
            </Button>
          </div>
        </Form>
      )}
    </div>
  );
}

/* -----------------------------------
        INLINE STYLES
----------------------------------- */
const styles = {
  loader: {
    height: "70vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },

  title: {
    fontSize: "34px",
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 20,
  },

  desktopBox: {
    width: "100%",
    height: "80vh",
    border: "2px solid #000",
    borderRadius: 20,
    overflow: "hidden",
  },

  sidebar: {
    width: 260,
    background: "#F5F5F5",
    paddingTop: 100,
  },

  sidebarBtn: {
    width: "100%",
    padding: "12px 14px",
    background: "transparent",
    border: "none",
    textAlign: "left",
    fontSize: 18,
    borderRadius: 8,
  },

  sidebarActive: {
    background: "#fff",
    border: "2px solid #000",
  },

  desktopContent: {
    flex: 1,
    padding: 30,
    overflowY: "auto",
  },

  sectionTitle: {
    fontSize: 26,
    fontWeight: 700,
    textAlign: "center",
    marginBottom: 20,
  },

  table: { marginTop: 10 },

  th: {
    background: "#136CED",
    color: "#fff",
    fontWeight: 700,
    textAlign: "center",
  },

  td: { textAlign: "center", fontWeight: 300 },

  noMsg: { textAlign: "center", padding: 20 },

  readBtn: {
    background: "#34C759",
    padding: "5px 12px",
    borderRadius: 8,
    color: "#fff",
  },

  markReadBtn: {
    background: "#FFCC00",
    padding: "5px 12px",
    borderRadius: 8,
    fontWeight: 700,
  },

  sendForm: {
    border: "2px solid #000",
    padding: 20,
    borderRadius: 14,
    marginTop: 10,
  },

  sendSubmitBtn: {
    marginTop: 10,
    background: "#34C759",
    border: "none",
    padding: "10px 20px",
    borderRadius: 8,
  },

  /* MOBILE */
  mobileTabs: {
    display: "flex",
    justifyContent: "center",
    gap: 12,
    marginBottom: 15,
  },

  mobileTabBtn: {
    padding: "8px 18px",
    borderRadius: 10,
    border: "1px solid #000",
    background: "#fff",
    fontWeight: 500,
  },

  mobileTabActive: {
    background: "#136CED",
    color: "#fff",
    border: "none",
  },

  sendBox: {
    display: "flex",
    justifyContent: "center",
    marginBottom: 12,
  },

  sendBtnMobile: {
    padding: "10px 18px",
    borderRadius: 10,
    border: "1px solid #000",
    fontWeight: 600,
  },

  mobileCard: {
    border: "2px solid #000",
    borderRadius: 14,
    padding: 12,
    marginTop: 10,
  },

  mobileTable: { width: "100%" },

  mobileTh: {
    background: "#136CED",
    color: "#fff",
    padding: 6,
    border: "1px solid #000",
  },

  mobileTd: {
    padding: 6,
    border: "1px solid #000",
  },

  mobileSendForm: {
    border: "2px solid #000",
    borderRadius: 14,
    padding: 15,
    marginTop: 10,
  },
};

export default Messages;
