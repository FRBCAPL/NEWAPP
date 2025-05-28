import React, { useState } from "react";
import fetchSheetData from "../utils/fetchSheetData";

// Google Sheet details
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
      // Fetch up to 1000 rows and columns A-L
      const rows = await fetchSheetData(sheetID, `${pinSheetName}!A1:L1000`);
      // First row is the header
      const dataRows = rows.slice(1);
      // Find the row where the PIN matches (column 11, L)
      const match = dataRows.find(row => row[11]?.toString() === pin);
      setLoading(false);
      if (match) {
        // first name (0), last name (1), email (2)
        const firstName = match[0] ? match[0].toString() : "";
        const lastName = match[1] ? match[1].toString() : "";
        const email = match[2] ? match[2].toString() : "";
        const userName = `${firstName} ${lastName}`.trim();
        setMessage("");
        // --- DEBUG LOG: See what email is found and sent to App ---
        console.log("DEBUG PinLogin: userName =", userName, "| email =", email, "| pin =", pin);
        // Pass userName, email, and pin to App.jsx
        onSuccess(userName, email, pin);
      } else {
        setMessage("Invalid PIN. Please try again. Your PIN is in your welcome email. Email: frbcapl@gmail.com for PIN reset.");
      }
    } catch (error) {
      setLoading(false);
      setMessage("Error verifying PIN. Please try again later.");
      console.error("PIN verification error:", error);
    }
  };

  return (
    <div className="pin-login-card">
      <h2>Welcome to</h2>
      <h1>Front Range Pool League</h1>
      <h3>🔒 Please Enter Your PIN</h3>
      <input
        type="password"
        value={pin}
        onChange={(e) => setPin(e.target.value)}
        placeholder="Enter PIN"
        maxLength={12}
        inputMode="numeric"
        autoFocus
      />
      <br />
      <button onClick={verifyPin} disabled={loading}>
        {loading ? "Verifying..." : "Submit"}
      </button>
    {message && (
  <p className="pin-login-error">
    {message}
  </p>
)}

    </div>
  );
}
