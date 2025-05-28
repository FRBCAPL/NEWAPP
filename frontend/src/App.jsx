import React, { useState, useEffect } from "react";
import { HashRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import PinLogin from "./components/PinLogin";
import Dashboard from "./components/Dashboard";
import PlayerSearch from "./components/PlayerSearch";
import ConfirmMatch from "./components/ConfirmMatch";
import MatchChat from "./MatchChat";
import AdminDashboard from "./components/AdminDashboard";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userName, setUserName] = useState("");
  const [showPlayerSearch, setShowPlayerSearch] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [userPin, setUserPin] = useState("");

  // Restore auth state from localStorage on app load
  useEffect(() => {
    const savedAuth = localStorage.getItem("isAuthenticated");
    if (savedAuth === "true") {
      setUserName(localStorage.getItem("userName") || "");
      setUserEmail(localStorage.getItem("userEmail") || "");
      setUserPin(localStorage.getItem("userPin") || "");
      setIsAuthenticated(true);
    }
  }, []);

  // Now expects name, email, and pin from PinLogin
  const handleLoginSuccess = (name, email, pin) => {
    setUserName(name);
    setUserEmail(email);
    setUserPin(pin);
    setIsAuthenticated(true);

    // Save to localStorage
    localStorage.setItem("userName", name);
    localStorage.setItem("userEmail", email);
    localStorage.setItem("userPin", pin);
    localStorage.setItem("isAuthenticated", "true");
  };

  const handleLogout = () => {
    setUserName("");
    setUserEmail("");
    setUserPin("");
    setIsAuthenticated(false);
    setShowPlayerSearch(false);

    // Clear localStorage on logout
    localStorage.clear();
  };

  const handleScheduleMatch = () => {
    setShowPlayerSearch(true);
  };

  const handlePlayerSelected = (player) => {
    setShowPlayerSearch(false);
    alert(`You selected: ${player.firstName} ${player.lastName}`);
  };

  const handleClosePlayerSearch = () => {
    setShowPlayerSearch(false);
  };

  // Main app content (login/dashboard/player search)
  const MainApp = () => {
    const navigate = useNavigate();

    // No auto-redirect for admins!

    // Check for "showPlayerSearch" flag from admin navigation
    useEffect(() => {
      if (localStorage.getItem("showPlayerSearch") === "true") {
        setShowPlayerSearch(true);
        localStorage.removeItem("showPlayerSearch");
      }
    }, []);

    return (
      <div>
        {!isAuthenticated ? (
          <PinLogin onSuccess={handleLoginSuccess} />
        ) : (
          <>
            <Dashboard
              playerName={userName}
              onScheduleMatch={handleScheduleMatch}
              onOpenChat={() => window.location.hash = "#/chat"}
              onLogout={handleLogout}
              userPin={userPin}
              onGoToAdmin={() => navigate("/admin")}
            />
            {showPlayerSearch && !!userEmail && (
              <PlayerSearch
                onSelect={handlePlayerSelected}
                onClose={handleClosePlayerSearch}
                excludeName={userName}
                senderName={userName}
                senderEmail={userEmail}
              />
            )}
          </>
        )}
      </div>
    );
  };

  return (
    <HashRouter>
      <Routes>
        <Route path="/confirm-match" element={<ConfirmMatch />} />
        <Route
          path="/chat"
          element={
            isAuthenticated ? (
              <MatchChat
                userName={userName}
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
        <Route path="/" element={<MainApp />} />
      </Routes>
    </HashRouter>
  );
}

export default App;
