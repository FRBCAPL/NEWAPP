# Facebook/YouTube Live Comment Display Setup Guide

🔴 **Show your Facebook and YouTube live comments on screen while streaming!**

This system displays real-time comments from your Facebook Live streams and YouTube Live chat directly as overlays in VMix during your pool matches.

## 🚀 Quick Overview

- **Displays live comments** from YOUR Facebook Live streams in real-time
- **Shows YouTube chat** from YOUR live streams (requires OAuth setup)
- **VMix compatible** transparent overlay that won't interfere with your stream
- **Real-time polling** of live comments (2-3 second updates)
- **Clean, professional display** with platform indicators
- **Auto-hide comments** after customizable time periods

## 📋 Prerequisites

1. **Facebook Page** that you own/manage (for Facebook Live comments)
2. **YouTube Channel** that you own/manage (for YouTube Live chat)
3. **Facebook Developer Account** (free - for API access)
4. **Google Cloud Console** account (free - for YouTube API)
5. **Node.js 16+** installed on your streaming computer
6. **VMix** for live streaming

**Important**: This only works for YOUR own Facebook/YouTube streams, not other people's streams.

## 🛠️ Installation

### Step 1: Set Up the Backend Server

1. **Create a new directory** for the social media server:
```bash
mkdir pool-stream-chat
cd pool-stream-chat
```

2. **Copy the files** we created:
   - `social-media-server.js`
   - `social-media-package.json` (rename to `package.json`)
   - `.env.example`

3. **Install dependencies**:
```bash
npm install
```

4. **Configure environment variables**:
```bash
cp .env.example .env
```

Edit `.env` with your actual API keys (see configuration section below).

### Step 2: Add to Your Frontend

1. **Copy the new components** to your React app:
   - `src/components/LiveStreamChat.jsx`
   - `src/components/LiveStreamChat.module.css`
   - `src/components/StreamingOverlay.jsx`
   - `src/components/StreamingOverlay.css`

2. **Install additional dependencies** (if not already installed):
```bash
npm install ws
```

## 🔧 Configuration

### Stream Chat (Required)

You already have Stream Chat set up! Just add your server secret to the backend:

1. Go to [GetStream Dashboard](https://dashboard.getstream.io/)
2. Copy your **API Key** and **API Secret**
3. Add to `.env`:
```env
VITE_STREAM_API_KEY=your_existing_api_key
STREAM_API_SECRET=your_secret_here
```

### Facebook Integration (Optional)

1. **Create Facebook App**:
   - Go to [Facebook Developers](https://developers.facebook.com/)
   - Create new app → Business → Next
   - Add "Webhooks" and "Pages" products

2. **Get Page Access Token**:
   - Go to Graph API Explorer
   - Select your app and page
   - Generate token with `pages_read_engagement` permission

3. **Configure Webhooks**:
   - Webhook URL: `https://yourdomain.com/webhook/facebook`
   - Verify Token: Create a random string
   - Subscribe to `feed` events

4. **Add to `.env`**:
```env
FACEBOOK_ACCESS_TOKEN=your_page_access_token
FACEBOOK_VERIFY_TOKEN=your_verify_token
```

### YouTube Integration (Optional)

1. **Enable YouTube Data API**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Enable YouTube Data API v3
   - Create API credentials

2. **Add to `.env`**:
```env
YOUTUBE_API_KEY=your_youtube_api_key
```

## 🎮 VMix Integration

### Method 1: Configuration Interface

1. **Start the backend server**:
```bash
npm start
```

2. **Open configuration page**:
   Navigate to: `http://localhost:5173/streaming-overlay?configure=true`

3. **Configure your settings**:
   - Enter Facebook Page IDs
   - Enter YouTube Channel IDs
   - Choose position (bottom-right, top-left, etc.)
   - Select size and theme
   - Copy the generated VMix URL

4. **Add to VMix**:
   - Add Input → Web Browser
   - Paste the generated URL
   - Set Width/Height based on your choice
   - Enable "Transparent Background"

### Method 2: Direct URL

Create your VMix URL manually:
```
http://localhost:5173/streaming-overlay?facebook=PAGE_ID1,PAGE_ID2&youtube=CHANNEL_ID1&position=bottom-right&size=medium&theme=dark
```

**URL Parameters:**
- `facebook`: Comma-separated Facebook page IDs
- `youtube`: Comma-separated YouTube channel IDs  
- `position`: `bottom-right`, `bottom-left`, `top-right`, `top-left`
- `size`: `small` (300x400), `medium` (400x500), `large` (500x600), `full`
- `theme`: `dark`, `light`, `transparent`
- `showTimestamps`: `true`/`false`
- `showPlatformIcons`: `true`/`false`
- `maxMessages`: Number (5-100)

## 🎯 Usage Workflow

### For Live Streaming:

1. **Start the backend server**:
```bash
npm run dev  # For development with auto-restart
```

2. **Configure your overlay** using the web interface

3. **Add to VMix**:
   - Add the generated URL as a Web Browser source
   - Position and size as needed
   - Set to "Transparent Background"

4. **Go live** on your platforms:
   - Start streaming on Facebook and/or YouTube
   - Chat messages will automatically appear in the overlay
   - Messages are aggregated in real-time

### For Testing:

1. **Use the control panel**:
   Navigate to: `http://localhost:5173/live-stream-chat`

2. **Monitor connections**:
   - Check Facebook/YouTube connection status
   - View chat statistics
   - Test moderation controls

## 🔧 Advanced Features

### Chat Moderation

The system includes built-in moderation:
- **Profanity filtering**
- **Spam detection**
- **Rate limiting**
- **Manual message deletion**
- **User blocking**

### Custom Styling

Modify the CSS files to match your brand:
- `LiveStreamChat.module.css` - Main chat interface
- `StreamingOverlay.css` - Overlay themes and positioning

### Multiple Stream Setup

For multiple simultaneous streams:
1. Run multiple backend instances on different ports
2. Create separate overlay URLs for each stream
3. Use different Stream Chat channels for each

## 🔍 Troubleshooting

### Common Issues:

**"Facebook not connecting"**
- Verify your page access token has correct permissions
- Check that your page is published
- Ensure webhook URL is accessible

**"YouTube chat not showing"**
- Verify you're actually live streaming (not just scheduled)
- Check that live chat is enabled on your stream
- Ensure API key has YouTube Data API v3 enabled

**"Overlay not appearing in VMix"**
- Check that the URL is accessible in a regular browser first
- Ensure "Transparent Background" is enabled in VMix
- Verify the overlay size matches your VMix input size

**"Messages not appearing"**
- Check browser console for errors
- Verify WebSocket connection (should see connection messages)
- Test with the control panel first

### Health Check

Monitor your server health:
```
GET http://localhost:3001/health
```

This returns:
- Connection status
- Number of active pollers
- API integrations status

## 🚀 Production Deployment

For production use:

1. **Deploy backend** to a cloud service (Heroku, DigitalOcean, AWS)
2. **Update URLs** in your `.env` file
3. **Configure webhooks** to use your production domain
4. **Set up SSL** for secure WebSocket connections
5. **Use PM2** for process management:
```bash
npm install -g pm2
pm2 start social-media-server.js --name "pool-chat-aggregator"
```

## 📞 Support

If you need help with setup:
1. Check the browser console for errors
2. Review the server logs
3. Test each component individually
4. Verify all API keys and permissions

## 🎉 You're All Set!

Your VMix streaming setup now has:
- ✅ Unified chat from multiple social platforms
- ✅ Professional-looking overlay
- ✅ Real-time message aggregation
- ✅ Built-in moderation tools
- ✅ Easy configuration interface

**Happy Streaming!** 🎱🔴