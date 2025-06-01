import React, { useState } from "react";
import { useMessageContext, Avatar } from "stream-chat-react";
import styles from "./CustomMessageUi.module.css";
import { format } from "date-fns";

export default function CustomMessageUi() {
  const { message, isMyMessage, handleReaction } = useMessageContext();
  const isMine = isMyMessage();
  const user = message.user || {};
  const isOnline = user.online;
  const timestamp = message.created_at
    ? format(new Date(message.created_at), "p")
    : "";

  // Stream default reaction types
  const reactions = ["like", "love", "haha", "wow", "sad", "angry"];
  const reactionEmojis = {
    like: "👍",
    love: "❤️",
    haha: "😂",
    wow: "😮",
    sad: "😢",
    angry: "😠",
  };

  // Group reactions by type
  const reactionGroups = {};
  (message.latest_reactions || []).forEach((reaction) => {
    if (!reactionGroups[reaction.type]) reactionGroups[reaction.type] = [];
    reactionGroups[reaction.type].push(reaction.user);
  });

  // Tooltip state for which emoji is hovered
  const [hovered, setHovered] = useState(null);

  return (
    <div className={`${styles.customMessageUi} ${isMine ? styles.myMessage : ""}`}>
      <div className={styles.avatarWrapper}>
        <Avatar
          image={user.image}
          name={user.name || user.id}
          size={40}
          shape="rounded"
        />
        <span
          className={`${styles.onlineDot} ${isOnline ? styles.online : styles.offline}`}
          title={isOnline ? "Online" : "Offline"}
        />
      </div>
      <div className={`${styles.customMessageBubble} ${isMine ? styles.myMessageBubble : ""}`}>
        <div className={styles.messageHeader}>
          <span className={styles.senderName}>{user.name || user.id}</span>
          <span className={styles.timestamp}>{timestamp}</span>
        </div>
        <div className={styles.messageText}>{message.text}</div>
        <div className={styles.reactionsBar}>
          {reactions.map((type) => {
            const users = reactionGroups[type] || [];
            return (
              <span
                key={type}
                role="img"
                aria-label={type}
                className={styles.reaction}
                onClick={() => handleReaction(type)}
                onMouseEnter={() => setHovered(type)}
                onMouseLeave={() => setHovered(null)}
                style={{ opacity: message.own_reactions?.some(r => r.type === type) ? 1 : 0.6 }}
              >
                {reactionEmojis[type]}
                {users.length > 0 && (
                  <span className={styles.reactionCount}> {users.length}</span>
                )}
                {/* Tooltip with user names */}
                {hovered === type && users.length > 0 && (
                  <span className={styles.reactionTooltip}>
                    {users.map(u => u.name || u.id).join(", ")}
                  </span>
                )}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
