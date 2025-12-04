// src/components/MessageModal.jsx
import { Modal, Button, Form } from "react-bootstrap";
import { useState } from "react";
import API from "../api/api";

function MessageModal({ show, onHide, recipients = [], senderRole }) {
  const [form, setForm] = useState({
    subject: "",
    body: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const sendMessage = async () => {
    if (!form.subject.trim() || !form.body.trim()) {
      alert("Please fill subject and message.");
      return;
    }

    try {
      for (const r of recipients) {
        const payload = {
          subject: form.subject,
          body: form.body,
        };

        if (r.role === "EMPLOYEE") payload.employeeReceiver = { id: r.id };
        if (r.role === "STUDENT") payload.studentReceiver = { id: r.id };

        await API.post("/admin/message/send", payload);
      }

      alert("Message sent!");
      setForm({ subject: "", body: "" });
      onHide();
    } catch (err) {
      console.error(err);
      alert("Failed to send message.");
    }
  };

  return (
    <Modal
      show={show}
      onHide={onHide}
      centered
      dialogClassName="figma-msg-modal"
    >
      <style>{`
        .figma-msg-modal .modal-content {
          border-radius: 18px !important;
          border: 2px solid #000 !important;
          font-family: 'Instrument Sans', sans-serif !important;
          overflow: hidden;
        }

        .figma-msg-header {
          padding: 14px 22px;
          border-bottom: 1px solid #e6e6e6;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .figma-msg-title {
          font-size: 22px;
          font-family: 'Salsa', cursive;
          font-weight: 700;
          color: #136CED;
          margin: 0;
        }

        .figma-close-btn {
          font-size: 22px;
          font-weight: 700;
          color: #ff383c;
          cursor: pointer;
        }

        .figma-msg-body {
          padding: 16px 22px 8px;
        }

        .figma-label {
          font-size: 15px;
          font-weight: 600;
          margin-bottom: 4px;
        }

        .figma-input {
          border-radius: 10px !important;
          border: 1.4px solid #d1d1d1 !important;
          padding: 8px 12px !important;
          font-size: 15px !important;
        }

        .figma-textarea {
          border-radius: 12px !important;
          border: 1.4px solid #d1d1d1 !important;
          padding: 10px 12px !important;
          font-size: 15px !important;
          min-height: 110px;
        }

        .figma-footer {
          padding: 14px 22px 22px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .figma-cancel-btn {
          width: 100%;
          padding: 10px;
          border-radius: 12px;
          background: #fff;
          border: 1.4px solid #d1d1d1;
          font-weight: 600;
          font-size: 16px;
          color:#136CED;
        }

        .figma-send-btn {
          width: 100%;
          padding: 12px;
          border-radius: 12px;
          background: #136CED;
          border: none;
          color: #fff;
          font-weight: 700;
          font-size: 17px;
        }

        @media (max-width: 576px) {
          .figma-msg-modal .modal-dialog {
            max-width: 94% !important;
          }
        }
      `}</style>

      {/* HEADER */}
      <div className="figma-msg-header">
        <div className="figma-msg-title">Send Message</div>
        <span className="figma-close-btn" onClick={onHide}>×</span>
      </div>

      {/* BODY */}
      <div className="figma-msg-body">
        <p style={{ fontSize: "15px", marginBottom: "10px" }}>
          <strong>Sending to:</strong>{" "}
          {recipients.map((r) => `${r.name} (${r.id})`).join(", ")}
        </p>

        <Form.Group className="mb-3">
          <Form.Label className="figma-label">Subject</Form.Label>
          <Form.Control
            className="figma-input"
            name="subject"
            placeholder="Enter Subject"
            value={form.subject}
            onChange={handleChange}
          />
        </Form.Group>

        <Form.Group>
          <Form.Label className="figma-label">Message</Form.Label>
          <Form.Control
            as="textarea"
            name="body"
            className="figma-textarea"
            placeholder="Type your message..."
            value={form.body}
            onChange={handleChange}
          />
        </Form.Group>
      </div>

      {/* FOOTER */}
      <div className="figma-footer">
        <Button className="figma-cancel-btn" onClick={onHide}>
          Cancel
        </Button>

        <Button className="figma-send-btn" onClick={sendMessage}>
          Send
        </Button>
      </div>
    </Modal>
  );
}

export default MessageModal;
