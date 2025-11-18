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
            // SEND to each recipient Individually
            for (const r of recipients) {
                const payload = {
                    subject: form.subject,
                    body: form.body,
                };

                // Attach correct receiver object
                if (r.role === "EMPLOYEE") {
                    payload.employeeReceiver = { id: r.id };
                } else if (r.role === "STUDENT") {
                    payload.studentReceiver = { id: r.id };
                } else if (r.role === "ADMIN") {
                    // admin receiver → no object needed
                }

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
        <Modal show={show} onHide={onHide} centered>
            <Modal.Header closeButton>
                <Modal.Title>Send Message</Modal.Title>
            </Modal.Header>

            <Modal.Body>
                <p>
                    <strong>Sending to:</strong>{" "}
                    {recipients.map((r) => `${r.name} (${r.id})`).join(", ")}
                </p>

                <Form>
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
                </Form>
            </Modal.Body>

            <Modal.Footer>
                <Button variant="secondary" onClick={onHide}>
                    Cancel
                </Button>

                <Button variant="primary" onClick={sendMessage}>
                    Send
                </Button>
            </Modal.Footer>
        </Modal>
    );
}

export default MessageModal;
