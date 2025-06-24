import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import Highlight from "../Highlight";
import fetchSheetData from "../../utils/fetchSheetData";
import PlayerAvailabilityModal from "./PlayerAvailabilityModal";
import MatchProposalModal from "./MatchProposalModal";
import styles from "./PlayerSearch.module.css";

// --- Google Sheet details (safe for public read-only use) ---
const sheetID = "1tvMgMHsRwQxsR6lMNlSnztmwpK7fhZeNEyqjTqmRFRc";
const pinSheetName = "BCAPL SIGNUP";

// --- Utility: Normalize time string for display ---
function normalizeTime(str) {
  if (!str) return "";
  str = str.trim().toLowerCase().replace(/\s+/g, "");
  let match = str.match(/^(\d{1,2})(:?(\d{2}))?(am|pm)$/);
  if (!match) return str.toUpperCase();
  let [, h, , m, ap] = match;
  if (!m) m = "00";
  return `${parseInt(h, 10)}:${m} ${ap.toUpperCase()}`;
}

// --- Utility: Parse availability string into day-slot map ---
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

/**
 * PlayerSearch - Modal for searching and selecting a player to propose a match.
 * @param {function} onClose - callback to close the modal
 * @param {string} excludeName - player name to exclude from search
 * @param {string} senderName - name of the user sending the proposal
 * @param {string} senderEmail - email of the user sending the proposal
 * @param {function} onProposalComplete - callback after proposal is sent
 * @param {string} phase - the selected phase ("challenge" or "scheduled")
 */
export default function PlayerSearch({
  onClose,
  excludeName,
  senderName,
  senderEmail,
  onProposalComplete,
  selectedDivision,
  phase,
}) {
  const [players, setPlayers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const [mode, setMode] = useState("search"); // "search" | "availability" | "proposal"
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [proposal, setProposal] = useState(null);

  // --- Load players from Google Sheet ---
  useEffect(() => {
    let isMounted = true;
    async function loadPlayers() {
      try {
        const rows = await fetchSheetData(sheetID, `${pinSheetName}!A1:L1000`);
        if (!rows || rows.length === 0) {
          if (isMounted) setPlayers([]);
          setLoading(false);
          return;
        }
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
            preferredContacts: (row[10] || "")
              .split(/\r?\n/)
              .map(method => method.trim().toLowerCase())
              .filter(Boolean),
          }))
          .filter(
            p =>
              p.email &&
              p.firstName &&
              p.lastName &&
              `${p.firstName} ${p.lastName}`.toLowerCase() !== excludeName?.toLowerCase()
          );
        if (isMounted) setPlayers(playerList);
      } catch (err) {
        if (isMounted) setPlayers([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadPlayers();
    return () => { isMounted = false; };
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

  // --- Modal content for each mode ---
  const modalContent = (
    <>
      {mode === "search" && (
        <div className={styles.overlay}>
          <div className={styles.overlayBackground} onClick={onClose} />
          <div className={styles.modal} role="dialog" aria-modal="true" aria-label="Player Search">
            <div className={styles.playerSearchModal}>
              <button
                className={styles.playerSearchClose}
                onClick={onClose}
                aria-label="Close"
              >
                &times;
              </button>
              <h2 className={styles.playerSearchTitle}>Player Search</h2>
              {/* Instructional text appears when there are search results */}
              {search.length >= 3 && filteredPlayers.length > 0 && (
                <div className={styles.playerSearchInstruction}>
                  Click opponent's name to see availability.
                </div>
              )}
              <input
                type="text"
                className={styles.playerSearchInput}
                placeholder="Type at least 3 letters to search..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                autoFocus
                aria-label="Search for player"
              />
              {loading ? (
                <p>Loading players...</p>
              ) : (
                <>
                  {search.length < 3 ? (
                    <p className={styles.playerSearchHint}>
                      Please enter at least 3 letters to search for a player.
                    </p>
                  ) : (
                    <ul className={styles.playerSearchList}>
                      {filteredPlayers.length === 0 && (
                        <li className={styles.playerSearchEmpty}>
                          No players found.
                        </li>
                      )}
                      {filteredPlayers.map((p, i) => (
                        <li key={i}>
                          <button
                            className={styles.playerSearchListBtn}
                            onClick={() => {
                              setSelectedPlayer(p);
                              setMode("availability");
                            }}
                            type="button"
                          >
                            <Highlight text={`${p.firstName} ${p.lastName}`} query={search} />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {mode === "availability" && selectedPlayer && (
        <PlayerAvailabilityModal
          player={selectedPlayer}
          onClose={onClose}
          onProposeMatch={(day, slot, phaseValue, divisionValue) => {
            setProposal({
              player: selectedPlayer,
              day,
              slot,
              phase: phaseValue,
              selectedDivision: divisionValue || selectedDivision // fallback
            });
            setMode("proposal");
          }}
          phase={phase}
          selectedDivision={selectedDivision}
        />
      )}

      {mode === "proposal" && proposal && (
        <>
          {console.log("proposal.phase", proposal.phase)}
          <MatchProposalModal
            player={proposal.player}
            day={proposal.day}
            slot={proposal.slot}
            onClose={onClose}
            senderName={senderName}
            senderEmail={senderEmail}
            onProposalComplete={() => {
              setMode("search");
              setProposal(null);
              setSelectedPlayer(null);
              if (onProposalComplete) onProposalComplete();
              onClose();
            }}
            phase={proposal.phase}  // <-- FIXED: Pass phase directly!
            selectedDivision={proposal.selectedDivision || selectedDivision}
          />
        </>
      )}
    </>
  );

  // --- Render modal via portal ---
  return ReactDOM.createPortal(modalContent, document.body);
}
