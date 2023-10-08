"use client";

import React from "react";
import io from "socket.io-client";
import { useRouter, usePathname } from "next/navigation";
import { SocketContext } from "./SocketContext";
import { CustomSocket } from "@/types/socketCustomTypes";
import { socketURL } from "@/constants/constants";
import { GET_ROOM_INFO, GET_USER_INFO, SET_ADMIN } from "@/constants/socketActions";
import { Room, User } from "@/types/interfaces";

interface SocketProviderProps {
  sessionToken: string | null;
  adminToken: string | null;
}

export const SocketProvider: React.FC<React.PropsWithChildren<SocketProviderProps>> = ({ children, sessionToken, adminToken }) => {
  const [socket, setSocket] = React.useState<CustomSocket | null>(null);
  const [room, setRoom] = React.useState<Room | null | undefined>(undefined);
  const [user, setUser] = React.useState<User | null>(null);
  const [isConnecting, setIsConnecting] = React.useState<boolean>(true);
  const [retries, setRetries] = React.useState(3);

  const router = useRouter();
  const pathname = usePathname();

  React.useEffect(() => {
    console.log("sessionToken", sessionToken);
    if (!sessionToken && pathname !== "/404") {
      if (retries > 0 && pathname) {
        setRetries((prevRetries) => prevRetries - 1);
        router.refresh();
      }
      return;
    }
    const newSocket = io(socketURL, {
      transports: ["websocket"],
      auth: {
        token: sessionToken,
        adminToken,
      },
    }) as unknown as CustomSocket;

    if (sessionToken) {
      newSocket.userId = sessionToken;
      newSocket.roomId = room?.id;
    }

    setSocket(newSocket);

    newSocket.on("connect", () => {
      console.log("Connected");
      setIsConnecting(false);
    });

    newSocket.on("disconnect", () => {
      setIsConnecting(false);
      setRoom(null);
    });

    newSocket.on(SET_ADMIN, () => {
      newSocket.isAdmin = true;
    });

    newSocket.on(GET_ROOM_INFO, (newRoom) => {
      setRoom(newRoom);
    });

    newSocket.on(GET_USER_INFO, (newUser) => {
      setUser(newUser);
    });

    return () => {
      newSocket.disconnect();
    };
  }, [sessionToken]);

  return <SocketContext.Provider value={{ socket, room, user, isConnecting, sessionToken }}>{children}</SocketContext.Provider>;
};

export default SocketContext;
