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
  TypingIndicator,
} from "stream-chat-react";
import "stream-chat-react/dist/css/v2/index.css";
import PlayerSearch from "../modal/PlayerSearch";
import CustomChannelHeader from "../CustomChannelHeader";
import CustomMessageUi from "../CustomMessageUi";
import PoolSimulation from "../PoolSimulation";
import AdminAnnouncementInput from "../AdminAnnouncementInput"; // <-- ADD THIS LINE

import styles from "./MatchChat.module.css";

const apiKey = import.meta.env.VITE_STREAM_API_KEY;
const API_BASE = "https://atlasbackend-bnng.onrender.com";
const GENERAL_CHANNEL_ID = "general";

function cleanId(id) {
  return id.toLowerCase().replace(/[^a-z0-9_-]/g, "");
}

const ChannelNameOnlyPreview = ({ channel }) => (
  <div className={styles.channelNamePreview}>
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
    className={`${styles.pinIcon}${pinned ? " " + styles.pinned : ""}`}
    title={pinned ? "Unpin channel" : "Pin channel"}
  >
    {pinned ? "📌" : "📍"}
  </span>
);

const SectionHeader = ({ children }) => (
  <div className={styles.sectionHeader}>{children}</div>
);

export default function MatchChat({ userName, userEmail, userPin, channelId, onClose }) {
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [chatClient, setChatClient] = useState(null);
  const [generalChannel, setGeneralChannel] = useState(null);
  const [channel, setChannel] = useState(null);
  const [pinnedIds, setPinnedIds] = useState(getPinnedChannels());
  const [showPlayerSearch, setShowPlayerSearch] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(1800);
  const [channelSearch, setChannelSearch] = useState("");

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

  useEffect(() => {
    let client = StreamChat.getInstance(apiKey);
    let didConnect = false;
    let isMounted = true;

    async function init() {
      if (!client.userID) {
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
        didConnect = true;
      }
      if (!isMounted) return;

      setChatClient(client);
      const general = client.channel("messaging", GENERAL_CHANNEL_ID, {
        name: "General",
      });
      await general.watch({ limit: 30 });

      if (isMounted) {
        setGeneralChannel(general);
        setChannel(general);
      }
    }
    init();

    return () => {
      isMounted = false;
      if (client && didConnect) client.disconnectUser();
    };
  }, [userEmail, userName]);

  useEffect(() => {
    setPinnedChannels(pinnedIds);
  }, [pinnedIds]);

  function logoutAndRedirect() {
    if (chatClient) chatClient.disconnectUser();
    localStorage.clear();
    if (onClose) {
      onClose();
    } else {
      navigate("/");
      window.location.reload();
    }
  }

  if (!chatClient || !generalChannel)
    return (
      <div className={styles.loadingContainer} style={{height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}>
        <div className={styles.spinner}></div>
        <div>Loading chat...Please wait</div>
      </div>
    );

  const currentUserId = chatClient.user.id;
  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;

  const channelListFilters = {
    type: "messaging",
    members: { $in: [currentUserId] },
  };

  return (
    <div className={styles.outerChatBg} style={{height: '100%', width: '100%'}}>
      <div className={styles.chatContainer} style={{height: '100%', width: '100%', maxWidth: 'none', maxHeight: 'none'}}>
        <button
          className={styles.hamburgerButton}
          onClick={() => setSidebarOpen(true)}
          aria-label="Open channel list"
        >
          <span className={styles.hamburgerIcon}>☰</span>
        </button>

        {sidebarOpen && (
          <div
            className={styles.sidebarBackdrop}
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <Chat client={chatClient} theme="str-chat__theme-dark">
          <div className={styles.topNavBar}>
            <span className={styles.chatGreeting}>Hello, {userName}!</span>
            <div className={styles.buttonRow}>
              <button
                className={styles.topChatButton}
                onClick={() => {
                  if (onClose) {
                    onClose();
                  } else {
                    navigate("/");
                    window.location.reload();
                  }
                }}
              >
                Dashboard
              </button>
              <button
                className={styles.topChatButton}
                onClick={() => setShowPlayerSearch(true)}
              >
                Schedule a Match
              </button>
              <div className={styles.logoutWithTimer}>
                <button
                  className={styles.topChatButton}
                  onClick={logoutAndRedirect}
                >
                  Logout
                </button>
                <span className={styles.timerBox}>
                  Auto Logout: {minutes}:{seconds.toString().padStart(2, "0")}
                </span>
              </div>
            </div>
          </div>

          <div className={styles.mainChatArea}>
            <div className={`${styles.sidebar} ${sidebarOpen ? styles.open : ""}`}>
              <button
                className={styles.closeSidebarButton}
                onClick={() => setSidebarOpen(false)}
                aria-label="Close channel list"
              >
                ×
              </button>

              <div
                className={`${styles.generalChannelRow}${
                  channel?.id === GENERAL_CHANNEL_ID ? " " + styles.active : ""
                }`}
                onClick={() => {
                  setChannel(generalChannel);
                  setSidebarOpen(false);
                }}
              >
                <span style={{ marginRight: 8 }}>#</span> General
              </div>
              <div className={styles.sidebarSearch}>
                <input
                  type="text"
                  placeholder="Search channels..."
                  value={channelSearch}
                  onChange={(e) => setChannelSearch(e.target.value)}
                />
              </div>
              <div className={styles.channelListWrapper}>
                <ChannelList
                  filters={channelListFilters}
                  sort={{ last_message_at: -1 }}
                  options={{ state: true, watch: true, presence: true }}
                  renderChannels={(channels) => {
                    channels = Array.isArray(channels) ? channels : [];
                    const nonGeneral = channels.filter(
                      (ch) => ch && ch.id !== GENERAL_CHANNEL_ID
                    );
                    const pinned = nonGeneral.filter((ch) =>
                      pinnedIds.includes(ch.id)
                    );
                    const others = nonGeneral.filter(
                      (ch) => !pinnedIds.includes(ch.id)
                    );

                    const othersSorted = [...others].sort((a, b) => {
                      const aTime = a.last_message_at
                        ? new Date(a.last_message_at).getTime()
                        : 0;
                      const bTime = b.last_message_at
                        ? new Date(b.last_message_at).getTime()
                        : 0;
                      return bTime - aTime;
                    });

                    const renderChannelWithPin = (ch) => {
                      if (!ch || !ch.cid) return null;
                      return (
                        <div
                          key={ch.cid}
                          className={styles.channelListRow}
                          onClick={() => {
                            setChannel(ch);
                            setSidebarOpen(false);
                          }}
                        >
                          <div className={styles.channelListName}>
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
                        {pinned.length > 0 ? (
                          pinned.map(renderChannelWithPin)
                        ) : (
                          <div className={styles.noPinnedChannels}>
                            No pinned channels.
                          </div>
                        )}
                        <SectionHeader>Your Match Channels</SectionHeader>
                        {othersSorted.length > 0 ? (
                          othersSorted.map(renderChannelWithPin)
                        ) : (
                          <div className={styles.noChannelsFound}>
                            No channels found.
                          </div>
                        )}
                      </>
                    );
                  }}
                />
              </div>
            </div>

            <div className={styles.mainChatWindow}>
              <Channel channel={channel} Message={CustomMessageUi}>
                <Window>
                  {/* --- Pool simulation as background --- */}
                  <div className={styles.messageListBackground} aria-hidden="true">
                    <PoolSimulation />
                  </div>
                  <CustomChannelHeader />
                  {/* --- ADMIN ANNOUNCEMENT INPUT HERE --- */}
                  <AdminAnnouncementInput />
                  <MessageList />
                  <TypingIndicator />
                  <MessageInput
                    additionalTextareaProps={{
                      placeholder:
                        "Type a message... :smile: (Markdown & emoji supported!)",
                    }}
                  />
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
              // Your propose match logic here
            }}
            onClose={() => setShowPlayerSearch(false)}
            excludeName={userName}
            senderName={userName}
            senderEmail={userEmail}
            onProposalComplete={() => {
              setShowPlayerSearch(false);
              if (onClose) {
                onClose();
              } else {
                navigate("/");
              }
            }}
          />
        )}
      </div>
    </div>
  );
}
