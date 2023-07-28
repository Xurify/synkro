import { Room, Rooms, User } from '@shared/interfaces';
import { CustomSocket } from '@shared/socketCustomTypes';

export const getUser = (id: string, users: User[]) => users.find((user) => user.id === id);

export const addUser = ({ id, username, roomId }: { id: string; username: string; roomId: string }, users: User[]): User => {
  const created = new Date().toISOString();
  const user: User = { id, username, roomId, created };
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
