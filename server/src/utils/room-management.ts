import { Room, User } from '../../../src/types/interfaces';
import { nanoid } from 'nanoid';

export const addRoom = (id: string, name: string, user: User): Room => {
  const trimmedName = (name ?? '')?.trim();
  const created = new Date().toISOString();
  const inviteCode = nanoid(5);
  const room: Room = {
    host: user.id,
    name: trimmedName,
    id,
    inviteCode,
    videoInfo: {
      currentVideoUrl: 'https://youtu.be/QdKhuEnkwiY',
      currentQueueIndex: -1,
      queue: [],
    },
    maxRoomSize: 10,
    members: [user],
    passcode: null,
    created,
    previouslyConnectedMembers: [{ userId: user.id, username: user.username }],
  };
  return room;
};

export const updateRoom = (id: string, rooms: Map<string, Room>, newRoom: Partial<Room>): Room => {
  const room = rooms.get(id) as Room;
  if (!newRoom) return room;

  const updatedRoom = {
    ...room,
    ...newRoom,
  };

  return updatedRoom;
};

export const getRoomByInviteCode = (inviteCode: string, rooms: Map<string, Room>): Room | undefined => {
  const room = Array.from(rooms.values()).find((room) => room.inviteCode === inviteCode);
  return room;
};
