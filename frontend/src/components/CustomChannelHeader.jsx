import React from "react";
import { useChannelStateContext } from "stream-chat-react";

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
  const currentUserId = channel.getClient().user.id;

  // Show all online members, including yourself
  const onlineMembers = Object.values(channel.state.members || {})
    .filter(
      (m) => m.user?.online || m.user?.id === currentUserId
    )
    .map((m) => m.user?.name || m.user?.id)
    .filter(Boolean);

  return (
    <div className="custom-channel-header">
      <div className="custom-channel-header-row">
        <span className="custom-channel-header-icon">💬</span>
        <span>
          You’re in the{" "}
          <span className="custom-channel-header-title">
            "{channelName}"
          </span>{" "}
          channel.
        </span>
        {matchDate && (
          <span className="custom-channel-header-date">
            Match Date: {new Date(matchDate).toLocaleDateString()}
          </span>
        )}
      </div>
      <div className="custom-channel-header-online">
        <span className="custom-channel-header-online-label">Online:</span>
        {onlineMembers.length === 0 && (
          <span className="custom-channel-header-none">No one online</span>
        )}
        {onlineMembers.map((name) => (
          <span
            key={name}
            className="custom-channel-header-avatar"
            title={name}
          >
            {getInitials(name)}
          </span>
        ))}
      </div>
    </div>
  );
}
