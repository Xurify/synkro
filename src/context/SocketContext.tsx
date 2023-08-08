import { Room, User } from "@/types/interfaces";
import { CustomSocket } from "@/types/socketCustomTypes";
import React from "react";

export type SocketContextType = {
  socket: CustomSocket | null;
  room: Room | null;
  user: User | null;
  isConnecting: boolean;
};

export const SocketContext = React.createContext<SocketContextType>({
  socket: null,
  room: null,
  user: null,
  isConnecting: true,
});

export const useSocket = () => React.useContext(SocketContext);
