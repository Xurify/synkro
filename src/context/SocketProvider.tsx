import React from "react";
import io from "socket.io-client";
import { useRouter } from "next/router";
import { SocketContext } from "./SocketContext";
import { CustomSocket } from "@/types/socketCustomTypes";
import { socketURL } from "@/constants/constants";
import { GET_ROOM_INFO, GET_USER_INFO, SET_HOST } from "@/constants/socketActions";
import { Room, User } from "@/types/interfaces";

interface SocketProviderProps {
  sessionToken: string | null;
}

export const SocketProvider: React.FC<React.PropsWithChildren<SocketProviderProps>> = ({ children, sessionToken }) => {
  const [socket, setSocket] = React.useState<CustomSocket | null>(null);
  const [room, setRoom] = React.useState<Room | null | undefined>(undefined);
  const [user, setUser] = React.useState<User | null>(null);
  const [isConnecting, setIsConnecting] = React.useState<boolean>(true);
  const [retries, setRetries] = React.useState(3);

  const router = useRouter();

  React.useEffect(() => {
    if (!sessionToken && router.pathname !== "/404") {
      if (retries > 0) {
        setRetries((prevRetries) => prevRetries - 1);
        router.replace(router.asPath);
      }
      return;
    }
    const newSocket = io(socketURL, {
      transports: ["websocket"],
      query: {
        userId: sessionToken,
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

    newSocket.on(GET_ROOM_INFO, (newRoom) => {
      setRoom(newRoom);
    });

    newSocket.on(GET_USER_INFO, (newUser) => {
      setUser(newUser);
    });

    newSocket.on(SET_HOST, (newHost: string) => {
      if (room) {
        const newRoom = { ...room, host: newHost };
        setRoom(newRoom);
      }
    });

    return () => {
      newSocket.disconnect();
    };
  }, [sessionToken]);

  return <SocketContext.Provider value={{ socket, room, user, isConnecting }}>{children}</SocketContext.Provider>;
};

export default SocketContext;
