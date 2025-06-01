import React, { useState } from "react";
import fetchSheetData from "../../utils/fetchSheetData";
import styles from "./PinLogin.module.css";
import PoolSimulation from "../PoolSimulation.jsx";

const sheetID = "1tvMgMHsRwQxsR6lMNlSnztmwpK7fhZeNEyqjTqmRFRc";
const pinSheetName = "BCAPL SIGNUP";

export default function PinLogin({ onSuccess }) {
  const [pin, setPin] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

const verifyPin = async () => {
  if (!pin) {
    setMessage("Please enter a PIN.");
    return;
  }
  setMessage("");
  setLoading(true);
  try {
    const rows = await fetchSheetData(sheetID, `${pinSheetName}!A1:L1000`);
    const dataRows = rows.slice(1);
    const match = dataRows.find(row => row[11]?.toString() === pin);
    setLoading(false);
    if (match) {
      setMessage("");
      // Pass full name (first + last), email, pin
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


  const handleKeyDown = (e) => {
    if (e.key === "Enter") verifyPin();
  };

  return (
    <div className={styles.pinLoginBg}>
      <div className={styles.pinLoginFrame}>
        <div className={styles.pinLoginCard}>
          {/* Pool simulation appears ONLY here */}
          <PoolSimulation />
          <h3 className={styles.pinLoginSubtitle}>
            <span className={styles.pinLoginLock}>🔒</span>
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
          />
          <button
            onClick={verifyPin}
            disabled={loading}
            className={styles.pinLoginBtn}
          >
            {loading ? "Verifying..." : "Submit"}
          </button>
          {message && (
            <p className={styles.pinLoginError}>
              {message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
