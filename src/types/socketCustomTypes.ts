import { Socket, Server } from "socket.io";
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
  FASTFORWARD_VIDEO,
  REWIND_VIDEO,
  CHANGE_VIDEO,
  SYNC_TIME,
  SYNC_VIDEO_INFORMATION,
  GET_VIDEO_INFORMATION,
  GET_HOST_VIDEO_INFORMATION,
  ADD_VIDEO_TO_QUEUE,
  END_OF_VIDEO,
  REMOVE_VIDEO_FROM_QUEUE,
  VIDEO_QUEUE_REORDERED,
  CHANGE_SETTINGS,
  JOIN_ROOM_BY_INVITE,
  KICK_USER,
  SET_ADMIN,
  VIDEO_QUEUE_CLEARED,
  USER_VIDEO_STATUS,
} from "../constants/socketActions";
import { ChatMessage, Room, ServerMessage, User, VideoQueueItem, VideoStatus } from "./interfaces";

export interface ClientToServerEvents {
  connect: () => void;
  disconnect: () => void;
  [JOIN_ROOM]: (
    roomId: string,
    username: string,
    callback: (value: { success: boolean; error?: string }) => void
  ) => void;
  [LEAVE_ROOM]: (roomId: string) => void;
  [RECONNECT_USER]: (
    roomId: string,
    userId: string | null,
    callback: (value: { success: boolean; error?: string }) => void
  ) => void;
  [USER_MESSAGE]: (message: string, roomId: string) => void;
  [SERVER_MESSAGE]: ({ message, type }: ServerMessage) => void;
  [CHECK_IF_ROOM_EXISTS]: (roomId: string, callback: (room: Room | null) => void) => void;
  [CREATE_ROOM]: (
    username: string,
    roomName: string,
    callback: (value: { result?: Room; error?: string }) => void
  ) => void;
  [SET_HOST]: (host: string) => void;
  [KICK_USER]: (userId: string) => void;
  [GET_USERS]: (users: User[]) => void;
  [GET_ROOM_INFO]: (roomId: string, callback: (room: Room) => void) => void;
  [PLAY_VIDEO]: () => void;
  [PAUSE_VIDEO]: () => void;
  [FASTFORWARD_VIDEO]: (newTime: number) => void;
  [REWIND_VIDEO]: (newTime: number) => void;
  [BUFFERING_VIDEO]: (time: number) => void;
  [CHANGE_VIDEO]: (newVideoUrl: string, newIndex?: number) => void;
  [END_OF_VIDEO]: () => void;
  [SYNC_TIME]: (currentVideoTime: number) => void;
  [SYNC_VIDEO_INFORMATION]: (
    callback: (playing: boolean, hostVideoUrl: string, elapsedVideoTime: number, eventCalledTime: number) => void
  ) => void;
  [GET_HOST_VIDEO_INFORMATION]: (
    callback: (playing: boolean, hostVideoUrl: string, elapsedVideoTime: number, eventCalledTime: number) => void
  ) => void;
  [GET_VIDEO_INFORMATION]: () => void;
  [ADD_VIDEO_TO_QUEUE]: (video: VideoQueueItem) => void;
  [REMOVE_VIDEO_FROM_QUEUE]: (url: string) => void;
  [VIDEO_QUEUE_REORDERED]: (videoQueue: VideoQueueItem[]) => void;
  [VIDEO_QUEUE_CLEARED]: () => void;
  [CHANGE_SETTINGS]: (newSettings: { maxRoomSize: number; roomPasscode: string | null; private: boolean }) => void;
  [JOIN_ROOM_BY_INVITE]: (
    inviteCode: string,
    username: string,
    roomPasscode: string,
    callback: (value: { success: boolean; roomId?: string; error?: string }) => void
  ) => void;
}

export interface ServerToClientEvents {
  connect: () => void;
  disconnect: () => void;
  connect_error: (error: any) => void;
  [JOIN_ROOM]: (
    roomId: string,
    username: string,
    callback: (value: { success: boolean; error: string }) => void
  ) => void;
  [LEAVE_ROOM]: () => void;
  [KICK_USER]: () => void;
  [SET_ADMIN]: () => void;
  [SERVER_MESSAGE]: ({ message, type }: ServerMessage) => void;
  [USER_MESSAGE]: (message: ChatMessage) => void;
  [CHECK_IF_ROOM_IS_FULL]: (roomId: string, callback: any) => void;
  [CHECK_IF_ROOM_EXISTS]: (roomId: string, callback: (room: Room | null) => void) => void;
  [CREATE_ROOM]: (
    username: string,
    roomName: string,
    callback: (value: { result?: Room; error?: string }) => void
  ) => void;
  [SET_HOST]: (host: string) => void;
  [GET_ROOM_INFO]: (room: Room) => void;
  [GET_USER_INFO]: (user: User) => void;
  [PLAY_VIDEO]: () => void;
  [PAUSE_VIDEO]: () => void;
  [FASTFORWARD_VIDEO]: (newTime: number) => void;
  [REWIND_VIDEO]: (newTime: number) => void;
  [CHANGE_VIDEO]: (newVideoUrl: string, newIndex?: number) => void;
  [SYNC_TIME]: (currentVideoTime: number) => void;
  [BUFFERING_VIDEO]: (time: number) => void;
  [SYNC_VIDEO_INFORMATION]: (
    playing: boolean,
    hostVideoUrl: string,
    elapsedVideoTime: number,
    eventCalledTime: number
  ) => void;
  [GET_HOST_VIDEO_INFORMATION]: (
    callback: (playing: boolean, hostVideoUrl: string, elapsedVideoTime: number, eventCalledTime: number) => void
  ) => void;
  [GET_VIDEO_INFORMATION]: () => void;
  [ADD_VIDEO_TO_QUEUE]: (video: VideoQueueItem) => void;
  [REMOVE_VIDEO_FROM_QUEUE]: (url: string) => void;
  [VIDEO_QUEUE_REORDERED]: (videoQueue: VideoQueueItem[]) => void;
  [VIDEO_QUEUE_CLEARED]: () => void;
  [JOIN_ROOM_BY_INVITE]: (
    inviteCode: string,
    username: string,
    roomPasscode: string,
    callback: (value: { success: boolean; roomId?: string; error?: string }) => void
  ) => void;
  [USER_VIDEO_STATUS]: (userId: string, videoStatus: VideoStatus) => void;
}

export interface InterServerEvents {
  ping: () => void;
}

export interface SocketData {
  userId: string | undefined;
  roomId: string | undefined;
  isAdmin: boolean | undefined;
}

export type CustomSocket = Socket<ServerToClientEvents, ClientToServerEvents, InterServerEvents, SocketData>;
export type CustomServer = Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
export type CustomServerSocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
