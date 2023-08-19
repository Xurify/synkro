export type UserId = string;
export type RoomId = string;

export interface User {
  id: UserId;
  socketId: string;
  username: string;
  roomId: RoomId;
  created: string;
}

export interface Room {
  id: string;
  name: string;
  host: string;
  videoQueue: VideoQueueItem[];
  members: User[];
  previouslyConnectedMembers: { userId: UserId; username: string }[];
  maxRoomSize: number;
  created: string;
}

export type Rooms = { [roomId: RoomId]: Room };

export interface ChatMessage {
  username: string;
  message: string;
  id: string;
  userId: UserId;
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
  //id: string;
}

export type Message = ChatMessage | ServerMessage;
export type Messages = Message[];

export interface VideoQueueItem {
  id: string;
  name: string;
  url: string;
  thumbnail: string;
}
