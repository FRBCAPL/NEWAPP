import React, { useEffect, useState, useRef } from "react";
import "./LiveCommentDisplay.css";

export default function LiveCommentDisplay({ 
  position = "bottom-right",
  maxComments = 5,
  theme = "dark",
  autoHide = true,
  commentDisplayTime = 8000 // 8 seconds per comment
}) {
  const [comments, setComments] = useState([]);
  const [isLive, setIsLive] = useState(false);
  const [platforms, setPlatforms] = useState({
    facebook: { connected: false, liveVideoId: null },
    youtube: { connected: false, liveChatId: null }
  });
  
  const wsRef = useRef(null);
  const commentTimeouts = useRef(new Map());

  useEffect(() => {
    initializeConnection();
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      // Clear all timeouts
      commentTimeouts.current.forEach(timeout => clearTimeout(timeout));
    };
  }, []);

  const initializeConnection = () => {
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${wsProtocol}//${window.location.host.replace(':5173', ':3001')}/ws/live-comments`;
    
    wsRef.current = new WebSocket(wsUrl);
    
    wsRef.current.onopen = () => {
      console.log("Connected to live comments WebSocket");
      setIsLive(true);
      
      // Request current live stream status
      wsRef.current.send(JSON.stringify({
        type: "get_live_status"
      }));
    };

    wsRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      switch (data.type) {
        case 'live_status':
          setPlatforms(data.platforms);
          break;
        case 'new_comment':
          addComment(data.comment);
          break;
        case 'platform_connected':
          setPlatforms(prev => ({
            ...prev,
            [data.platform]: { connected: true, ...data.details }
          }));
          break;
        default:
          break;
      }
    };

    wsRef.current.onclose = () => {
      console.log("Live comments WebSocket disconnected");
      setIsLive(false);
      // Attempt to reconnect after 3 seconds
      setTimeout(initializeConnection, 3000);
    };
  };

  const addComment = (comment) => {
    const commentWithId = {
      ...comment,
      id: `${comment.platform}-${comment.timestamp}-${Math.random()}`,
      displayTime: Date.now()
    };

    setComments(prev => {
      const newComments = [commentWithId, ...prev].slice(0, maxComments);
      return newComments;
    });

    // Auto-remove comment after specified time if autoHide is enabled
    if (autoHide) {
      const timeout = setTimeout(() => {
        setComments(prev => prev.filter(c => c.id !== commentWithId.id));
      }, commentDisplayTime);
      
      commentTimeouts.current.set(commentWithId.id, timeout);
    }
  };

  const removeComment = (commentId) => {
    setComments(prev => prev.filter(c => c.id !== commentId));
    
    // Clear timeout if exists
    const timeout = commentTimeouts.current.get(commentId);
    if (timeout) {
      clearTimeout(timeout);
      commentTimeouts.current.delete(commentId);
    }
  };

  const getPositionClass = () => {
    switch (position) {
      case 'top-left': return 'position-top-left';
      case 'top-right': return 'position-top-right';
      case 'bottom-left': return 'position-bottom-left';
      case 'bottom-right': 
      default: return 'position-bottom-right';
    }
  };

  const getPlatformIcon = (platform) => {
    switch (platform) {
      case 'facebook': return '📘';
      case 'youtube': return '🔴';
      default: return '💬';
    }
  };

  const getPlatformColor = (platform) => {
    switch (platform) {
      case 'facebook': return '#1877F2';
      case 'youtube': return '#FF0000';
      default: return '#888';
    }
  };

  if (!isLive || comments.length === 0) {
    return null; // Don't render anything if not live or no comments
  }

  return (
    <div className={`live-comment-display ${getPositionClass()} theme-${theme}`}>
      <div className="comments-container">
        {comments.map(comment => (
          <div 
            key={comment.id}
            className={`comment-item platform-${comment.platform}`}
            style={{
              borderLeftColor: getPlatformColor(comment.platform)
            }}
          >
            <div className="comment-header">
              <span className="platform-icon">
                {getPlatformIcon(comment.platform)}
              </span>
              <span className="author-name">{comment.author}</span>
              <button 
                className="remove-comment"
                onClick={() => removeComment(comment.id)}
                title="Remove comment"
              >
                ×
              </button>
            </div>
            <div className="comment-text">
              {comment.message}
            </div>
            <div className="comment-time">
              {new Date(comment.timestamp).toLocaleTimeString()}
            </div>
          </div>
        ))}
      </div>
      
      {/* Status indicator */}
      <div className="live-status">
        <div className="status-indicators">
          {platforms.facebook.connected && (
            <div className="platform-status facebook-live">
              📘 FB Live
            </div>
          )}
          {platforms.youtube.connected && (
            <div className="platform-status youtube-live">
              🔴 YT Live
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Configuration component for VMix setup
export function LiveCommentConfig() {
  const [config, setConfig] = useState({
    position: 'bottom-right',
    maxComments: 5,
    theme: 'dark',
    autoHide: true,
    commentDisplayTime: 8000
  });

  const generateVMixURL = () => {
    const baseUrl = `${window.location.origin}/live-comments-overlay`;
    const params = new URLSearchParams({
      position: config.position,
      maxComments: config.maxComments.toString(),
      theme: config.theme,
      autoHide: config.autoHide.toString(),
      displayTime: config.commentDisplayTime.toString()
    });
    return `${baseUrl}?${params.toString()}`;
  };

  return (
    <div className="live-comment-config">
      <h2>🔴 Live Comment Overlay Configuration</h2>
      <p>Configure how Facebook and YouTube live comments appear on your stream</p>

      <div className="config-section">
        <h3>📍 Position</h3>
        <select
          value={config.position}
          onChange={(e) => setConfig(prev => ({ ...prev, position: e.target.value }))}
        >
          <option value="bottom-right">Bottom Right</option>
          <option value="bottom-left">Bottom Left</option>
          <option value="top-right">Top Right</option>
          <option value="top-left">Top Left</option>
        </select>
      </div>

      <div className="config-section">
        <h3>📊 Max Comments</h3>
        <input
          type="number"
          min="1"
          max="10"
          value={config.maxComments}
          onChange={(e) => setConfig(prev => ({ ...prev, maxComments: parseInt(e.target.value) }))}
        />
      </div>

      <div className="config-section">
        <h3>🎨 Theme</h3>
        <select
          value={config.theme}
          onChange={(e) => setConfig(prev => ({ ...prev, theme: e.target.value }))}
        >
          <option value="dark">Dark</option>
          <option value="light">Light</option>
          <option value="transparent">Transparent</option>
        </select>
      </div>

      <div className="config-section">
        <h3>⏱️ Display Time (seconds)</h3>
        <input
          type="number"
          min="3"
          max="30"
          value={config.commentDisplayTime / 1000}
          onChange={(e) => setConfig(prev => ({ 
            ...prev, 
            commentDisplayTime: parseInt(e.target.value) * 1000 
          }))}
        />
      </div>

      <div className="config-section">
        <h3>🔄 Auto Hide</h3>
        <label>
          <input
            type="checkbox"
            checked={config.autoHide}
            onChange={(e) => setConfig(prev => ({ ...prev, autoHide: e.target.checked }))}
          />
          Automatically hide comments after display time
        </label>
      </div>

      <div className="config-result">
        <h3>🔗 VMix Browser Source URL</h3>
        <div className="url-container">
          <input
            type="text"
            value={generateVMixURL()}
            readOnly
            className="vmix-url"
          />
          <button
            onClick={() => navigator.clipboard.writeText(generateVMixURL())}
            className="copy-button"
          >
            📋 Copy
          </button>
        </div>
        <small>Add this URL as a Web Browser source in VMix with transparent background</small>
      </div>

      <div className="config-actions">
        <button
          onClick={() => window.open(generateVMixURL(), '_blank')}
          className="preview-button"
        >
          👁️ Preview Overlay
        </button>
      </div>
    </div>
  );
}