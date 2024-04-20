import { EventEmitter } from 'events';
import { Room, User } from '../../../src/types/interfaces';
import { CustomSocket } from '../../../src/types/socketCustomTypes';
import { assignUsernameChatColor } from './chat';

export class UsersSource extends EventEmitter {
  public users: Map<string, User> = new Map();
  public length: () => number = () => this.getLength();

  clear(): void {
    this.users.clear();
    this.emit('users:cleared');
  }

  delete(id: string): void {
    const user = this.users.get(id);
    if (user) {
      this.users.delete(id);
      this.emit('user:deleted', user);
    }
  }

  get(id: string): User | undefined {
    return this.users.get(id);
  }

  has(id: string): boolean {
    return this.users.has(id);
  }

  set(id: string, user: User): void {
    const existingUser = this.users.get(id);
    this.users.set(id, user);
    this.emit(existingUser ? 'users:updated' : 'users:added', user);
  }

  setUsers(users: Map<string, User>): void {
    this.users = users;
    this.emit('users:updated');
  }

  getLength(): number {
    return Array.from(this.users.values()).length;
  }

  getAll(): Map<string, User> {
    return this.users;
  }

  getAllAsArray(): User[] {
    return Array.from(this.users.values());
  }

  createUser = ({
    id,
    username,
    roomId,
    socketId,
    isAdmin,
  }: {
    id: string;
    username: string;
    roomId: string;
    socketId: string;
    isAdmin?: boolean;
  }): User => {
    const created = new Date().toISOString();
    const usersInSameRoom = Array.from(this.users.values()).filter((user) => user.roomId === roomId);
    const user: User = { id, username, roomId, created, socketId, color: assignUsernameChatColor(usersInSameRoom), isAdmin };
    const existingUser = this.users.get(id);
    if (!existingUser) this.users.set(id, user);
    return user;
  };
}

export const usersSource = new UsersSource();

export const requestIsNotFromHost = (socket: CustomSocket, rooms: Map<string, Room>, adminCheck: boolean = false): boolean => {
  if (adminCheck && socket.isAdmin) return false;
  const room = !!socket?.roomId && rooms.get(socket.roomId);
  return Boolean(room && socket.userId !== room.host);
};
