import { Server } from "socket.io";
import type { NextApiRequest } from "next";
import type { NextApiResponseWithSocket, ServerToClientEvents, ClientToServerEvents } from "@/types/socketCustomTypes";
import {
  CHECK_IF_ROOM_ID_EXISTS,
  CHECK_IF_ROOM_IS_FULL,
  GET_USERS,
  JOIN_ROOM,
  LEAVE_ROOM,
  SEND_USER_MESSAGE,
  SERVER_MESSAGE,
  SET_HOST,
  USER_MESSAGE,
} from "@/constants/socketActions";

import { v4 as uuidv4 } from "uuid";
import { Room, User } from "@/types/interfaces";

const getUser = (id: string, users: User[]) => users.find((user) => user.id === id);
const addUser = (id: string, users: User[], username: string, roomId: string) => {
  const user = { id, username, roomId };
  users.push(user);
  return user;
};
const addRoom = (id: string, name: string, user: User) => {
  name = name.trim();
  const room: Room = {
    host: user.id,
    name,
    id,
    queue: [],
    maxRoomSize: 20,
    members: [user],
  };
  return room;
};
const updateRoom = (id: string, rooms: Rooms, newRoom: Partial<Room>) => {
  const room = getRoomById(id, rooms);
  if (!newRoom) return room;

  const updatedRoom = {
    ...room,
    members: newRoom.members || room.members,
    ...newRoom,
  };

  return updatedRoom;
};

type Rooms = { [roomId: string]: Room };
const getRoomById = (roomId: string, rooms: Rooms) => {
  const room = rooms[roomId];
  return room;
};

export const handler = (_req: NextApiRequest, res: NextApiResponseWithSocket) => {
  let activeConnections = 0;
  let users: User[] = [];
  const rooms: { [roomId: string]: Room } = {};

  if (!res.socket.server.io) {
    console.log("Starting Socket.io server");

    const io = new Server<ClientToServerEvents, ServerToClientEvents>(res.socket.server);

    io.on("connection", (socket) => {
      activeConnections++;

      socket.on(CHECK_IF_ROOM_ID_EXISTS, (roomId, callback) => {
        const room = getRoomById(roomId, rooms);

        if (room && room.id) {
          return callback(true);
        }
        callback(false);
      });

      socket.on(CHECK_IF_ROOM_IS_FULL, (roomId, callback) => {
        const room = getRoomById(roomId, rooms);

        if (room && room.members.length === room.maxRoomSize) {
          return callback(true);
        }
        callback(false);
      });

      socket.on(JOIN_ROOM, async ({ roomId, roomName, username }) => {
        const room: Room = getRoomById(roomId, rooms);
        await socket.join(roomId);
        const user = addUser(socket.id, users, username, roomId);

        if (room) {
          const newMembers = [...room.members, user];
          const updatedRoom = updateRoom(roomId, rooms, { ...room, members: newMembers });
          rooms[roomId] = updatedRoom;
        } else {
          const newRoom = addRoom(roomId, roomName, user);
          rooms[roomId] = newRoom;
          //io.to(roomId).emit(SET_HOST, socket.id);
          // await prisma.rooms.create({
          //   data: {
          //     name: res.name,
          //     id: code,
          //   },
          // });
        }

        const clientsInRoom = io.sockets.adapter.rooms.get(roomId);
        io.to(roomId).emit(SERVER_MESSAGE, {
          type: "USER_JOINED",
          message: `${username} joined the room`,
        });
        const numberOfClientsInRoom = clientsInRoom ? clientsInRoom.size : 0;
        io.to(roomId).emit(SERVER_MESSAGE, {
          type: "UPDATE",
          message: `There ${numberOfClientsInRoom === 1 ? `is 1 user` : `are ${numberOfClientsInRoom} users`} here`,
        });
        io.to(roomId).emit(GET_USERS, users);
      });

      socket.on(SEND_USER_MESSAGE, (message, roomId) => {
        console.log(SEND_USER_MESSAGE, socket.id, message, roomId, activeConnections);
        const user = getUser(socket.id, users);
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

      socket.on(LEAVE_ROOM, async (roomId) => {
        const user = getUser(socket.id, users);
        if (user) {
          io.to(roomId).emit(SERVER_MESSAGE, {
            type: "USER_DISCONNECTED",
            message: `A user left the room ${roomId}`,
          });
          const room = getRoomById(roomId, rooms);

          if (room) {
            const newMembers = room.members.filter((member) => member.id !== socket.id);
            const updatedRoom = updateRoom(roomId, rooms, { members: newMembers });
            rooms[roomId] = updatedRoom;

            const updatedUsers = users.filter((user) => user.id !== socket.id);
            users = updatedUsers;

            await socket.leave(roomId);
          }
        }
      });

      socket.on("disconnect", () => {
        activeConnections--;
        const user = getUser(socket.id, users);

        if (user) {
          io.to(user.roomId).emit(SERVER_MESSAGE, {
            type: "USER_DISCONNECTED",
            message: `A user disconnected ${user.roomId}`,
          });

          const updatedUsers = users.filter((user) => user.id !== socket.id);
          users = updatedUsers;

          const room = getRoomById(user.roomId, rooms);

          if (room) {
            const userWasHost = socket.id === room.host;

            const newMembers = room.members.filter((member) => member.id !== socket.id);
            const updatedRoom = updateRoom(user.roomId, rooms, { members: newMembers });
            rooms[user.roomId] = updatedRoom;

            if (userWasHost && room.members.length > 0) {
              io.in(room.id).emit(SET_HOST, room.host);
              io.in(room.id).emit(SERVER_MESSAGE, {
                type: "NEW_HOST",
                message: `${room.members[0].username} is now the host. 👑`,
              });
            }
          }

          const roome = getRoomById(user.roomId, rooms);
          console.log("LEAVE_ROOM", user.roomId, roome.members.length, users.length, activeConnections);
        }
      });
    });

    res.socket.server.io = io;
  } else {
    console.log("Socket.io server already running");
  }
  res.end();
};

export const config = {
  api: {
    bodyParser: false,
  },
};

export default handler;
