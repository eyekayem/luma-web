import { WebSocketServer } from 'ws';

const wss = new WebSocketServer({ noServer: true });

export default function handler(req, res) {
  if (res.socket.server.wss) {
    console.log('WebSocket server already running');
  } else {
    console.log('Starting WebSocket server');
    res.socket.server.wss = wss;

    res.socket.server.on('upgrade', (request, socket, head) => {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    });
  }

  res.end();
}

wss.on('connection', (ws) => {
  ws.on('message', (message) => {
    console.log('received: %s', message);
    ws.send(`Hello, you sent -> ${message}`);
  });

  ws.send('Hi there, I am a WebSocket server');
});
