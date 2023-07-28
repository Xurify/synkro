import React, { useEffect, useState } from "react";
import { GetServerSideProps } from "next";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import type ReactPlayerType from "react-player";
import { parse } from "cookie";

import { LEAVE_ROOM, USER_MESSAGE, SERVER_MESSAGE, PLAY_VIDEO, PAUSE_VIDEO, GET_ROOM_INFO } from "../../../constants/socketActions";
import type { ChatMessage, Room, Messages, ServerMessage } from "@/types/interfaces";
import { useSocket } from "@/context/SocketContext";
import RoomToolbar, { ButtonActions, SidebarViews } from "@/components/RoomToolbar";
import Chat from "@/components/Chat";
import Sidebar from "@/components/Sidebar";

const ReactPlayer = dynamic(() => import("react-player/lazy"), { ssr: false });

export interface RoomPageProps {
  sessionToken: string;
}

export const RoomPage: React.FC<RoomPageProps> = () => {
  const [activeView, setActiveView] = useState<SidebarViews>("chat");
  const [isPlaying, setIsPlaying] = useState(false);
  const [messages, setMessages] = useState<Messages>([]);
  const [serverMessages, setServerMessages] = useState<ServerMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [player, setPlayer] = useState<ReactPlayerType | null>(null);
  const [room, setRoom] = useState<Room | null>(null);

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
      setMessages((prevMessages) => [...prevMessages, newMessage]);
    });

    socket.on(PLAY_VIDEO, () => {
      setIsPlaying(true);
    });

    socket.on(PAUSE_VIDEO, () => {
      setIsPlaying(false);
    });

    return () => {
      socket.offAnyOutgoing();
    };
  }, [socket]);

  useEffect(() => {
    if (socket && roomId) {
      socket.emit(GET_ROOM_INFO, roomId, (room) => {
        console.log(GET_ROOM_INFO, room);
        setRoom(room);
      });
    }
  }, [roomId, socket]);

  const onReady = (player: ReactPlayerType) => {
    setPlayer(player);
    setLoading(false);
    socketMethods();
  };

  const handleLeaveRoom = (): void => {
    if (socket) {
      socket.emit(LEAVE_ROOM, roomId);
      void router.push("/");
    }
  };

  const runIfAuthorized = (callback?: () => void) => {
    if (room?.host === socket?.userId) {
      typeof callback === "function" && callback();
    }
  };

  const handlePlay = () => {
    !isPlaying && setIsPlaying(true);
    runIfAuthorized(() => socket?.emit(PLAY_VIDEO));
  };

  const handlePause = () => {
    isPlaying && setIsPlaying(false);
    runIfAuthorized(() => socket?.emit(PAUSE_VIDEO));
  };

  const handleBuffer = () => {};

  const handleClickPlayerButton = (buttonAction: ButtonActions) => {
    if (["chat", "queue", "settings"].includes(buttonAction)) {
      setActiveView(buttonAction as SidebarViews);
    }

    console.log("handleSendMessage", serverMessages, messages, player, loading);
    player && console.log(player.getCurrentTime());

    switch (buttonAction) {
      case "play":
        handlePlay();
        return;
      case "pause":
        handlePause();
        return;
      case "leave_room":
        handleLeaveRoom();
        return;
      default:
        break;
    }
  };

  const views: { [key in SidebarViews]: JSX.Element } = {
    chat: <Chat messages={messages} socket={socket} roomId={roomId} />,
    queue: <div className="flex-grow overflow-y-auto p-4">QUEUE</div>,
    settings: <div className="flex-grow overflow-y-auto p-4">SETTINGS</div>,
  };

  return (
    <main className="mx-auto flex justify-center mt-4">
      <div className="flex flex-col max-w-[80rem] w-full">
        <div className="max-w-[80rem] w-full">
          <div className="player-wrapper mb-2">
            <ReactPlayer
              className="react-player"
              url="https://youtu.be/4yKsIdr_PNU"
              width="100%"
              height="100%"
              playing={isPlaying}
              onReady={onReady}
              onBuffer={handleBuffer}
              onPlay={handlePlay}
            />
          </div>
        </div>
        <div className="w-full flex items-center justify-center">
          <RoomToolbar activeView={activeView} onClickPlayerButton={handleClickPlayerButton} isPlaying={isPlaying} roomId={roomId} />
        </div>
      </div>
      <Sidebar activeView={activeView} views={views} />
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
