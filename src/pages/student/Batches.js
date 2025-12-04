import React, { useEffect, useState, useCallback } from "react";
import {
  Badge,
  Button,
  Spinner,
  Alert,
  Modal,
  Form,
} from "react-bootstrap";
import API from "../../api/api";
import { useAuth } from "../../context/AuthContext";

function StudentBatches() {
  const { user } = useAuth();

  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /* MESSAGE MODAL */
  const [showModal, setShowModal] = useState(false);
  const [receiver, setReceiver] = useState(null);
  const [msgForm, setMsgForm] = useState({ subject: "", body: "" });

  /* ---------------------- INTERNAL CSS (NEW CLEAN UI) ---------------------- */
  const styles = `
    @import url('https://fonts.googleapis.com/css2?family=Salsa:wght@400;700&display=swap');
    @import url('https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&display=swap');

    * {
      font-family: 'Instrument Sans', sans-serif !important;
    }

    .page-title {
      font-size: 38px;
      font-weight: 700;
      color: #136CED;
      text-align: center;
      margin-bottom: 22px;
      font-family: 'Salsa', cursive !important;
    }

    .outer-box {
      border: 3px solid #136CED;
      border-radius: 16px;
      padding: 18px 20px;
      background: #fff;
      margin-bottom: 28px;
    }

    .batch-title {
      font-size: 30px;
      text-align: center;
      color: #136CED;
      font-weight: 700;
      font-family: 'Salsa', cursive !important;
      padding-bottom: 10px;
      margin-bottom: 16px;
      border-bottom: 1px solid #000;
    }

    .info-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 10px;
      flex-wrap: wrap;
    }

    .batch-info {
      font-size: 17px;
      font-weight: 500;
      margin: 4px 0;
    }

    .tutor-btn {
      background: #34C759;
      color: #fff;
      border: none;
      padding: 10px 18px;
      border-radius: 10px;
      font-weight: 600;
      font-size: 16px;
      white-space: nowrap;
    }

    .batchmates-title {
      font-size: 22px;
      font-weight: 700;
      margin: 16px 0 12px;
      color: #000;
      border-top: 1px solid #000;
      padding-top: 10px;

      font-family: 'Salsa', cursive !important;
    }

    .mate-box {
      border: 2px solid #136CED;
      background: #f9f9ff;
      padding: 12px 14px;
      border-radius: 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
      font-size: 17px;
    }

    .badge-you,
    .badge-id {
      background: #136CED;
      color: #fff;
      font-size: 13px;
      padding: 3px 10px;
      border-radius: 6px;
    }

    .msg-btn {
      background: #34C759;
      color: #fff;
      padding: 7px 14px;
      border-radius: 8px;
      font-weight: 600;
      border: none;
    }

    /* CUSTOM MODAL */
    .custom-modal .modal-content {
      border-radius: 18px !important;
      border: 2px solid #000 !important;
      overflow: hidden;
    }

    .custom-header {
      padding: 14px 20px;
      background: #f9f9f9;
      border-bottom: 1px solid #dcdcdc;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .custom-title {
      font-size: 22px;
      font-weight: 700;
      font-family: 'Salsa', cursive !important;
      color: #136CED;
    }

    .custom-close {
      font-size: 26px;
      font-weight: 700;
      cursor: pointer;
      color: #FF383C;
    }

    .custom-body {
      padding: 18px 20px;
    }

    .custom-footer {
      padding: 14px 20px 20px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .modal-cancel-btn {
      padding: 12px;
      width: 100%;
      border-radius: 12px;
      background: #fff;
      border: 1.4px solid #cfcfcf;
      font-weight: 600;
      color: #136CED;
    }

    .modal-submit-btn {
      padding: 12px;
      width: 100%;
      border-radius: 12px;
      background: #34C759;
      border: none;
      font-weight: 700;
      color: #fff;
      font-size: 16px;
    }

    /* MOBILE OPTIMIZATION */
    @media (max-width: 576px) {      
      .batch-title {
        font-size: 26px;
      }
      .outer-box {
        padding: 15px;
      }
      .mate-box {
        flex-direction: column;
        gap: 8px;
        align-items: flex-start;
      }
      .msg-btn {
        width: 100%;
      }
      .custom-modal .modal-dialog {
        max-width: 95% !important;
      }
    }
  `;

  /* ---------------------- FETCH BATCHES ---------------------- */
  const fetchBatches = useCallback(async () => {
    try {
      const res = await API.get(`/student/${user.id}/batches`);
      setBatches(Array.isArray(res.data) ? res.data : []);
    } catch {
      setError("Failed to load your batches.");
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  useEffect(() => {
    fetchBatches();
  }, [fetchBatches]);

  /* ---------------------- OPEN MESSAGE MODAL ---------------------- */
  const openModal = (receiverObj) => {
    setReceiver(receiverObj);
    setMsgForm({ subject: "", body: "" });
    setShowModal(true);
  };

  /* ---------------------- SEND MESSAGE ---------------------- */
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
    } catch {
      alert("Failed to send message.");
    }
  };

  /* ---------------------- LOADING ---------------------- */
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

      <h2 className="page-title">My Batches</h2>

      {error && <Alert variant="danger">{error}</Alert>}

      {batches.map((batch) => {
        const mates = batch.students || [];

        return (
          <div key={batch.id} className="outer-box">

            <div className="batch-title">{batch.name}</div>

            <div className="info-row">
              <div>
                <p className="batch-info">
                  <strong>Timing:</strong> {batch.startTime?.slice(0, 5)} – {batch.endTime?.slice(0, 5)}
                </p>

                <p className="batch-info">
                  <strong>Tutor:</strong> {batch.tutorName}
                </p>
              </div>

              <Button
                className="tutor-btn"
                onClick={() =>
                  openModal({
                    id: batch.tutorId,
                    name: batch.tutorName,
                    role: "EMPLOYEE",
                  })
                }
              >
                Message Tutor
              </Button>
            </div>

            <div className="batchmates-title">Batchmates</div>

            {mates.map((m) => {
              const isYou = m.id === user.id;

              return (
                <div key={m.id} className="mate-box">
                  <div>
                    {m.name}{" "}
                    <Badge className={isYou ? "badge-you" : "badge-id"}>
                      {isYou ? "YOU" : m.id}
                    </Badge>
                  </div>

                  {!isYou && (
                    <Button
                      className="msg-btn"
                      onClick={() =>
                        openModal({
                          id: m.id,
                          name: m.name,
                          role: "STUDENT",
                        })
                      }
                    >
                      Message
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        );
      })}

      {/* ---------------------- CUSTOM MODAL ---------------------- */}
      <Modal
        show={showModal}
        centered
        onHide={() => setShowModal(false)}
        dialogClassName="custom-modal"
      >
        <div className="custom-header">
          <div className="custom-title">
            Message → {receiver?.name}
          </div>
          <span className="custom-close" onClick={() => setShowModal(false)}>
            ×
          </span>
        </div>

        <div className="custom-body">
          <Form>
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

            <Form.Group>
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
          </Form>
        </div>

        <div className="custom-footer">
          <Button
            className="modal-cancel-btn"
            onClick={() => setShowModal(false)}
          >
            Cancel
          </Button>

          <Button
            className="modal-submit-btn"
            onClick={sendMessage}
          >
            Send Message
          </Button>
        </div>
      </Modal>
    </div>
  );
}

export default StudentBatches;
