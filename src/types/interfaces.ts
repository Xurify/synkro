export type UserId = string;
export type RoomId = string;

export interface User {
  id: UserId;
  socketId: string;
  username: string;
  roomId: RoomId;
  created: string;
  color: string;
  isAdmin?: boolean;
}

export interface Room {
  id: string;
  name: string;
  host: string;
  inviteCode: string | null;
  passcode: string | null;
  videoInfo: {
    currentVideoUrl: string | null;
    currentQueueIndex: number;
    queue: VideoQueueItem[];
  };
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
  color: string;
  type: "USER";
  isAdmin: boolean;
}

export enum ServerMessageType {
  ALERT = "ALERT",
  DEFAULT = "DEFAULT",
  UPDATE = "UPDATE",
  NEW_HOST = "NEW_HOST",
  ERROR = "ERROR",
  USER_JOINED = "USER_JOINED",
  USER_DISCONNECTED = "USER_DISCONNECTED",
  USER_RECONNECTED = "USER_RECONNECTED",
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
  title: string;
  url: string;
  thumbnail: string;
}
