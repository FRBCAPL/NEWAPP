import React, { useState, useEffect } from "react";
import { HashRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";

// Main pages/components
import ConfirmMatch from "./components/ConfirmMatch";
import Dashboard from "./components/dashboard/Dashboard";
import MatchChat from "./components/chat/MatchChat";
import AdminDashboard from "./components/dashboard/AdminDashboard";
import PinLogin from "./components/modal/PinLogin";
import "./styles/variables.css";
import "./styles/global.css";

// --- MainApp must be a component, not a function inside App ---
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
    <>
      {!isAuthenticated ? (
        <PinLogin onSuccess={handleLoginSuccess} />
      ) : (
        <Dashboard
          playerName={userFirstName}
          playerLastName={userLastName}
          senderEmail={userEmail}
          onScheduleMatch={() => {}} // Not used anymore, can remove if you want
          onOpenChat={() => (window.location.hash = "#/chat")}
          onLogout={handleLogout}
          userPin={userPin}
          onGoToAdmin={() => navigate("/admin")}
        />
      )}
    </>
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
    </HashRouter>
  );
}

export default App;
