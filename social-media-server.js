const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const axios = require('axios');
const { StreamChat } = require('stream-chat');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuration
const PORT = process.env.SOCIAL_MEDIA_PORT || 3001;
const STREAM_API_KEY = process.env.VITE_STREAM_API_KEY;
const STREAM_API_SECRET = process.env.STREAM_API_SECRET;
const FACEBOOK_ACCESS_TOKEN = process.env.FACEBOOK_ACCESS_TOKEN;
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

// Initialize Stream Chat server client
const serverClient = STREAM_API_KEY && STREAM_API_SECRET ? 
  StreamChat.getInstance(STREAM_API_KEY, STREAM_API_SECRET) : null;

// Store active connections and configurations
const activeConnections = new Map();
const socialMediaPollers = new Map();

console.log('🔴 Starting Social Media Chat Aggregator Server...');

// WebSocket connection handler
wss.on('connection', (ws) => {
  console.log('New WebSocket connection established');
  
  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message);
      
      if (data.type === 'configure') {
        const connectionId = Date.now().toString();
        activeConnections.set(connectionId, {
          ws,
          facebookPages: data.facebookPages || [],
          youtubeChannels: data.youtubeChannels || [],
          streamChannelId: data.streamChannelId || 'live-stream-chat'
        });
        
        // Start polling for each configured platform
        await startSocialMediaPolling(connectionId);
        
        ws.send(JSON.stringify({
          type: 'configured',
          connectionId,
          message: 'Social media polling started'
        }));
      }
    } catch (error) {
      console.error('WebSocket message error:', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Configuration failed'
      }));
    }
  });
  
  ws.on('close', () => {
    console.log('WebSocket connection closed');
    // Clean up polling for this connection
    for (const [connectionId, config] of activeConnections.entries()) {
      if (config.ws === ws) {
        stopSocialMediaPolling(connectionId);
        activeConnections.delete(connectionId);
        break;
      }
    }
  });
});

// Facebook webhook endpoint
app.get('/webhook/facebook', (req, res) => {
  const verify_token = process.env.FACEBOOK_VERIFY_TOKEN;
  
  if (req.query['hub.verify_token'] === verify_token) {
    res.status(200).send(req.query['hub.challenge']);
  } else {
    res.status(403).send('Verification failed');
  }
});

app.post('/webhook/facebook', async (req, res) => {
  try {
    const { entry } = req.body;
    
    if (entry && entry.length > 0) {
      for (const item of entry) {
        if (item.changes) {
          for (const change of item.changes) {
            if (change.field === 'feed' && change.value.item === 'comment') {
              await processFacebookComment(change.value);
            }
          }
        }
      }
    }
    
    res.status(200).send('OK');
  } catch (error) {
    console.error('Facebook webhook error:', error);
    res.status(500).send('Error processing webhook');
  }
});

// YouTube webhook endpoint (using PubSubHubbub)
app.get('/webhook/youtube', (req, res) => {
  res.status(200).send(req.query['hub.challenge'] || 'OK');
});

app.post('/webhook/youtube', async (req, res) => {
  try {
    // Parse YouTube webhook data
    const xmlData = req.body;
    // Process YouTube chat messages
    await processYouTubeUpdate(xmlData);
    res.status(200).send('OK');
  } catch (error) {
    console.error('YouTube webhook error:', error);
    res.status(500).send('Error processing webhook');
  }
});

// Stream Chat token endpoint
app.post('/stream-token', async (req, res) => {
  try {
    if (!serverClient) {
      return res.status(500).json({ error: 'Stream Chat not configured' });
    }
    
    const { userId, isStreamer } = req.body;
    
    const token = serverClient.createToken(userId);
    
    res.json({ 
      token,
      userId,
      apiKey: STREAM_API_KEY
    });
  } catch (error) {
    console.error('Token generation error:', error);
    res.status(500).json({ error: 'Failed to generate token' });
  }
});

// Facebook API integration
async function startFacebookPolling(connectionId, pageIds) {
  if (!FACEBOOK_ACCESS_TOKEN || !pageIds.length) return;
  
  const pollInterval = setInterval(async () => {
    try {
      for (const pageId of pageIds) {
        const response = await axios.get(
          `https://graph.facebook.com/v18.0/${pageId}/feed`,
          {
            params: {
              access_token: FACEBOOK_ACCESS_TOKEN,
              fields: 'comments{message,from,created_time}',
              limit: 10
            }
          }
        );
        
        if (response.data.data) {
          for (const post of response.data.data) {
            if (post.comments && post.comments.data) {
              for (const comment of post.comments.data) {
                await broadcastSocialMessage(connectionId, {
                  platform: 'facebook',
                  message: comment.message,
                  user: {
                    id: comment.from.id,
                    name: comment.from.name
                  },
                  timestamp: comment.created_time,
                  originalId: comment.id
                });
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Facebook polling error:', error);
    }
  }, 5000); // Poll every 5 seconds
  
  if (!socialMediaPollers.has(connectionId)) {
    socialMediaPollers.set(connectionId, []);
  }
  socialMediaPollers.get(connectionId).push(pollInterval);
}

// YouTube API integration
async function startYouTubePolling(connectionId, channelIds) {
  if (!YOUTUBE_API_KEY || !channelIds.length) return;
  
  const pollInterval = setInterval(async () => {
    try {
      for (const channelId of channelIds) {
        // Get live broadcasts for the channel
        const broadcastResponse = await axios.get(
          'https://www.googleapis.com/youtube/v3/liveBroadcasts',
          {
            params: {
              key: YOUTUBE_API_KEY,
              part: 'snippet',
              channelId: channelId,
              broadcastStatus: 'active'
            }
          }
        );
        
        if (broadcastResponse.data.items && broadcastResponse.data.items.length > 0) {
          const liveBroadcast = broadcastResponse.data.items[0];
          const liveChatId = liveBroadcast.snippet.liveChatId;
          
          if (liveChatId) {
            // Get live chat messages
            const chatResponse = await axios.get(
              'https://www.googleapis.com/youtube/v3/liveChat/messages',
              {
                params: {
                  key: YOUTUBE_API_KEY,
                  liveChatId: liveChatId,
                  part: 'snippet,authorDetails'
                }
              }
            );
            
            if (chatResponse.data.items) {
              for (const message of chatResponse.data.items) {
                await broadcastSocialMessage(connectionId, {
                  platform: 'youtube',
                  message: message.snippet.displayMessage,
                  user: {
                    id: message.authorDetails.channelId,
                    name: message.authorDetails.displayName,
                    avatar: message.authorDetails.profileImageUrl
                  },
                  timestamp: message.snippet.publishedAt,
                  originalId: message.id
                });
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('YouTube polling error:', error);
    }
  }, 3000); // Poll every 3 seconds
  
  if (!socialMediaPollers.has(connectionId)) {
    socialMediaPollers.set(connectionId, []);
  }
  socialMediaPollers.get(connectionId).push(pollInterval);
}

// Start social media polling for a connection
async function startSocialMediaPolling(connectionId) {
  const config = activeConnections.get(connectionId);
  if (!config) return;
  
  // Start Facebook polling
  if (config.facebookPages.length > 0) {
    await startFacebookPolling(connectionId, config.facebookPages);
    console.log(`Started Facebook polling for ${config.facebookPages.length} pages`);
  }
  
  // Start YouTube polling
  if (config.youtubeChannels.length > 0) {
    await startYouTubePolling(connectionId, config.youtubeChannels);
    console.log(`Started YouTube polling for ${config.youtubeChannels.length} channels`);
  }
}

// Stop social media polling for a connection
function stopSocialMediaPolling(connectionId) {
  const intervals = socialMediaPollers.get(connectionId);
  if (intervals) {
    intervals.forEach(interval => clearInterval(interval));
    socialMediaPollers.delete(connectionId);
    console.log(`Stopped polling for connection ${connectionId}`);
  }
}

// Broadcast social media message to WebSocket clients
async function broadcastSocialMessage(connectionId, messageData) {
  const config = activeConnections.get(connectionId);
  if (!config || !config.ws) return;
  
  try {
    // Send to WebSocket client (frontend)
    config.ws.send(JSON.stringify(messageData));
    
    // Also send to Stream Chat if configured
    if (serverClient && config.streamChannelId) {
      const channel = serverClient.channel('livestream', config.streamChannelId);
      
      await channel.sendMessage({
        text: messageData.message,
        user: {
          id: `${messageData.platform}-${messageData.user.id}`,
          name: messageData.user.name || 'Anonymous',
          image: messageData.user.avatar || messageData.user.profilePicture
        },
        custom: {
          platform: messageData.platform,
          originalId: messageData.originalId,
          timestamp: messageData.timestamp,
          isSocialMedia: true,
          platformIcon: messageData.platform === 'facebook' ? '📘' : '🎥',
          platformColor: messageData.platform === 'facebook' ? '#1877F2' : '#FF0000'
        }
      });
    }
  } catch (error) {
    console.error('Error broadcasting social message:', error);
  }
}

// Process Facebook comment from webhook
async function processFacebookComment(commentData) {
  const messageData = {
    platform: 'facebook',
    message: commentData.message,
    user: {
      id: commentData.from?.id || 'unknown',
      name: commentData.from?.name || 'Anonymous'
    },
    timestamp: commentData.created_time || new Date().toISOString(),
    originalId: commentData.comment_id
  };
  
  // Broadcast to all active connections
  for (const [connectionId, config] of activeConnections.entries()) {
    if (config.facebookPages.includes(commentData.post?.id?.split('_')[0])) {
      await broadcastSocialMessage(connectionId, messageData);
    }
  }
}

// Process YouTube update from webhook
async function processYouTubeUpdate(xmlData) {
  // Parse XML and extract video/channel information
  // This would need XML parsing logic based on YouTube's webhook format
  console.log('YouTube webhook received:', xmlData);
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    activeConnections: activeConnections.size,
    pollers: socialMediaPollers.size,
    streamChatEnabled: !!serverClient,
    facebookEnabled: !!FACEBOOK_ACCESS_TOKEN,
    youtubeEnabled: !!YOUTUBE_API_KEY
  });
});

// Social media connection endpoints
app.post('/social/facebook/connect', async (req, res) => {
  try {
    const { pages, streamChannelId } = req.body;
    
    if (!FACEBOOK_ACCESS_TOKEN) {
      return res.status(400).json({ error: 'Facebook access token not configured' });
    }
    
    // Verify pages exist and are accessible
    const verifiedPages = [];
    for (const pageId of pages) {
      try {
        const response = await axios.get(
          `https://graph.facebook.com/v18.0/${pageId}`,
          {
            params: {
              access_token: FACEBOOK_ACCESS_TOKEN,
              fields: 'name,id'
            }
          }
        );
        verifiedPages.push(response.data);
      } catch (error) {
        console.error(`Failed to verify Facebook page ${pageId}:`, error.message);
      }
    }
    
    res.json({
      status: 'connected',
      verifiedPages,
      message: `Connected to ${verifiedPages.length} Facebook pages`
    });
  } catch (error) {
    console.error('Facebook connection error:', error);
    res.status(500).json({ error: 'Failed to connect to Facebook' });
  }
});

app.post('/social/youtube/connect', async (req, res) => {
  try {
    const { channels, streamChannelId } = req.body;
    
    if (!YOUTUBE_API_KEY) {
      return res.status(400).json({ error: 'YouTube API key not configured' });
    }
    
    // Verify channels exist and are accessible
    const verifiedChannels = [];
    for (const channelId of channels) {
      try {
        const response = await axios.get(
          'https://www.googleapis.com/youtube/v3/channels',
          {
            params: {
              key: YOUTUBE_API_KEY,
              part: 'snippet',
              id: channelId
            }
          }
        );
        
        if (response.data.items && response.data.items.length > 0) {
          verifiedChannels.push(response.data.items[0]);
        }
      } catch (error) {
        console.error(`Failed to verify YouTube channel ${channelId}:`, error.message);
      }
    }
    
    res.json({
      status: 'connected',
      verifiedChannels,
      message: `Connected to ${verifiedChannels.length} YouTube channels`
    });
  } catch (error) {
    console.error('YouTube connection error:', error);
    res.status(500).json({ error: 'Failed to connect to YouTube' });
  }
});

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Social Media Chat Aggregator running on port ${PORT}`);
  console.log(`📘 Facebook integration: ${FACEBOOK_ACCESS_TOKEN ? 'Enabled' : 'Disabled'}`);
  console.log(`🎥 YouTube integration: ${YOUTUBE_API_KEY ? 'Enabled' : 'Disabled'}`);
  console.log(`💬 Stream Chat integration: ${serverClient ? 'Enabled' : 'Disabled'}`);
  console.log(`🔗 WebSocket server running for real-time chat aggregation`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Shutting down social media server...');
  
  // Clear all polling intervals
  for (const [connectionId] of socialMediaPollers.entries()) {
    stopSocialMediaPolling(connectionId);
  }
  
  // Close WebSocket server
  wss.close(() => {
    server.close(() => {
      console.log('Social media server stopped');
      process.exit(0);
    });
  });
});

module.exports = { app, server, wss };