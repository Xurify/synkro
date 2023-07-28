import express, { Application } from 'express';
import { createServer, Server as HttpServer } from 'http';
import { v4 as uuidv4 } from 'uuid';
import shortid from 'shortid';
import { Server } from 'socket.io';
import { Room, User } from '@shared/interfaces';
import { CustomSocketServer } from '@shared/socketCustomTypes';
import { addRoom, addUser, getRoomById, getUser, requestIsNotFromHost, updateRoom } from './utils/socket';
import {
  LEAVE_ROOM,
  USER_MESSAGE,
  SERVER_MESSAGE,
  JOIN_ROOM,
  GET_ROOM_INFO,
  SET_HOST,
  CHECK_IF_ROOM_EXISTS,
  CREATE_ROOM,
  PLAY_VIDEO,
  PAUSE_VIDEO,
} from '@shared/socketActions';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const PORT = (process.env.PORT && parseInt(process.env.PORT)) || 8000;
const app: Application = express();
const server: HttpServer = createServer(app);
const io: Server = new Server(server);

let users: User[] = [];
const rooms: { [roomId: string]: Room } = {};
const roomTimeouts: { [roomId: string]: NodeJS.Timeout | undefined } = {};

let activeConnections = 0;

io.on('connection', (socket: CustomSocketServer) => {
  activeConnections++;

  //const roomId = socket.handshake.query.roomId as string | undefined;
  const userId = socket.handshake.query.userId as string | undefined;
  //const username = socket.handshake.query.username as string | undefined;
  //const roomName = socket.handshake.query.roomName as string | undefined;

  socket.userId = userId ?? socket.id;

  console.log(`⚡️ New user connected - User Id: ${userId}`);

  socket.on(CHECK_IF_ROOM_EXISTS, (roomId: string, callback: (value: Room) => void) => {
    const room = getRoomById(roomId, rooms);
    typeof callback === 'function' && callback(room);
  });

  socket.on(CREATE_ROOM, async (username, roomName, callback: (value: { result?: Room; error?: string }) => void) => {
    const newRoomId = shortid.generate();
    if (userId) {
      const room: Room = getRoomById(newRoomId, rooms);
      if (room) {
        typeof callback === 'function' && callback({ error: 'Room already exists' });
      } else {
        if (!socket.userId) return;
        const user = addUser({ id: socket.userId, username, roomId: newRoomId }, users);
        socket.join(newRoomId);
        socket.roomId = newRoomId;
        const newRoom = addRoom(newRoomId, roomName, user);
        await prisma.rooms.create({ data: { id: newRoomId, name: roomName } }).catch((err) => console.log(`failed to create room: ${err}`));
        console.log(newRoom?.id);
        await prisma.users
          .create({
            data: {
              id: user.id,
              name: user.username,
              roomId: user.roomId,
            },
          })
          .catch((err) => console.log(`failed to create user: ${err}`));
        if (newRoom) {
          rooms[newRoomId] = newRoom;
          typeof callback === 'function' && callback({ result: newRoom });
          console.log(`👀 New user joined in room: ${user.roomId} - User Id: ${userId}`);
        }
      }
    } else {
      typeof callback === 'function' && callback({ error: 'Failed to create room' });
    }
  });

  socket.on(JOIN_ROOM, async (roomId: string, username: string, callback: (value: boolean) => void) => {
    if (roomId && username && socket.userId) {
      socket.join(roomId);
      const user = addUser({ id: socket.userId, username, roomId }, users);
      await prisma.users
        .create({
          data: {
            id: user.id,
            name: user.username,
            roomId: user.roomId,
          },
        })
        .catch((err) => console.log(`failed to create user: ${err}`));
      const room: Room = getRoomById(roomId, rooms);
      if (room) {
        const newMembers = [...room.members, user];
        const updatedRoom = updateRoom(roomId, rooms, { ...room, members: newMembers });
        rooms[roomId] = updatedRoom;
        socket.roomId = roomId;
        if (roomTimeouts[roomId]) {
          clearTimeout(roomTimeouts[roomId]);
          roomTimeouts[roomId] = undefined;
        }
        typeof callback === 'function' && callback(false);
        socket.emit(GET_ROOM_INFO, room);
        console.log(`👀 New user joined in room: ${roomId} - User Id: ${userId}`);
      }
    } else {
      typeof callback === 'function' && callback(false);
    }
  });

  socket.on(USER_MESSAGE, async (message: string, roomId: string) => {
    console.log(`📩 Received message: ${message} in ${roomId}`);
    const user = socket.userId && getUser(socket.userId, users);
    if (user) {
      const timestamp = new Date().toISOString();
      console.log('roomId', roomId);
      const messageID = uuidv4();
      io.in(roomId).emit(USER_MESSAGE, {
        username: user.username,
        message,
        userId: socket.userId,
        id: messageID,
        timestamp,
        type: 'USER',
      });
      console.log(user.id);
      console.log(socket.userId);
      await prisma.messages
        .create({
          data: {
            id: messageID,
            message: message,
            userId: user.id,
            roomId: roomId,
          },
        })
        .catch((err) => console.log(`failed to add message to database: ${err}`));
    }
  });

  socket.on(PLAY_VIDEO, () => {
    if (requestIsNotFromHost(socket, rooms)) return;

    const user = socket.userId && getUser(socket.userId, users);
    if (user && user.roomId) {
      console.log(PLAY_VIDEO, socket.userId, user.roomId);
      socket.to(user.roomId).emit(PLAY_VIDEO);
    }
  });

  socket.on(PAUSE_VIDEO, () => {
    if (requestIsNotFromHost(socket, rooms)) return;

    const user = socket?.userId && getUser(socket.userId, users);
    if (user && user.roomId) {
      console.log(PAUSE_VIDEO, socket.userId, user.roomId);
      socket.to(user.roomId).emit(PAUSE_VIDEO);
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

const handleUserLeaveRoom = async (socket: CustomSocketServer) => {
  activeConnections--;
  console.log(`👻 User disconnected - User Id: ${socket.userId}`);
  const user = socket?.userId && getUser(socket.userId, users);
  if (user) {
    io.to(user.roomId).emit(SERVER_MESSAGE, {
      type: 'USER_DISCONNECTED',
      message: `A user disconnected ${user.roomId}`,
    });

    const room: Room = getRoomById(user.roomId, rooms);

    if (room) {
      const userWasHost = socket.userId === room.host;

      const newMembers = room.members.filter((member) => member.id !== socket.userId);
      const updatedRoom = updateRoom(user.roomId, rooms, { members: newMembers });
      rooms[user.roomId] = updatedRoom;

      const TWO_MINUTES = 2 * 60 * 1000;

      if (newMembers.length === 0) {
        roomTimeouts[user.roomId] = setTimeout(async () => {
          if (updatedRoom.members.length === 0) {
            delete rooms[user.roomId];
            await prisma.rooms.delete({ where: { id: user.roomId } }).catch((err) => console.log(`failed to delete room: ${err}`));
            await prisma.messages.deleteMany({ where: { roomId: user.roomId } }).catch((err) => console.log(`failed to delete messsages: ${err}`));
            console.log(`🚀 Room ${user.roomId} has been deleted.`);
          }
        }, TWO_MINUTES);
        rooms[user.roomId] = updatedRoom;
      } else {
        roomTimeouts[user.roomId] && clearTimeout(roomTimeouts[user.roomId]);
      }

      await prisma.users.delete({ where: { id: socket.userId } }).catch((err) => console.log(`failed to delete room messages: ${err}`));
      const updatedUsers = users.filter((user) => user.id !== socket.userId);
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
    console.log('LEAVE_ROOM', user.roomId, roomInfo?.members?.length, users.length, activeConnections);
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
