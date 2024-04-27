import express, { Application } from 'express';
import { createServer, Server as HttpServer } from 'http';
import cors from 'cors';
import { Server } from 'socket.io';
import { InterServerEvents, ServerToClientEvents, ClientToServerEvents, SocketData } from '../../src/types/socketCustomTypes';
import { roomsSource } from './utils/room-management';
import { usersSource } from './utils/user-management';
import { handleSocketEvents } from './handlers/socket-events';
import { startCleanupInterval } from './utils/cleanup';
import { publicRoomsHandler } from './handlers/public-rooms';

import { config } from 'dotenv';
import { handleVerifyApiKey } from './handlers/middleware';
config();

const PORT = (process.env.PORT && parseInt(process.env.PORT)) || 8000;
const app: Application = express();
const server: HttpServer = createServer(app);

const allowedOrigins = [
  'http://localhost:3000',
  'https://synkro.vercel.app',
  'https://synkro-synkro.vercel.app',
  'https://synkro-git-master-synkro.vercel.app',
];

const corsOptions = {
  origin: allowedOrigins,
  methods: ['GET', 'POST'],
};

app.use(cors(corsOptions));

const io = new Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>(server, {
  allowRequest: (req, callback) => {
    const isAllowedOrigin = req?.headers?.origin ? allowedOrigins.includes(req.headers.origin) : false;
    callback(null, isAllowedOrigin);
  },
});

io.use((socket, next) => {
  const userId = socket.handshake.auth.token;
  if (userId) {
    next();
  } else {
    next(new Error('Missing session token'));
  }
});

io.on('connection', (socket) => {
  handleSocketEvents(io, socket);
});

startCleanupInterval();

server.listen(PORT, () => {
  console.log(`🚀 WebSocket server is running on http://localhost:${PORT}`);
});

app.get('/api/healthz', (_req, res) => {
  res.send({ status: 'ok' });
});

app.get('/api/rooms', handleVerifyApiKey, (_req, res) => {
  res.json({ rooms: Object.fromEntries(roomsSource.rooms.entries()) });
});

app.get('/api/room/:roomId', handleVerifyApiKey, (req, res) => {
  const roomId = req.params?.roomId as string;
  const room = roomsSource.get(roomId) || null;
  res.json({ room });
});

app.get('/api/room-invite-code/:inviteCode', handleVerifyApiKey, (req, res) => {
  const inviteCode = req.params?.inviteCode as string;
  const room = roomsSource.getRoomByInviteCode(inviteCode) || null;
  res.json({ room });
});


app.get('/api/users', handleVerifyApiKey, (_req, res) => {
  res.json({ users: Object.fromEntries(usersSource.users.entries()) });
});

app.get('/api/connections', (_req, res) => {
  const activeConnections = io.sockets.sockets.size;
  const roomIds = Array.from(roomsSource.rooms).map((room) => room[0]);
  const usersIds = Array.from(usersSource.users).map((user) => user[0]);
  res.json({
    activeConnections,
    users: {
      ids: usersIds,
      length: usersIds.length,
    },
    rooms: {
      ids: roomIds,
      length: roomIds.length,
    },
  });
});

app.get('/api/public-rooms', publicRoomsHandler);
