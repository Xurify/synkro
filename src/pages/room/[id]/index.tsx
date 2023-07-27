import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import RoomToolbar, { ButtonActions } from "@/components/RoomToolbar";

//import { io, type Socket } from "socket.io-client";
import io, { type Socket } from "socket.io-client";
import { parse } from "cookie";
import type { ServerToClientEvents, ClientToServerEvents, ServerMessage } from "@/types/socketCustomTypes";
import { useRouter, useSearchParams } from "next/navigation";

//import { useRouter, useSearchParams } from "next/navigation";
//import { socketURL } from "@/constants/constants";
import { LEAVE_ROOM, USER_MESSAGE, SERVER_MESSAGE, JOIN_ROOM, SEND_USER_MESSAGE } from "@/constants/socketActions";
import type ReactPlayerType from "react-player";
import { GetServerSideProps } from "next";

const ReactPlayer = dynamic(() => import("react-player/lazy"), { ssr: false });

let socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;

export interface RoomPageProps {
  sessionToken: string;
}

export const RoomPage: React.FC<RoomPageProps> = ({ sessionToken }) => {
  const [activeButton, setActiveButton] = useState<ButtonActions>("chat");
  const [isPlaying, setIsPlaying] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ username: string; message: string; id: string; userId: string }[]>([]);
  const [serverMessages, setServerMessages] = useState<ServerMessage[]>([]);
  const [chatMessage, setChatMessage] = useState<string>("TEST");
  const [loading, setLoading] = useState(false);
  const [player, setPlayer] = useState<ReactPlayerType | null>(null);

  const router = useRouter();
  const searchParams = useSearchParams();
  const roomId = searchParams.get("id") as string;

  const socketMethods = React.useCallback(() => {
    console.log("roomId", roomId);
    socket = io(`ws://localhost:8000`, {
      transports: ["websocket"],
      query: {
        roomId,
        username: "Tester",
        userId: sessionToken,
      },
    });

    //http://localhost:5000/?EIO=4&transport=polling&t=OcKxdlW
    //ws://localhost:5000/socket.io/?EIO=3&transport=websocket

    //ws://localhost:5000/?EIO=4&transport=websocket
    //ws://localhost:5000/socket.io?EIO=4&transport=websocket
    //ws://localhost:5000/socket.io?EIO=4&transport=websocket

    socket.on("connect", () => {
      console.log("Connected");
    });

    socket.on(SERVER_MESSAGE, (newMessage) => {
      console.log("SERVER_MESSAGE", newMessage);
      setServerMessages((prevMessages) => [...prevMessages, newMessage]);
    });

    socket.on(USER_MESSAGE, (newMessage) => {
      console.log("TESDAD", newMessage);
      setChatMessages((prevMessages) => [...prevMessages, newMessage]);
    });
  }, [roomId]);

  useEffect(() => {
    if (!socket && roomId) {
      socketMethods();
    }

    return () => {
      if (socket) {
        socket.disconnect();
        socket = null;
      }
    };
  }, [roomId, socketMethods]);

  useEffect(() => {
    if (socket && roomId) {
      socket.emit(JOIN_ROOM, roomId);
    }
  }, [roomId]);

  const onReady = (player: ReactPlayerType) => {
    setPlayer(player);

    console.log(player.getDuration());

    setLoading(false);
    //this.onSocketMethods(socket);
    //setLoading(false);
  };

  const handleLeaveRoom = (): void => {
    if (socket) {
      socket.emit(LEAVE_ROOM, roomId);
      void router.push("/");
    }
  };

  const handleClickPlayerButton = (buttonAction: ButtonActions) => {
    setActiveButton(buttonAction);

    switch (buttonAction) {
      case "play":
        setIsPlaying(true);
        return;
      case "pause":
        setIsPlaying(false);
        return;
      default:
        break;
    }
  };

  const handleSendMessage = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    console.log("emitted", socket, roomId);
    console.log("TEST", serverMessages, loading, player);
    player && console.log(player.getCurrentTime());

    if (socket) {
      socket.emit(SEND_USER_MESSAGE, chatMessage, roomId);
    }
  };

  const handleChangeChatMessage = (e: React.ChangeEvent<HTMLInputElement>) => setChatMessage(e.target.value);

  return (
    <main className="flex flex-col items-center p-4">
      <div className="max-w-[80rem] w-full">
        <div className="player-wrapper mb-2">
          <ReactPlayer
            className="react-player"
            //url="https://stream.mux.com/01nkUiLRyVE82K7fM3UgMickgF01qIdZQhyZS7DHc1bVo.m3u8?redundant_streams=true"
            url="https://youtu.be/4yKsIdr_PNU"
            width="100%"
            height="100%"
            playing={isPlaying}
            onReady={onReady}
          />
        </div>
      </div>
      <div className="w-full flex items-center justify-center mb-2">
        <RoomToolbar activeButton={activeButton} onClickPlayerButton={handleClickPlayerButton} isPlaying={isPlaying} />
      </div>
      <button onClick={handleLeaveRoom}>Leave</button>
      <button onClick={handleSendMessage}>Send message</button>
      <input onChange={handleChangeChatMessage} value={chatMessage} type="text" />
      <div>
        {chatMessages.map((chatMessage) => (
          <div key={chatMessage.id}>{chatMessage.message}</div>
        ))}
      </div>
    </main>
  );
};

export default RoomPage;

export const getServerSideProps: GetServerSideProps = async (context) => {
  const cookies = parse(context.req.headers.cookie || "");
  const sessionToken = cookies["session_token"] || null;
  return {
    props: {
      sessionToken,
    },
  };
};
