// src/pages/student/StudentDashboard.jsx
import { useEffect, useState, useCallback } from "react";
import { Spinner, ProgressBar } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import API from "../../api/api";
import { useAuth } from "../../context/AuthContext";

function StudentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  /* ---------------- GOOGLE FONTS ---------------- */
  useEffect(() => {
    const fontStyles = `
      @import url('https://fonts.googleapis.com/css2?family=Salsa&display=swap');
      @import url('https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&display=swap');
      @import url('https://fonts.googleapis.com/css2?family=Inclusive+Sans:wght@400;600&display=swap');
    `;
    const style = document.createElement("style");
    style.innerHTML = fontStyles;
    document.head.appendChild(style);
  }, []);

  /* ---------------- FETCH STUDENT SUMMARY ---------------- */
  const fetchStats = useCallback(async () => {
    try {
      const res = await API.get(`/student/${user.id}/summary`);
      setStats(res.data);
    } catch (err) {
      console.error("Error loading student dashboard:", err);
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  if (loading || !stats)
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: "60vh" }}>
        <Spinner animation="border" />
      </div>
    );

  /* ---------------- INTERNAL STYLING ---------------- */
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
    margin: 0;
    font-size: 26px;
    font-weight: 700;
    font-family: 'Salsa';
  }
  .welcome-text p {
    margin: 2px 0 0;
    font-size: 14px;
    font-family: 'Salsa';
    opacity: 0.9;
  }

  .welcome-avatar img {
    width: 70px;
    height: 70px;
    border-radius: 50%;
    object-fit: cover;
    border: 3px solid #fff;
  }

  /* ---------- GRID ---------- */
  .smart-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 26px;
    margin: 35px 0;
  }

  .grid-center { grid-column: 2 / 3; }
  .grid-left   { grid-column: 1 / 2; }
  .grid-right  { grid-column: 3 / 4; }

  /* ---------- CARDS ---------- */
  .stat-card {
    padding: 26px 10px;
    border-radius: 18px;
    background: #fff;
    text-align: center;
    box-shadow: 0 4px 12px rgba(0,0,0,0.08);
    transition: 0.2s;
    cursor: pointer;
  }
  .stat-card:hover {
    transform: translateY(-3px);
  }

  .stat-title {
    font-size: 20px;
    font-weight: 700;
    font-family: 'Instrument Sans';
    margin-bottom: 10px;
  }

  .stat-value {
    font-size: 32px;
    font-weight: 700;
    font-family: 'Inclusive Sans';
  }

  .blue   { color: #136CED; }
  .yellow { color: #FFB400; }
  .green  { color: #34C759; }
  .red    { color: #FF383C; }
  .purple { color: #9D27D1; }

  /* ---------- BOTTOM BOX ---------- */
  .bottom-box {
    background: #F5F5F5;
    border-radius: 12px;
    padding: 24px;
    box-shadow: inset 0 2px 6px rgba(0,0,0,0.04);
  }

  .bottom-title {
    text-align: center;
    font-size: 22px;
    font-weight: 700;
    font-family: 'Salsa';
  }

  .bottom-text {
    text-align: center;
    font-size: 16px;
    font-family: 'Inclusive Sans';
  }

  /* ---------- MOBILE VIEW ---------- */
  @media (max-width: 992px) {
    .welcome-box {
      max-width: 381px;
      height: 80px;
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

    /* reset desktop alignment */
    .grid-left,
    .grid-right,
    .grid-center {
      grid-column: auto !important;
    }

    /* center 5th card */
    .smart-grid > .stat-card:nth-child(5) {
      grid-column: 1 / span 2 !important;
      justify-self: center !important;
      width: 70%;
    }

    .stat-card {
      padding: 20px 8px !important;
      height: 120px !important;
    }

    .stat-title { font-size: 16px !important; }
    .stat-value { font-size: 22px !important; }
  }
  `;

  /* ---------------- CARD DATA ---------------- */
  const completionRate =
    stats.taskCount > 0
      ? Math.round((stats.completedTaskCount / stats.taskCount) * 100)
      : 0;

  const cards = [
    { title: "Attendance", value: stats.attendanceCount, color: "blue" },
    { title: "Tasks Assigned", value: stats.taskCount, color: "yellow" },
    { title: "Leaves Applied", value: stats.leaveCount, color: "red" },
    { title: "Messages Received", value: stats.messageCount, color: "green" },
    { title: "Task Progress", value: `${completionRate}%`, color: "purple" },
  ];

  /* ---------------- CARD NAVIGATION MAPPING ---------------- */
  const cardRoutes = {
    Attendance: "/student/attendance",
    "Tasks Assigned": "/student/tasks",
    "Leaves Applied": "/student/leaves",
    "Messages Received": "/student/messages",
    "Task Progress": "/student/tasks",
  };

  /* ---------------- CARD COMPONENT ---------------- */
  const renderCard = (c, i) => (
    <div key={i} className="stat-card" onClick={() => navigate(cardRoutes[c.title])}>
      <div className="stat-title">{c.title}</div>
      <div className={`stat-value ${c.color}`}>{c.value}</div>
    </div>
  );

  /* ---------------- GRID LOGIC ---------------- */
  const renderCards = () => {
    return (
      <>
        {cards.slice(0, 3).map(renderCard)}
        <div className="grid-left">{renderCard(cards[3], 3)}</div>
        <div className="grid-right">{renderCard(cards[4], 4)}</div>
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
          <p>Student</p>
        </div>
        <div className="welcome-avatar">
          <img
            src={user.profile || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
            alt="User"
          />
        </div>
      </div>

      {/* GRID */}
      <div className="smart-grid">{renderCards()}</div>

      {/* BOTTOM BOX */}
      <div className="bottom-box mt-4">
        <div className="bottom-title">Your Overall Progress</div>

        <div className="bottom-text">
          Completed <strong>{stats.completedTaskCount}</strong> out of{" "}
          <strong>{stats.taskCount}</strong> tasks.
        </div>

        <ProgressBar
          now={completionRate}
          label={`${completionRate}%`}
          variant={
            completionRate >= 80
              ? "success"
              : completionRate >= 50
              ? "warning"
              : "danger"
          }
          style={{ height: "25px", borderRadius: "12px", marginTop: "16px" }}
        />
      </div>
    </div>
  );
}

export default StudentDashboard;
