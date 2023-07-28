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
  type: "USER";
}

export enum ServerMessageType {
  ALERT = "ALERT",
  DEFAULT = "DEFAULT",
  UPDATE = "UPDATE",
  NEW_HOST = "NEW_HOST",
  ERROR = "ERROR",
  USER_JOINED = "USER_JOINED",
  USER_DISCONNECTED = "USER_DISCONNECTED",
}

export interface ServerMessage {
  message: string;
  type: ServerMessageType;
  timestamp: string;
}

export type Message = ChatMessage | ServerMessage;
export type Messages = Message[];
