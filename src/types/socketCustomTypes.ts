import type { Socket } from "socket.io";
import {
  LEAVE_ROOM,
  USER_MESSAGE,
  SERVER_MESSAGE,
  JOIN_ROOM,
  CHECK_IF_ROOM_IS_FULL,
  CHECK_IF_ROOM_EXISTS,
  SET_HOST,
  GET_USERS,
  GET_ROOM_INFO,
  CREATE_ROOM,
  PLAY_VIDEO,
  PAUSE_VIDEO,
  BUFFERING_VIDEO,
  RECONNECT_USER,
  GET_USER_INFO,
} from "../constants/socketActions";
import { ChatMessage, Room, ServerMessage, User } from "./interfaces";

export interface ServerToClientEvents {
  connect: () => void;
  disconnect: () => void;
  [JOIN_ROOM]: (roomId: string, username: string, callback: (value: boolean) => void) => void;
  [LEAVE_ROOM]: (roomId: string) => void;
  [RECONNECT_USER]: (roomId: string, userId: string, callback: (canReconnect: boolean) => void) => void;
  [USER_MESSAGE]: (message: string, roomId: string) => void;
  [SERVER_MESSAGE]: ({ message, type }: ServerMessage) => void;
  [CHECK_IF_ROOM_EXISTS]: (roomId: string, callback: (room: Room | null) => void) => void;
  [CREATE_ROOM]: (username: string, roomName: string, callback: (value: { result?: Room; error?: string }) => void) => void;
  [SET_HOST]: (host: string) => void;
  [GET_USERS]: (users: User[]) => void;
  [GET_ROOM_INFO]: (roomId: string, callback: (room: Room) => void) => void;
  [PLAY_VIDEO]: () => void;
  [PAUSE_VIDEO]: () => void;
  [BUFFERING_VIDEO]: (userId: string) => void;
}

export interface ClientToServerEvents {
  connect: () => void;
  disconnect: () => void;
  [JOIN_ROOM]: (roomId: string, username: string, callback: (value: boolean) => void) => void;
  [LEAVE_ROOM]: (roomId: string) => void;
  [SERVER_MESSAGE]: ({ message, type }: ServerMessage) => void;
  [USER_MESSAGE]: (message: ChatMessage, roomId: string) => void;
  [CHECK_IF_ROOM_IS_FULL]: (roomId: string, callback: any) => void;
  [CHECK_IF_ROOM_EXISTS]: (roomId: string, callback: (room: Room | null) => void) => void;
  [CREATE_ROOM]: (username: string, roomName: string, callback: (value: { result?: Room; error?: string }) => void) => void;
  [GET_ROOM_INFO]: (room: Room) => void;
  [GET_USER_INFO]: (user: User) => void;
  [PLAY_VIDEO]: () => void;
  [PAUSE_VIDEO]: () => void;
}

export type CustomSocket = Socket<ClientToServerEvents, ServerToClientEvents> & CustomSocketProperties;
export type CustomSocketServer = Socket<ServerToClientEvents, ClientToServerEvents> & CustomSocketProperties;

type CustomSocketProperties = {
  userId?: string;
  roomId?: string;
};
