import type { Server as HTTPServer } from "http";
import type { NextApiResponse } from "next";
import type { Socket as NetSocket } from "net";
import type { Server as IOServer, Socket } from "socket.io";
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
} from "../constants/socketActions";
import { ChatMessage, Room, User } from "./interfaces";

export interface SocketServer extends HTTPServer {
  io?: IOServer | undefined;
}

export interface SocketWithIO extends NetSocket {
  server: SocketServer;
}

export interface NextApiResponseWithSocket extends NextApiResponse {
  socket: SocketWithIO;
}

export type ServerMessageType = "ALERT" | "DEFAULT" | "UPDATE" | "NEW_HOST" | "ERROR" | "USER_JOINED" | "USER_DISCONNECTED";
export interface ServerMessage {
  message: string;
  type: ServerMessageType;
}

export interface ServerToClientEvents {
  connect: () => void;
  disconnect: () => void;
  [JOIN_ROOM]: (roomId: string, username: string, callback: (value: boolean) => void) => void;
  [LEAVE_ROOM]: (roomId: string) => void;
  [USER_MESSAGE]: (message: string, roomId: string) => void;
  [SERVER_MESSAGE]: ({ message, type }: ServerMessage) => void;
  [CHECK_IF_ROOM_EXISTS]: (roomId: string, callback: (room: Room | null) => void) => void;
  [CREATE_ROOM]: (username: string, roomName: string, callback: (value: { result?: Room; error?: string }) => void) => void;
  [SET_HOST]: (host: string) => void;
  [GET_USERS]: (users: User[]) => void;
  [GET_ROOM_INFO]: (roomId: string, callback: (room: Room) => void) => void;
  [PLAY_VIDEO]: () => void;
  [PAUSE_VIDEO]: () => void;
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
  [PLAY_VIDEO]: () => void;
  [PAUSE_VIDEO]: () => void;
}

export type CustomSocket = Socket<ClientToServerEvents, ServerToClientEvents> & CustomSocketProperties;
export type CustomSocketServer = Socket<ServerToClientEvents, ClientToServerEvents> & CustomSocketProperties;

type CustomSocketProperties = {
  userId?: string;
  roomId?: string;
};
