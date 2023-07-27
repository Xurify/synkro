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
  CHECK_IF_ROOM_ID_EXISTS,
  SET_HOST,
  GET_USERS,
  GET_ROOM_INFO,
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
  [JOIN_ROOM]: (roomId: string, callback: (value: boolean) => void) => void;
  [LEAVE_ROOM]: (roomId: string) => void;
  [USER_MESSAGE]: (message: ChatMessage, roomId: string) => void;
  //[USER_MESSAGE]: (data: { username: string; userId: string; message: string; id: string }) => void;
  [SERVER_MESSAGE]: ({ message, type }: ServerMessage) => void;
  [SET_HOST]: (host: string) => void;
  [GET_USERS]: (users: User[]) => void;
  [GET_ROOM_INFO]: (room: Room) => void;
}

export interface ClientToServerEvents {
  [JOIN_ROOM]: (roomId: string, callback: (value: boolean) => void) => void;
  [LEAVE_ROOM]: (roomId: string) => void;
  [USER_MESSAGE]: (message: string, roomId: string) => void;
  [CHECK_IF_ROOM_IS_FULL]: (roomId: string, callback: any) => void;
  [CHECK_IF_ROOM_ID_EXISTS]: (roomId: string, callback: any) => void;
  [GET_ROOM_INFO]: (room: Room) => void;
}

export type CustomSocket = Socket<ClientToServerEvents, ServerToClientEvents> & CustomSocketProperties;
type CustomSocketProperties = {
  userId?: string;
};
