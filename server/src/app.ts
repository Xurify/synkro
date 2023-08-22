import express, { Application } from 'express';
import { createServer, Server as HttpServer } from 'http';
import { v4 as uuidv4 } from 'uuid';
import shortid from 'shortid';
import { Server } from 'socket.io';
import { Room, User, VideoQueueItem } from '../../src/types/interfaces';
import { CustomSocketServer } from '../../src/types/socketCustomTypes';
import { addRoom, addUser, getPreviouslyConnectedUser, getRoomById, getUser, requestIsNotFromHost, updateRoom } from './utils/socket';
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
  USER_RECONNECTED,
  USER_DISCONNECTED,
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
} from '../../src/constants/socketActions';

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

  socket.on(CREATE_ROOM, (username, roomName, callback: (value: { result?: Room; error?: string }) => void) => {
    const newRoomId = shortid.generate();
    if (userId) {
      const room: Room = getRoomById(newRoomId, rooms);
      if (room) {
        typeof callback === 'function' && callback({ error: 'Room already exists' });
      } else {
        if (!socket.userId) return;
        const user = addUser({ id: socket.userId, username, roomId: newRoomId, socketId: socket.id }, users);
        socket.join(newRoomId);
        socket.roomId = newRoomId;
        const newRoom = addRoom(newRoomId, roomName, user);
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

  socket.on(JOIN_ROOM, (roomId: string, username: string, callback: (value: boolean) => void) => {
    if (roomId && username && socket.userId) {
      const existingRoom: Room = getRoomById(roomId, rooms);
      if (!existingRoom) {
        typeof callback === 'function' && callback(false);
      }

      socket.join(roomId);

      const existingUser = getUser(socket.userId, users);

      if (existingUser) {
        io.to(roomId).emit(SERVER_MESSAGE, {
          type: USER_RECONNECTED,
          message: `${existingUser.username} reconnected`,
        });
        return;
      }

      const user = addUser({ id: socket.userId, username, roomId, socketId: socket.id }, users);

      const room: Room = getRoomById(roomId, rooms);
      if (room) {
        const userExistsInRoomMembers = room.members.find((member) => member.id === user.id);
        const newMembers = userExistsInRoomMembers ? room.members : [...room.members, user];
        const updatedRoom = updateRoom(roomId, rooms, {
          ...room,
          members: newMembers,
          previouslyConnectedMembers: [{ userId: user.id, username: user.username }],
        });
        rooms[roomId] = updatedRoom;
        socket.roomId = roomId;
        if (roomTimeouts[roomId]) {
          clearTimeout(roomTimeouts[roomId]);
          roomTimeouts[roomId] = undefined;
        }
        typeof callback === 'function' && callback(false);
        socket.emit(GET_ROOM_INFO, updatedRoom);
        console.log(`👀 New user joined in room: ${roomId} - User Id: ${userId}`);
      }
    } else {
      typeof callback === 'function' && callback(false);
    }
  });

  socket.on(RECONNECT_USER, (roomId: string, userId: string, callback: (value: boolean) => void) => {
    if (roomId && userId) {
      const existingRoom: Room = getRoomById(roomId, rooms);

      if (!existingRoom) {
        typeof callback === 'function' && callback(false);
      }

      socket.userId = userId;
      socket.roomId = roomId;
      socket.join(roomId);

      const previouslyConnectedUser = getPreviouslyConnectedUser(userId, existingRoom);

      if (previouslyConnectedUser) {
        io.to(roomId).emit(SERVER_MESSAGE, {
          type: USER_RECONNECTED,
          message: `${previouslyConnectedUser.username} reconnected`,
        });

        const user: User = addUser(
          {
            id: userId,
            username: previouslyConnectedUser.username,
            roomId: roomId,
            socketId: socket.id,
          },
          users,
        );

        const newMembers = previouslyConnectedUser ? [...existingRoom.members, user] : existingRoom.members;
        const updatedRoom = updateRoom(roomId, rooms, { ...existingRoom, members: newMembers });
        rooms[roomId] = updatedRoom;
        if (roomTimeouts[roomId]) {
          clearTimeout(roomTimeouts[roomId]);
          roomTimeouts[roomId] = undefined;
        }
        socket.emit(GET_ROOM_INFO, updatedRoom);
      }
    } else {
      typeof callback === 'function' && callback(false);
    }
  });

  socket.on(USER_MESSAGE, (message: string, roomId: string) => {
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
        type: 'USER',
      });
    }
  });

  socket.on(GET_VIDEO_INFORMATION, () => {
    if (!requestIsNotFromHost(socket, rooms)) return;
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
    }
  });

  socket.on(PAUSE_VIDEO, () => {
    if (requestIsNotFromHost(socket, rooms)) return;

    const user = socket?.userId && getUser(socket.userId, users);
    if (user && user.roomId) {
      socket.to(user.roomId).emit(PAUSE_VIDEO);
    }
  });

  socket.on(BUFFERING_VIDEO, (time: number) => {
    const user = socket.userId && getUser(socket.userId, users);
    if (requestIsNotFromHost(socket, rooms) && user && user.roomId) {
      io.to(user.roomId).emit('USER_VIDEO_STATUS', socket.userId, 'BUFFERING');
    } else if (user && user.roomId) {
      socket.to(user.roomId).emit(SYNC_TIME, time);
    }
  });

  socket.on(REWIND_VIDEO, (time: number) => {
    if (requestIsNotFromHost(socket, rooms)) return;
    const user = socket?.userId && getUser(socket.userId, users);
    if (user && user.roomId) {
      socket.to(user.roomId).emit(REWIND_VIDEO, time);
    }
  });

  socket.on(FASTFORWARD_VIDEO, (time: number) => {
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
        room.videoInfo.currentQueueIndex = nextIndex < room.videoInfo.queue.length ? nextIndex : 0;
        io.to(user.roomId).emit(CHANGE_VIDEO, nextVideo.url);
      }
    }
  });

  socket.on(CHANGE_VIDEO, (url: string) => {
    if (requestIsNotFromHost(socket, rooms)) return;
    const user = socket?.userId && getUser(socket.userId, users);
    if (user && user?.roomId) {
      const room: Room = getRoomById(user.roomId, rooms);
      if (room) {
        room.videoInfo.currentVideoUrl = url;
      }
      socket.in(user.roomId).emit(CHANGE_VIDEO, url);
    }
  });

  socket.on(ADD_VIDEO_TO_QUEUE, (newVideo: VideoQueueItem) => {
    if (requestIsNotFromHost(socket, rooms)) return;
    const user = socket?.userId && getUser(socket.userId, users);
    if (user && user?.roomId) {
      const room: Room = getRoomById(user.roomId, rooms);
      room.videoInfo.queue = [...room.videoInfo.queue, newVideo];
      socket.to(user.roomId).emit(ADD_VIDEO_TO_QUEUE, newVideo);
    }
  });

  socket.on(REMOVE_VIDEO_FROM_QUEUE, (url: string) => {
    if (requestIsNotFromHost(socket, rooms)) return;
    const user = socket?.userId && getUser(socket.userId, users);
    if (user && user?.roomId) {
      const room: Room = getRoomById(user.roomId, rooms);
      const newVideoQueue = room.videoInfo.queue.filter((videoItem) => videoItem.url !== url);
      room.videoInfo.queue = newVideoQueue;
      socket.to(user.roomId).emit(REMOVE_VIDEO_FROM_QUEUE, url);
    }
  });

  socket.on(VIDEO_QUEUE_REORDERED, (newVideoQueue: VideoQueueItem[]) => {
    if (requestIsNotFromHost(socket, rooms)) return;
    const user = socket?.userId && getUser(socket.userId, users);
    if (user && user?.roomId) {
      const room: Room = getRoomById(user.roomId, rooms);
      room.videoInfo.queue = newVideoQueue;
      socket.to(user.roomId).emit(VIDEO_QUEUE_REORDERED, newVideoQueue);
    }
  });

  socket.on(LEAVE_ROOM, () => {
    handleUserLeaveRoom(socket);
  });

  socket.on('disconnect', () => {
    handleUserLeaveRoom(socket);
  });
});

const handleUserLeaveRoom = (socket: CustomSocketServer) => {
  activeConnections > 0 && activeConnections--;
  console.log(`👻 User disconnected - User Id: ${socket.userId}`);
  const user = socket?.userId && getUser(socket.userId, users);
  if (user) {
    io.to(user.roomId).emit(SERVER_MESSAGE, {
      type: USER_DISCONNECTED,
      message: `A user disconnected ${user.roomId}`,
    });

    const room: Room = getRoomById(user.roomId, rooms);

    if (room) {
      const userWasHost = socket.userId === room.host;

      const newMembers = room.members.filter((member) => member.id !== socket.userId);
      const updatedRoom = updateRoom(user.roomId, rooms, { members: newMembers });
      rooms[user.roomId] = updatedRoom;

      const THREE_MINUTES = 3 * 60 * 1000;

      if (newMembers.length === 0) {
        roomTimeouts[user.roomId] = setTimeout(async () => {
          if (updatedRoom.members.length === 0) {
            delete rooms[user.roomId];
            console.log(`🚀 Room ${user.roomId} has been deleted.`);
          }
        }, THREE_MINUTES);
        rooms[user.roomId] = updatedRoom;
      } else {
        roomTimeouts[user.roomId] && clearTimeout(roomTimeouts[user.roomId]);
      }

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
