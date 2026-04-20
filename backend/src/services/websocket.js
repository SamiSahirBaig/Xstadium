import { WebSocketServer } from 'ws';

const clients = new Set();

export const attachWebSocketServer = (server) => {
  const wss = new WebSocketServer({ server });

  wss.on('connection', (ws) => {
    clients.add(ws);
    console.log(`[WebSocket] New client connected. Active connections: ${clients.size}`);

    ws.on('close', () => {
      clients.delete(ws);
      console.log(`[WebSocket] Client disconnected. Active connections: ${clients.size}`);
    });

    ws.on('error', (err) => {
      console.error('[WebSocket] Error:', err);
    });
  });

  return wss;
};

export const broadcast = (data) => {
  const payload = JSON.stringify(data);
  for (const client of clients) {
    if (client.readyState === 1) { // WebSocket.OPEN
      client.send(payload);
    }
  }
};
