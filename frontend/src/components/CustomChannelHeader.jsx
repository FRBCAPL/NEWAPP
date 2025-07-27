import React from "react";
import { useChannelStateContext } from "stream-chat-react";
import styles from "./CustomChannelHeader.module.css";

// Utility function to format date as MM-DD-YYYY
function formatDateMMDDYYYY(dateStr) {
  if (!dateStr) return 'N/A';
  
  // Handle YYYY-MM-DD format (which might be UTC)
  if (dateStr.includes('-') && dateStr.length === 10) {
    const [year, month, day] = dateStr.split('-');
    // Create date in local timezone to avoid UTC shift
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    const localMonth = String(date.getMonth() + 1).padStart(2, '0');
    const localDay = String(date.getDate()).padStart(2, '0');
    const localYear = date.getFullYear();
    return `${localMonth}-${localDay}-${localYear}`;
  }
  
  // Handle different date formats
  let date;
  if (dateStr.includes('-')) {
    // Already in YYYY-MM-DD format
    date = new Date(dateStr);
  } else if (dateStr.includes('/')) {
    // Handle M/D/YYYY or MM/DD/YYYY format
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      const [month, day, year] = parts;
      date = new Date(year, month - 1, day);
    } else {
      return dateStr; // Return as-is if can't parse
    }
  } else {
    return dateStr; // Return as-is if unknown format
  }
  
  if (isNaN(date.getTime())) {
    return dateStr; // Return original if invalid date
  }
  
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const year = date.getFullYear();
  
  return `${month}-${day}-${year}`;
}

// Helper to get two initials from a name or ID
function getInitials(nameOrId) {
  if (!nameOrId) return "";
  const parts = nameOrId.trim().split(" ");
  if (parts.length === 1) {
    const alt = parts[0].split(/[^a-zA-Z0-9]/).filter(Boolean);
    if (alt.length > 1) {
      return (alt[0][0] + alt[1][0]).toUpperCase();
    }
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function CustomChannelHeader() {
  const { channel } = useChannelStateContext();
  const channelName = channel?.data?.name || channel?.id;
  const matchDate = channel?.data?.matchDate;
  const currentUser = channel.getClient().user;
  const currentUserId = currentUser.id;

  // Show all online members, including yourself
  const onlineMembers = Object.values(channel.state.members || {})
    .filter(
      (m) => m.user?.online || m.user?.id === currentUserId
    )
    .map((m) => m.user?.name || m.user?.id)
    .filter(Boolean);

  return (
    <div className={styles.customChannelHeader}>
      <div className={styles.customChannelHeaderRow}>
        <div className={styles.customChannelHeaderLeft}>
          <span className={styles.customChannelHeaderIcon}>💬</span>
          <span>
            You're in the{" "}
            <span className={styles.customChannelHeaderTitle}>
              "{channelName}"
            </span>{" "}
            channel.
          </span>
          {matchDate && (
            <span className={styles.customChannelHeaderDate}>
              Match Date: {formatDateMMDDYYYY(matchDate)}
            </span>
          )}
        </div>
      </div>
      <div className={styles.customChannelHeaderOnline}>
        <span className={styles.customChannelHeaderOnlineLabel}>Online:</span>
        {onlineMembers.length === 0 && (
          <span className={styles.customChannelHeaderNone}>No one online</span>
        )}
        {onlineMembers.map((name) => (
          <span
            key={name}
            className={styles.customChannelHeaderAvatar}
            title={name}
          >
            {getInitials(name)}
          </span>
        ))}
      </div>
    </div>
  );
}
