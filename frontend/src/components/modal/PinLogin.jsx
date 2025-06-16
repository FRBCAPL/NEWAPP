import React, { useState } from "react";
import fetchSheetData from "../../utils/fetchSheetData";
import styles from "./PinLogin.module.css";

import ResponsiveWrapper from "../ResponsiveWrapper";
import PoolSimulation from "../PoolSimulation";

// --- Google Sheet config (safe to expose for public read-only sheets) ---
const sheetID = "1tvMgMHsRwQxsR6lMNlSnztmwpK7fhZeNEyqjTqmRFRc";
const pinSheetName = "BCAPL SIGNUP";

/**
 * PinLogin - Login form for PIN authentication
 * @param {function} onSuccess - callback when login succeeds
 */
export default function PinLogin({ onSuccess }) {
  const [pin, setPin] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // --- Verify PIN against Google Sheet ---
  const verifyPin = async () => {
    if (!pin) {
      setMessage("Please enter a PIN.");
      return;
    }
    setMessage("");
    setLoading(true);
    try {
      const rows = await fetchSheetData(sheetID, `${pinSheetName}!A1:L1000`);
      const dataRows = rows.slice(1); // skip header
      const match = dataRows.find(row => row[11]?.toString() === pin);
      setLoading(false);
      if (match) {
        setMessage("");
        onSuccess(`${match[0] || ""} ${match[1] || ""}`.trim(), match[2] || "", pin);
      } else {
        setMessage("Invalid PIN. Please try again. Your PIN is in your welcome email. Email: frbcapl@gmail.com for PIN reset.");
      }
    } catch (error) {
      setLoading(false);
      setMessage("Error verifying PIN. Please try again later.");
      console.error("PIN verification error:", error);
    }
  };

  // --- Allow Enter key to submit ---
  const handleKeyDown = (e) => {
    if (e.key === "Enter") verifyPin();
  };

  // ---- YOUR RETURN MUST BE INSIDE THE FUNCTION BODY ----
  return (
  <div className={styles.pinLoginBg}>
    <div className={styles.pinLoginFrame}>
      {/* --- Sign Up Button --- */}
      <a
        href="https://frusapl.com/frbcapl-singles#3a534cc1-c4ac-4c04-8d7a-a0fe9ddfaca4"
        target="_blank"
        rel="noopener noreferrer"
        className={styles.signupBtn}
        style={{ marginBottom: "1.5rem" }}
      >
        Sign Up for Beta Test
      </a>
      {/* --- Simulation --- */}
     <div className={styles.simulationContainer}>
  <ResponsiveWrapper aspectWidth={600} aspectHeight={300}>
    <PoolSimulation />
  </ResponsiveWrapper>
</div>

        <div className={styles.pinLoginCard}>
          <h3 className={styles.pinLoginSubtitle}>
            <span className={styles.pinLoginLock} aria-hidden="true">🔒</span>
            <span className={styles.pinOutlineText}> Please Enter Your PIN</span>
          </h3>
          <input
            type="password"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter PIN"
            maxLength={12}
            inputMode="numeric"
            autoFocus
            className={styles.pinInput}
            aria-label="PIN"
            disabled={loading}
          />
          <button
            onClick={verifyPin}
            disabled={loading}
            className={styles.pinLoginBtn}
            type="button"
          >
            {loading ? "Verifying..." : "Submit"}
          </button>
          {message && (
            <p className={styles.pinLoginError} role="alert">
              {message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}