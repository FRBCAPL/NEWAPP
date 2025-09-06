import React, { useState, useEffect, useRef } from 'react';

export default function DraggableModal({ 
  open, 
  onClose, 
  children, 
  title = "Modal",
  maxWidth = "500px",
  className = ""
}) {
  // Draggable state
  const [drag, setDrag] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });

  // Reset position when modal opens
  useEffect(() => {
    if (open) {
      setDrag({ x: 0, y: 0 });
    }
  }, [open]);

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
  }, [dragging]);

  if (!open) return null;

  return (
    <div 
      className="modal-overlay" 
      onClick={onClose}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0,0,0,0.7)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        backdropFilter: "blur(3px)",
        WebkitBackdropFilter: "blur(3px)"
      }}
    >
      <div
        className={`draggable-modal ${className}`}
        style={{
          transform: `translate(${drag.x}px, ${drag.y}px)`,
          cursor: dragging ? "grabbing" : "default",
          background: "linear-gradient(120deg, #232323 80%, #2a0909 100%)",
          color: "#fff",
          border: "2px solid #e53e3e",
          borderRadius: window.innerWidth <= 400 ? "0" : "1.2rem",
          boxShadow: "0 0 32px #e53e3e, 0 0 40px rgba(0,0,0,0.85)",
          width: window.innerWidth <= 400 ? "100vw" : maxWidth,
          maxWidth: window.innerWidth <= 400 ? "100vw" : maxWidth,
          minWidth: 0,
          margin: "0 auto",
          animation: "modalBounceIn 0.5s cubic-bezier(.21,1.02,.73,1.01)",
          padding: 0,
          position: "relative",
          fontFamily: "inherit",
          boxSizing: "border-box",
          height: window.innerWidth <= 500 ? "75vh" : "auto",
          maxHeight: window.innerWidth <= 500 ? "75vh" : "65vh",
          display: "flex",
          flexDirection: "column"
        }}
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
      >
        {/* Draggable header */}
        <div
          className="modal-header"
          onMouseDown={onMouseDown}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "#e53e3e",
            padding: "0.05rem .05rem 0.05rem .05rem",
            borderTopLeftRadius: "1.2rem",
            borderTopRightRadius: "1.2rem",
            position: "relative",
            cursor: "grab",
            userSelect: "none",
            gap: "1rem"
          }}
        >
          <span 
            className="modal-accent-bar"
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: "100%",
              height: "5px",
              background: "linear-gradient(90deg, #fff0 0%, #e53e3e 60%, #fff0 100%)",
              borderTopLeftRadius: "1.2rem",
              borderTopRightRadius: "1.2rem",
              pointerEvents: "none"
            }}
          ></span>
          <h2 
            className="modal-title"
            style={{
              margin: 0,
              fontSize: window.innerWidth <= 500 ? "1rem" : "1.1rem",
              fontWeight: "bold",
              textAlign: "center",
              letterSpacing: "0.02em",
              color: "#fff",
              textShadow: "0 1px 12px #000a",
              zIndex: 2,
              flex: 1,
              wordBreak: "break-word",
              minWidth: 0
            }}
          >
            {title}
          </h2>
          {/* Close button moved here for flex layout */}
          <button 
            className="modal-close-btn"
            onClick={onClose} 
            aria-label="Close"
            style={{
              background: "none",
              border: "none",
              color: "#fff",
              fontSize: "2em",
              fontWeight: "bold",
              cursor: "pointer",
              zIndex: 10,
              lineHeight: 1,
              transition: "color 0.2s, transform 0.2s",
              padding: 0,
              marginLeft: "1rem"
            }}
            onMouseEnter={(e) => {
              e.target.style.color = "#ffd6d6";
              e.target.style.transform = "scale(1.2) rotate(10deg)";
            }}
            onMouseLeave={(e) => {
              e.target.style.color = "#fff";
              e.target.style.transform = "scale(1) rotate(0deg)";
            }}
          >
            &times;
          </button>
        </div>

        {/* Modal content */}
        <div 
          className="modal-content"
          style={{
            ...(window.innerWidth <= 500
              ? { flex: "1 1 auto", minHeight: 0, overflowY: "auto" }
              : { overflowY: "auto" }),
            padding: window.innerWidth <= 500 ? "1rem 1rem 0.8rem 1rem" : "1.4rem 1.5rem 1.2rem 1.5rem",
            background: "none"
          }}
        >
          {children}
        </div>
      </div>

      <style jsx>{`
        @keyframes modalBounceIn {
          0% { opacity: 0; transform: scale(0.95) translateY(-40px);}
          70% { opacity: 1; transform: scale(1.02) translateY(8px);}
          100% { opacity: 1; transform: scale(1) translateY(0);}
        }
        
        @media (max-width: 500px) {
          .draggable-modal {
            max-width: 99vw !important;
            border-radius: 0.7rem !important;
          }
          .modal-header {
            padding: 0.7rem 0.7rem 0.5rem 0.7rem !important;
          }
          .modal-content {
            padding: 1rem 0.6rem 0.8rem 0.6rem !important;
          }
        }
        /* Custom scrollbar for modal-content */
        .modal-content::-webkit-scrollbar {
          width: 10px;
        }
        .modal-content::-webkit-scrollbar-thumb {
          background: #e53e3e;
          border-radius: 6px;
        }
        .modal-content::-webkit-scrollbar-track {
          background: #232323;
          border-radius: 6px;
        }
        .modal-content {
          scrollbar-width: thin;
          scrollbar-color: #e53e3e #232323;
        }
      `}</style>
    </div>
  );
}
