"use client";

import { Room, User } from "@/types/interfaces";
import { CustomSocket } from "@/types/socketCustomTypes";
import React from "react";

export type SocketContextType = {
  socket: CustomSocket | null;
  room: Room | null | undefined;
  user: User | null;
  isConnecting: boolean;
  sessionToken: string | null;
};

export const SocketContext = React.createContext<SocketContextType>({
  socket: null,
  room: null,
  user: null,
  isConnecting: true,
  sessionToken: null,
});

export const useSocket = () => React.useContext(SocketContext);
