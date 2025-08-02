import React, { useState, useEffect, useRef } from "react";
import { HashRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";

// Main pages/components
import ConfirmMatch from "./components/ConfirmMatch";
import Dashboard from "./components/dashboard/Dashboard";
import MatchChat from "./components/chat/MatchChat";
import AdminDashboard from "./components/dashboard/AdminDashboard";
import PinLogin from "./components/modal/PinLogin";
import FloatingLogos from './components/FloatingLogos';
import TenBallTutorial from './components/TenBallTutorial';
import SimplePoolGame from './components/tenball/SimplePoolGame';
import logo from "./assets/logo.png";
import bcaplLogo from "./assets/bcapl_logo.png";
import csiLogo from "./assets/csi_logo.png";
import usaplLogo from "./assets/usapl_logo.png";
import fargorateLogo from "./assets/fargorate-logo.png";
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
      background: "rgba(20,20,20,0.92)",
      backdropFilter: "blur(2px)",
      borderBottom: "1.5px solid #333"
    }}>
      <span className="app-header-title">
        Front Range Pool League
      </span>
    </div>
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
      <div style={{ position: "relative", minHeight: "100vh", width: "100%", overflowX: "hidden", background: "#000" }}>
        <FloatingLogos />
        <div style={{ position: "relative", zIndex: 3, maxWidth: 900, margin: "0 auto", width: "100%", background: "none", minHeight: "100vh" }}>
          <AppHeader />
          <Routes>
            <Route
              path="/admin"
              element={
                isAuthenticated && userPin === "777777" ? (
                  <div className="admin-app-content"><AdminDashboard /></div>
                ) : (
                  <Navigate to="/" />
                )
              }
            />
            <Route
              path="*"
              element={
                <main className="main-app-content">
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
                      path="/simple-pool"
                      element={<SimplePoolGame />}
                    />
                    <Route
                      path="/tenball-tutorial"
                      element={<TenBallTutorial />}
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
              }
            />
          </Routes>
        </div>
      </div>
    </HashRouter>
  );
}

export default App;
