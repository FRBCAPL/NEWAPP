import React, { useState, useEffect } from 'react';
import styles from './ContextualTip.module.css';

const ContextualTip = ({ tip, isVisible, onClose }) => {
  const [isAnimating, setIsAnimating] = useState(false);

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

  if (!isVisible) return null;

  return (
    <div className={`${styles.tipContainer} ${isAnimating ? styles.show : ''}`}>
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