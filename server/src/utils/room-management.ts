import { EventEmitter } from 'events';
import { nanoid } from 'nanoid';
import { Room, RoomId, User, UserId } from '../../../src/types/interfaces';

class RoomsSource extends EventEmitter {
  public rooms: Map<string, Room> = new Map();

  clear(): void {
    this.rooms.clear();
    this.emit('rooms:cleared');
  }

  delete(id: string): void {
    const room = this.rooms.get(id);
    if (room) {
      this.rooms.delete(id);
      this.emit('room:deleted', room);
    }
  }

  get(id: string): Room | undefined {
    return this.rooms.get(id);
  }

  has(id: string): boolean {
    return this.rooms.has(id);
  }

  set(id: string, room: Room): void {
    const existingRoom = this.rooms.get(id);
    this.rooms.set(id, room);
    this.emit(existingRoom ? 'room:updated' : 'room:added', room);
  }

  getLength(): number {
    return Array.from(this.rooms.values()).length;
  }

  getAll(): Map<string, Room> {
    return this.rooms;
  }

  getAllAsArray(): Room[] {
    return Array.from(this.rooms.values());
  }

  getPreviouslyConnectedUser = (userId: UserId, roomId: RoomId): { userId: UserId; username: string } | null => {
    if (!userId || !roomId) return null;
    const room = this.get(roomId);
    const users = room?.previouslyConnectedMembers;
    if (!users) return null;
    const result = users.find((user) => user.userId === userId) ?? null;
    return result;
  };

  getPreviouslyConnectedUsers = (roomId: RoomId): { userId: string; username: string }[] | null => {
    if (!roomId) return null;
    const room = this.get(roomId);
    const previouslyConnectedMemberIds = room?.previouslyConnectedMembers.map((member) => member.userId);
    const result =
      room?.members
        .filter((user) => previouslyConnectedMemberIds?.includes(user.id))
        .map((user) => {
          return { userId: user.id, username: user.username };
        }) ?? null;
    return result;
  };

  create(id: string, name: string, user: User): Room {
    const trimmedName = (name ?? 'Unnamed')?.trim();
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
      private: true,
      previouslyConnectedMembers: [{ userId: user.id, username: user.username }],
    };
    this.set(id, room);
    this.emit('room:added', room);
    return room;
  }

  update(id: string, newRoom: Partial<Room>): Room {
    const room = this.rooms.get(id) as Room;
    if (!newRoom) return room;

    const updatedRoom = {
      ...room,
      ...newRoom,
    };
    this.set(id, updatedRoom);
    this.emit('room:updated', updatedRoom);
    return updatedRoom;
  }

  getRoomByInviteCode(inviteCode: string): Room | undefined {
    const room = Array.from(this.rooms.values()).find((room) => room.inviteCode === inviteCode);
    return room;
  }
}

export const roomsSource = new RoomsSource();
