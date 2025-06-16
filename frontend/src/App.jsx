import React, { useState, useEffect } from "react";
import { HashRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";

// Main pages/components
import ConfirmMatch from "./components/ConfirmMatch";
import Dashboard from "./components/dashboard/Dashboard";
import MatchChat from "./components/chat/MatchChat";
import AdminDashboard from "./components/dashboard/AdminDashboard";
import './styles/variables.css';

// Modal components
import PinLogin from "./components/modal/PinLogin";
import PlayerSearch from "./components/modal/PlayerSearch";
import PhaseSelectionModal from "./components/modal/PhaseSelectionModal"; // <-- Make sure path is correct

import "./styles/global.css";

// --- MainApp must be a component, not a function inside App ---
function MainApp({
  isAuthenticated,
  userFirstName,
  userLastName,
  userEmail,
  userPin,
  showPlayerSearch,
  handleLoginSuccess,
  handleScheduleMatch,
  handlePlayerSelected,
  handleClosePlayerSearch,
  handleLogout,
  phaseSelectionOpen,
  handlePhaseSelected,
  selectedPhase,
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
            playerName={userFirstName}
            playerLastName={userLastName}
            onScheduleMatch={handleScheduleMatch}
            onOpenChat={() => (window.location.hash = "#/chat")}
            onLogout={handleLogout}
            userPin={userPin}
            onGoToAdmin={() => navigate("/admin")}
          />
          {/* Phase selection modal */}
          {phaseSelectionOpen && (
            <PhaseSelectionModal
              open={phaseSelectionOpen}
              onSelect={handlePhaseSelected}
              onClose={handleClosePlayerSearch}
            />
          )}
          {/* Player search modal, only after phase is selected */}
          {showPlayerSearch && !!userEmail && (
            <PlayerSearch
              phase={selectedPhase}
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
  // --- State ---
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userFirstName, setUserFirstName] = useState("");
  const [userLastName, setUserLastName] = useState("");
  const [showPlayerSearch, setShowPlayerSearch] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [userPin, setUserPin] = useState("");
  const [phaseSelectionOpen, setPhaseSelectionOpen] = useState(false);
  const [selectedPhase, setSelectedPhase] = useState(null);

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
    setShowPlayerSearch(false);
    setPhaseSelectionOpen(false);
    setSelectedPhase(null);
    // Only remove your app's keys, not all localStorage:
    localStorage.removeItem("userFirstName");
    localStorage.removeItem("userLastName");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userPin");
    localStorage.removeItem("isAuthenticated");
  };

  // --- Modal handlers ---
  // When user clicks "Schedule a Match" on dashboard, open phase selection modal
  const handleScheduleMatch = () => {
    setPhaseSelectionOpen(true);
    setSelectedPhase(null);
    setShowPlayerSearch(false);
  };

  // When phase is selected, open player search and store phase
  const handlePhaseSelected = (phase) => {
    setSelectedPhase(phase);
    setPhaseSelectionOpen(false);
    setShowPlayerSearch(true);
  };

  const handlePlayerSelected = (player) => {
    setShowPlayerSearch(false);
    // You can do more with the selected player here if needed
    alert(`You selected: ${player.firstName} ${player.lastName}`);
  };

  const handleClosePlayerSearch = () => {
    setShowPlayerSearch(false);
    setPhaseSelectionOpen(false);
    setSelectedPhase(null);
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
                onScheduleMatch={handleScheduleMatch}
                onOpenChat={() => (window.location.hash = "#/chat")}
                onLogout={handleLogout}
                userPin={userPin}
                onGoToAdmin={() => { /* This won't work here, use MainApp for navigation */ }}
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
              showPlayerSearch={showPlayerSearch}
              handleLoginSuccess={handleLoginSuccess}
              handleScheduleMatch={handleScheduleMatch}
              handlePlayerSelected={handlePlayerSelected}
              handleClosePlayerSearch={handleClosePlayerSearch}
              handleLogout={handleLogout}
              phaseSelectionOpen={phaseSelectionOpen}
              handlePhaseSelected={handlePhaseSelected}
              selectedPhase={selectedPhase}
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
