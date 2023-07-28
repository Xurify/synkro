import { useState, useEffect } from "react";
import CreateRoomBox from "@/components/CreateRoomBox";
import JoinRoomBox from "@/components/JoinRoomBox";
import { ServerToClientEvents, ClientToServerEvents } from "@/types/socketCustomTypes";
import io, { type Socket } from "socket.io-client";
import { parse } from "cookie";
import { GetServerSideProps } from "next";

export interface HomePageProps {
  sessionToken: string;
}

export const HomePage: React.FC<HomePageProps> = ({ sessionToken }) => {
  const [isCreateBoxShown, setIsCreateBoxShown] = useState(true);
  const [socket, setSocket] = useState<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);

  const handleToggle = () => setIsCreateBoxShown(!isCreateBoxShown);

  useEffect(() => {
    const newSocket = io(`ws://localhost:8000`, {
      transports: ["websocket"],
      query: {
        userId: sessionToken,
      },
    });

    setSocket(newSocket);

    newSocket.on("connect", () => {
      console.log("Connected");
    });
  }, [sessionToken]);

  return (
    <main className="flex flex-col mt-4">
      <div className="w-full h-full flex flex-col items-center justify-center px-2">
        {isCreateBoxShown ? <CreateRoomBox toggle={handleToggle} socket={socket} /> : <JoinRoomBox toggle={handleToggle} socket={socket} />}
      </div>
    </main>
  );
};

export default HomePage;

export const getServerSideProps: GetServerSideProps = async (context) => {
  const cookies = parse(context.req.headers.cookie || "");
  const sessionToken = cookies["session_token"] || null;
  return {
    props: {
      sessionToken,
    },
  };
};
