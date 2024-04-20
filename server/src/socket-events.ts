import { nanoid } from 'nanoid';
import { v4 as uuidv4 } from 'uuid';
import ReactPlayer from 'react-player';
import {
  SET_ADMIN,
  CHECK_IF_ROOM_EXISTS,
  CREATE_ROOM,
  GET_ROOM_INFO,
  JOIN_ROOM,
  JOIN_ROOM_BY_INVITE,
  RECONNECT_USER,
  SERVER_MESSAGE,
  USER_MESSAGE,
  GET_VIDEO_INFORMATION,
  GET_HOST_VIDEO_INFORMATION,
  SYNC_VIDEO_INFORMATION,
  PLAY_VIDEO,
  PAUSE_VIDEO,
  BUFFERING_VIDEO,
  USER_VIDEO_STATUS,
  SYNC_TIME,
  REWIND_VIDEO,
  FASTFORWARD_VIDEO,
  END_OF_VIDEO,
  CHANGE_VIDEO,
  ADD_VIDEO_TO_QUEUE,
  REMOVE_VIDEO_FROM_QUEUE,
  VIDEO_QUEUE_REORDERED,
  VIDEO_QUEUE_CLEARED,
  CHANGE_SETTINGS,
  SET_HOST,
  KICK_USER,
  LEAVE_ROOM,
} from '../../src/constants/socketActions';
import { roomsSource } from './utils/room-management';
import { requestIsNotFromHost, usersSource } from './utils/user-management';
import { Room, ServerMessageType, User, VideoStatus } from '../../src/types/interfaces';
import { CustomServer, CustomSocketServer } from '../../src/types/socketCustomTypes';

const roomTimeouts: { [roomId: string]: NodeJS.Timeout | undefined } = {};

export const handleSocketEvents = (io: CustomServer, socket: CustomSocketServer) => {
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

  if (typeof socket.userId !== 'string') return;

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
    if (typeof username !== 'string') {
      typeof callback === 'function' && callback({ error: 'Username must be of type string' });
      return;
    } else if (username.length > 80) {
      typeof callback === 'function' && callback({ error: 'Username cannot exceed the maximum character length of 80' });
      return;
    }
    const newRoomId = nanoid(6);
    if (userId) {
      const room = roomsSource.get(newRoomId);
      if (room) {
        typeof callback === 'function' && callback({ error: 'Room already exists' });
      } else {
        if (!socket.userId) return;
        const user = usersSource.createUser({ id: socket.userId, username, roomId: newRoomId, socketId: socket.id, isAdmin: socket.isAdmin });
        console.log(`👀 New user joined in room: ${user.roomId} - User Id: ${userId}`);
        socket.join(newRoomId);
        socket.roomId = newRoomId;

        const newRoom = roomsSource.create(newRoomId, roomName, user);

        if (newRoom) {
          roomsSource.set(newRoomId, newRoom);
          typeof callback === 'function' && callback({ result: newRoom });
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
    } else if (typeof username !== 'string') {
      typeof callback === 'function' && callback({ success: false, error: 'Username must be of type string' });
      return;
    } else if (typeof roomId !== 'string') {
      typeof callback === 'function' && callback({ success: false, error: 'Room Id must be of type string' });
      return;
    } else if (username.length > 80) {
      typeof callback === 'function' && callback({ success: false, error: 'Username cannot exceed the maximum character length of 80' });
      return;
    } else if (roomId.length !== 6) {
      typeof callback === 'function' && callback({ success: false, error: 'Room Id must have a character length of 6' });
      return;
    }

    const existingRoom = roomsSource.has(roomId);
    if (!existingRoom) {
      typeof callback === 'function' && callback({ success: false, error: `Failed to find room: ${roomId}` });
      return;
    }

    const updatedRoom = addUserToRoom(io, socket, socket.userId, roomId, username);
    if (updatedRoom && typeof callback === 'function') {
      callback({ success: true });
    }
  });

  socket.on(JOIN_ROOM_BY_INVITE, (inviteCode, username, callback) => {
    if (!inviteCode || !username || !socket.userId) {
      typeof callback === 'function' && callback({ success: false, error: 'An invalid input was provided' });
      return;
    } else if (inviteCode.length !== 5) {
      typeof callback === 'function' && callback({ success: false, error: 'Invite code must have a character length of 5' });
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

    const updatedRoom = addUserToRoom(io, socket, socket.userId, room.id, username);
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

      const previouslyConnectedUser = roomsSource.getPreviouslyConnectedUser(userId, roomId);

      if (previouslyConnectedUser) {
        socket.userId = userId;
        socket.roomId = roomId;
        socket.join(roomId);

        const timestamp = new Date().toISOString();
        io.to(roomId).emit(SERVER_MESSAGE, {
          type: ServerMessageType.USER_RECONNECTED,
          message: `${previouslyConnectedUser.username} reconnected`,
          timestamp,
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
          const timestamp = new Date().toISOString();
          io.in(roomId).emit(SERVER_MESSAGE, {
            type: ServerMessageType.NEW_HOST,
            message: `${previouslyConnectedUser.username} is now the host. 👑`,
            timestamp,
          });
        }

        roomsSource.set(roomId, updatedRoom);
        if (roomTimeouts[roomId]) {
          clearTimeout(roomTimeouts[roomId]);
          delete roomTimeouts[roomId];
        }

        io.to(roomId).emit(GET_ROOM_INFO, updatedRoom);

        return;
      }

      typeof callback === 'function' && callback({ success: false, error: `You are not authorized to connect to this room: ${roomId}` });
    } else {
      const errorMessage = !roomId && !userId ? 'No room or user id was provided' : !roomId ? 'No room id was provided' : 'No user id was provided';
      typeof callback === 'function' && callback({ success: false, error: errorMessage });
    }
  });

  socket.on(USER_MESSAGE, (message, roomId) => {
    if (message.length > 500) {
      console.error(`Message length cannot be greater than 500 - UserId: ${socket.userId}`);
      return;
    }
    console.log(`📩 Received message: ${message} in ${roomId} by ${socket.userId}`);
    const user = socket.userId && usersSource.get(socket.userId);
    if (user && socket.userId) {
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
        isAdmin: socket.isAdmin || false,
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

    io.sockets.sockets.get(host.socketId)?.emit(GET_HOST_VIDEO_INFORMATION, (playing, videoUrl, elapsedVideoTime, eventCalledTime) => {
      //socket.emit(SYNC_VIDEO_INFORMATION, playing, videoUrl, time);
      socket.emit(SYNC_VIDEO_INFORMATION, playing, room.videoInfo.currentVideoUrl || videoUrl, elapsedVideoTime, eventCalledTime);
    });
  });

  socket.on(PLAY_VIDEO, () => {
    if (requestIsNotFromHost(socket, roomsSource.rooms)) return;

    const user = socket.userId && usersSource.get(socket.userId);
    if (user && user.roomId) {
      socket.to(user.roomId).emit(PLAY_VIDEO);

      socket.emit(GET_HOST_VIDEO_INFORMATION, (playing, videoUrl, elapsedVideoTime, eventCalledTime) => {
        socket.to(user.roomId).emit(SYNC_VIDEO_INFORMATION, playing, videoUrl, elapsedVideoTime, eventCalledTime);
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
    if (requestIsNotFromHost(socket, roomsSource.rooms) && user && user.roomId && socket.userId) {
      io.to(user.roomId).emit(USER_VIDEO_STATUS, socket.userId, VideoStatus.BUFFERING);
    } else if (user && user.roomId) {
      socket.to(user.roomId).emit(SYNC_TIME, time);
      socket.to(user.roomId).emit(PLAY_VIDEO);

      // const room = roomsSource.get(user.roomId);
      // if (room) {
      //   io.sockets.sockets.get(room.host)?.emit(GET_HOST_VIDEO_INFORMATION, (playing) => {
      //     socket.to(user.roomId).emit(SYNC_TIME, time);
      //     socket.to(user.roomId).emit(PLAY_VIDEO);
      //   });
      // }
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

      if (nextVideo) {
        room.videoInfo.currentQueueIndex = nextIndex < room.videoInfo.queue.length ? nextIndex : 0;
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
          io.to(room.id).emit(GET_ROOM_INFO, room);
          // TODO: TEST THIS
          io.to(room.id).emit(SYNC_VIDEO_INFORMATION, playing, videoUrl, 0, 0);
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
      room.passcode = newSettings.roomPasscode;
      room.private = newSettings.private;

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

    io.in(room.id).emit(GET_ROOM_INFO, room);
    const timestamp = new Date().toISOString();
    io.in(room.id).emit(SERVER_MESSAGE, {
      type: ServerMessageType.NEW_HOST,
      message: `${user.username} is now the host. 👑`,
      timestamp,
    });
  });

  socket.on(KICK_USER, (userId) => {
    if (requestIsNotFromHost(socket, roomsSource.rooms)) return;
    if (!socket.roomId) return;

    const user = usersSource.get(userId);
    if (!user || user.isAdmin) return;

    handleUserDisconnect(userId, io);
    io.sockets.sockets.get(user.socketId)?.emit(KICK_USER);
    io.sockets.sockets.get(user.socketId)?.leave(user.roomId);
  });

  socket.on(LEAVE_ROOM, () => {
    if (socket.userId) {
      handleUserDisconnect(socket.userId, io);
      socket.roomId && socket?.emit(LEAVE_ROOM);
      socket.roomId && socket.leave(socket.roomId);
      socket.userId = undefined;
      socket.roomId = undefined;
    }
  });

  socket.on('disconnect', () => {
    if (socket.userId) {
      handleUserDisconnect(socket.userId, io);
      socket.roomId && socket.leave(socket.roomId);
      socket.userId = undefined;
      socket.roomId = undefined;
    }
  });
};

const handleUserDisconnect = (userId: string, io: CustomServer) => {
  if (!userId) return;

  const user = usersSource.get(userId);
  if (user) {
    const timestamp = new Date().toISOString();
    io.to(user.roomId).emit(SERVER_MESSAGE, {
      type: ServerMessageType.USER_DISCONNECTED,
      message: `${user.username} has disconnected`,
      timestamp,
    });

    const room = roomsSource.get(user.roomId);

    if (room) {
      const userWasHost = userId === room.host;

      const newMembers = room.members.filter((member) => member.id !== userId);
      const updatedRoom = roomsSource.update(user.roomId, { members: newMembers });
      roomsSource.set(user.roomId, updatedRoom);

      const THREE_MINUTES = 3 * 60 * 1000;

      if (newMembers.length === 0) {
        roomsSource.set(user.roomId, { ...updatedRoom, members: [] });
        roomTimeouts[user.roomId] = setTimeout(async () => {
          if (updatedRoom.members.length === 0) {
            roomsSource.delete(user.roomId);
            console.log(`🧼 Cleanup: Room ${user.roomId} has been deleted.`);
          }
        }, THREE_MINUTES);
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
        roomsSource.set(user.roomId, updatedRoom);

        const timestamp = new Date().toISOString();
        io.in(room.id).emit(SERVER_MESSAGE, {
          type: ServerMessageType.NEW_HOST,
          message: `${newMembers[0].username} is now the host. 👑`,
          timestamp,
        });
      }

      io.to(room.id).emit(GET_ROOM_INFO, updatedRoom);
    }

    const roomInfo = roomsSource.get(user.roomId);
    const activeConnections = io.sockets.sockets.size;
    console.log(
      `👻 User disconnected - User Id: ${userId} - Room Id: ${user.roomId}`,
      roomInfo?.members?.length,
      usersSource.getLength(),
      activeConnections,
    );
  }
};

const addUserToRoom = (io: CustomServer, socket: CustomSocketServer, userId: string, roomId: string, username: string): Room | null => {
  const room = roomsSource.get(roomId);
  if (!room) return null;

  console.log(`👀 New user joined in room: ${roomId} - User Id: ${userId}`);

  socket.join(roomId);
  socket.roomId = roomId;

  const existingUser = usersSource.get(userId);
  if (existingUser) {
    const timestamp = new Date().toISOString();
    io.to(roomId).emit(SERVER_MESSAGE, {
      type: ServerMessageType.USER_RECONNECTED,
      message: `${existingUser.username} has reconnected`,
      timestamp,
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

  const timestamp = new Date().toISOString();
  io.to(roomId).emit(SERVER_MESSAGE, {
    type: ServerMessageType.USER_JOINED,
    message: `${username} has joined the room`,
    timestamp,
  });

  return updatedRoom;
};
