import React, { useState, useEffect } from "react";
import LiveStreamChat from "./LiveStreamChat";
import "./StreamingOverlay.css";

export default function StreamingOverlay() {
  const [config, setConfig] = useState({
    facebookPages: [],
    youtubeChannels: [],
    userName: "Stream Bot",
    userEmail: "streambot@poolleague.com",
    position: "bottom-right", // bottom-right, bottom-left, top-right, top-left
    size: "medium", // small, medium, large, full
    theme: "dark", // dark, light, transparent
    showTimestamps: true,
    showPlatformIcons: true,
    maxMessages: 20,
    autoScroll: true
  });

  const [isConfiguring, setIsConfiguring] = useState(false);

  // Load configuration from URL parameters (for VMix integration)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    
    const newConfig = { ...config };
    
    // Parse URL parameters
    if (urlParams.get('facebook')) {
      newConfig.facebookPages = urlParams.get('facebook').split(',');
    }
    if (urlParams.get('youtube')) {
      newConfig.youtubeChannels = urlParams.get('youtube').split(',');
    }
    if (urlParams.get('position')) {
      newConfig.position = urlParams.get('position');
    }
    if (urlParams.get('size')) {
      newConfig.size = urlParams.get('size');
    }
    if (urlParams.get('theme')) {
      newConfig.theme = urlParams.get('theme');
    }
    if (urlParams.get('showTimestamps')) {
      newConfig.showTimestamps = urlParams.get('showTimestamps') === 'true';
    }
    if (urlParams.get('showPlatformIcons')) {
      newConfig.showPlatformIcons = urlParams.get('showPlatformIcons') === 'true';
    }
    if (urlParams.get('maxMessages')) {
      newConfig.maxMessages = parseInt(urlParams.get('maxMessages'));
    }

    setConfig(newConfig);

    // Check if this is configuration mode
    if (urlParams.get('configure') === 'true') {
      setIsConfiguring(true);
    }
  }, []);

  const getSizeStyles = () => {
    switch (config.size) {
      case 'small':
        return { width: '300px', height: '400px' };
      case 'medium':
        return { width: '400px', height: '500px' };
      case 'large':
        return { width: '500px', height: '600px' };
      case 'full':
        return { width: '100vw', height: '100vh' };
      default:
        return { width: '400px', height: '500px' };
    }
  };

  const getPositionStyles = () => {
    const base = {
      position: 'fixed',
      zIndex: 9999,
      ...getSizeStyles()
    };

    switch (config.position) {
      case 'top-left':
        return { ...base, top: '20px', left: '20px' };
      case 'top-right':
        return { ...base, top: '20px', right: '20px' };
      case 'bottom-left':
        return { ...base, bottom: '20px', left: '20px' };
      case 'bottom-right':
      default:
        return { ...base, bottom: '20px', right: '20px' };
    }
  };

  const generateVMixURL = () => {
    const baseUrl = window.location.origin + window.location.pathname;
    const params = new URLSearchParams({
      facebook: config.facebookPages.join(','),
      youtube: config.youtubeChannels.join(','),
      position: config.position,
      size: config.size,
      theme: config.theme,
      showTimestamps: config.showTimestamps.toString(),
      showPlatformIcons: config.showPlatformIcons.toString(),
      maxMessages: config.maxMessages.toString()
    });
    return `${baseUrl}?${params.toString()}`;
  };

  if (isConfiguring) {
    return (
      <div className="streaming-overlay-config">
        <div className="config-panel">
          <h2>🔴 Live Stream Chat Overlay Configuration</h2>
          <p>Configure your chat overlay for VMix integration</p>

          <div className="config-section">
            <h3>📘 Facebook Pages</h3>
            <input
              type="text"
              placeholder="Enter Facebook page IDs (comma-separated)"
              value={config.facebookPages.join(',')}
              onChange={(e) => setConfig({
                ...config,
                facebookPages: e.target.value.split(',').filter(Boolean)
              })}
            />
            <small>Get page IDs from Facebook Page Settings → About</small>
          </div>

          <div className="config-section">
            <h3>🎥 YouTube Channels</h3>
            <input
              type="text"
              placeholder="Enter YouTube channel IDs (comma-separated)"
              value={config.youtubeChannels.join(',')}
              onChange={(e) => setConfig({
                ...config,
                youtubeChannels: e.target.value.split(',').filter(Boolean)
              })}
            />
            <small>Get channel IDs from YouTube Studio → Settings → Channel</small>
          </div>

          <div className="config-section">
            <h3>📍 Position</h3>
            <select
              value={config.position}
              onChange={(e) => setConfig({ ...config, position: e.target.value })}
            >
              <option value="bottom-right">Bottom Right</option>
              <option value="bottom-left">Bottom Left</option>
              <option value="top-right">Top Right</option>
              <option value="top-left">Top Left</option>
            </select>
          </div>

          <div className="config-section">
            <h3>📏 Size</h3>
            <select
              value={config.size}
              onChange={(e) => setConfig({ ...config, size: e.target.value })}
            >
              <option value="small">Small (300x400)</option>
              <option value="medium">Medium (400x500)</option>
              <option value="large">Large (500x600)</option>
              <option value="full">Full Screen</option>
            </select>
          </div>

          <div className="config-section">
            <h3>🎨 Theme</h3>
            <select
              value={config.theme}
              onChange={(e) => setConfig({ ...config, theme: e.target.value })}
            >
              <option value="dark">Dark Theme</option>
              <option value="light">Light Theme</option>
              <option value="transparent">Transparent</option>
            </select>
          </div>

          <div className="config-section">
            <h3>⚙️ Options</h3>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={config.showTimestamps}
                onChange={(e) => setConfig({ ...config, showTimestamps: e.target.checked })}
              />
              Show Timestamps
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={config.showPlatformIcons}
                onChange={(e) => setConfig({ ...config, showPlatformIcons: e.target.checked })}
              />
              Show Platform Icons
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={config.autoScroll}
                onChange={(e) => setConfig({ ...config, autoScroll: e.target.checked })}
              />
              Auto Scroll
            </label>
          </div>

          <div className="config-section">
            <h3>📊 Max Messages</h3>
            <input
              type="number"
              min="5"
              max="100"
              value={config.maxMessages}
              onChange={(e) => setConfig({ ...config, maxMessages: parseInt(e.target.value) })}
            />
          </div>

          <div className="config-result">
            <h3>🔗 VMix URL</h3>
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
            <small>Use this URL as a Web Browser source in VMix</small>
          </div>

          <div className="config-actions">
            <button
              onClick={() => window.open(generateVMixURL(), '_blank')}
              className="preview-button"
            >
              👁️ Preview Overlay
            </button>
            <button
              onClick={() => setIsConfiguring(false)}
              className="close-config-button"
            >
              ❌ Close Config
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`streaming-overlay streaming-overlay-${config.theme}`}
      style={getPositionStyles()}
    >
      <LiveStreamChat
        userName={config.userName}
        userEmail={config.userEmail}
        isOverlay={true}
        facebookPages={config.facebookPages}
        youtubeChannels={config.youtubeChannels}
        maxMessages={config.maxMessages}
        showTimestamps={config.showTimestamps}
        showPlatformIcons={config.showPlatformIcons}
        autoScroll={config.autoScroll}
      />
    </div>
  );
}

// Export configuration component for easy access
export function StreamingOverlayConfig() {
  return (
    <div style={{ 
      padding: '20px', 
      maxWidth: '800px', 
      margin: '0 auto',
      background: '#1a1a1a',
      color: '#fff',
      minHeight: '100vh'
    }}>
      <StreamingOverlay />
    </div>
  );
}