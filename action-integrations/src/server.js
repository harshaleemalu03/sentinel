require('dotenv').config();
const http = require('http');
const express = require('express');
const cors = require('cors');

const actionsRouter = require('./routes/actions');
const approvalsRouter = require('./routes/approvals');
const broadcaster = require('./utils/broadcaster');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => res.json({ ok: true, module: 'action-integrations' }));

app.use('/actions', actionsRouter);
app.use('/approvals', approvalsRouter);

const server = http.createServer(app);
broadcaster.attach(server); // ws clients (dashboard) connect at /ws

const PORT = process.env.PORT || 4003;
server.listen(PORT, () => {
  console.log(`[action-integrations] listening on :${PORT}`);
  console.log(`[action-integrations] websocket at ws://localhost:${PORT}/ws`);
});
