import { Modal, Button, Form } from "react-bootstrap";
import { useState, useEffect, useRef } from "react";

function FormModal({
  show,
  onHide,
  title,
  formFields = [],
  initialData = {},
  onSubmit,
  errors = {}
}) {
  const [formData, setFormData] = useState(initialData);

  // prevent resetting when errors exist
  const initialized = useRef(false);

  useEffect(() => {
    if (show && !initialized.current) {
      setFormData(initialData || {});
      initialized.current = true; // form initialized ONCE
    }
  }, [show, initialData]);

  // Reset the flag when modal closes
  useEffect(() => {
    if (!show) {
      initialized.current = false;
    }
  }, [show]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "email") {
      setFormData((prev) => ({ ...prev, [name]: value.replace(/\s+/g, "") }));
      return;
    }

    const cleaned =
      value.trim().length === 0 ? value : value.replace(/^\s+/, "");

    setFormData((prev) => ({ ...prev, [name]: cleaned }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>{title}</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {errors.submit && (
          <div className="alert alert-danger py-2">{errors.submit}</div>
        )}

        <Form onSubmit={handleSubmit}>
          {formFields.map((field) => (
            <Form.Group key={field.name} className="mb-3">
              <Form.Label>{field.label}</Form.Label>

              {field.type === "select" ? (
                <Form.Select
                  name={field.name}
                  value={formData[field.name] || ""}
                  onChange={handleChange}
                  disabled={field.disabled}
                  className={errors[field.name] ? "is-invalid" : ""}
                >
                  <option value="">-- Select --</option>
                  {(field.options || []).map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </Form.Select>
              ) : (
                <Form.Control
                  type={field.type || "text"}
                  name={field.name}
                  value={formData[field.name] || ""}
                  onChange={handleChange}
                  disabled={field.disabled}
                  placeholder={field.placeholder}
                  className={errors[field.name] ? "is-invalid" : ""}
                />
              )}

              {errors[field.name] && (
                <small className="text-danger">{errors[field.name]}</small>
              )}
            </Form.Group>
          ))}

          <div className="text-end">
            <Button variant="secondary" onClick={onHide} className="me-2">
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Save
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
}

export default FormModal;
