import express, { Application } from 'express';
import { createServer, Server as HttpServer } from 'http';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import { nanoid } from 'nanoid';
import { Server } from 'socket.io';
import ReactPlayer from 'react-player';
import { Room, ServerMessageType, User } from '../../src/types/interfaces';
import { CustomSocketServer } from '../../src/types/socketCustomTypes';
import { roomsSource } from './utils/room-management';
import { usersSource, requestIsNotFromHost } from './utils/user-management';

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
  RECONNECT_USER,
  REWIND_VIDEO,
  FASTFORWARD_VIDEO,
  CHANGE_VIDEO,
  BUFFERING_VIDEO,
  SYNC_TIME,
  GET_VIDEO_INFORMATION,
  SYNC_VIDEO_INFORMATION,
  GET_HOST_VIDEO_INFORMATION,
  ADD_VIDEO_TO_QUEUE,
  END_OF_VIDEO,
  REMOVE_VIDEO_FROM_QUEUE,
  VIDEO_QUEUE_REORDERED,
  JOIN_ROOM_BY_INVITE,
  CHANGE_SETTINGS,
  KICK_USER,
  SET_ADMIN,
  VIDEO_QUEUE_CLEARED,
} from '../../src/constants/socketActions';

import { config } from 'dotenv';
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

const io: Server = new Server(server, {
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

const roomTimeouts: { [roomId: string]: NodeJS.Timeout | undefined } = {};

io.on('connection', (socket: CustomSocketServer) => {
  const userId = socket.handshake.auth.token;
  const adminTokenHandshake = socket.handshake.auth.adminToken;
  const adminToken = process.env.ADMIN_TOKEN;

  if (!userId) {
    socket.disconnect();
    return;
  }

  if (usersSource.users.has(userId)) {
    socket.disconnect();
    return;
  }

  socket.userId = userId;
  socket.isAdmin = false;

  if (adminToken === adminTokenHandshake) {
    socket.isAdmin = true;
    socket.emit(SET_ADMIN);
  }

  console.log(`⚡️ New user connected - User Id: ${userId}`);

  socket.on(CHECK_IF_ROOM_EXISTS, (roomId, callback) => {
    const room = roomsSource.get(roomId);
    typeof callback === 'function' && callback(room ?? null);
  });

  socket.on(CREATE_ROOM, async (username, roomName, callback) => {
    const newRoomId = nanoid(6);
    if (userId) {
      const room = roomsSource.get(newRoomId);
      if (room) {
        typeof callback === 'function' && callback({ error: 'Room already exists' });
      } else {
        if (!socket.userId) return;
        const user = usersSource.createUser({ id: socket.userId, username, roomId: newRoomId, socketId: socket.id, isAdmin: socket.isAdmin });
        socket.join(newRoomId);
        socket.roomId = newRoomId;

        const newRoom = roomsSource.create(newRoomId, roomName, user);
        startCleanupInterval();

        if (newRoom) {
          roomsSource.set(newRoomId, newRoom);
          typeof callback === 'function' && callback({ result: newRoom });
          console.log(`👀 New user joined in room: ${user.roomId} - User Id: ${userId}`);
          socket.emit(GET_ROOM_INFO, newRoom);
        }
      }
    } else {
      typeof callback === 'function' && callback({ error: 'Failed to create room' });
    }
  });

  socket.on(JOIN_ROOM, (roomId, username, callback) => {
    if (!roomId || !username || !socket.userId) {
      typeof callback === 'function' && callback({ success: false, error: 'An invalid input was provided' });
      return;
    }

    const existingRoom = roomsSource.has(roomId);
    if (!existingRoom) {
      typeof callback === 'function' && callback({ success: false, error: `Failed to find room: ${roomId}` });
      return;
    }

    const updatedRoom = addUserToRoom(socket, socket.userId, roomId, username);
    if (updatedRoom && typeof callback === 'function') {
      callback({ success: true });
    }
  });

  socket.on(JOIN_ROOM_BY_INVITE, (inviteCode, username, callback) => {
    if (!inviteCode || !username || !socket.userId) {
      typeof callback === 'function' && callback({ success: false, error: 'An invalid input was provided' });
      return;
    }

    const room = roomsSource.getRoomByInviteCode(inviteCode);
    if (!room) {
      typeof callback === 'function' &&
        callback({
          success: false,
          error: 'Invite code is invalid or this room no longer exists',
        });
      return;
    }

    const updatedRoom = addUserToRoom(socket, socket.userId, room.id, username);
    if (updatedRoom && typeof callback === 'function') {
      callback({ success: true, roomId: room.id });
    }
  });

  socket.on(RECONNECT_USER, (roomId, userId, callback) => {
    if (roomId && userId) {
      const existingRoom = roomsSource.get(roomId);

      if (!existingRoom) {
        typeof callback === 'function' && callback({ success: false, error: `Failed to find room: ${roomId}` });
        return;
      }

      socket.userId = userId;
      socket.roomId = roomId;
      socket.join(roomId);

      const previouslyConnectedUser = roomsSource.getPreviouslyConnectedUser(userId, roomId);

      if (previouslyConnectedUser) {
        io.to(roomId).emit(SERVER_MESSAGE, {
          type: ServerMessageType.USER_RECONNECTED,
          message: `${previouslyConnectedUser.username} reconnected`,
        });

        const user: User = usersSource.createUser({
          id: userId,
          username: previouslyConnectedUser.username,
          roomId: roomId,
          socketId: socket.id,
          isAdmin: socket.isAdmin,
        });

        const userExistsInRoomMembers = existingRoom.members.find((member) => member.id === user.id);
        const newMembers = userExistsInRoomMembers ? existingRoom.members : [...existingRoom.members, user];
        const updatedRoom = roomsSource.update(roomId, {
          ...existingRoom,
          members: newMembers,
        });

        if (newMembers.length === 1) {
          updatedRoom.host = userId;
          io.in(roomId).emit(SERVER_MESSAGE, {
            type: ServerMessageType.NEW_HOST,
            message: `${previouslyConnectedUser.username} is now the host. 👑`,
          });
        }

        roomsSource.set(roomId, updatedRoom);
        if (roomTimeouts[roomId]) {
          clearTimeout(roomTimeouts[roomId]);
          delete roomTimeouts[roomId];
        }
        io.to(roomId).emit(GET_ROOM_INFO, updatedRoom);
      }
    } else {
      const errorMessage = !roomId && !userId ? 'No room or user id was provided' : !roomId ? 'No room id was provided' : 'No user id was provided';
      typeof callback === 'function' && callback({ success: false, error: errorMessage });
    }
  });

  socket.on(USER_MESSAGE, (message, roomId) => {
    console.log(`📩 Received message: ${message} in ${roomId} by ${socket.userId}`);
    const user = socket.userId && usersSource.get(socket.userId);
    if (user) {
      const timestamp = new Date().toISOString();
      const messageID = uuidv4();
      io.in(roomId).emit(USER_MESSAGE, {
        username: user.username,
        message,
        userId: socket.userId,
        id: messageID,
        timestamp,
        color: user.color,
        type: 'USER',
        isAdmin: socket.isAdmin,
      });
    }
  });

  socket.on(GET_VIDEO_INFORMATION, () => {
    if (!requestIsNotFromHost(socket, roomsSource.rooms)) return;
    if (!socket?.roomId) return;

    const room = roomsSource.get(socket.roomId);
    if (!room) return;

    const host = usersSource.get(room.host);
    if (!host) return;

    io.sockets.sockets.get(host.socketId)?.emit(GET_HOST_VIDEO_INFORMATION, (playing: boolean, videoUrl: string, time: number) => {
      socket.emit(SYNC_VIDEO_INFORMATION, playing, videoUrl, time);
    });
  });

  socket.on(PLAY_VIDEO, () => {
    if (requestIsNotFromHost(socket, roomsSource.rooms)) return;

    const user = socket.userId && usersSource.get(socket.userId);
    if (user && user.roomId) {
      socket.to(user.roomId).emit(PLAY_VIDEO);

      socket.emit(GET_HOST_VIDEO_INFORMATION, (playing: boolean, videoUrl: string, time: number) => {
        socket.to(user.roomId).emit(SYNC_VIDEO_INFORMATION, playing, videoUrl, time);
      });
    }
  });

  socket.on(PAUSE_VIDEO, () => {
    if (requestIsNotFromHost(socket, roomsSource.rooms)) return;

    const user = socket?.userId && usersSource.get(socket.userId);
    if (user && user.roomId) {
      socket.to(user.roomId).emit(PAUSE_VIDEO);
    }
  });

  socket.on(BUFFERING_VIDEO, (time) => {
    const user = socket.userId && usersSource.get(socket.userId);
    if (requestIsNotFromHost(socket, roomsSource.rooms) && user && user.roomId) {
      io.to(user.roomId).emit('USER_VIDEO_STATUS', socket.userId, 'BUFFERING');
    } else if (user && user.roomId) {
      socket.to(user.roomId).emit(SYNC_TIME, time);
    }
  });

  socket.on(REWIND_VIDEO, (time) => {
    if (requestIsNotFromHost(socket, roomsSource.rooms)) return;
    const user = socket?.userId && usersSource.get(socket.userId);
    if (user && user.roomId) {
      socket.to(user.roomId).emit(REWIND_VIDEO, time);
    }
  });

  socket.on(FASTFORWARD_VIDEO, (time) => {
    if (requestIsNotFromHost(socket, roomsSource.rooms)) return;
    const user = socket?.userId && usersSource.get(socket.userId);
    if (user && user.roomId) {
      socket.to(user.roomId).emit(FASTFORWARD_VIDEO, time);
    }
  });

  socket.on(END_OF_VIDEO, () => {
    if (requestIsNotFromHost(socket, roomsSource.rooms)) return;
    const user = socket?.userId && usersSource.get(socket.userId);
    if (user && user?.roomId) {
      const room = roomsSource.get(user.roomId);
      if (!room) return;

      const nextIndex = room.videoInfo.currentQueueIndex + 1;
      const nextVideo = room.videoInfo.queue[nextIndex] ?? room.videoInfo.queue[0];

      console.log('nextVideo1', nextVideo, nextIndex);
      if (nextVideo) {
        console.log('nextVideo2', nextVideo, nextIndex, room.videoInfo.queue.length);
        room.videoInfo.currentQueueIndex = nextIndex < room.videoInfo.queue.length ? nextIndex : 0;
        console.log('nextVideo3', nextVideo, nextIndex, room.videoInfo.queue.length);
        room.videoInfo.currentVideoUrl = nextVideo.url;
        io.to(user.roomId).emit(CHANGE_VIDEO, nextVideo.url);
      }
    }
  });

  socket.on(CHANGE_VIDEO, async (url, newIndex) => {
    if (!ReactPlayer.canPlay(url)) return;
    if (requestIsNotFromHost(socket, roomsSource.rooms)) return;
    const user = socket?.userId && usersSource.get(socket.userId);
    if (user && user?.roomId) {
      const room = roomsSource.get(user.roomId);
      if (room) {
        room.videoInfo.currentVideoUrl = url;
        if (typeof newIndex === 'number' && newIndex > -1) {
          room.videoInfo.currentQueueIndex = newIndex;
        }
        await socket.in(user.roomId).emit(CHANGE_VIDEO, url);
        socket.emit(GET_HOST_VIDEO_INFORMATION, (playing: boolean, videoUrl: string) => {
          io.to(room.id).emit(SYNC_VIDEO_INFORMATION, playing, videoUrl, 0);
        });
      }
    }
  });

  socket.on(ADD_VIDEO_TO_QUEUE, (newVideo) => {
    if (requestIsNotFromHost(socket, roomsSource.rooms)) return;
    const user = socket?.userId && usersSource.get(socket.userId);
    if (user && user?.roomId) {
      const room = roomsSource.get(user.roomId);
      if (!room) return;
      room.videoInfo.queue = [...room.videoInfo.queue, newVideo];
      socket.to(user.roomId).emit(ADD_VIDEO_TO_QUEUE, newVideo);
    }
  });

  socket.on(REMOVE_VIDEO_FROM_QUEUE, (url) => {
    if (requestIsNotFromHost(socket, roomsSource.rooms)) return;
    const user = socket?.userId && usersSource.get(socket.userId);
    if (user && user?.roomId) {
      const room = roomsSource.get(user.roomId);
      if (!room) return;
      const newVideoQueue = room.videoInfo.queue.filter((videoItem) => videoItem.url !== url);
      room.videoInfo.queue = newVideoQueue;
      socket.to(user.roomId).emit(REMOVE_VIDEO_FROM_QUEUE, url);
    }
  });

  socket.on(VIDEO_QUEUE_REORDERED, (newVideoQueue) => {
    if (requestIsNotFromHost(socket, roomsSource.rooms)) return;
    const user = socket?.userId && usersSource.get(socket.userId);
    if (user && user?.roomId) {
      const room = roomsSource.get(user.roomId);
      if (!room) return;
      room.videoInfo.queue = newVideoQueue;
      socket.to(user.roomId).emit(VIDEO_QUEUE_REORDERED, newVideoQueue);
    }
  });

  socket.on(VIDEO_QUEUE_CLEARED, () => {
    if (requestIsNotFromHost(socket, roomsSource.rooms)) return;
    const user = socket?.userId && usersSource.get(socket.userId);
    if (user && user?.roomId) {
      const room = roomsSource.get(user.roomId);
      if (!room) return;
      if (room.videoInfo.queue.length > 0) {
        room.videoInfo.queue = [];
        socket.to(user.roomId).emit(VIDEO_QUEUE_REORDERED, []);
      }
    }
  });

  socket.on(CHANGE_SETTINGS, (newSettings) => {
    if (requestIsNotFromHost(socket, roomsSource.rooms)) return;
    const user = socket?.userId && usersSource.get(socket.userId);
    if (user && user?.roomId) {
      const room = roomsSource.get(user.roomId);
      if (!room) return;
      if (newSettings.maxRoomSize && newSettings.maxRoomSize <= 20) {
        room.maxRoomSize = newSettings.maxRoomSize;
      }
      if (newSettings.roomPasscode) {
        room.passcode = newSettings.roomPasscode;
      }
      io.to(user.roomId).emit(GET_ROOM_INFO, room);
    }
  });

  socket.on(SET_HOST, (userId) => {
    if (requestIsNotFromHost(socket, roomsSource.rooms)) return;
    if (!socket.roomId) return;

    const user = usersSource.get(userId);
    if (!user) return;

    const room = roomsSource.get(user.roomId);
    if (!room) return;
    room.host = userId;
    roomsSource.set(socket.roomId, room);
    //io.in(room.id).emit(SET_HOST, room.host);
    io.in(room.id).emit(GET_ROOM_INFO, room);
    io.in(room.id).emit(SERVER_MESSAGE, {
      type: ServerMessageType.NEW_HOST,
      message: `${user.username} is now the host. 👑`,
    });
  });

  socket.on(KICK_USER, (userId) => {
    if (requestIsNotFromHost(socket, roomsSource.rooms)) return;
    if (!socket.roomId) return;

    const user = usersSource.get(userId);
    if (!user || user.isAdmin) return;

    handleUserDisconnect(userId);
    io.sockets.sockets.get(user.socketId)?.emit(KICK_USER);
    io.sockets.sockets.get(user.socketId)?.leave(user.roomId);
  });

  socket.on(LEAVE_ROOM, () => {
    if (socket.userId) {
      handleUserDisconnect(socket.userId);
      socket.roomId && socket?.emit(LEAVE_ROOM);
      socket.roomId && socket.leave(socket.roomId);
      socket.userId = undefined;
      socket.roomId = undefined;
    }
  });

  socket.on('disconnect', () => {
    if (socket.userId) {
      handleUserDisconnect(socket.userId);
      socket.roomId && socket.leave(socket.roomId);
      socket.userId = undefined;
      socket.roomId = undefined;
    }
  });
});

const handleUserDisconnect = (userId: string) => {
  if (!userId) return;

  console.log(`👻 User disconnected - User Id: ${userId}`);
  const user = usersSource.get(userId);
  if (user) {
    io.to(user.roomId).emit(SERVER_MESSAGE, {
      type: ServerMessageType.USER_DISCONNECTED,
      message: `${user.username} has disconnected`,
    });

    const room = roomsSource.get(user.roomId);

    if (room) {
      const userWasHost = userId === room.host;

      const newMembers = room.members.filter((member) => member.id !== userId);
      const updatedRoom = roomsSource.update(user.roomId, { members: newMembers });
      roomsSource.set(user.roomId, updatedRoom);

      const THREE_MINUTES = 3 * 60 * 1000;

      console.log('handleUserDisconnect', userId, user.roomId, newMembers, updatedRoom);

      if (newMembers.length === 0) {
        roomTimeouts[user.roomId] = setTimeout(async () => {
          if (updatedRoom.members.length === 0) {
            roomsSource.delete(user.roomId);
            console.log(`🧼 Cleanup: Room ${user.roomId} has been deleted.`);
          }
        }, THREE_MINUTES);
        roomsSource.set(user.roomId, updatedRoom);
      } else {
        roomTimeouts[user.roomId] && clearTimeout(roomTimeouts[user.roomId]);
      }

      const updatedUsers = new Map(
        Array.from(usersSource.users.values())
          .filter((user) => user.id !== userId)
          .map((user) => [user.id, user]),
      );
      usersSource.setUsers(updatedUsers);

      if (userWasHost && newMembers.length > 0) {
        updatedRoom.host = newMembers[0].id;
        console.log(`TESTING - NEW HOST ${updatedRoom.host} ${newMembers.length}`);
        roomsSource.set(user.roomId, updatedRoom);

        io.in(room.id).emit(SERVER_MESSAGE, {
          type: ServerMessageType.NEW_HOST,
          message: `${newMembers[0].username} is now the host. 👑`,
        });
      }

      io.to(room.id).emit(GET_ROOM_INFO, updatedRoom);
    }

    const roomInfo = roomsSource.get(user.roomId);
    const activeConnections = io.sockets.sockets.size;
    console.log(LEAVE_ROOM, user.roomId, roomInfo?.members?.length, usersSource.getLength(), activeConnections);
  }
};

const addUserToRoom = (socket: CustomSocketServer, userId: string, roomId: string, username: string): Room | null => {
  const room = roomsSource.get(roomId);
  if (!room) return null;

  socket.join(roomId);
  socket.roomId = roomId;

  const existingUser = usersSource.get(userId);
  if (existingUser) {
    io.to(roomId).emit(SERVER_MESSAGE, {
      type: ServerMessageType.USER_RECONNECTED,
      message: `${existingUser.username} has reconnected`,
    });
    //return room;
  }

  const user = usersSource.createUser({ id: userId, username, roomId, socketId: socket.id, isAdmin: socket.isAdmin });

  const userExistsInRoomMembers = room.members.find((member) => member.id === user.id);
  const newMembers = userExistsInRoomMembers ? room.members : [...room.members, user];
  const updatedRoom = roomsSource.update(roomId, {
    ...room,
    members: newMembers,
    previouslyConnectedMembers: [...room.previouslyConnectedMembers, { userId: user.id, username: user.username }],
  });

  if (newMembers.length === 1) {
    updatedRoom.host = userId;
  }

  roomsSource.set(roomId, updatedRoom);
  if (roomTimeouts[roomId]) {
    clearTimeout(roomTimeouts[roomId]);
    roomTimeouts[roomId] = undefined;
  }

  io.to(roomId).emit(GET_ROOM_INFO, updatedRoom);
  console.log(`👀 New user joined in room: ${roomId} - User Id: ${userId}`);
  io.to(roomId).emit(SERVER_MESSAGE, {
    type: ServerMessageType.USER_JOINED,
    message: `${username} has joined the room`,
  });
  return updatedRoom;
};

const CLEANUP_INTERVAL = 4 * 60 * 1000;
let cleanupInterval: NodeJS.Timeout | null = null;

const startCleanupInterval = () => {
  if (!cleanupInterval && roomsSource.getLength() > 0) {
    cleanupInterval = setInterval(() => {
      for (const roomId in roomsSource.rooms) {
        if (roomsSource.get(roomId)?.members.length === 0) {
          roomsSource.delete(roomId);
          console.log(`🧼 Cleanup: Room ${roomId} has been deleted.`);
        }
      }
      if (roomsSource.getLength() === 0 && cleanupInterval) {
        clearInterval(cleanupInterval);
        cleanupInterval = null;
        console.log('🛑 Cleanup interval stopped as there are no rooms left.');
      }
    }, CLEANUP_INTERVAL);
  }
};

server.listen(PORT, () => {
  console.log(`🚀 WebSocket server is running on http://localhost:${PORT}`);
});

app.get('/api/healthz', (_req, res) => {
  res.send({ status: 'ok' });
});

app.get('/api/rooms', (_req, res) => {
  res.json({ rooms: Object.fromEntries(roomsSource.rooms.entries()) });
});

app.get('/api/users', (_req, res) => {
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

app.get('/api/public-rooms', function (req, res) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });

  const rooms = roomsSource.getAllAsArray();
  res.write(`data: ${JSON.stringify({ type: 'rooms', rooms: rooms })}\n\n`);

  // TODO: MIGHT NOT WANT TO SEND ALL THE ROOMS
  const onQueueUpdate = () => {
    const rooms = roomsSource.getAllAsArray();
    res.write(`data: ${JSON.stringify({ type: 'rooms', rooms: rooms })}\n\n`);
  };

  roomsSource.on('room:added', onQueueUpdate);
  roomsSource.on('room:updated', onQueueUpdate);
  roomsSource.on('rooms:cleared', onQueueUpdate);
  roomsSource.on('room:deleted', onQueueUpdate);

  req.on('close', () => {
    console.log('ONCLOSE');
    roomsSource.removeListener('room:added', onQueueUpdate);
    roomsSource.removeListener('room:updated', onQueueUpdate);
    roomsSource.removeListener('rooms:cleared', onQueueUpdate);
    roomsSource.removeListener('room:deleted', onQueueUpdate);
  });
});
