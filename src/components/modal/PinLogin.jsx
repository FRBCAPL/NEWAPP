import React, { useState } from "react";
import fetchSheetData from "../../utils/fetchSheetData";
import styles from "./PinLogin.module.css";
import ResponsiveWrapper from "../ResponsiveWrapper";
import PoolSimulation from "../PoolSimulation";

// --- Google Sheet config ---
const sheetID = "1tvMgMHsRwQxsR6lMNlSnztmwpK7fhZeNEyqjTqmRFRc";
const pinSheetName = "BCAPL SIGNUP";

/**
 * Login - Login form for email OR PIN authentication
 * @param {function} onSuccess - callback when login succeeds
 */
export default function Login({ onSuccess }) {
  const [input, setInput] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showInput, setShowInput] = useState(false); // <-- new state

  // --- Verify Email or PIN against Google Sheet ---
  const verifyInput = async () => {
    if (!input) {
      setMessage("Please enter your email or PIN.");
      return;
    }
    setMessage("");
    setLoading(true);
    try {
      const rows = await fetchSheetData(sheetID, `${pinSheetName}!A1:L1000`);
      const dataRows = rows.slice(1); // skip header
      // Find by email (case-insensitive) or PIN (exact)
      const match = dataRows.find(row =>
        (row[2] || "").trim().toLowerCase() === input.trim().toLowerCase() ||
        (row[11] || "").trim() === input.trim()
      );
      setLoading(false);
      if (match) {
        setMessage("");
        // Pass name, email, and PIN to parent
        onSuccess(`${match[0] || ""} ${match[1] || ""}`.trim(), match[2] || "", match[11] || "");
      } else {
        setMessage("No user found with that email or PIN. Please try again or contact frbcapl@gmail.com for help.");
      }
    } catch (error) {
      setLoading(false);
      setMessage("Error verifying login. Please try again later.");
      console.error("Login verification error:", error);
    }
  };

  // --- Allow Enter key to submit ---
  const handleKeyDown = (e) => {
    if (e.key === "Enter") verifyInput();
  };

  return (
    <>
    <div className={styles.pinLoginBg}>
      <div className={styles.pinLoginFrame}>
        <a
          href="https://frusapl.com/frbcapl-singles#3a534cc1-c4ac-4c04-8d7a-a0fe9ddfaca4"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.signupBtn}
          style={{ marginBottom: "1.5rem" }}
        >
          Sign Up for Beta Test
        </a>
        <div className={styles.simulationContainer}>
          <ResponsiveWrapper aspectWidth={600} aspectHeight={300}>
            <PoolSimulation />
          </ResponsiveWrapper>
        </div>
        <div className={styles.pinLoginCard}>
          <h3 className={styles.pinLoginSubtitle}>
            <span className={styles.pinLoginLock} aria-hidden="true">🔒</span>
            <span className={styles.pinOutlineText}> Enter Email</span>
          </h3>
            <label htmlFor="pin-input" style={{ fontWeight: 500, fontSize: '1.1em', marginBottom: 8, color: '#fff' }}>
              Enter Email To Log In
            </label>
            <div style={{ position: 'relative', width: '100%', maxWidth: 220 }}>
          <input
                type={input.includes('@') ? 'text' : (showInput ? 'text' : 'password')}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Email"
            autoFocus
            className={styles.pinInput}
            aria-label="Email"
            disabled={loading}
                style={{ paddingRight: 38 }}
          />
              {/* Show/hide button only for PIN (not email) */}
              {!input.includes('@') && (
                <button
                  type="button"
                  onClick={() => setShowInput(v => !v)}
                  style={{
                    position: 'absolute',
                    right: 6,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#fff',
                    fontSize: '0.95em',
                    cursor: 'pointer',
                    padding: 0,
                    zIndex: 2,
                    textDecoration: 'underline',
                    fontWeight: 500
                  }}
                  tabIndex={-1}
                  aria-label={showInput ? 'Hide PIN' : 'View PIN'}
                >
                  {showInput ? 'Hide' : 'View'}
                </button>
              )}
            </div>
          <button
            onClick={verifyInput}
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
    </>
  );
}
