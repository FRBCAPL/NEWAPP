import React from "react";
import { useMessageContext } from "stream-chat-react";

// Utility to get user initials
function getInitials(name) {
  if (!name) return "";
  return name
    .split(" ")
    .map((part) => part[0]?.toUpperCase())
    .join("")
    .slice(0, 2);
}

export default function CustomMessageUi() {
  const { message, isMyMessage } = useMessageContext();
  const name = message.user?.name || message.user?.id;

  return (
    <div
      className={`custom-message-ui${isMyMessage() ? " my-message" : ""}`}
      data-message-id={message.id}
    >
      <span
        className="custom-message-avatar"
        title={name}
      >
        {getInitials(name)}
      </span>
      <div
        className={`custom-message-bubble${isMyMessage() ? " my-message" : ""}`}
      >
        <div className="custom-message-username">{name}</div>
        <div>{message.text}</div>
      </div>
    </div>
  );
}
