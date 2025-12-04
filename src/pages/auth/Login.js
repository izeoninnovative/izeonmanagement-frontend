// src/pages/auth/Login.jsx
import { useState } from "react";
import {
  Form,
  Button,
  Card,
  Alert,
  Spinner,
} from "react-bootstrap";
import API from "../../api/api";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import logo from "../../images/izeon-logo.svg";
import bgImage from "../../images/Login-Page.svg";

function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const { login } = useAuth();
  const navigate = useNavigate();

  const validate = () => {
    if (!form.email.trim()) return setError("Email cannot be empty.");
    if (!form.password.trim()) return setError("Password cannot be empty.");
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!validate()) return;

    setLoading(true);

    try {
      const res = await API.post("/auth/login", form);
      const data = res.data;

      if (data.error) return setError(data.error);

      login(data);
      const role = data.role?.toLowerCase();

      if (role === "admin") navigate("/admin/dashboard");
      else if (role === "employee") navigate("/employee/dashboard");
      else if (role === "student") navigate("/student/dashboard");
      else setError("Unknown role. Contact administrator.");
    } catch {
      setError("Invalid credentials or server error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Salsa&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&display=swap');

        * {
          font-family: 'Instrument Sans', sans-serif !important;
        }

        /* Full SVG background */
        .login-bg {
          width: 100%;
          height: 100vh;
          background-image: url(${bgImage});
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* Logo box placed exactly like screenshot */
        .logo-box {
          width: 400px;
          position: absolute;
          top: 28%;
          left: 10%;
          padding: 22px 30px;
          border-radius: 16px;
        }

        /* Center content on white-right area */
        .login-form-wrapper {
          width: 100%;
          max-width: 320px;
          position: relative;
          right: -28%;
        }

        .welcome-text {
          font-size: 34px;
          font-weight: 700;
          color: #136CED;
          text-align: center;
          margin-bottom: 25px;
            font-family: 'Salsa', cursive !important;
        }

        /* Form card transparent */
        .login-card {
          background: rgba(255,255,255,0); /* FULL transparent */
          border: none;
          box-shadow: none;
         margin-left:20px;
        }

        /* Mobile Version */
@media(max-width: 768px) {

  /* Zoom background FULL & show only right-bottom corner */
  .login-bg {
    height: 100vh;
    background:none;
    {/* background-size: cover !important;      /* fully zoomed */
    background-position: bottom right !important; /* show right-bottom */ */}
    padding: 0;
    align-items: center;
    justify-content: center;
    display: flex;
    flex-direction: column;
  }

  /* Move logo ABOVE Welcome Back */
  .logo-box {
    position: relative !important;
    top: -8% !important;
    left: -5% !important;
    width: 280px;
    margin: !important; /* center */
    z-index: 10;
  }
  .logo-box img {
    width: 100%;
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  }

  /* Form wrapper below logo */
  .login-form-wrapper {
    right: 0 !important;
    max-width: 92%;
    padding:0 30px;
    margin-left: 0 !important;
    margin-top: -30px;
    margin-bottom: 40px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    padding: 18px 20px;
  }

  .welcome-text {
    font-size: 26px;
    margin-top: 10px;
    text-align: center;
  }

  /* Card should NOT push anything */
  .login-card {
    background: transparent !important;
    box-shadow: none !important;
  }
}

      `}</style>

      <div className="login-bg">

        {/* LOGO BOX ON LEFT */}
        <div className="logo-box">
          <img src={logo} alt="IZEON INNOVATIVE" width="100%" />
        </div>

        {/* RIGHT SIDE FORM */}
        <div className="login-form-wrapper">
          <h2 className="welcome-text">Welcome Back</h2>

          <Card className="login-card p-0 mx-auto">
            <Card.Body className="p-0">
              {error && <Alert variant="danger">{error}</Alert>}

              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Enter your email"
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                  />
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label>Password</Form.Label>
                  <Form.Control
                    type="password"
                    placeholder="Enter your password"
                    onChange={(e) =>
                      setForm({ ...form, password: e.target.value })
                    }
                  />
                </Form.Group>

                <div className="d-flex justify-content-between mb-3">
                  <div>
                    <input type="checkbox" className="me-2" />
                    <small>Remember me</small>
                  </div>
                  <small style={{ color: "#136CED", cursor: "pointer" }}>
                    Forgot Password
                  </small>
                </div>

                <Button
                  variant="primary"
                  type="submit"
                  className="w-100 py-2"
                  disabled={loading}
                >
                  {loading ? <Spinner size="sm" /> : "Login"}
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </div>
      </div>
    </>
  );
}

export default Login;
