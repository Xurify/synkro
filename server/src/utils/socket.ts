import { Room, Rooms, User } from '../../../src/types/interfaces';

export const getUser = (id: string, users: User[]) => users.find((user) => user.id === id);

export const addUser = (id: string, users: User[], username: string, roomId: string) => {
  const user = { id, username, roomId };
  users.push(user);
  return user;
};

export const addRoom = (id: string, name: string, user: User) => {
  const trimmedName = name?.trim();
  const room: Room = {
    host: user.id,
    name: trimmedName,
    id,
    queue: [],
    maxRoomSize: 20,
    members: [user],
  };
  return room;
};

export const updateRoom = (id: string, rooms: Rooms, newRoom: Partial<Room>) => {
  const room = getRoomById(id, rooms);
  if (!newRoom) return room;

  const updatedRoom = {
    ...room,
    members: newRoom.members || room.members,
    ...newRoom,
  };

  return updatedRoom;
};

export const getRoomById = (roomId: string, rooms: Rooms) => {
  const room = rooms[roomId];
  return room;
};
