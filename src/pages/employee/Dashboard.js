// src/pages/employee/EmployeeDashboard.jsx
import { useEffect, useState, useCallback } from "react";
import { Spinner } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import API from "../../api/api";
import { useAuth } from "../../context/AuthContext";

function EmployeeDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [summary, setSummary] = useState({
    attendance: 0,
    leaves: 0,
    messages: 0,
    batches: 0,
  });

  const [loading, setLoading] = useState(true);

  /* -------- GOOGLE FONTS -------- */
  useEffect(() => {
    const style = document.createElement("style");
    style.innerHTML = `
      @import url('https://fonts.googleapis.com/css2?family=Salsa&display=swap');
      @import url('https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&display=swap');
      @import url('https://fonts.googleapis.com/css2?family=Inclusive+Sans:wght@400;600&display=swap');
    `;
    document.head.appendChild(style);
  }, []);

  /* -------- BODY ROLE CLASS -------- */
  useEffect(() => {
    if (user.subRole === "TUTOR") {
      document.body.classList.add("tutor-role");
      document.body.classList.remove("employee-role");
    } else {
      document.body.classList.add("employee-role");
      document.body.classList.remove("tutor-role");
    }
  }, [user.subRole]);

  /* -------- FETCH SUMMARY -------- */
  const fetchSummary = useCallback(async () => {
    try {
      const res = await API.get(`/employee/${user.id}/summary`);
      setSummary({
        attendance: res.data.attendance || 0,
        leaves: res.data.leaves || 0,
        messages: res.data.messages || 0,
        batches: res.data.batches || 0,
        reports: res.data.reports || 0,
      });
    } catch (err) {
      console.error("Summary failed:", err);
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  useEffect(() => {
    fetchSummary();
    const x = setInterval(fetchSummary, 30000);
    return () => clearInterval(x);
  }, [fetchSummary]);

  /* ---------------- STYLE ---------------- */
  const styles = `
  .welcome-box {
    background: #2D68FE;
    padding: 22px 28px;
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    color: #fff;
    margin-bottom: 25px;
  }
  .welcome-text h2 {
    margin: 0; font-size: 26px; font-weight: 700;
    font-family: 'Salsa', cursive;
  }
  .welcome-text p {
    margin: 2px 0 0; font-size: 14px;
    font-family: 'Salsa', cursive;
  }
  .welcome-avatar img {
    width: 70px; height: 70px;
    border-radius: 50%; object-fit: cover;
    border: 3px solid #fff;
  }

  .smart-grid {
    display: grid;
    grid-template-columns: repeat(3,1fr);
    gap: 26px;
    margin: 35px 0;
  }
  .grid-center { grid-column: 2 / 3; }
  .grid-left   { grid-column: 1 / 2; }
  .grid-right  { grid-column: 3 / 4; }

  .stat-card {
    padding: 26px 10px;
    background: #fff;
    border-radius: 18px;
    text-align: center;
    box-shadow: 0 4px 12px rgba(0,0,0,0.08);
    cursor: pointer;
    transition: 0.2s;
  }
  .stat-card:hover {
    transform: translateY(-3px);
  }

  .stat-title {
    font-size: 18px; font-weight: 600;
    font-family: 'Instrument Sans', sans-serif;
  }
  .stat-value {
    margin-top: 6px;
    font-size: 24px; font-weight: 700;
    font-family: 'Inclusive Sans', sans-serif;
  }

  .blue { color:#136CED; }
  .red { color:#ff383c; }
  .green { color:#34C759; }
  .yellow { color:#FFB400; }
  .orange { color:#e68600; }

  .bottom-box {
    background:#F5F5F5;
    padding:24px;
    border-radius: 12px;
  }
  .bottom-title {
    text-align:center; font-size:22px;
    font-family: 'Salsa';
  }
  .bottom-text {
    text-align:center; font-size:16px;
    font-family: 'Inclusive Sans';
  }

  /* -------- MOBILE VIEW -------- */
  @media (max-width: 992px) {
    .welcome-box {
      max-width: 381px;
      height: 80px;
      border-radius: 12px;
      padding: 0 18px;
      margin: 0 auto 16px;
    }
    .welcome-text h2 { font-size: 20px; }
    .welcome-text p  { font-size: 12px; }
    .welcome-avatar img { width: 50px; height: 50px; }

    .smart-grid {
      grid-template-columns: repeat(2,1fr) !important;
      gap: 20px !important;
      margin-top: 10px !important;
    }

    .grid-left, .grid-right, .grid-center {
      grid-column: auto !important;
    }

    /* Center 5th card (Tutor only) */
    body.tutor-role .smart-grid > .stat-card:nth-child(5),
    body.tutor-role .grid-left:nth-child(5),
    body.tutor-role .grid-right:nth-child(5) {
      grid-column: 1 / span 2 !important;
      justify-self: center !important;
      width: 70% !important;
    }

    .stat-card {
      padding: 20px 8px !important;
      height: 120px !important;
      border-radius: 14px !important;
    }
    .stat-title { font-size: 16px !important; }
    .stat-value { font-size: 22px !important; }
  }
  `;

  if (loading)
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: "65vh" }}>
        <Spinner animation="border" />
      </div>
    );

  /* -------- CARD DATA -------- */
  const cards = [
    { title: "Attendance", value: summary.attendance, color: "blue" },
    { title: "Leaves Taken", value: summary.leaves, color: "red" },
    { title: "Messages", value: summary.messages, color: "green" },
    { title: "Total Report", value: summary.reports, color: "orange" },
  ];

  if (user.subRole === "TUTOR") {
    cards.push({ title: "Batches Assigned", value: summary.batches, color: "yellow" });
  }

 

  /* -------- CARD ROUTE MAPPING -------- */
  const cardRoutes = {
    Attendance: "/employee/attendance",
    "Leaves Taken": "/employee/leaves",
    Messages: "/employee/messages",
    "Batches Assigned": "/employee/tutor/batches",
    "Total Report": "/employee/reports",
  };

  /* -------- CARD UI COMPONENT -------- */
  const renderCard = (c, key) => (
    <div key={key} className="stat-card" onClick={() => navigate(cardRoutes[c.title])}>
      <div className="stat-title">{c.title}</div>
      <div className={`stat-value ${c.color}`}>{c.value.toString().padStart(2, "0")}</div>
    </div>
  );

  /* -------- CARD GRID -------- */
  const renderCards = () => {
    const count = cards.length;

    if (count === 3) return cards.map((c, i) => renderCard(c, i));

    if (count === 4)
      return (
        <>
          {cards.slice(0, 3).map((c, i) => renderCard(c, i))}
          <div className="grid-center">{renderCard(cards[3], "last")}</div>
        </>
      );

    if (count === 5)
      return (
        <>
          {cards.slice(0, 3).map((c, i) => renderCard(c, i))}
          <div className="grid-left">{renderCard(cards[3], "left")}</div>
          <div className="grid-right">{renderCard(cards[4], "right")}</div>
        </>
      );
  };

  return (
    <div className="px-2 px-md-3 py-2">
      <style>{styles}</style>

      {/* HEADER */}
      <div className="welcome-box shadow-sm">
        <div className="welcome-text">
          <h2>Welcome {user.name}</h2>
          <p>{user.subRole || user.role}</p>
        </div>
        <div className="welcome-avatar">
          <img src={user.profile || "https://cdn-icons-png.flaticon.com/512/149/149071.png"} alt="User" />
        </div>
      </div>

      {/* CARDS */}
      <div className="smart-grid">{renderCards()}</div>

      {/* OVERVIEW */}
      <div className="bottom-box mt-4">
        {user.subRole === "TUTOR" ? (
          <>
            <div className="bottom-title">Employee Overview</div>
            <div className="bottom-text">
              You are managing <strong>{summary.batches}</strong> batches and{" "}
              <strong>{summary.attendance}</strong> attendance records.
            </div>
          </>
        ) : (
          <>
            <div className="bottom-title">Employee Overview</div>
            <div className="bottom-text">
              You have <strong>{summary.attendance}</strong> attendance entries,{" "}
              <strong>{summary.leaves}</strong> leave requests, and{" "}
              <strong>{summary.messages}</strong> messages.
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default EmployeeDashboard;
