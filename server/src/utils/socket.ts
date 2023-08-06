import { Room, Rooms, User, RoomId, UserId } from '../../../src/types/interfaces';
import { CustomSocket } from '../../../src/types/socketCustomTypes';

export const getUser = (id: string, users: User[]): User | undefined => users.find((user) => user.id === id);

export const addUser = (
  { id, username, roomId, socketId }: { id: string; username: string; roomId: string; socketId: string },
  users: User[],
): User => {
  const created = new Date().toISOString();
  const user: User = { id, username, roomId, created, socketId };
  users.push(user);
  return user;
};

export const addRoom = (id: string, name: string, user: User): Room | null => {
  if (typeof name != 'string') return null;
  const trimmedName = name?.trim();
  const created = new Date().toISOString();
  const room: Room = {
    host: user.id,
    name: trimmedName,
    id,
    queue: [],
    maxRoomSize: 20,
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

export const requestIsNotFromHost = (socket: CustomSocket, rooms: Rooms): boolean => {
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
