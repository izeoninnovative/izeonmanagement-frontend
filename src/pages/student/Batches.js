import React, { useEffect, useState, useCallback } from "react";
import {
  Badge,
  Button,
  Spinner,
  Alert,
  Modal,
  ListGroup,
  Form,
  Card,
} from "react-bootstrap";
import API from "../../api/api";
import { useAuth } from "../../context/AuthContext";

function StudentBatches() {
  const { user } = useAuth();
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Message Modal
  const [showModal, setShowModal] = useState(false);
  const [receiver, setReceiver] = useState(null);
  const [msgForm, setMsgForm] = useState({ subject: "", body: "" });

  // Injected Styles (same UI theme as your other pages)
  const styles = `
    .batch-header {
      background: linear-gradient(135deg, #1a73e8, #673ab7, #d500f9);
      background-size: 300% 300%;
      animation: gradientMove 7s ease infinite;
      border-radius: 16px;
      padding: 20px 25px;
      color: white;
    }

    @keyframes gradientMove {
      0% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }

    .batch-card {
      border-radius: 18px;
      transition: 0.25s ease;
    }

    .batch-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 20px rgba(0,0,0,0.15);
    }

    @media(max-width: 576px) {
      .batch-header h3 {
        font-size: 1.35rem;
      }
    }
  `;

  // Fetch batches
  const fetchBatches = useCallback(async () => {
    try {
      const res = await API.get(`/student/${user.id}/batches`);
      setBatches(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
      setError("Failed to load your batches.");
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  useEffect(() => {
    fetchBatches();
  }, [fetchBatches]);

  // Open Message Modal
  const openMessageModal = ({ id, name, role }) => {
    setReceiver({ id, name, role });
    setMsgForm({ subject: "", body: "" });
    setShowModal(true);
  };

  // Send Message
  const sendMessage = async (e) => {
    e.preventDefault();
    try {
      await API.post(`/student/${user.id}/message/send`, {
        receiverRole: receiver.role,
        receiverId: receiver.id,
        subject: msgForm.subject,
        body: msgForm.body,
      });
      alert("Message sent!");
      setShowModal(false);
    } catch (err) {
      console.error(err);
      alert("Failed to send message. Try again.");
    }
  };

  if (loading)
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ height: "60vh" }}
      >
        <Spinner animation="border" />
      </div>
    );

  return (
    <div className="p-3 p-md-4">
      <style>{styles}</style>

      {/* PAGE HEADER */}
      <div className="batch-header mb-4">
        <h3 className="fw-bold mb-0">My Batches</h3>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      {batches.length === 0 && (
        <Alert variant="info">You are not enrolled in any batches.</Alert>
      )}

      {/* ----------------- BATCH LIST ----------------- */}
      {batches.map((b) => {
        const batchmates = b.students || [];
        return (
          <Card key={b.id} className="p-3 mb-4 shadow-sm batch-card">
            {/* Batch Title */}
            <h5 className="fw-bold mb-2">
              <Badge bg="info" text="dark">
                {b.name}
              </Badge>
            </h5>

            <p className="mb-1">
              <strong>Timing:</strong> {b.startTime?.slice(0, 5)} – {b.endTime?.slice(0, 5)}
            </p>

            {/* Tutor Section */}
            <p className="mb-3">
              <strong>Tutor:</strong> {b.tutorName}
              <Button
                size="sm"
                className="ms-3"
                variant="primary"
                onClick={() =>
                  openMessageModal({
                    id: b.tutorId,
                    name: b.tutorName,
                    role: "EMPLOYEE",
                  })
                }
              >
                Message Tutor
              </Button>
            </p>

            {/* Batchmates */}
            <h6 className="fw-bold">Batchmates</h6>
            <ListGroup className="mt-2">
              {batchmates.map((s) => {
                const isYou = s.id === user.id;

                return (
                  <ListGroup.Item
                    key={s.id}
                    className="d-flex justify-content-between align-items-center"
                  >
                    <div>
                      {s.name}{" "}
                      <Badge bg={isYou ? "primary" : "secondary"}>
                        {isYou ? "YOU" : s.id}
                      </Badge>
                    </div>

                    {!isYou && (
                      <Button
                        size="sm"
                        variant="outline-primary"
                        onClick={() =>
                          openMessageModal({
                            id: s.id,
                            name: s.name,
                            role: "STUDENT",
                          })
                        }
                      >
                        Message
                      </Button>
                    )}
                  </ListGroup.Item>
                );
              })}
            </ListGroup>
          </Card>
        );
      })}

      {/* ----------------- MESSAGE MODAL ----------------- */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Message → {receiver?.name}</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <Form onSubmit={sendMessage}>
            <Form.Group className="mb-3">
              <Form.Label>Subject</Form.Label>
              <Form.Control
                required
                value={msgForm.subject}
                onChange={(e) =>
                  setMsgForm({ ...msgForm, subject: e.target.value })
                }
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Message</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                required
                value={msgForm.body}
                onChange={(e) =>
                  setMsgForm({ ...msgForm, body: e.target.value })
                }
              />
            </Form.Group>

            <div className="text-end">
              <Button variant="secondary" className="me-2" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                Send
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </div>
  );
}

export default StudentBatches;
