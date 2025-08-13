import React, { useEffect, useState, useRef } from "react";
import { StreamChat } from "stream-chat";
import {
  Chat,
  Channel,
  MessageList,
  MessageInput,
  Window,
  Thread,
  TypingIndicator,
} from "stream-chat-react";
import "stream-chat-react/dist/css/v2/index.css";
import CustomChannelHeader from "./CustomChannelHeader";
import CustomMessageUi from "./CustomMessageUi";
import styles from "./LiveStreamChat.module.css";
import { BACKEND_URL } from '../config.js';

const apiKey = import.meta.env.VITE_STREAM_API_KEY;
const API_BASE = BACKEND_URL;
const LIVESTREAM_CHANNEL_ID = "live-stream-chat";

export default function LiveStreamChat({ 
  userName = "Stream Moderator", 
  userEmail = "moderator@stream.com",
  isOverlay = false,
  facebookPages = [],
  youtubeChannels = [],
  onClose 
}) {
  const [chatClient, setChatClient] = useState(null);
  const [liveChannel, setLiveChannel] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [socialConnections, setSocialConnections] = useState({
    facebook: { connected: false, pages: [] },
    youtube: { connected: false, channels: [] }
  });
  const [moderationEnabled, setModerationEnabled] = useState(true);
  const [chatStats, setChatStats] = useState({
    totalMessages: 0,
    facebookMessages: 0,
    youtubeMessages: 0,
    localMessages: 0
  });
  
  // WebSocket connection for real-time social media chat
  const wsRef = useRef(null);

  // Initialize Stream Chat client and live streaming channel
  useEffect(() => {
    let client = StreamChat.getInstance(apiKey);
    let didConnect = false;
    let isMounted = true;

    async function initLiveStreamChat() {
      try {
        if (!client.userID) {
          const userId = `stream-${userEmail.replace(/[^a-z0-9_-]/g, "")}`;
          const response = await fetch(`${API_BASE}/stream-token`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId, isStreamer: true }),
          });
          const { token } = await response.json();

          await client.connectUser(
            {
              id: userId,
              name: userName,
              email: userEmail,
              role: "moderator",
              isStreamer: true
            },
            token
          );
          didConnect = true;
        }

        if (!isMounted) return;

        setChatClient(client);

        // Create or get live stream channel
        const liveStreamChannel = client.channel("livestream", LIVESTREAM_CHANNEL_ID, {
          name: "🔴 Live Stream Chat",
          description: "Live chat for pool match streaming - aggregated from multiple platforms",
          image: "/logo.png",
          live: true,
          moderation: moderationEnabled
        });
        
        await liveStreamChannel.watch({ limit: 50 });
        
        if (isMounted) {
          setLiveChannel(liveStreamChannel);
          setIsConnected(true);
        }

        // Initialize social media connections
        initializeSocialConnections();

      } catch (error) {
        console.error("Failed to initialize live stream chat:", error);
      }
    }

    initLiveStreamChat();

    return () => {
      isMounted = false;
      if (client && didConnect) {
        client.disconnectUser();
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [userEmail, userName]);

  // Initialize social media API connections
  const initializeSocialConnections = async () => {
    try {
      // Setup WebSocket for real-time social media chat
      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${wsProtocol}//${window.location.host.replace(':5173', ':3001')}/ws/social-chat`;
      
      wsRef.current = new WebSocket(wsUrl);
      
      wsRef.current.onopen = () => {
        console.log("Connected to social media chat websocket");
        
        // Send configuration for Facebook pages and YouTube channels
        wsRef.current.send(JSON.stringify({
          type: "configure",
          facebookPages,
          youtubeChannels
        }));
      };

      wsRef.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        handleSocialMediaMessage(data);
      };

      wsRef.current.onerror = (error) => {
        console.error("WebSocket error:", error);
      };

      wsRef.current.onclose = () => {
        console.log("Social media chat websocket disconnected");
        // Attempt to reconnect after 5 seconds
        setTimeout(initializeSocialConnections, 5000);
      };

    } catch (error) {
      console.error("Failed to initialize social connections:", error);
    }
  };

  // Handle incoming messages from social media platforms
  const handleSocialMediaMessage = async (socialMessage) => {
    if (!liveChannel || !chatClient) return;

    try {
      const { platform, message, user, timestamp, originalId } = socialMessage;
      
      // Create a unified message format
      const streamMessage = {
        text: `${message}`,
        user: {
          id: `${platform}-${user.id}`,
          name: user.name || user.username || "Anonymous",
          image: user.profilePicture || user.avatar,
          platform: platform
        },
        attachments: [],
        custom: {
          platform,
          originalId,
          timestamp,
          isSocialMedia: true
        }
      };

      // Add platform-specific styling
      if (platform === 'facebook') {
        streamMessage.custom.platformColor = '#1877F2';
        streamMessage.custom.platformIcon = '📘';
        setChatStats(prev => ({ ...prev, facebookMessages: prev.facebookMessages + 1, totalMessages: prev.totalMessages + 1 }));
      } else if (platform === 'youtube') {
        streamMessage.custom.platformColor = '#FF0000';
        streamMessage.custom.platformIcon = '🎥';
        setChatStats(prev => ({ ...prev, youtubeMessages: prev.youtubeMessages + 1, totalMessages: prev.totalMessages + 1 }));
      }

      // Send message to Stream Chat
      await liveChannel.sendMessage(streamMessage);

    } catch (error) {
      console.error("Failed to process social media message:", error);
    }
  };

  // Setup social media platform connections
  const connectFacebookPages = async () => {
    try {
      const response = await fetch(`${API_BASE}/social/facebook/connect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          pages: facebookPages,
          streamChannelId: LIVESTREAM_CHANNEL_ID 
        }),
      });
      
      if (response.ok) {
        setSocialConnections(prev => ({
          ...prev,
          facebook: { connected: true, pages: facebookPages }
        }));
      }
    } catch (error) {
      console.error("Failed to connect Facebook pages:", error);
    }
  };

  const connectYouTubeChannels = async () => {
    try {
      const response = await fetch(`${API_BASE}/social/youtube/connect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          channels: youtubeChannels,
          streamChannelId: LIVESTREAM_CHANNEL_ID 
        }),
      });
      
      if (response.ok) {
        setSocialConnections(prev => ({
          ...prev,
          youtube: { connected: true, channels: youtubeChannels }
        }));
      }
    } catch (error) {
      console.error("Failed to connect YouTube channels:", error);
    }
  };

  // Toggle moderation
  const toggleModeration = async () => {
    if (!liveChannel) return;
    
    try {
      await liveChannel.updatePartial({
        set: { moderation: !moderationEnabled }
      });
      setModerationEnabled(!moderationEnabled);
    } catch (error) {
      console.error("Failed to toggle moderation:", error);
    }
  };

  // Clear chat
  const clearChat = async () => {
    if (!liveChannel) return;
    
    try {
      await liveChannel.truncate();
      setChatStats({
        totalMessages: 0,
        facebookMessages: 0,
        youtubeMessages: 0,
        localMessages: 0
      });
    } catch (error) {
      console.error("Failed to clear chat:", error);
    }
  };

  if (!chatClient || !liveChannel) {
    return (
      <div className={`${styles.loadingContainer} ${isOverlay ? styles.overlay : ''}`}>
        <div className={styles.spinner}></div>
        <div>Initializing Live Stream Chat...</div>
      </div>
    );
  }

  return (
    <div className={`${styles.liveStreamChatContainer} ${isOverlay ? styles.overlay : ''}`}>
      {!isOverlay && (
        <div className={styles.controlPanel}>
          <div className={styles.streamInfo}>
            <h2>🔴 Live Stream Chat Control Panel</h2>
            <div className={styles.connectionStatus}>
              <span className={`${styles.statusIndicator} ${isConnected ? styles.connected : styles.disconnected}`}></span>
              {isConnected ? 'Connected' : 'Disconnected'}
            </div>
          </div>

          <div className={styles.socialConnections}>
            <div className={styles.platformConnection}>
              <h3>📘 Facebook Pages</h3>
              <div className={styles.connectionInfo}>
                Status: {socialConnections.facebook.connected ? '✅ Connected' : '❌ Disconnected'}
              </div>
              <button 
                onClick={connectFacebookPages}
                className={styles.connectButton}
                disabled={socialConnections.facebook.connected}
              >
                {socialConnections.facebook.connected ? 'Reconnect' : 'Connect'} Facebook
              </button>
            </div>

            <div className={styles.platformConnection}>
              <h3>🎥 YouTube Channels</h3>
              <div className={styles.connectionInfo}>
                Status: {socialConnections.youtube.connected ? '✅ Connected' : '❌ Disconnected'}
              </div>
              <button 
                onClick={connectYouTubeChannels}
                className={styles.connectButton}
                disabled={socialConnections.youtube.connected}
              >
                {socialConnections.youtube.connected ? 'Reconnect' : 'Connect'} YouTube
              </button>
            </div>
          </div>

          <div className={styles.chatStats}>
            <h3>📊 Chat Statistics</h3>
            <div className={styles.statsGrid}>
              <div className={styles.stat}>
                <span className={styles.statLabel}>Total Messages:</span>
                <span className={styles.statValue}>{chatStats.totalMessages}</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statLabel}>Facebook:</span>
                <span className={styles.statValue}>{chatStats.facebookMessages}</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statLabel}>YouTube:</span>
                <span className={styles.statValue}>{chatStats.youtubeMessages}</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statLabel}>Local:</span>
                <span className={styles.statValue}>{chatStats.localMessages}</span>
              </div>
            </div>
          </div>

          <div className={styles.moderationControls}>
            <h3>🛡️ Moderation Controls</h3>
            <div className={styles.controlButtons}>
              <button 
                onClick={toggleModeration}
                className={`${styles.moderationButton} ${moderationEnabled ? styles.enabled : styles.disabled}`}
              >
                {moderationEnabled ? '🛡️ Moderation ON' : '🚫 Moderation OFF'}
              </button>
              <button 
                onClick={clearChat}
                className={styles.clearButton}
              >
                🗑️ Clear Chat
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={`${styles.chatWindow} ${isOverlay ? styles.overlayChat : ''}`}>
        <Chat client={chatClient} theme="str-chat__theme-dark">
          {liveChannel && (
            <Channel channel={liveChannel}>
              <Window>
                {!isOverlay && <CustomChannelHeader />}
                <MessageList 
                  Message={CustomMessageUi}
                  disableDateSeparator={isOverlay}
                />
                {!isOverlay && <MessageInput />}
                <TypingIndicator />
              </Window>
              {!isOverlay && <Thread />}
            </Channel>
          )}
        </Chat>
      </div>

      {!isOverlay && onClose && (
        <div className={styles.closeButtonContainer}>
          <button onClick={onClose} className={styles.closeButton}>
            Close Live Chat
          </button>
        </div>
      )}
    </div>
  );
}