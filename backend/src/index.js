import http from 'http';
import app from './app.js';
import { attachWebSocketServer } from './services/websocket.js';
import { startPubSubListener } from './services/pubsubListener.js';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 3001;

// Create HTTP server
const server = http.createServer(app);

// Attach WebSocket server for real-time capabilities
// (We inject the HTTP server to share the same port)
attachWebSocketServer(server);

// Start listening to Pub/Sub updates
startPubSubListener();

server.listen(PORT, () => {
  console.log(`[Server] 🚀 Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('[Server] Shutting down gracefully...');
  server.close(() => {
    console.log('[Server] Closed out remaining connections.');
    process.exit(0);
  });
});
