import React from "react";
import io from "socket.io-client";
import { useRouter } from "next/router";
import { SocketContext } from "./SocketContext";
import { CustomSocket } from "@/types/socketCustomTypes";
import { SOCKET_URL } from "@/constants/constants";
import { GET_ROOM_INFO, GET_USER_INFO, SET_ADMIN } from "@/constants/socketActions";
import { Room, User } from "@/types/interfaces";

interface SocketProviderProps {
  sessionToken: string | null;
  adminToken?: string;
}

export const SocketProvider: React.FC<React.PropsWithChildren<SocketProviderProps>> = ({
  children,
  sessionToken,
  adminToken,
}) => {
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
    const newSocket = io(SOCKET_URL, {
      transports: ["websocket"],
      auth: {
        token: sessionToken,
        adminToken,
      },
    }) as unknown as CustomSocket;

    newSocket.data = {};

    if (sessionToken) {
      newSocket.data.userId = sessionToken;
      newSocket.data.roomId = room?.id;
    }

    setSocket(newSocket);

    newSocket.on("connect_error", (err) => {
      console.log(`connect_error due to ${err.message}`);
    });

    newSocket.on("connect", () => {
      console.log("Connected");
      setIsConnecting(false);
    });

    newSocket.on("disconnect", () => {
      setIsConnecting(false);
      setRoom(null);
    });

    newSocket.on(SET_ADMIN, () => {
      newSocket.data.isAdmin = true;
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

  return (
    <SocketContext.Provider value={{ socket, sessionToken, room, user, isConnecting }}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketContext;
