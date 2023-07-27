// src/index.ts

import express, { Application } from 'express';
import { createServer, Server as HttpServer } from 'http';
import { v4 as uuidv4 } from 'uuid';
import { Server, Socket } from 'socket.io';
import { Room, User } from '../../src/types/interfaces';
import { CustomSocket } from '../../src/types/socketCustomTypes';
import { addRoom, addUser, getRoomById, getUser, updateRoom } from './utils/socket';
import {
  LEAVE_ROOM,
  USER_MESSAGE,
  SERVER_MESSAGE,
  JOIN_ROOM,
  GET_ROOM_INFO,
  SET_HOST,
  CHECK_IF_ROOM_EXISTS,
  CREATE_ROOM,
} from '../../src/constants/socketActions';

const PORT = 8000;
const app: Application = express();
const server: HttpServer = createServer(app);
const io: Server = new Server(server);

let users: User[] = [];
const rooms: { [roomId: string]: Room } = {};
let activeConnections = 0;

io.on('connection', (socket: CustomSocket) => {
  activeConnections++;

  const roomId = socket.handshake.query.roomId as string | undefined;
  const userId = socket.handshake.query.userId as string | undefined;
  const username = socket.handshake.query.username as string | undefined;
  const roomName = socket.handshake.query.roomName as string | undefined;

  socket.userId = userId ?? socket.id;

  console.log(`⚡️ New user connected in Room: ${roomId} - User Id: ${userId} - Username: ${username}`);

  socket.on(CHECK_IF_ROOM_EXISTS, (roomId: string, callback: (value: Room) => void) => {
    const room = getRoomById(roomId, rooms);
    console.log(CHECK_IF_ROOM_EXISTS, roomId, room);

    typeof callback === 'function' && callback(room);
  });

  socket.on(CREATE_ROOM, (callback: (value: { result?: Room; error?: string }) => void) => {
    console.log('CREATE_ROOM', roomId, userId, username, roomName);
    if (roomId && userId && username && roomName) {
      const user = addUser(socket.id, users, username, roomId);
      const room: Room = getRoomById(roomId, rooms);
      if (room) {
        typeof callback === 'function' && callback({ error: 'Room already exists' });
      } else {
        socket.join(roomId);
        const newRoom = addRoom(roomId, roomName, user);
        rooms[roomId] = newRoom;
        typeof callback === 'function' && callback({ result: newRoom });
      }
    } else {
      typeof callback === 'function' && callback({ error: 'Failed to create room' });
    }
  });

  socket.on(JOIN_ROOM, (roomId: string, callback: (value: boolean) => void) => {
    console.log('JOIN_ROOM', roomId, userId, username, roomName);
    if (roomId && userId && username && roomName) {
      socket.join(roomId);
      const user = addUser(socket.id, users, username, roomId);
      const room: Room = getRoomById(roomId, rooms);
      if (room) {
        const newMembers = [...room.members, user];
        const updatedRoom = updateRoom(roomId, rooms, { ...room, members: newMembers });
        rooms[roomId] = updatedRoom;
        socket.emit(GET_ROOM_INFO, room);
      }
    } else {
      typeof callback === 'function' && callback(false);
    }
  });

  socket.on(USER_MESSAGE, (message: string, roomId: string) => {
    console.log(`📩 Received message: ${message} in ${roomId}`);
    const user = socket.userId && getUser(socket.userId, users);
    console.log('USER_MESSAGE', user, userId, socket.id);
    if (user) {
      const messageId = uuidv4();
      io.to(roomId).emit(USER_MESSAGE, {
        username: user.username,
        message,
        userId: socket.id,
        id: messageId,
      });
    }
  });

  socket.on(LEAVE_ROOM, async () => {
    handleUserLeaveRoom(socket);
  });

  socket.on('disconnect', () => {
    activeConnections--;
    handleUserLeaveRoom(socket);
  });
});

const handleUserLeaveRoom = async (socket: Socket) => {
  activeConnections--;
  console.log(`🔌 User disconnected - Socket ID: ${socket.id}`);
  const user = getUser(socket.id, users);
  if (user) {
    io.to(user.roomId).emit(SERVER_MESSAGE, {
      type: 'USER_DISCONNECTED',
      message: `A user disconnected ${user.roomId}`,
    });

    const room: Room = getRoomById(user.roomId, rooms);

    if (room) {
      const userWasHost = socket.id === room.host;

      const newMembers = room.members.filter((member) => member.id !== socket.id);
      const updatedRoom = updateRoom(user.roomId, rooms, { members: newMembers });
      rooms[user.roomId] = updatedRoom;

      const updatedUsers = users.filter((user) => user.id !== socket.id);
      users = updatedUsers;

      if (userWasHost && room.members.length > 0) {
        io.in(room.id).emit(SET_HOST, room.host);
        io.in(room.id).emit(SERVER_MESSAGE, {
          type: 'NEW_HOST',
          message: `${room.members[0].username} is now the host. 👑`,
        });
      }
    }

    const roomInfo = getRoomById(user.roomId, rooms);
    console.log('LEAVE_ROOM', user.roomId, roomInfo.members.length, users.length, activeConnections);
  }
};

server.listen(PORT, () => {
  console.log(`🚀 WebSocket server is running on http://localhost:${PORT}`);
});

app.get('/api/rooms', (_req, res) => {
  res.json({ rooms });
});

app.get('/api/users', (_req, res) => {
  res.json({ users });
});
