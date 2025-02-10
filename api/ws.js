// api/ws.js
import { Server } from 'ws';

export default (req, res) => {
  if (!res.socket.server.ws) {
    console.log('Initializing WebSocket server...');
    const wss = new Server({ noServer: true });

    res.socket.server.on('upgrade', (request, socket, head) => {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    });

    wss.on('connection', (ws) => {
      ws.on('message', (message) => {
        console.log(`Received message => ${message}`);
        ws.send(`Server received: ${message}`);
      });

      ws.on('close', () => {
        console.log('Client disconnected');
      });
    });

    res.socket.server.ws = wss;
  } else {
    console.log('WebSocket server already initialized');
  }
  res.end();
};
