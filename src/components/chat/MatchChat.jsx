import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { StreamChat } from "stream-chat";
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

// Global flag to prevent multiple connections
let globalConnectionInProgress = false;

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
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);

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
    // Use global flag to prevent multiple simultaneous initializations
    if (globalConnectionInProgress) {
      console.log('Global connection already in progress, skipping...');
      return;
    }
    
    globalConnectionInProgress = true;
    let client = StreamChat.getInstance(apiKey);
    let didConnect = false;
    let isMounted = true;

    async function init() {
      console.log('Starting chat initialization...');

      try {
        // Check if already connected
        if (client.userID) {
          console.log('Already connected as:', client.userID);
          try {
            await client.disconnectUser();
            console.log('Disconnected existing user');
          } catch (disconnectError) {
            console.log('Disconnect error (ignored):', disconnectError.message);
          }
        }

        // Add a small delay to ensure disconnect completes
        await new Promise(resolve => setTimeout(resolve, 300));
        console.log('Delay completed, proceeding with token request...');
        
        const userId = cleanId(userEmail);
        console.log('Cleaned userId:', userId);
        console.log('Making token request to:', `${API_BASE}/token`);
        const response = await fetch(`${API_BASE}/token`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId }),
        });
        console.log('Token response status:', response.status);
        const { token, userId: actualUserId } = await response.json();
        console.log('Token received for userId:', actualUserId);

        console.log('Connecting user to Stream Chat...');
        console.log('Using actualUserId for connection:', actualUserId);
        await client.connectUser(
          {
            id: actualUserId,
            name: userName,
            email: userEmail,
          },
          token
        );
        console.log('User connected successfully!');
        didConnect = true;
        if (!isMounted) return;

        console.log('Setting chat client...');
        setChatClient(client);

        // Create or get general channel
        console.log('Creating general channel...');
        const general = client.channel("messaging", GENERAL_CHANNEL_ID, {
          name: "General Chat",
          description: "General discussion for all players"
        });
        console.log('General channel object created, now watching...');
        await general.watch({ limit: 30 });
        console.log('General channel created and watched');

        // Create or get announcements channel
        console.log('Creating announcements channel...');
        const announcements = client.channel("messaging", ANNOUNCEMENTS_CHANNEL_ID, {
          name: "📢 Announcements",
          description: "Important announcements and updates"
        });
        try {
          await announcements.watch({ limit: 30 });
          console.log('Announcements channel created and watched');
        } catch (error) {
          console.log('Could not load announcements channel:', error.message);
        }

        // Create division-specific channels
        console.log('Creating division channels...');
        const divisionChannelsObj = {};
        for (const division of AVAILABLE_DIVISIONS) {
          const divisionId = cleanId(division);
          const divisionChannel = client.channel("messaging", `division-${divisionId}`, {
            name: `🏆 ${division}`,
            description: `Discussion for ${division} players`,
            category: CHANNEL_CATEGORIES.DIVISIONS
          });
          try {
            await divisionChannel.watch({ limit: 30 });
            divisionChannelsObj[division] = divisionChannel;
            console.log(`Division channel created: ${division}`);
          } catch (error) {
            console.log(`Could not load division channel ${division}:`, error.message);
          }
        }

        // Create game room channels
        console.log('Creating game room channels...');
        const gameRooms = [];
        for (let i = 1; i <= 5; i++) {
          const gameRoomId = `game-room-${i}`;
          const gameRoom = client.channel("messaging", gameRoomId, {
            name: `🎮 Game Room ${i}`,
            description: `Multiplayer game room ${i} - for future online play`,
            category: CHANNEL_CATEGORIES.GAME_ROOMS
          });
          try {
            await gameRoom.watch({ limit: 30 });
            gameRooms.push(gameRoom);
            console.log(`Game room ${i} created`);
          } catch (error) {
            console.log(`Could not load game room ${i}:`, error.message);
          }
        }

        console.log('Setting up channel states...');
        if (isMounted) {
          setGeneralChannel(general);
          setAnnouncementsChannel(announcements);
          setDivisionChannels(divisionChannelsObj);
          setGameRoomChannels(gameRooms);
          setChannel(general); // Start with general channel
          console.log('Setting loading to false...');
          setLoading(false);
          console.log('Chat initialization complete!');
        }
      } catch (error) {
        console.error('Error initializing chat:', error);
        console.error('Error details:', {
          message: error.message,
          stack: error.stack,
          name: error.name
        });
        if (isMounted) {
          setLoading(false);
        }
      } finally {
        // Reset global flag when done
        globalConnectionInProgress = false;
      }

    }

    init();

    return () => {
      isMounted = false;
      if (client && didConnect) {
        try {
          client.disconnectUser();
        } catch (error) {
          console.log('Error during cleanup disconnect:', error.message);
        }
      }
      // Reset global flag on cleanup
      globalConnectionInProgress = false;
    };
  }, [userEmail, userName]);

  useEffect(() => {
    setPinnedChannels(pinnedIds);
  }, [pinnedIds]);

  // Load messages when channel changes and listen for new messages
  useEffect(() => {
    console.log('Channel changed:', channel);
    if (channel) {
      const channelMessages = channel.state.messages || [];
      console.log('Channel messages:', channelMessages);
      setMessages(channelMessages);

      // Listen for new messages
      const handleNewMessage = (event) => {
        console.log('New message received:', event);
        const updatedMessages = channel.state.messages || [];
        console.log('Updated messages from new message:', updatedMessages);
        setMessages([...updatedMessages]);
      };

      // Listen for channel state updates
      const handleChannelUpdate = () => {
        console.log('Channel state updated');
        const updatedMessages = channel.state.messages || [];
        console.log('Updated messages from state update:', updatedMessages);
        setMessages([...updatedMessages]);
      };

      // Set up event listeners
      channel.on('message.new', handleNewMessage);
      channel.on('message.updated', handleChannelUpdate);
      channel.on('message.deleted', handleChannelUpdate);

      // Cleanup listener when channel changes
      return () => {
        channel.off('message.new', handleNewMessage);
        channel.off('message.updated', handleChannelUpdate);
        channel.off('message.deleted', handleChannelUpdate);
      };
    } else {
      console.log('No channel available');
      setMessages([]);
    }
  }, [channel]);

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

  // Send message function
  const sendMessage = async () => {
    console.log('Send message called with:', newMessage);
    console.log('Channel:', channel);
    
    if (!newMessage.trim()) {
      console.log('Message is empty, returning');
      return;
    }
    
    if (!channel) {
      console.log('No channel available, returning');
      return;
    }
    
    try {
      console.log('Sending message to channel...');
      const response = await channel.sendMessage({
        text: newMessage,
      });
      console.log('Message sent successfully:', response);
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  // Handle Enter key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <div>Loading chat...Please wait</div>
      </div>
    );
  }

  const currentUserId = chatClient?.user?.id;
  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;

  // Helper function to render channel with pin
  const renderChannelWithPin = (ch, category = null) => {
    if (!ch || !ch.cid) return null;
    return (
      <div
        key={ch.cid}
        className={`${styles.channelListRow} ${category ? styles[category] : ''} ${channel?.id === ch.id ? styles.active : ''}`}
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
    <div className={styles.outerChatBg}>
      <div className={styles.chatContainer}>
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

        <div className={styles.topNavBar}>
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
          </div>
          <span className={styles.chatGreeting}>Hello, {userName}!</span>
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

        <div className={styles.mainChatArea}>
          <div className={`${styles.sidebar} ${sidebarOpen ? styles.open : ""}`}>
            <button
              className={styles.closeSidebarButton}
              onClick={() => setSidebarOpen(false)}
              aria-label="Close channel list"
            >
              ×
            </button>

            {/* Mobile Navigation Buttons */}
            <div className={styles.mobileNavButtons}>
              <button
                className={styles.mobileNavButton}
                onClick={() => {
                  if (onClose) {
                    onClose();
                  } else {
                    navigate("/");
                    window.location.reload();
                  }
                  setSidebarOpen(false);
                }}
              >
                🏠 Dashboard
              </button>
              <button
                className={styles.mobileNavButton}
                onClick={() => {
                  handleScheduleMatch();
                  setSidebarOpen(false);
                }}
              >
                📅 Schedule a Match
              </button>
              <button
                className={styles.mobileNavButton}
                onClick={() => {
                  logoutAndRedirect();
                  setSidebarOpen(false);
                }}
              >
                🚪 Logout
              </button>
              <div className={styles.mobileTimerBox}>
                Auto Logout: {minutes}:{seconds.toString().padStart(2, "0")}
              </div>
            </div>

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
              
              {/* Play Game Button */}
              <div 
                className={`${styles.channelListRow} ${styles.gameButton}`}
                onClick={() => {
                  navigate("/tenball");
                  setSidebarOpen(false);
                }}
              >
                <span style={{ marginRight: 8 }}>🎯</span>
                Play Pool Game
              </div>
            </div>
          </div>

          <div className={styles.mainChatWindow}>
            {/* Pool Simulation Background */}
            <div className={styles.poolBackground}>
              <PoolSimulation />
            </div>
            
            {channel && (
              <>
                <CustomChannelHeader 
                  channel={channel}
                  currentUser={chatClient?.user}
                />
                
                {/* Messages Area */}
                <div className={styles.messagesArea}>
                  {messages.map((message) => {
                    // More robust user comparison that handles both old and new ID formats
                    const messageUserId = message.user?.id;
                    const currentUserId = chatClient?.user?.id;
                    
                    // Check exact match first
                    let isCurrentUser = messageUserId === currentUserId;
                    
                    // If no exact match, check if the message user ID is the base ID (without timestamp)
                    // and the current user ID contains that base ID
                    if (!isCurrentUser && messageUserId && currentUserId) {
                      const baseUserId = messageUserId.replace(/_\d+$/, ''); // Remove timestamp suffix
                      isCurrentUser = currentUserId.startsWith(baseUserId);
                    }
                    
                    return (
                      <div 
                        key={message.id} 
                        className={`${styles.messageItem} ${isCurrentUser ? styles.messageItemRight : styles.messageItemLeft}`}
                      >
                        <div className={styles.messageHeader}>
                          <span className={styles.messageAuthor}>
                            {message.user?.name || message.user?.id}
                          </span>
                          <span className={styles.messageTime}>
                            {new Date(message.created_at).toLocaleTimeString()}
                          </span>
                        </div>
                        <div className={styles.messageText}>
                          {message.text}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Message Input */}
                <div className={styles.messageInputContainer}>
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your message..."
                    className={styles.messageInput}
                  />
                  <button
                    onClick={sendMessage}
                    className={styles.sendButton}
                    disabled={!newMessage.trim()}
                  >
                    🚀 Send
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {showDivisionSelector && (
          <DivisionSelectorModal
            userName={userName}
            userEmail={userEmail}
            userPin={userPin}
            onClose={() => setShowDivisionSelector(false)}
            fromChat={true}
          />
        )}
      </div>
    </div>
  );
}
