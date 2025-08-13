import React, { useState, useEffect, useRef } from 'react';
import styles from './ContextualTip.module.css';

const ContextualTip = ({ tip, isVisible, onClose }) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const tipRef = useRef(null);

  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true);
      // Auto-hide after 8 seconds
      const timer = setTimeout(() => {
        onClose();
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  const handleMouseDown = (e) => {
    if (e.target.closest('button')) return; // Don't drag if clicking close button
    
    setIsDragging(true);
    const rect = tipRef.current.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    
    const newX = e.clientX - dragOffset.x;
    const newY = e.clientY - dragOffset.y;
    
    // Keep within viewport bounds
    const maxX = window.innerWidth - 250; // tip width
    const maxY = window.innerHeight - 100; // approximate tip height
    
    setPosition({
      x: Math.max(0, Math.min(newX, maxX)),
      y: Math.max(0, Math.min(newY, maxY))
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragOffset]);

  if (!isVisible) return null;

  return (
    <div 
      ref={tipRef}
      className={`${styles.tipContainer} ${isAnimating ? styles.show : ''} ${isDragging ? styles.dragging : ''}`}
      style={{
        maxWidth: '250px',
        width: '250px',
        minWidth: '250px',
        top: position.y || 20,
        left: position.x || '50%',
        transform: position.x ? 'none' : 'translateX(-50%)',
        right: 'auto',
        cursor: isDragging ? 'grabbing' : 'grab'
      }}
      onMouseDown={handleMouseDown}
    >
      <div className={styles.tipContent}>
        <div className={styles.tipHeader}>
          <span className={styles.tipIcon}>💡</span>
          <span className={styles.tipTitle}>Pro Tip</span>
          <button className={styles.closeButton} onClick={onClose}>
            ×
          </button>
        </div>
        <div className={styles.tipText}>
          {tip}
        </div>
      </div>
    </div>
  );
};

export default ContextualTip; 