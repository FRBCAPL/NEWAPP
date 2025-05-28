import React, { useState, useEffect } from "react";
import MatchProposalModal from "./MatchProposalModal";
import Highlight from "./Highlight";
import { sendProposalEmail } from "../utils/emailHelpers";
import fetchSheetData from "../utils/fetchSheetData";

// --- Google Sheet details ---
const sheetID = "1tvMgMHsRwQxsR6lMNlSnztmwpK7fhZeNEyqjTqmRFRc";
const pinSheetName = "BCAPL SIGNUP";

// --- Parse the availability string into a grid-friendly object ---
function normalizeTime(str) {
  if (!str) return "";
  str = str.trim().toLowerCase().replace(/\s+/g, "");
  let match = str.match(/^(\d{1,2})(:?(\d{2}))?(am|pm)$/);
  if (!match) return str.toUpperCase();
  let [, h, , m, ap] = match;
  if (!m) m = "00";
  return `${parseInt(h, 10)}:${m} ${ap.toUpperCase()}`;
}

function parseAvailability(str) {
  const dayMap = {
    Monday: "Mon",
    Tuesday: "Tue",
    Wednesday: "Wed",
    Thursday: "Thu",
    Friday: "Fri",
    Saturday: "Sat",
  };
  const result = { Mon: [], Tue: [], Wed: [], Thu: [], Fri: [], Sat: [] };
  if (!str) return result;
  str.split(/\r?\n/).forEach(line => {
    const match = line.match(/Day:\s*(\w+),\s*Available From:\s*([\w:]+),\s*Available Until:\s*([\w: ]+)/i);
    if (match) {
      const [_, dayFull, from, until] = match;
      const dayShort = dayMap[dayFull];
      if (dayShort) {
        const fromNorm = normalizeTime(from);
        const untilNorm = normalizeTime(until);
        result[dayShort].push(`${fromNorm} - ${untilNorm}`);
      }
    }
  });
  return result;
}

export default function PlayerSearch({
  onSelect,
  onClose,
  excludeName,
  senderName,
  senderEmail,
  onProposalComplete
}) {
  // --- State declarations ---
  const [players, setPlayers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [showContact, setShowContact] = useState(false);
  const [timer, setTimer] = useState(10);
  const [proposalData, setProposalData] = useState(null);

  // --- Load player data from Google Sheet ---
  useEffect(() => {
    async function loadPlayers() {
      try {
        const rows = await fetchSheetData(sheetID, `${pinSheetName}!A1:L1000`);
        if (!rows || rows.length === 0) {
          setPlayers([]);
          setLoading(false);
          return;
        }
        const headerCells = rows[0];
        const headerMap = {};
        headerCells.forEach((cell, idx) => {
          if (cell !== undefined && cell !== null) {
            headerMap[String(cell).trim().toLowerCase()] = idx;
          }
        });
        const playerList = rows
          .slice(1)
          .map(row => ({
            firstName: row[0] || "",
            lastName: row[1] || "",
            email: row[2] || "",
            phone: row[3] || "",
            locations: row[8] || "",
            availability: parseAvailability(row[7] || ""),
            pin: row[11] || "",
          }))
          .filter(
            p =>
              p.email &&
              p.firstName &&
              p.lastName &&
              `${p.firstName} ${p.lastName}`.toLowerCase() !== excludeName?.toLowerCase()
          );
        setPlayers(playerList);
      } catch (err) {
        setPlayers([]);
      } finally {
        setLoading(false);
      }
    }
    loadPlayers();
  }, [excludeName]);

  // --- Filtered players for search ---
  const filteredPlayers =
    search.length >= 3
      ? players.filter(
          p =>
            `${p.firstName} ${p.lastName}`.toLowerCase().includes(search.toLowerCase()) &&
            `${p.firstName} ${p.lastName}`.toLowerCase() !== excludeName?.toLowerCase()
        )
      : [];

  // --- Timer for hiding contact info ---
  useEffect(() => {
    let interval;
    if (showContact) {
      setTimer(10);
      interval = setInterval(() => {
        setTimer(t => {
          if (t <= 1) {
            clearInterval(interval);
            setShowContact(false);
            return 10;
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [showContact]);

  return (
    <div className="modal">
      <div className="modal-content player-search-modal">
        <button
          className="modal-close"
          onClick={onClose}
          aria-label="Close"
        >
          &times;
        </button>

        <h2>Player Search</h2>
        <input
          type="text"
          className="player-search-input"
          placeholder="Type at least 3 letters to search..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          autoFocus
        />

        {loading ? (
          <p>Loading players...</p>
        ) : (
          <>
            {search.length < 3 ? (
              <p className="player-search-hint">
                Please enter at least 3 letters to search for a player.
              </p>
            ) : (
              <ul className="player-search-list">
                {filteredPlayers.length === 0 && (
                  <li className="player-search-empty">
                    No players found.
                  </li>
                )}
                {filteredPlayers.map((p, i) => (
                  <li key={i}>
                    <button
                      className="player-search-list-btn"
                      onClick={() => {
                        setSelectedPlayer(p);
                        setShowContact(false);
                      }}
                    >
                      <Highlight text={`${p.firstName} ${p.lastName}`} query={search} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}

        {selectedPlayer && (
          <div className="player-modal">
            <button
              className="player-modal-close"
              onClick={() => setSelectedPlayer(null)}
              aria-label="Close"
            >
              &times;
            </button>

            <h2 className="player-modal-title">
              {selectedPlayer.firstName} {selectedPlayer.lastName}
            </h2>

            <div className="player-modal-section">
              <h3 className="player-modal-section-title">Preferred Locations</h3>
              <div className="player-modal-section-value">
                {selectedPlayer.locations || "No locations specified"}
              </div>
            </div>

            <div className="player-modal-section">
              <h3 className="player-modal-section-title">Availability</h3>
              <div className="player-modal-grid">
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
                  <div className="player-modal-day" key={day}>
                    <div className="player-modal-day-label">
                      {day}
                    </div>
                    {(selectedPlayer.availability[day] || []).length === 0 && (
                      <div className="player-modal-slot-empty">—</div>
                    )}
                    {(selectedPlayer.availability[day] || []).map((slot, i) => (
                      <div
                        className={`player-modal-slot${selectedPlayer.email ? "" : " disabled"}`}
                        key={i}
                        onClick={() => {
                          if (selectedPlayer.email) {
                            setProposalData({ player: selectedPlayer, day, slot });
                          } else {
                            alert("This player does not have an email address and cannot be proposed a match.");
                          }
                        }}
                        title={selectedPlayer.email ? "Propose a match" : "No email address"}
                      >
                        {slot}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            <div className="player-modal-section">
              <h3 className="player-modal-section-title">Contact Info</h3>
              {showContact ? (
                <div>
                  <div className="player-modal-contact">
                    <b>Email:</b> {selectedPlayer.email}
                  </div>
                  <div className="player-modal-contact">
                    <b>Phone:</b> {selectedPlayer.phone}
                  </div>
                  <div className="player-modal-contact-timer">
                    Contact info will hide in {timer} seconds
                  </div>
                </div>
              ) : (
                <button
                  className="player-modal-show-contact"
                  onClick={() => setShowContact(true)}
                >
                  Show Contact Info
                </button>
              )}
            </div>
          </div>
        )}

        {proposalData && (
          <MatchProposalModal
            player={proposalData.player}
            day={proposalData.day}
            slot={proposalData.slot}
            onClose={() => setProposalData(null)}
            senderName={senderName}
            senderEmail={senderEmail}
            onProposalComplete={() => {
              setProposalData(null);
              if (onProposalComplete) onProposalComplete();
            }}
          />
        )}
      </div>
    </div>
  );
}
