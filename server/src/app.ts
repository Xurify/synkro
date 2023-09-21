import express, { Application } from 'express';
import { createServer, Server as HttpServer } from 'http';
import { v4 as uuidv4 } from 'uuid';
import { nanoid } from 'nanoid';
import { Server } from 'socket.io';
import ReactPlayer from 'react-player';
import { Room, Rooms, ServerMessageType, User } from '../../src/types/interfaces';
import { CustomSocketServer } from '../../src/types/socketCustomTypes';
import {
  addRoom,
  addUser,
  getPreviouslyConnectedUser,
  getRoomById,
  getRoomByInviteCode,
  getUser,
  requestIsNotFromHost,
  updateRoom,
} from './utils/socket';
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

const io: Server = new Server(server);

let users: User[] = [];
const rooms: { [roomId: string]: Room } = {};

const roomTimeouts: { [roomId: string]: NodeJS.Timeout | undefined } = {};

let activeConnections = 0;

io.on('connection', (socket: CustomSocketServer) => {
  activeConnections++;

  const userId = socket.handshake.auth.token;
  const adminTokenHandshake = socket.handshake.auth.adminToken;
  const adminToken = process.env.ADMIN_TOKEN;

  //const roomId = socket.handshake.query.roomId as string | undefined;
  //const userId = socket.handshake.query.userId as string | undefined;
  //const username = socket.handshake.query.username as string | undefined;
  //const roomName = socket.handshake.query.roomName as string | undefined;

  if (!userId) {
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
    const room = getRoomById(roomId, rooms);
    typeof callback === 'function' && callback(room);
  });

  socket.on(CREATE_ROOM, async (username, roomName, callback) => {
    const newRoomId = nanoid(6);
    if (userId) {
      const room: Room = getRoomById(newRoomId, rooms);
      if (room) {
        typeof callback === 'function' && callback({ error: 'Room already exists' });
      } else {
        if (!socket.userId) return;
        const user = addUser({ id: socket.userId, username, roomId: newRoomId, socketId: socket.id, isAdmin: socket.isAdmin }, users);
        socket.join(newRoomId);
        socket.roomId = newRoomId;

        const newRoom = addRoom(newRoomId, roomName, user);
        startCleanupInterval();
        if (newRoom) {
          rooms[newRoomId] = newRoom;
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

    const existingRoom = getRoomById(roomId, rooms);
    if (!existingRoom) {
      typeof callback === 'function' && callback({ success: false, error: `Failed to find room: ${roomId}` });
      return;
    }

    const updatedRoom = addUserToRoom(socket, socket.userId, roomId, username, rooms, users);
    if (updatedRoom && typeof callback === 'function') {
      callback({ success: true });
    }
  });

  socket.on(JOIN_ROOM_BY_INVITE, (inviteCode, username, callback) => {
    if (!inviteCode || !username || !socket.userId) {
      typeof callback === 'function' && callback({ success: false, error: 'An invalid input was provided' });
      return;
    }

    const room = getRoomByInviteCode(inviteCode, rooms);
    if (!room) {
      typeof callback === 'function' &&
        callback({
          success: false,
          error: 'Invite code is invalid or this room no longer exists',
        });
      return;
    }

    const updatedRoom = addUserToRoom(socket, socket.userId, room.id, username, rooms, users);
    if (updatedRoom && typeof callback === 'function') {
      callback({ success: true, roomId: room.id });
    }
  });

  socket.on(RECONNECT_USER, (roomId, userId, callback) => {
    if (roomId && userId) {
      const existingRoom: Room = getRoomById(roomId, rooms);

      if (!existingRoom) {
        typeof callback === 'function' && callback({ success: false, error: `Failed to find room: ${roomId}` });
        return;
      }

      socket.userId = userId;
      socket.roomId = roomId;
      socket.join(roomId);

      const previouslyConnectedUser = getPreviouslyConnectedUser(userId, existingRoom);

      if (previouslyConnectedUser) {
        io.to(roomId).emit(SERVER_MESSAGE, {
          type: ServerMessageType.USER_RECONNECTED,
          message: `${previouslyConnectedUser.username} reconnected`,
        });

        const user: User = addUser(
          {
            id: userId,
            username: previouslyConnectedUser.username,
            roomId: roomId,
            socketId: socket.id,
            isAdmin: socket.isAdmin,
          },
          users,
        );

        const userExistsInRoomMembers = existingRoom.members.find((member) => member.id === user.id);
        const newMembers = userExistsInRoomMembers ? existingRoom.members : [...existingRoom.members, user];
        const updatedRoom = updateRoom(roomId, rooms, {
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

        rooms[roomId] = updatedRoom;
        if (roomTimeouts[roomId]) {
          clearTimeout(roomTimeouts[roomId]);
          delete roomTimeouts[roomId];
        }
        io.to(roomId).emit(GET_ROOM_INFO, updatedRoom);
      }
    } else {
      typeof callback === 'function' && callback({ success: false, error: 'An invalid input was provided' });
    }
  });

  socket.on(USER_MESSAGE, (message, roomId) => {
    console.log(`📩 Received message: ${message} in ${roomId} by ${socket.userId}`);
    const user = socket.userId && getUser(socket.userId, users);
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
    if (!requestIsNotFromHost(socket, rooms, false)) return;
    if (!socket?.roomId) return;

    const room: Room = getRoomById(socket.roomId, rooms);
    const host = getUser(room.host, users);

    if (!host) return;

    io.sockets.sockets.get(host.socketId)?.emit(GET_HOST_VIDEO_INFORMATION, (playing: boolean, videoUrl: string, time: number) => {
      socket.emit(SYNC_VIDEO_INFORMATION, playing, videoUrl, time);
    });
  });

  socket.on(PLAY_VIDEO, () => {
    if (requestIsNotFromHost(socket, rooms)) return;

    const user = socket.userId && getUser(socket.userId, users);
    if (user && user.roomId) {
      socket.to(user.roomId).emit(PLAY_VIDEO);

      socket.emit(GET_HOST_VIDEO_INFORMATION, (playing: boolean, videoUrl: string, time: number) => {
        socket.to(user.roomId).emit(SYNC_VIDEO_INFORMATION, playing, videoUrl, time);
      });
    }
  });

  socket.on(PAUSE_VIDEO, () => {
    if (requestIsNotFromHost(socket, rooms)) return;

    const user = socket?.userId && getUser(socket.userId, users);
    if (user && user.roomId) {
      socket.to(user.roomId).emit(PAUSE_VIDEO);
    }
  });

  socket.on(BUFFERING_VIDEO, (time) => {
    const user = socket.userId && getUser(socket.userId, users);
    if (requestIsNotFromHost(socket, rooms) && user && user.roomId) {
      io.to(user.roomId).emit('USER_VIDEO_STATUS', socket.userId, 'BUFFERING');
    } else if (user && user.roomId) {
      socket.to(user.roomId).emit(SYNC_TIME, time);
    }
  });

  socket.on(REWIND_VIDEO, (time) => {
    if (requestIsNotFromHost(socket, rooms)) return;
    const user = socket?.userId && getUser(socket.userId, users);
    if (user && user.roomId) {
      socket.to(user.roomId).emit(REWIND_VIDEO, time);
    }
  });

  socket.on(FASTFORWARD_VIDEO, (time) => {
    if (requestIsNotFromHost(socket, rooms)) return;
    const user = socket?.userId && getUser(socket.userId, users);
    if (user && user.roomId) {
      socket.to(user.roomId).emit(FASTFORWARD_VIDEO, time);
    }
  });

  socket.on(END_OF_VIDEO, () => {
    if (requestIsNotFromHost(socket, rooms)) return;
    const user = socket?.userId && getUser(socket.userId, users);
    if (user && user?.roomId) {
      const room: Room = getRoomById(user.roomId, rooms);
      const nextVideo = room.videoInfo.queue[room.videoInfo.currentQueueIndex + 1] ?? room.videoInfo.queue[0];

      if (nextVideo) {
        const nextIndex = room.videoInfo.currentQueueIndex + 1;
        room.videoInfo.currentQueueIndex = nextIndex < room.videoInfo.queue.length - 1 ? nextIndex : 0;
        room.videoInfo.currentVideoUrl = nextVideo.url;
        io.to(user.roomId).emit(CHANGE_VIDEO, nextVideo.url);
      }
    }
  });

  socket.on(CHANGE_VIDEO, (url, newIndex) => {
    if (!ReactPlayer.canPlay(url)) return;
    if (requestIsNotFromHost(socket, rooms)) return;
    const user = socket?.userId && getUser(socket.userId, users);
    if (user && user?.roomId) {
      const room: Room = getRoomById(user.roomId, rooms);
      if (room) {
        room.videoInfo.currentVideoUrl = url;
        if (typeof newIndex === 'number' && newIndex > -1) {
          room.videoInfo.currentQueueIndex = newIndex;
        }
      }
      socket.in(user.roomId).emit(CHANGE_VIDEO, url);
      socket.emit(GET_HOST_VIDEO_INFORMATION, (playing: boolean, videoUrl: string) => {
        io.to(room.id).emit(SYNC_VIDEO_INFORMATION, playing, videoUrl, 0);
      });
    }
  });

  socket.on(ADD_VIDEO_TO_QUEUE, (newVideo) => {
    if (requestIsNotFromHost(socket, rooms)) return;
    const user = socket?.userId && getUser(socket.userId, users);
    if (user && user?.roomId) {
      const room: Room = getRoomById(user.roomId, rooms);
      room.videoInfo.queue = [...room.videoInfo.queue, newVideo];
      socket.to(user.roomId).emit(ADD_VIDEO_TO_QUEUE, newVideo);
    }
  });

  socket.on(REMOVE_VIDEO_FROM_QUEUE, (url) => {
    if (requestIsNotFromHost(socket, rooms)) return;
    const user = socket?.userId && getUser(socket.userId, users);
    if (user && user?.roomId) {
      const room: Room = getRoomById(user.roomId, rooms);
      const newVideoQueue = room.videoInfo.queue.filter((videoItem) => videoItem.url !== url);
      room.videoInfo.queue = newVideoQueue;
      socket.to(user.roomId).emit(REMOVE_VIDEO_FROM_QUEUE, url);
    }
  });

  socket.on(VIDEO_QUEUE_REORDERED, (newVideoQueue) => {
    if (requestIsNotFromHost(socket, rooms)) return;
    const user = socket?.userId && getUser(socket.userId, users);
    if (user && user?.roomId) {
      const room: Room = getRoomById(user.roomId, rooms);
      room.videoInfo.queue = newVideoQueue;
      socket.to(user.roomId).emit(VIDEO_QUEUE_REORDERED, newVideoQueue);
    }
  });

  socket.on(VIDEO_QUEUE_CLEARED, () => {
    if (requestIsNotFromHost(socket, rooms)) return;
    const user = socket?.userId && getUser(socket.userId, users);
    if (user && user?.roomId) {
      const room: Room = getRoomById(user.roomId, rooms);
      room.videoInfo.queue = [];
      socket.to(user.roomId).emit(VIDEO_QUEUE_REORDERED, []);
    }
  });

  socket.on(CHANGE_SETTINGS, (newSettings) => {
    if (requestIsNotFromHost(socket, rooms)) return;
    const user = socket?.userId && getUser(socket.userId, users);
    if (user && user?.roomId) {
      const room: Room = getRoomById(user.roomId, rooms);
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
    if (requestIsNotFromHost(socket, rooms)) return;
    if (!socket.roomId) return;

    const user = getUser(userId, users);
    if (!user) return;

    const room: Room = getRoomById(socket.roomId, rooms);
    room.host = userId;
    rooms[socket.roomId] = room;
    //io.in(room.id).emit(SET_HOST, room.host);
    io.in(room.id).emit(GET_ROOM_INFO, room);
    io.in(room.id).emit(SERVER_MESSAGE, {
      type: ServerMessageType.NEW_HOST,
      message: `${user.username} is now the host. 👑`,
    });
  });

  socket.on(KICK_USER, (userId) => {
    if (requestIsNotFromHost(socket, rooms)) return;
    if (!socket.roomId) return;

    const user = getUser(userId, users);
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

  activeConnections > 0 && activeConnections--;
  console.log(`👻 User disconnected - User Id: ${userId}`);
  const user = userId && getUser(userId, users);
  if (user) {
    io.to(user.roomId).emit(SERVER_MESSAGE, {
      type: ServerMessageType.USER_DISCONNECTED,
      message: `${user.username} has disconnected`,
    });

    const room: Room = getRoomById(user.roomId, rooms);

    if (room) {
      const userWasHost = userId === room.host;

      const newMembers = room.members.filter((member) => member.id !== userId);
      const updatedRoom = updateRoom(user.roomId, rooms, { members: newMembers });
      rooms[user.roomId] = updatedRoom;

      const THREE_MINUTES = 3 * 60 * 1000;

      console.log('handleUserDisconnect', userId, user.roomId, newMembers, updatedRoom);

      if (newMembers.length === 0) {
        roomTimeouts[user.roomId] = setTimeout(async () => {
          if (updatedRoom.members.length === 0) {
            delete rooms[user.roomId];
            console.log(`🧼 Cleanup: Room ${user.roomId} has been deleted.`);
          }
        }, THREE_MINUTES);
        rooms[user.roomId] = updatedRoom;
      } else {
        roomTimeouts[user.roomId] && clearTimeout(roomTimeouts[user.roomId]);
      }

      const updatedUsers = users.filter((user) => user.id !== userId);
      users = updatedUsers;

      if (userWasHost && newMembers.length > 0) {
        updatedRoom.host = newMembers[0].id;
        console.log(`TESTING - NEW HOST ${updatedRoom.host} ${newMembers.length}`);
        rooms[user.roomId] = updatedRoom;

        io.in(room.id).emit(SERVER_MESSAGE, {
          type: ServerMessageType.NEW_HOST,
          message: `${newMembers[0].username} is now the host. 👑`,
        });
      }

      io.to(room.id).emit(GET_ROOM_INFO, updatedRoom);
    }

    const roomInfo = getRoomById(user.roomId, rooms);
    console.log(LEAVE_ROOM, user.roomId, roomInfo?.members?.length, users.length, activeConnections);
  }
};

const addUserToRoom = (socket: CustomSocketServer, userId: string, roomId: string, username: string, rooms: Rooms, users: User[]): Room | null => {
  const room = getRoomById(roomId, rooms);
  if (!room) return null;

  socket.join(roomId);
  socket.roomId = roomId;

  const existingUser = getUser(userId, users);
  if (existingUser) {
    io.to(roomId).emit(SERVER_MESSAGE, {
      type: ServerMessageType.USER_RECONNECTED,
      message: `${existingUser.username} has reconnected`,
    });
    //return room;
  }

  const user = addUser({ id: userId, username, roomId, socketId: socket.id, isAdmin: socket.isAdmin }, users);

  const userExistsInRoomMembers = room.members.find((member) => member.id === user.id);
  const newMembers = userExistsInRoomMembers ? room.members : [...room.members, user];
  const updatedRoom = updateRoom(roomId, rooms, {
    ...room,
    members: newMembers,
    previouslyConnectedMembers: [...room.previouslyConnectedMembers, { userId: user.id, username: user.username }],
  });

  if (newMembers.length === 1) {
    updatedRoom.host = userId;
  }

  rooms[roomId] = updatedRoom;
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
  if (!cleanupInterval && Object.keys(rooms).length > 0) {
    cleanupInterval = setInterval(() => {
      for (const roomId in rooms) {
        if (rooms[roomId].members.length === 0) {
          delete rooms[roomId];
          console.log(`🧼 Cleanup: Room ${roomId} has been deleted.`);
        }
      }
      if (Object.keys(rooms).length === 0 && cleanupInterval) {
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
  res.json({ rooms });
});

app.get('/api/users', (_req, res) => {
  res.json({ users });
});

app.get('/api/connections', (_req, res) => {
  res.json({
    activeConnections,
    users: {
      ids: users.map((user) => user.id),
      length: users.length,
    },
    rooms: {
      ids: Object.keys(rooms),
      length: Object.keys(rooms).length,
    },
  });
});
