import React, { useState, useEffect } from "react";
import { HashRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";

// Import main pages/components
import ConfirmMatch from "./components/ConfirmMatch";
import Dashboard from "./components/dashboard/Dashboard";
import MatchChat from "./components/chat/MatchChat";
import AdminDashboard from "./components/dashboard/AdminDashboard";

// Modal components
import PinLogin from "./components/modal/PinLogin";
import PlayerSearch from "./components/modal/PlayerSearch";

import "./styles/chat-theme.css";

// --- MainApp must be a component, not a function inside App ---
function MainApp({
  isAuthenticated,
  userFirstName,     // <-- NEW
  userLastName,      // <-- NEW
  userEmail,
  userPin,
  showPlayerSearch,
  handleLoginSuccess,
  handleScheduleMatch,
  handlePlayerSelected,
  handleClosePlayerSearch,
  handleLogout,
}) {
  const navigate = useNavigate();

  useEffect(() => {
    if (localStorage.getItem("showPlayerSearch") === "true") {
      handleScheduleMatch();
      localStorage.removeItem("showPlayerSearch");
    }
    // eslint-disable-next-line
  }, []);

  return (
    <>
      {!isAuthenticated ? (
        <PinLogin onSuccess={handleLoginSuccess} />
      ) : (
        <>
          <Dashboard
            playerName={userFirstName}      // <-- Pass first name
            playerLastName={userLastName}   // <-- Pass last name
            onScheduleMatch={handleScheduleMatch}
            onOpenChat={() => (window.location.hash = "#/chat")}
            onLogout={handleLogout}
            userPin={userPin}
            onGoToAdmin={() => navigate("/admin")}
          />
          {showPlayerSearch && !!userEmail && (
            <PlayerSearch
              onSelect={handlePlayerSelected}
              onClose={handleClosePlayerSearch}
              excludeName={`${userFirstName} ${userLastName}`}
              senderName={`${userFirstName} ${userLastName}`}
              senderEmail={userEmail}
            />
          )}
        </>
      )}
    </>
  );
}

function App() {
  // --- Split first and last name into separate state ---
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userFirstName, setUserFirstName] = useState("");
  const [userLastName, setUserLastName] = useState("");
  const [showPlayerSearch, setShowPlayerSearch] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [userPin, setUserPin] = useState("");

  // --- Load from localStorage on mount ---
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

  // --- Handle login success: split name and store both parts ---
  const handleLoginSuccess = (name, email, pin) => {
    let firstName = "";
    let lastName = "";
    if (name) {
      const parts = name.trim().split(" ");
      firstName = parts[0];
      lastName = parts.slice(1).join(" "); // Handles middle names too
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

  const handleLogout = () => {
    setUserFirstName("");
    setUserLastName("");
    setUserEmail("");
    setUserPin("");
    setIsAuthenticated(false);
    setShowPlayerSearch(false);
    localStorage.clear();
  };

  const handleScheduleMatch = () => setShowPlayerSearch(true);
  const handlePlayerSelected = (player) => {
    setShowPlayerSearch(false);
    alert(`You selected: ${player.firstName} ${player.lastName}`);
  };
  const handleClosePlayerSearch = () => setShowPlayerSearch(false);

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
          path="/"
          element={
            <MainApp
              isAuthenticated={isAuthenticated}
              userFirstName={userFirstName}
              userLastName={userLastName}
              userEmail={userEmail}
              userPin={userPin}
              showPlayerSearch={showPlayerSearch}
              handleLoginSuccess={handleLoginSuccess}
              handleScheduleMatch={handleScheduleMatch}
              handlePlayerSelected={handlePlayerSelected}
              handleClosePlayerSearch={handleClosePlayerSearch}
              handleLogout={handleLogout}
            />
          }
        />
        {/* Catch-all route to redirect unknown paths to root */}
        <Route path="*" element={<Navigate to="/" />} />
 <Route
  path="/dashboard"
  element={
    isAuthenticated ? (
      <Dashboard
        playerName={userFirstName}
        playerLastName={userLastName}
        onScheduleMatch={handleScheduleMatch}
        onOpenChat={() => (window.location.hash = "#/chat")}
        onLogout={handleLogout}
        userPin={userPin}
        onGoToAdmin={() => navigate("/admin")}
      />
    ) : (
      <Navigate to="/" />
    )
  }
/>


      </Routes>
    </HashRouter>
  );
}

export default App;
