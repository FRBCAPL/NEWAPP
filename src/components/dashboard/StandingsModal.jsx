import React, { useState, useEffect, useRef } from "react";
import FocusTrap from "focus-trap-react";
import styles from "./dashboard.module.css";

export default function StandingsModal({ open, onClose, standingsUrl }) {
  // Spinner state
  const [loading, setLoading] = useState(true);

  // Draggable state
  const [drag, setDrag] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });

  // Keyboard accessibility: close on Esc
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  // Mouse event handlers for dragging
  const onMouseDown = (e) => {
    setDragging(true);
    dragStart.current = {
      x: e.clientX - drag.x,
      y: e.clientY - drag.y,
    };
    document.body.style.userSelect = "none";
  };
  const onMouseMove = (e) => {
    if (!dragging) return;
    setDrag({
      x: e.clientX - dragStart.current.x,
      y: e.clientY - dragStart.current.y,
    });
  };
  const onMouseUp = () => {
    setDragging(false);
    document.body.style.userSelect = "";
  };

  useEffect(() => {
    if (dragging) {
      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
    } else {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
    // eslint-disable-next-line
  }, [dragging]);

  if (!open) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <FocusTrap>
        <div
          className={styles.modalContent}
          style={{
            transform: `translate(${drag.x}px, ${drag.y}px)`,
            cursor: dragging ? "grabbing" : "default",
          }}
          onClick={e => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-label="League Standings"
          tabIndex={-1}
        >
          {/* Close button */}
          <button
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close"
            type="button"
            autoFocus
          >
            &times;
          </button>
          {/* Header (draggable handle) */}
          <div
            className={styles.modalHeader}
            onMouseDown={onMouseDown}
            style={{ cursor: "grab", userSelect: "none" }}
          >
            <h2 className={styles.modalTitle}>League Standings</h2>
          </div>
          {/* Iframe and spinner */}
          <div className={styles.iframeWrapper}>
            {loading && <div className={styles.spinner}></div>}
            <iframe
              src={standingsUrl}
              title="League Standings"
              className={styles.modalIframe}
              onLoad={() => setLoading(false)}
            />
            <div className={styles.iframeShade}></div>
          </div>
          {/* Footer */}
          <div className={styles.modalFooter}>
            <span>Front Range Pool League</span>
            <button className={styles.footerCloseBtn} onClick={onClose}>Close</button>
          </div>
        </div>
      </FocusTrap>
    </div>
  );
}
