import { WebSocketServer } from 'ws';

const wss = new WebSocketServer({ noServer: true });

export default function handler(req, res) {
  if (res.socket.server.wss) {
    console.log('WebSocket server already running');
  } else {
    console.log('Starting WebSocket server');
    res.socket.server.wss = wss;

    res.socket.server.on('upgrade', (request, socket, head) => {
      console.log('Handling upgrade request');
      wss.handleUpgrade(request, socket, head, (ws) => {
        console.log('WebSocket connection established');
        wss.emit('connection', ws, request);
      });
    });
  }

  res.end();
}

wss.on('connection', (ws, request) => {
  console.log('New WebSocket connection from', request.headers.origin);

  ws.on('message', (message) => {
    console.log('Received message:', message);
    try {
      const data = JSON.parse(message);
      console.log('Parsed message data:', data);
      ws.send(`Received your message: ${message}`);
    } catch (error) {
      console.error('Error parsing message:', error);
      ws.send('Error: Invalid JSON');
    }
  });

  ws.on('close', () => {
    console.log('WebSocket connection closed');
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });

  ws.send('Hi there, I am a WebSocket server');
});
