import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import RoomToolbar, { ButtonActions } from "@/components/RoomToolbar";

import { parse } from "cookie";
import type { ServerMessage } from "../../../types/socketCustomTypes";
import { useRouter, useSearchParams } from "next/navigation";

import { LEAVE_ROOM, USER_MESSAGE, SERVER_MESSAGE, PLAY_VIDEO, PAUSE_VIDEO, GET_ROOM_INFO } from "../../../constants/socketActions";
import type ReactPlayerType from "react-player";
import { GetServerSideProps } from "next";
import { ChatMessage } from "@/types/interfaces";
import { useSocket } from "@/context/SocketContext";

const ReactPlayer = dynamic(() => import("react-player/lazy"), { ssr: false });

export interface RoomPageProps {
  sessionToken: string;
}

export const RoomPage: React.FC<RoomPageProps> = () => {
  const [activeButton, setActiveButton] = useState<ButtonActions>("chat");
  const [isPlaying, setIsPlaying] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [serverMessages, setServerMessages] = useState<ServerMessage[]>([]);
  const [chatMessage, setChatMessage] = useState<string>("TEST");
  const [loading, setLoading] = useState(false);
  const [player, setPlayer] = useState<ReactPlayerType | null>(null);

  const socket = useSocket();

  const router = useRouter();
  const searchParams = useSearchParams();
  const roomId = searchParams.get("id") as string;

  const socketMethods = React.useCallback(() => {
    if (!socket) return;

    socket.on("connect", () => {
      console.log("Connected");
    });

    socket.on(SERVER_MESSAGE, (newMessage) => {
      console.log("SERVER_MESSAGE", newMessage);
      setServerMessages((prevMessages) => [...prevMessages, newMessage]);
    });

    socket.on(USER_MESSAGE, (newMessage: ChatMessage) => {
      console.log("TESDAD", newMessage);
      setChatMessages((prevMessages) => [...prevMessages, newMessage]);
    });

    socket.on(PLAY_VIDEO, () => {
      console.log(PLAY_VIDEO);
      setIsPlaying(true);
    });

    socket.on(PAUSE_VIDEO, () => {
      console.log(PAUSE_VIDEO);
      setIsPlaying(false);
    });
  }, [socket]);

  useEffect(() => {
    if (socket && roomId) {
      socket.emit(GET_ROOM_INFO, roomId, (room) => {
        console.log(GET_ROOM_INFO, room);
      });
    }
  }, [roomId, socket]);

  const onReady = (player: ReactPlayerType) => {
    setPlayer(player);

    console.log(player.getDuration(), loading);

    setLoading(false);
    socketMethods();
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
        socket?.emit(PLAY_VIDEO);
        return;
      case "pause":
        setIsPlaying(false);
        socket?.emit(PAUSE_VIDEO);
        return;
      default:
        break;
    }
  };

  const handleSendMessage = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    console.log("handleSendMessage", serverMessages, chatMessages, player);
    player && console.log(player.getCurrentTime());

    if (socket) {
      socket.emit(USER_MESSAGE, chatMessage, roomId);
    }
  };

  const handleChangeChatMessage = (e: React.ChangeEvent<HTMLInputElement>) => setChatMessage(e.target.value);

  return (
    <main className="flex flex-col items-center p-4">
      <div className="max-w-[80rem] w-full">
        <div className="player-wrapper mb-2">
          <ReactPlayer
            className="react-player"
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
