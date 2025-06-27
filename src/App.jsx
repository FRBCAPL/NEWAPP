import React, { useState, useEffect, useRef } from "react";
import { HashRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";

// Main pages/components
import ConfirmMatch from "./components/ConfirmMatch";
import Dashboard from "./components/dashboard/Dashboard";
import MatchChat from "./components/chat/MatchChat";
import AdminDashboard from "./components/dashboard/AdminDashboard";
import PinLogin from "./components/modal/PinLogin";
import logo from "./assets/logo.png";
import bcaplLogo from "./assets/bcapl_logo.png";
import csiLogo from "./assets/csi_logo.png";
import usaplLogo from "./assets/usapl_logo.png";
import "./styles/variables.css";
import "./styles/global.css";

function AppHeader() {
  return (
    <div style={{
      width: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: "1.5rem",
      position: "sticky",
      top: 0,
      zIndex: 2,
      background: "rgba(24,24,24,0.92)",
      backdropFilter: "blur(2px)",
      borderBottom: "1.5px solid #333"
    }}>
      <span className="app-header-title">
        Front Range Pool League
      </span>
    </div>
  );
}

function BackgroundLogo() {
  // Get viewport size for responsive orbits
  const [vw, setVw] = useState(window.innerWidth);
  const [vh, setVh] = useState(window.innerHeight);
  const logoW = 120, logoH = 120; // Use the largest logo size for safety
  // Generate random configs for each logo on mount
  const [randomConfigs] = useState(() => [0,1,2,3].map(() => {
    // Clamp radii so logos never go off screen
    const maxRx = (vw / 2) - (logoW / 2) - 10;
    const maxRy = (vh / 2) - (logoH / 2) - 10;
    const minRx = maxRx * 0.4;
    const minRy = maxRy * 0.4;
    // Clamp speeds to a slow, smooth range
    const minSpeed = 0.08, maxSpeed = 0.12;
    return {
      cx: vw * 0.5,
      cy: vh * 0.5,
      rx1: minRx + Math.random() * (maxRx - minRx),
      rx2: minRx * 0.5 + Math.random() * (maxRx * 0.5 - minRx * 0.5),
      sx1: minSpeed + Math.random() * (maxSpeed - minSpeed),
      sx2: minSpeed + Math.random() * (maxSpeed - minSpeed),
      ry1: minRy + Math.random() * (maxRy - minRy),
      ry2: minRy * 0.5 + Math.random() * (maxRy * 0.5 - minRy * 0.5),
      sy1: minSpeed + Math.random() * (maxSpeed - minSpeed),
      sy2: minSpeed + Math.random() * (maxSpeed - minSpeed),
      phase: Math.random() * Math.PI * 2
    };
  }));

  useEffect(() => {
    const onResize = () => {
      setVw(window.innerWidth);
      setVh(window.innerHeight);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Floating logic: always visible, always floating
  function useRandomFloatingLogoPath(config) {
    const [pos, setPos] = useState({ x: config.cx, y: config.cy });
    useEffect(() => {
      let frame;
      const animate = () => {
        const t = Date.now() / 1000;
        setPos({
          x: config.cx +
            Math.cos(t * config.sx1 + config.phase) * config.rx1 +
            Math.sin(t * config.sx2 + config.phase * 1.7) * config.rx2,
          y: config.cy +
            Math.sin(t * config.sy1 + config.phase) * config.ry1 +
            Math.cos(t * config.sy2 + config.phase * 2.3) * config.ry2
        });
        frame = requestAnimationFrame(animate);
      };
      animate();
      return () => cancelAnimationFrame(frame);
    }, [config]);
    return pos;
  }

  // Use the random configs for each logo
  const main = useRandomFloatingLogoPath(randomConfigs[0]);
  const bcapl = useRandomFloatingLogoPath(randomConfigs[1]);
  const csi = useRandomFloatingLogoPath(randomConfigs[2]);
  const usapl = useRandomFloatingLogoPath(randomConfigs[3]);

  // Helper for style
  const logoStyle = (logo, width, opacity, filter) => ({
    position: "fixed",
    left: logo.x,
    top: logo.y,
    transform: "translate(-50%, -50%)",
    width,
    height: "auto",
    opacity,
    zIndex: 0,
    pointerEvents: "none",
    filter
  });

  return (
    <>
      {/* Main League Logo: adjust opacity (third argument) below */}
      <img src={logo} alt="League Logo Background" style={logoStyle(main, 150, 0.40, "drop-shadow(0 0 24px #e53e3e88)")} />
      {/* BCAPL Logo: adjust opacity (third argument) below */}
      <img src={bcaplLogo} alt="BCAPL Logo Background" style={logoStyle(bcapl, 120, 0.40, "drop-shadow(0 0 18px #e53e3e66)")} />
      {/* CSI Logo: adjust opacity (third argument) below */}
      <img src={csiLogo} alt="CSI Logo Background" style={logoStyle(csi, 120, 0.40, "drop-shadow(0 0 12px #e53e3e44)")} />
      {/* USAPL Logo: adjust opacity (third argument) below */}
      <img src={usaplLogo} alt="USAPL Logo Background" style={logoStyle(usapl, 140, 0.50, "drop-shadow(0 0 10px #e53e3e33)")} />
    </>
  );
}

function MainApp({
  isAuthenticated,
  userFirstName,
  userLastName,
  userEmail,
  userPin,
  handleLoginSuccess,
  handleLogout
}) {
  const navigate = useNavigate();
  return (
    <main className="main-app-content">
      {!isAuthenticated ? (
        <PinLogin onSuccess={handleLoginSuccess} />
      ) : (
        <Dashboard
          playerName={userFirstName}
          playerLastName={userLastName}
          senderEmail={userEmail}
          onScheduleMatch={() => {}}
          onOpenChat={() => (window.location.hash = "#/chat")}
          onLogout={handleLogout}
          userPin={userPin}
          onGoToAdmin={() => navigate("/admin")}
        />
      )}
    </main>
  );
}

function App() {
  // --- State ---
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userFirstName, setUserFirstName] = useState("");
  const [userLastName, setUserLastName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userPin, setUserPin] = useState("");

  // --- Load auth/user info from localStorage on mount ---
  useEffect(() => {
    const savedAuth = localStorage.getItem("isAuthenticated");
    if (savedAuth === "true") {
      setUserFirstName(localStorage.getItem("userFirstName") || "");
      setUserLastName(localStorage.getItem("userLastName") || "");
      setUserEmail(localStorage.getItem("userEmail") || "");
      setUserPin(localStorage.getItem("userPin") || "");
      setIsAuthenticated(true);
    }
  }, []);

  // --- Login handler ---
  const handleLoginSuccess = (name, email, pin) => {
    let firstName = "";
    let lastName = "";
    if (name) {
      const parts = name.trim().split(" ");
      firstName = parts[0];
      lastName = parts.slice(1).join(" ");
    }
    setUserFirstName(firstName);
    setUserLastName(lastName);
    setUserEmail(email);
    setUserPin(pin);
    setIsAuthenticated(true);

    localStorage.setItem("userFirstName", firstName);
    localStorage.setItem("userLastName", lastName);
    localStorage.setItem("userEmail", email);
    localStorage.setItem("userPin", pin);
    localStorage.setItem("isAuthenticated", "true");
  };

  // --- Logout handler ---
  const handleLogout = () => {
    setUserFirstName("");
    setUserLastName("");
    setUserEmail("");
    setUserPin("");
    setIsAuthenticated(false);
    localStorage.removeItem("userFirstName");
    localStorage.removeItem("userLastName");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userPin");
    localStorage.removeItem("isAuthenticated");
  };

  // --- Main Router ---
  return (
    <HashRouter>
      <BackgroundLogo />
      <main className="main-app-content">
        <AppHeader />
        <Routes>
          <Route path="/confirm-match" element={<ConfirmMatch />} />
          <Route
            path="/chat"
            element={
              isAuthenticated ? (
                <MatchChat
                  userName={`${userFirstName} ${userLastName}`}
                  userEmail={userEmail}
                  userPin={userPin}
                />
              ) : (
                <Navigate to="/" />
              )
            }
          />
          <Route
            path="/admin"
            element={
              isAuthenticated && userPin === "777777" ? (
                <AdminDashboard />
              ) : (
                <Navigate to="/" />
              )
            }
          />
          <Route
            path="/dashboard"
            element={
              isAuthenticated ? (
                <Dashboard
                  playerName={userFirstName}
                  playerLastName={userLastName}
                  senderEmail={userEmail}
                  onScheduleMatch={() => {}}
                  onOpenChat={() => (window.location.hash = "#/chat")}
                  onLogout={handleLogout}
                  userPin={userPin}
                  onGoToAdmin={() => {}}
                />
              ) : (
                <Navigate to="/" />
              )
            }
          />
          <Route
            path="/"
            element={
              <MainApp
                isAuthenticated={isAuthenticated}
                userFirstName={userFirstName}
                userLastName={userLastName}
                userEmail={userEmail}
                userPin={userPin}
                handleLoginSuccess={handleLoginSuccess}
                handleLogout={handleLogout}
              />
            }
          />
          {/* Catch-all route */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </HashRouter>
  );
}

export default App;
