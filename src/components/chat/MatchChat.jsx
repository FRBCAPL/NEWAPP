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
import CustomChannelHeader from "../CustomChannelHeader";
import CustomMessageUi from "../CustomMessageUi";
import PoolSimulation from "../PoolSimulation";
import AdminAnnouncementInput from "../AdminAnnouncementInput";
import DivisionSelectorModal from '../modal/DivisionSelectorModal';

import styles from "./MatchChat.module.css";
import { BACKEND_URL } from '../../config.js';

const apiKey = import.meta.env.VITE_STREAM_API_KEY;
const API_BASE = BACKEND_URL;
const GENERAL_CHANNEL_ID = "general";
const ANNOUNCEMENTS_CHANNEL_ID = "announcements";

// Available divisions - this can be expanded as you add more divisions
const AVAILABLE_DIVISIONS = [
  "FRBCAPL TEST",
  "Singles Test"
];

// Channel categories for better organization
const CHANNEL_CATEGORIES = {
  GENERAL: "general",
  DIVISIONS: "divisions", 
  ANNOUNCEMENTS: "announcements",
  GAME_ROOMS: "game-rooms"
};

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

const SectionHeader = ({ children, icon }) => (
  <div className={styles.sectionHeader}>
    {icon && <span style={{ marginRight: '8px' }}>{icon}</span>}
    {children}
  </div>
);

export default function MatchChat({ userName, userEmail, userPin, channelId, onClose }) {
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [chatClient, setChatClient] = useState(null);
  const [generalChannel, setGeneralChannel] = useState(null);
  const [announcementsChannel, setAnnouncementsChannel] = useState(null);
  const [divisionChannels, setDivisionChannels] = useState({});
  const [gameRoomChannels, setGameRoomChannels] = useState([]);
  const [channel, setChannel] = useState(null);
  const [pinnedIds, setPinnedIds] = useState(getPinnedChannels());
  const [showPlayerSearch, setShowPlayerSearch] = useState(false);
  const [showDivisionSelector, setShowDivisionSelector] = useState(false);
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

  // Initialize chat client and create channels
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

      // Create or get general channel
      const general = client.channel("messaging", GENERAL_CHANNEL_ID, {
        name: "General Chat",
        description: "General discussion for all players"
      });
      await general.watch({ limit: 30 });

      // Create or get announcements channel
      const announcements = client.channel("messaging", ANNOUNCEMENTS_CHANNEL_ID, {
        name: "📢 Announcements",
        description: "Important announcements and updates"
      });
      await announcements.watch({ limit: 30 });

      // Create division-specific channels
      const divisionChannelsObj = {};
      for (const division of AVAILABLE_DIVISIONS) {
        const divisionId = cleanId(division);
        const divisionChannel = client.channel("messaging", `division-${divisionId}`, {
          name: `🏆 ${division}`,
          description: `Discussion for ${division} players`,
          category: CHANNEL_CATEGORIES.DIVISIONS
        });
        await divisionChannel.watch({ limit: 30 });
        divisionChannelsObj[division] = divisionChannel;
      }

      // Create game room channels for future multiplayer
      const gameRooms = [];
      for (let i = 1; i <= 5; i++) {
        const gameRoomId = `game-room-${i}`;
        const gameRoom = client.channel("messaging", gameRoomId, {
          name: `🎮 Game Room ${i}`,
          description: `Multiplayer game room ${i} - for future online play`,
          category: CHANNEL_CATEGORIES.GAME_ROOMS
        });
        await gameRoom.watch({ limit: 30 });
        gameRooms.push(gameRoom);
      }

      if (isMounted) {
        setGeneralChannel(general);
        setAnnouncementsChannel(announcements);
        setDivisionChannels(divisionChannelsObj);
        setGameRoomChannels(gameRooms);
        setChannel(general); // Start with general channel
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

  // Handle Schedule Match button - show division selector
  function handleScheduleMatch() {
    console.log('Schedule Match button clicked');
    setShowDivisionSelector(true);
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

  // Helper function to render channel with pin
  const renderChannelWithPin = (ch, category = null) => {
    if (!ch || !ch.cid) return null;
    return (
      <div
        key={ch.cid}
        className={`${styles.channelListRow} ${category ? styles[category] : ''}`}
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
                onClick={handleScheduleMatch}
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

              {/* General Channel */}
              <div
                className={`${styles.generalChannelRow}${
                  channel?.id === GENERAL_CHANNEL_ID ? " " + styles.active : ""
                }`}
                onClick={() => {
                  setChannel(generalChannel);
                  setSidebarOpen(false);
                }}
              >
                <span style={{ marginRight: 8 }}>#</span> General Chat
              </div>

              {/* Search */}
              <div className={styles.sidebarSearch}>
                <input
                  type="text"
                  placeholder="Search channels..."
                  value={channelSearch}
                  onChange={(e) => setChannelSearch(e.target.value)}
                />
              </div>

              <div className={styles.channelListWrapper}>
                {/* Announcements Section */}
                <SectionHeader icon="📢">Announcements</SectionHeader>
                {announcementsChannel && renderChannelWithPin(announcementsChannel, 'announcements')}

                {/* Division Channels Section */}
                <SectionHeader icon="🏆">Division Channels</SectionHeader>
                {Object.values(divisionChannels).map(ch => renderChannelWithPin(ch, 'divisions'))}

                {/* Game Rooms Section */}
                <SectionHeader icon="🎮">Game Rooms</SectionHeader>
                {gameRoomChannels.map(ch => renderChannelWithPin(ch, 'game-rooms'))}

                {/* Other Channels (from Stream Chat) */}
                <ChannelList
                  filters={channelListFilters}
                  sort={{ last_message_at: -1 }}
                  options={{ state: true, watch: true, presence: true }}
                  renderChannels={(channels) => {
                    channels = Array.isArray(channels) ? channels : [];
                    
                    // Filter out channels we've already handled
                    const handledChannelIds = [
                      GENERAL_CHANNEL_ID,
                      ANNOUNCEMENTS_CHANNEL_ID,
                      ...Object.keys(divisionChannels).map(div => `division-${cleanId(div)}`),
                      ...gameRoomChannels.map(ch => ch.id)
                    ];
                    
                    const otherChannels = channels.filter(
                      (ch) => ch && !handledChannelIds.includes(ch.id)
                    );

                    const pinned = otherChannels.filter((ch) =>
                      pinnedIds.includes(ch.id)
                    );
                    const others = otherChannels.filter(
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

                    return (
                      <>
                        {/* Pinned Channels */}
                        {pinned.length > 0 && (
                          <>
                            <SectionHeader icon="📌">Pinned Channels</SectionHeader>
                            {pinned.map(renderChannelWithPin)}
                          </>
                        )}

                        {/* Other Channels */}
                        {othersSorted.length > 0 && (
                          <>
                            <SectionHeader icon="💬">Other Channels</SectionHeader>
                            {othersSorted.map(renderChannelWithPin)}
                          </>
                        )}
                      </>
                    );
                  }}
                />
              </div>
            </div>

            <div className={styles.chatWindow}>
              {channel && (
                <Channel channel={channel}>
                  <Window>
                    <CustomChannelHeader />
                    <MessageList />
                    <MessageInput />
                    <TypingIndicator />
                  </Window>
                  <Thread />
                </Channel>
              )}
            </div>
          </div>
        </Chat>

        {showDivisionSelector && (
          <DivisionSelectorModal
            userName={userName}
            userEmail={userEmail}
            userPin={userPin}
            onClose={() => setShowDivisionSelector(false)}
          />
        )}




      </div>
    </div>
  );
}
