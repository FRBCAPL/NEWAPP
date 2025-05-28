import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { StreamChat } from "stream-chat";
import {
  Chat,
  Channel,
  MessageList,
  MessageInput,
  Window,
  Thread,
  ChannelList,
  useMessageContext,
} from "stream-chat-react";
import "stream-chat-react/dist/css/v2/index.css";
import PlayerSearch from "./components/PlayerSearch";
import CustomChannelHeader from "./components/CustomChannelHeader";

const apiKey = import.meta.env.VITE_STREAM_API_KEY;
const API_BASE = import.meta.env.VITE_API_BASE_URL || "https://newapp-xyen.onrender.com";
const GENERAL_CHANNEL_ID = "general";

function cleanId(id) {
  return id.toLowerCase().replace(/[^a-z0-9_-]/g, "");
}

const ChannelNameOnlyPreview = ({ channel }) => (
  <div className="channel-name-preview">
    {channel.data?.name || channel.id}
  </div>
);

function getPinnedChannels() {
  return JSON.parse(localStorage.getItem("pinnedChannels") || "[]");
}
function setPinnedChannels(ids) {
  localStorage.setItem("pinnedChannels", JSON.stringify(ids));
}

const PinIcon = ({ pinned, onClick }) => (
  <span
    onClick={onClick}
    className={`pin-icon${pinned ? " pinned" : ""}`}
    title={pinned ? "Unpin channel" : "Pin channel"}
  >
    {pinned ? "📌" : "📍"}
  </span>
);

const SectionHeader = ({ children }) => (
  <div className="section-header">
    {children}
  </div>
);

// --- Custom Message UI with Online Indicator ---
const CustomMessageUi = () => {
  const { message } = useMessageContext();
  const isOnline = message.user?.online;

  return (
    <div className="custom-message-ui">
      <span
        className={`online-dot${isOnline ? " online" : ""}`}
        title={isOnline ? "Online" : "Offline"}
      ></span>
      <div className="message-content">
        <div className="message-username">
          {message.user?.name || message.user?.id}
        </div>
        <div className="message-text">{message.text}</div>
      </div>
    </div>
  );
};

export default function MatchChat({ userName, userEmail, userPin, channelId }) {
  const navigate = useNavigate();

  // --- State declarations ---
  const [chatClient, setChatClient] = useState(null);
  const [generalChannel, setGeneralChannel] = useState(null);
  const [channel, setChannel] = useState(null);
  const [pinnedIds, setPinnedIds] = useState(getPinnedChannels());
  const [showPlayerSearch, setShowPlayerSearch] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(1800); // 30 min
  const [channelSearch, setChannelSearch] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false); // 🟢 Sidebar toggle state

  // --- Timer for auto-logout ---
  useEffect(() => {
    if (secondsLeft <= 0) {
      logoutAndRedirect();
      return;
    }
    const interval = setInterval(() => {
      setSecondsLeft((s) => s - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [secondsLeft]);

  // --- Setup Stream Chat client and channels ---
  useEffect(() => {
    let client;
    async function init() {
      client = StreamChat.getInstance(apiKey);

      // 🟢 Fetch a real token from your backend
      const userId = cleanId(userEmail);
      const response = await fetch(`${API_BASE}/token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const { token } = await response.json();

      await client.connectUser(
        {
          id: userId,
          name: userName,
          email: userEmail,
        },
        token
      );
      setChatClient(client);
      const general = client.channel("messaging", GENERAL_CHANNEL_ID, {
        name: "General",
      });
      await general.watch();
      setGeneralChannel(general);
      setChannel(general);
    }
    init();
    return () => {
      if (client) client.disconnectUser();
    };
  }, [userEmail, userName]);

  // --- Persist pinned channels ---
  useEffect(() => {
    setPinnedChannels(pinnedIds);
  }, [pinnedIds]);

  // --- Logout handler ---
  function logoutAndRedirect() {
    if (chatClient) chatClient.disconnectUser();
    localStorage.clear();
    navigate("/");
    window.location.reload();
  }

  // --- Handle proposing a match ---
  async function handleProposeMatch(email, name) {
    // Your logic to propose a match and create a new channel
    // ...
  }

  if (!chatClient || !generalChannel) return <div>Loading chat...</div>;

  const currentUserId = chatClient.user.id;
  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;

  const channelListFilters = {
    type: "messaging",
    members: { $in: [currentUserId] },
  };

  return (
    <div className="outer-chat-bg">
      <div className="chat-container">
        <Chat client={chatClient} theme="str-chat__theme-dark">
          <div className="top-nav-bar">
            {/* 🟢 Hamburger menu for mobile */}
            <button
              className="hamburger-btn"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open sidebar"
            >
              &#9776;
            </button>
            <button
              className="dashboard-btn"
              onClick={() => {
                navigate("/");
                window.location.reload();
              }}
            >
              Dashboard
            </button>
            <button
              className="dashboard-btn"
              onClick={() => setShowPlayerSearch(true)}
            >
              Schedule a Match
            </button>
            <div className="nav-spacer" />
            <span className="chat-greeting">
              Hello, {userName}!
            </span>
            <button
              className="dashboard-btn"
              onClick={logoutAndRedirect}
            >
              Logout
            </button>
            <span className="timer-box">
              Auto Logout: {minutes}:{seconds.toString().padStart(2, "0")}
            </span>
          </div>

          {/* 🟢 Sidebar overlay for mobile */}
          {sidebarOpen && (
            <div
              className="sidebar-overlay active"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          <div className="main-chat-area">
            {/* 🟢 Sidebar with toggle/close */}
            <div className={`sidebar${sidebarOpen ? " active" : ""}`}>
              <button
                className="sidebar-close-btn"
                onClick={() => setSidebarOpen(false)}
                aria-label="Close sidebar"
              >
                &times;
              </button>
              <div
                className={`general-channel-row${channel?.id === GENERAL_CHANNEL_ID ? " active" : ""}`}
                onClick={() => setChannel(generalChannel)}
              >
                <span style={{ marginRight: 8 }}>#</span> General
              </div>
              <div className="sidebar-search">
                <input
                  type="text"
                  placeholder="Search channels..."
                  value={channelSearch}
                  onChange={(e) => setChannelSearch(e.target.value)}
                />
              </div>
              <div className="channel-list-wrapper">
                <ChannelList
                  filters={channelListFilters}
                  sort={{ last_message_at: -1 }}
                  options={{ state: true, watch: true, presence: true }}
                  renderChannels={(channels) => {
                    channels = Array.isArray(channels) ? channels : [];
                    const nonGeneral = channels.filter(
                      (ch) => ch && ch.id !== GENERAL_CHANNEL_ID
                    );
                    const pinned = nonGeneral.filter((ch) => pinnedIds.includes(ch.id));
                    const others = nonGeneral.filter((ch) => !pinnedIds.includes(ch.id));

                    const othersSorted = [...others].sort((a, b) => {
                      const aTime = a.last_message_at ? new Date(a.last_message_at).getTime() : 0;
                      const bTime = b.last_message_at ? new Date(b.last_message_at).getTime() : 0;
                      return bTime - aTime;
                    });

                    const renderChannelWithPin = (ch) => {
                      if (!ch || !ch.cid) return null;
                      return (
                        <div
                          key={ch.cid}
                          className="channel-list-row"
                          onClick={() => {
                            setChannel(ch);
                            setSidebarOpen(false); // 🟢 Close sidebar on channel select (mobile)
                          }}
                        >
                          <div className="channel-list-name">
                            <ChannelNameOnlyPreview channel={ch} />
                          </div>
                          <PinIcon
                            pinned={pinnedIds.includes(ch.id)}
                            onClick={(e) => {
                              e.stopPropagation();
                              let newIds;
                              if (pinnedIds.includes(ch.id)) {
                                newIds = pinnedIds.filter((id) => id !== ch.id);
                              } else {
                                newIds = [...pinnedIds, ch.id];
                              }
                              setPinnedIds(newIds);
                            }}
                          />
                        </div>
                      );
                    };

                    return (
                      <>
                        <SectionHeader>Pinned</SectionHeader>
                        {pinned.length > 0 ? pinned.map(renderChannelWithPin) : (
                          <div className="no-pinned-channels">No pinned channels.</div>
                        )}
                        <SectionHeader>Your Match Channels</SectionHeader>
                        {othersSorted.length > 0 ? othersSorted.map(renderChannelWithPin) : (
                          <div className="no-channels-found">No channels found.</div>
                        )}
                      </>
                    );
                  }}
                />
              </div>
            </div>
            <div className="main-chat-window">
              <Channel channel={channel} Message={CustomMessageUi}>
                <Window>
                  <CustomChannelHeader />
                  <MessageList />
                  <MessageInput />
                </Window>
                <Thread />
              </Channel>
            </div>
          </div>
        </Chat>
        {showPlayerSearch && (
          <PlayerSearch
            onSelect={async (player) => {
              setShowPlayerSearch(false);
              await handleProposeMatch(player.email, `${player.firstName} ${player.lastName}`);
            }}
            onClose={() => setShowPlayerSearch(false)}
            excludeName={userName}
            senderName={userName}
            senderEmail={userEmail}
            onProposalComplete={() => {
              setShowPlayerSearch(false);
              navigate("/");
            }}
          />
        )}
      </div>
    </div>
  );
}
