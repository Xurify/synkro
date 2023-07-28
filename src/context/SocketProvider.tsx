//import { CustomSocket } from "@/types/socketCustomTypes";
import React from "react";
import io from "socket.io-client";
import { SocketContext, SocketContextType } from "./SocketContext";
import { CustomSocket } from "@/types/socketCustomTypes";

interface SocketProviderProps {
  sessionToken: string | null;
}

export const SocketProvider: React.FC<React.PropsWithChildren<SocketProviderProps>> = ({ children, sessionToken }) => {
  const [socket, setSocket] = React.useState<SocketContextType>(null);

  React.useEffect(() => {
    const newSocket = io(`ws://localhost:8000`, {
      transports: ["websocket"],
      query: {
        userId: sessionToken,
      },
    }) as unknown as CustomSocket;

    setSocket(newSocket);

    newSocket.on("connect", () => {
      console.log("Connected");
    });

    return () => {
      newSocket.disconnect();
    };
  }, [sessionToken]);

  return <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>;
};

export default SocketContext;
