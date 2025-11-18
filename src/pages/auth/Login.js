import { useState } from "react";
import {
    Form,
    Button,
    Card,
    Container,
    Row,
    Col,
    Alert,
    Spinner,
} from "react-bootstrap";
import API from "../../api/api";
    import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

function Login() {
    const [form, setForm] = useState({ email: "", password: "" });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const res = await API.post("/auth/login", form);
            const data = res.data;

            if (data.error) {
                setError(data.error);
                setLoading(false);
                return;
            }

            login(data);

            const role = data.role?.toLowerCase();

            if (role === "admin") navigate("/admin/dashboard");
            else if (role === "employee") navigate("/employee/dashboard");
            else if (role === "student") navigate("/student/dashboard");
            else setError("Unknown role. Contact administrator.");

        } catch (err) {
            console.error(err);
            setError("Invalid credentials or server error.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {/* Internal Gradient Background Styles */}
            <style>{`
                .login-gradient-bg {
                    height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: linear-gradient(135deg, #1a73e8, #673ab7, #d500f9);
                    background-size: 300% 300%;
                    animation: gradientMove 8s ease infinite;
                }

                @keyframes gradientMove {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }

                .login-card {
                    background: rgba(255, 255, 255, 0.95);
                    backdrop-filter: blur(8px);
                    border-radius: 18px;
                }

                @media (max-width: 576px) {
                    .login-card {
                        padding: 1.2rem !important;
                    }
                }
            `}</style>

            <Container fluid className="login-gradient-bg">
                <Row className="w-100 justify-content-center">
                    <Col xs={12} sm={10} md={6} lg={4}>
                        <Card className="shadow-lg p-4 border-0 login-card">
                            <Card.Body>
                                <h3 className="text-center mb-4 fw-bold text-primary">Login</h3>

                                {error && <Alert variant="danger">{error}</Alert>}

                                <Form onSubmit={handleSubmit}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Email or ID</Form.Label>
                                        <Form.Control
                                            type="text"
                                            name="email"
                                            value={form.email}
                                            onChange={handleChange}
                                            placeholder="Enter your Email or ID"
                                            required
                                        />
                                    </Form.Group>

                                    <Form.Group className="mb-3">
                                        <Form.Label>Password</Form.Label>
                                        <Form.Control
                                            type="password"
                                            name="password"
                                            value={form.password}
                                            onChange={handleChange}
                                            placeholder="Enter your password"
                                            required
                                        />
                                    </Form.Group>

                                    <div className="d-grid">
                                        <Button variant="primary" type="submit" disabled={loading}>
                                            {loading ? (
                                                <Spinner animation="border" size="sm" />
                                            ) : (
                                                "Login"
                                            )}
                                        </Button>
                                    </div>
                                </Form>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </Container>
        </>
    );
}

export default Login;
