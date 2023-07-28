export interface User {
  id: string;
  username: string;
  roomId: string;
  created: string;
}

export interface Room {
  id: string;
  name: string;
  host: string;
  queue: Queue[];
  members: User[];
  maxRoomSize: number;
  created: string;
}

export type Rooms = { [roomId: string]: Room };

interface Queue {}

export interface ChatMessage {
  username: string;
  message: string;
  id: string;
  userId: string;
  timestamp: string;
}
