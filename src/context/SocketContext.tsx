import { Room, User } from "@/types/interfaces";
import { CustomSocket } from "@/types/socketCustomTypes";
import React from "react";

export type SocketContextType = {
  socket: CustomSocket | null;
  sessionToken: string | null;
  room: Room | null | undefined;
  user: User | null;
  isConnecting: boolean;
};

export const SocketContext = React.createContext<SocketContextType>({
  socket: null,
  sessionToken: null,
  room: null,
  user: null,
  isConnecting: true,
});

export const useSocket = () => React.useContext(SocketContext);
