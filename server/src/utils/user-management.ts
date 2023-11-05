import { Room, Rooms, User, RoomId, UserId } from '../../../src/types/interfaces';
import { CustomSocket } from '../../../src/types/socketCustomTypes';
import { assignUsernameChatColor } from './chat';

export const addUser = (
  { id, username, roomId, socketId, isAdmin }: { id: string; username: string; roomId: string; socketId: string; isAdmin?: boolean },
  users: Map<string, User>,
): User => {
  const created = new Date().toISOString();
  const usersInSameRoom = Array.from(users.values()).filter((user) => user.roomId === roomId);
  const user: User = { id, username, roomId, created, socketId, color: assignUsernameChatColor(usersInSameRoom), isAdmin };
  const existingUser = users.get(id);
  if (!existingUser) users.set(id, user);
  return user;
};

export const requestIsNotFromHost = (socket: CustomSocket, rooms: Map<string, Room>, adminCheck: boolean = true): boolean => {
  if (adminCheck && socket.isAdmin) return false;
  const room = !!socket?.roomId && rooms.get(socket.roomId);
  return Boolean(room && socket.userId !== room.host);
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
