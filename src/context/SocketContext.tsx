import { CustomSocket } from "@/types/socketCustomTypes";
import React from "react";

export type SocketContextType = CustomSocket | null;

export const SocketContext = React.createContext<SocketContextType>(null);

export const useSocket = () => React.useContext(SocketContext);
