import React, { useState, useEffect, useRef } from "react";
import { HashRouter, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";

// Main pages/components
import ConfirmMatch from "./components/ConfirmMatch";
import Dashboard from "./components/dashboard/Dashboard";
import MatchChat from "./components/chat/MatchChat";
import AdminDashboard from "./components/dashboard/AdminDashboard";
import PlatformAdminDashboard from "./components/PlatformAdminDashboard";
import PinLogin from "./components/modal/PinLogin";
import FloatingLogos from './components/FloatingLogos';
import TenBallTutorial from './components/TenBallTutorial';
import SimplePoolGame from './components/tenball/SimplePoolGame';
import MobileTestPage from './components/MobileTestPage';
import AppHub from './components/hub/AppHub';
import LoggedOutHub from './components/hub/LoggedOutHub';
import HubNavigation from './components/hub/HubNavigation';
import AppRouteWrapper from './components/hub/AppRouteWrapper';
import LadderApp from './components/ladder/LadderApp';
import LadderManagement from './components/ladder/LadderManagement';
import LadderPlayerManagement from './components/ladder/LadderPlayerManagement';
import PlayerManagement from './components/admin/PlayerManagement';
import adminAuthService from './services/adminAuthService.js';

// Guest App Components
import GuestLeagueApp from './components/guest/GuestLeagueApp';
import GuestLadderApp from './components/guest/GuestLadderApp';

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
  userType,
  handleLoginSuccess,
  handleLogout
}) {
  const navigate = useNavigate();
  return (
    <main className="main-app-content">
      {!isAuthenticated ? (
        <LoggedOutHub onLoginSuccess={handleLoginSuccess} />
      ) : (
        <AppHub
          isAuthenticated={isAuthenticated}
          userFirstName={userFirstName}
          userLastName={userLastName}
          userEmail={userEmail}
          userPin={userPin}
          userType={userType}
          handleLogout={handleLogout}
        />
      )}
    </main>
  );
}

function AppContent() {
  const location = useLocation();
  
  // --- State ---
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userFirstName, setUserFirstName] = useState("");
  const [userLastName, setUserLastName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userPin, setUserPin] = useState("");
  const [userType, setUserType] = useState("league");
  const [currentAppName, setCurrentAppName] = useState("");

  // --- Load auth/user info from localStorage on mount ---
  useEffect(() => {
    const savedAuth = localStorage.getItem("isAuthenticated");
    if (savedAuth === "true") {
      setUserFirstName(localStorage.getItem("userFirstName") || "");
      setUserLastName(localStorage.getItem("userLastName") || "");
      setUserEmail(localStorage.getItem("userEmail") || "");
      setUserPin(localStorage.getItem("userPin") || "");
      setUserType(localStorage.getItem("userType") || "league");
      setIsAuthenticated(true);
    }
  }, []);

  // --- Listen for app name changes and ladder login success ---
  useEffect(() => {
    const handleAppNameChange = (event) => {
      setCurrentAppName(event.detail);
    };

    // Listen for ladder login success events
    const handleLadderLoginSuccess = (event) => {
      console.log('App.jsx received ladderLoginSuccess event:', event.detail);
      const { name, email, pin, userType } = event.detail;
      
      // Call the existing login success handler
      handleLoginSuccess(name, email, pin, userType);
    };

    window.addEventListener('appNameChange', handleAppNameChange);
    window.addEventListener('ladderLoginSuccess', handleLadderLoginSuccess);

    return () => {
      window.removeEventListener('appNameChange', handleAppNameChange);
      window.removeEventListener('ladderLoginSuccess', handleLadderLoginSuccess);
    };
  }, []);

  // --- Login handler ---
  const handleLoginSuccess = (name, email, pin, userType, userData = null) => {
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
    setUserType(userType || 'league');
    setIsAuthenticated(true);

    // Store unified user data
    localStorage.setItem("userFirstName", firstName);
    localStorage.setItem("userLastName", lastName);
    localStorage.setItem("userEmail", email);
    localStorage.setItem("userPin", pin);
    localStorage.setItem("userType", userType || 'league'); // Default to league if not specified
    localStorage.setItem("isAuthenticated", "true");
    
    // Store complete user data if provided (includes ladderProfile, leagueProfile, etc.)
    if (userData) {
      localStorage.setItem("unifiedUserData", JSON.stringify(userData));
    }
    
    console.log('🔐 Unified Login Success:', {
      firstName,
      lastName,
      email,
      userType,
      pin: pin ? '***' : 'none',
      hasUserData: !!userData
    });
  };

  // --- Check if user is super admin ---
  const [isSuperAdminState, setIsSuperAdminState] = useState(false);
  const [isAdminState, setIsAdminState] = useState(false);
  const [adminLoading, setAdminLoading] = useState(false);

  const isSuperAdmin = () => {
    return isSuperAdminState;
  };

  const isAdmin = () => {
    return isAdminState;
  };

  // Check admin status when user logs in
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (isAuthenticated && userEmail && userPin) {
        setAdminLoading(true);
        try {
          // Check if user is a super admin
          const superAdminResult = await adminAuthService.isSuperAdmin(userEmail, userPin);
          setIsSuperAdminState(superAdminResult);
          
          // Check if user is any type of admin
          const adminResult = await adminAuthService.isAdmin(userEmail, userPin);
          setIsAdminState(adminResult);
          
          console.log('🔍 Admin Status Check:', {
            userEmail: userEmail,
            isSuperAdmin: superAdminResult,
            isAdmin: adminResult
          });
        } catch (error) {
          console.log('🔍 Admin check failed:', error.message);
          setIsSuperAdminState(false);
          setIsAdminState(false);
        } finally {
          setAdminLoading(false);
        }
      }
    };

    checkAdminStatus();
  }, [isAuthenticated, userEmail, userPin]);

  // --- Logout handler ---
  const handleLogout = () => {
    setUserFirstName("");
    setUserLastName("");
    setUserEmail("");
    setUserPin("");
    setUserType("league");
    setCurrentAppName("");
    setIsAuthenticated(false);
    setIsAdminState(false);
    setIsSuperAdminState(false);
    localStorage.removeItem("userFirstName");
    localStorage.removeItem("userLastName");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userPin");
    localStorage.removeItem("userType");
    localStorage.removeItem("isAuthenticated");
  };

  // --- Main Router ---
  return (
    <div style={{ position: "relative", minHeight: "100vh", width: "100%", overflowX: "hidden", background: "#000" }}>
        <FloatingLogos />
                         <HubNavigation 
          currentAppName={currentAppName} 
          isAdmin={isAdminState}
          isSuperAdmin={isSuperAdminState}
          onLogout={handleLogout}
          userFirstName={userFirstName}
          userLastName={userLastName}
        />

                 <div style={{ position: "relative", zIndex: 3, maxWidth: 900, margin: "0 auto", width: "100%", background: "none", minHeight: "100vh", paddingTop: "200px" }}>
          <Routes>
                         {/* Hub Route */}
             <Route
               path="/hub"
               element={
                 isAuthenticated ? (
                   <AppRouteWrapper appName="Front Range Pool Hub">
                     <main className="main-app-content">
                       <AppHub
                         isAuthenticated={isAuthenticated}
                         userFirstName={userFirstName}
                         userLastName={userLastName}
                         userEmail={userEmail}
                         userPin={userPin}
                         userType={userType}
                         handleLogout={handleLogout}
                       />
                     </main>
                   </AppRouteWrapper>
                 ) : (
                   <Navigate to="/" />
                 )
               }
             />
            
            {/* League App Routes */}
                         <Route
               path="/league"
               element={
                 isAuthenticated ? (
                   <AppRouteWrapper appName="Front Range Pool League">
                    <main className="main-app-content">
                      <Dashboard
                        playerName={userFirstName}
                        playerLastName={userLastName}
                        senderEmail={userEmail}
                        onScheduleMatch={() => {}}
                        onOpenChat={() => (window.location.hash = "#/league/chat")}
                        userPin={userPin}
                        onGoToAdmin={() => {}}
                        onGoToPlatformAdmin={() => navigate("/platform-admin")}
                      />
                    </main>
                  </AppRouteWrapper>
                ) : (
                  <Navigate to="/" />
                )
              }
            />
            
                         <Route
               path="/league/chat"
               element={
                 isAuthenticated ? (
                   <AppRouteWrapper appName="Front Range Pool League - Chat">
                    <main className="main-app-content">
                      <MatchChat
                        userName={`${userFirstName} ${userLastName}`}
                        userEmail={userEmail}
                        userPin={userPin}
                      />
                    </main>
                  </AppRouteWrapper>
                ) : (
                  <Navigate to="/" />
                )
              }
            />
            
                         {/* Ladder App Routes */}
                           <Route
                path="/ladder"
                element={
                  isAuthenticated ? (
                    <AppRouteWrapper appName="Ladder of Legends">
                      <main className="main-app-content">
                        <LadderApp
                          playerName={userFirstName}
                          playerLastName={userLastName}
                          senderEmail={userEmail}
                          userPin={userPin}
                          isAdmin={isAdminState}
                          userType={userType}
                        />
                      </main>
                    </AppRouteWrapper>
                  ) : (
                    <Navigate to="/" />
                  )
                }
              />
             
              

             {/* Guest App Routes */}
             <Route
               path="/guest/league"
               element={
                 <AppRouteWrapper appName="League App - Guest Preview">
                   <main className="main-app-content">
                     <GuestLeagueApp />
                   </main>
                 </AppRouteWrapper>
               }
             />
             
             <Route
               path="/guest/ladder"
               element={
                 <AppRouteWrapper appName="Ladder of Legends - Guest Preview">
                   <main className="main-app-content">
                     <GuestLadderApp />
                   </main>
                 </AppRouteWrapper>
               }
             />

             {/* Ladder Management Route */}
              <Route
                path="/ladder/manage"
                element={
                  isAuthenticated && isAdmin() ? (
                    <AppRouteWrapper appName="Ladder of Legends Management">
                      <main className="main-app-content">
                        <LadderManagement
                          userEmail={userEmail}
                          userPin={userPin}
                        />
                      </main>
                    </AppRouteWrapper>
                  ) : (
                    <Navigate to="/" />
                  )
                }
              />
              
              {/* Ladder Player Management Route */}
              <Route
                path="/ladder/admin"
                element={
                  isAuthenticated && isAdmin() ? (
                    <AppRouteWrapper appName="Ladder of Legends Player Management">
                      <main className="main-app-content">
                        <LadderPlayerManagement />
                      </main>
                    </AppRouteWrapper>
                  ) : (
                    <Navigate to="/" />
                  )
                }
              />
             
             {/* Admin Routes */}
             <Route
               path="/admin"
               element={
                 isAuthenticated && isAdmin() ? (
                   <AppRouteWrapper appName="Admin Dashboard">
                     <div className="admin-app-content">
                       <AdminDashboard />
                     </div>
                   </AppRouteWrapper>
                 ) : (
                   <Navigate to="/" />
                 )
               }
             />
             
             {/* Player Management Route */}
             <Route
               path="/admin/players"
               element={
                 isAuthenticated && isAdmin() ? (
                   <AppRouteWrapper appName="Player Management">
                     <div className="admin-app-content">
                       <PlayerManagement />
                     </div>
                   </AppRouteWrapper>
                 ) : (
                   <Navigate to="/" />
                 )
               }
             />
            <Route
              path="/platform-admin"
              element={
                isAuthenticated && isSuperAdmin() ? (
                  <AppRouteWrapper appName="Platform Admin">
                    <div className="platform-admin-app-content">
                      <PlatformAdminDashboard />
                    </div>
                  </AppRouteWrapper>
                ) : (
                  <Navigate to="/" />
                )
              }
            />
            
            {/* Other Routes */}
            <Route path="/confirm-match" element={<ConfirmMatch />} />
            <Route
              path="/simple-pool"
              element={<SimplePoolGame />}
            />
            <Route
              path="/tenball-tutorial"
              element={<TenBallTutorial />}
            />
            <Route
              path="/mobile-test"
              element={<MobileTestPage />}
            />
            
                         {/* Default Route - Hub */}
             <Route
               path="/"
               element={
                 <AppRouteWrapper appName={isAuthenticated ? "Front Range Pool Hub" : ""}>
                                       <MainApp
                      isAuthenticated={isAuthenticated}
                      userFirstName={userFirstName}
                      userLastName={userLastName}
                      userEmail={userEmail}
                      userPin={userPin}
                      userType={userType}
                      handleLoginSuccess={handleLoginSuccess}
                      handleLogout={handleLogout}
                    />
                 </AppRouteWrapper>
               }
             />
            
            {/* Catch-all route */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
      </div>
  );
}

function App() {
  return (
    <HashRouter>
      <AppContent />
    </HashRouter>
  );
}

export default App;
