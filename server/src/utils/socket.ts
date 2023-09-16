import { Room, Rooms, User, RoomId, UserId } from '../../../src/types/interfaces';
import { CustomSocket } from '../../../src/types/socketCustomTypes';
import { nanoid } from 'nanoid';
import { assignUsernameChatColor } from './chat';

export const getUser = (id: string, users: User[]): User | undefined => users.find((user) => user.id === id);

export const addUser = (
  { id, username, roomId, socketId, isAdmin }: { id: string; username: string; roomId: string; socketId: string; isAdmin?: boolean },
  users: User[],
): User => {
  const created = new Date().toISOString();
  const usersInSameRoom = users.filter((user) => user.roomId === roomId);
  const user: User = { id, username, roomId, created, socketId, color: assignUsernameChatColor(usersInSameRoom), isAdmin };
  const existingUser = getUser(id, users);
  if (!existingUser) users.push(user);
  return user;
};

export const addRoom = (id: string, name: string, user: User): Room | null => {
  if (typeof name != 'string') return null;
  const trimmedName = name?.trim();
  const created = new Date().toISOString();
  const inviteCode = nanoid(5);
  const room: Room = {
    host: user.id,
    name: trimmedName,
    id,
    inviteCode,
    videoInfo: {
      currentVideoUrl: null,
      currentQueueIndex: -1,
      queue: [],
    },
    maxRoomSize: 10,
    members: [user],
    created,
    previouslyConnectedMembers: [{ userId: user.id, username: user.username }],
  };
  return room;
};

export const updateRoom = (id: string, rooms: Rooms, newRoom: Partial<Room>): Room => {
  const room = getRoomById(id, rooms);
  if (!newRoom) return room;

  const updatedRoom = {
    ...room,
    ...newRoom,
  };

  return updatedRoom;
};

export const getRoomById = (roomId: string, rooms: Rooms): Room => {
  const room = rooms[roomId];
  return room;
};

export const getRoomByInviteCode = (inviteCode: string, rooms: Rooms): Room | undefined => {
  const room = Object.values(rooms).find((room) => room.inviteCode === inviteCode);
  return room;
};

export const requestIsNotFromHost = (socket: CustomSocket, rooms: Rooms, adminCheck?: boolean): boolean => {
  if (adminCheck && socket.isAdmin) return false;
  const room = !!socket?.roomId && getRoomById(socket.roomId, rooms);
  return room && socket.userId !== room.host;
};

export const getPreviouslyConnectedUser = (userId: UserId, room: Room): { userId: string; username: string } | null => {
  if (!userId || !room) return null;
  const users = room.previouslyConnectedMembers;
  if (!users) return null;
  const result = users.find((user) => user.userId === userId) ?? null;
  return result;
};

export const getPreviouslyConnectedUsers = (roomId: RoomId, rooms: Rooms): { userId: string; username: string }[] | null => {
  if (!roomId || !rooms?.[roomId]) return null;
  const result = rooms[roomId].members.map((user) => {
    return { userId: user.id, username: user.username };
  });

  return result;
};
