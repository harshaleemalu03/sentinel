const { WebSocketServer } = require('ws');

let wss = null;

function attach(server) {
  wss = new WebSocketServer({ server, path: '/ws' });
  wss.on('connection', (socket) => {
    socket.send(JSON.stringify({ type: 'connected', module: 'action-integrations' }));
  });
  console.log('[ws] action-integrations broadcaster attached at /ws');
}

// event: { type: 'action_created' | 'action_approved' | 'action_rejected' | 'action_updated', action }
function broadcast(event) {
  if (!wss) return;
  const payload = JSON.stringify({ ...event, emittedAt: new Date().toISOString() });
  wss.clients.forEach((client) => {
    if (client.readyState === 1) client.send(payload);
  });
}

module.exports = { attach, broadcast };
