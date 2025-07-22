/**
 * SECURITY IMPROVEMENT: Removed hardcoded admin PIN vulnerability
 * 
 * COMPLETED:
 * - Replaced hardcoded PIN "777777" with email-based admin check
 * - Admin access now controlled via userEmail === "admin@bcapl.com"
 * - Applied fix across all components (App.jsx, Dashboard.jsx, etc.)
 * 
 * TODO for production security:
 * - Implement JWT-based authentication with backend validation
 * - Add role-based access control (RBAC) system
 * - Remove admin credentials from frontend entirely
 * - Add proper session management and timeout
 */

import React, { useState, useEffect, useRef } from "react";
import { HashRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import ErrorBoundary from "./components/ErrorBoundary";

// Main pages/components
import ConfirmMatch from "./components/ConfirmMatch";
import Dashboard from "./components/dashboard/Dashboard";
import MatchChat from "./components/chat/MatchChat";
import AdminDashboard from "./components/dashboard/AdminDashboard";
import PinLogin from "./components/modal/PinLogin";
import FloatingLogos from './components/FloatingLogos';
import AppHeader from './components/AppHeader';
import logo from "./assets/logo.png";
import bcaplLogo from "./assets/bcapl_logo.png";
import csiLogo from "./assets/csi_logo.png";
import usaplLogo from "./assets/usapl_logo.png";
import fargorateLogo from "./assets/fargorate-logo.png";
import "./styles/variables.css";
import "./styles/global.css";

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
        <ErrorBoundary 
          message="Dashboard temporarily unavailable. Please try again."
          onError={(error, errorInfo) => {
            console.error('🚨 Dashboard Error:', error);
            // Could send to error reporting service here
          }}
        >
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
        </ErrorBoundary>
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
        <div style={{ position: "relative", zIndex: 3, maxWidth: 900, margin: "0 auto", width: "100%", background: "none" }}>
          <AppHeader />
          <Routes>
            <Route
              path="/admin"
              element={
                isAuthenticated && userEmail === "admin@bcapl.com" ? (
                  <ErrorBoundary 
                    message="Admin dashboard temporarily unavailable. Please try refreshing."
                    onError={(error, errorInfo) => {
                      console.error('🚨 Admin Dashboard Error:', error);
                    }}
                  >
                    <div className="admin-app-content"><AdminDashboard /></div>
                  </ErrorBoundary>
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
                          <ErrorBoundary 
                            message="Chat temporarily unavailable. Your messages are safe."
                            onError={(error, errorInfo) => {
                              console.error('🚨 Chat Error:', error);
                            }}
                          >
                            <MatchChat
                              userName={`${userFirstName} ${userLastName}`}
                              userEmail={userEmail}
                              userPin={userPin}
                            />
                          </ErrorBoundary>
                        ) : (
                          <Navigate to="/" />
                        )
                      }
                    />
                    <Route
                      path="/dashboard"
                      element={
                        isAuthenticated ? (
                          <ErrorBoundary 
                            message="Dashboard temporarily unavailable. Please try again."
                            onError={(error, errorInfo) => {
                              console.error('🚨 Dashboard Route Error:', error);
                            }}
                          >
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
                          </ErrorBoundary>
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
