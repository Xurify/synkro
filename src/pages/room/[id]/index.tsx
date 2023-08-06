import React, { useEffect, useState } from "react";
import { GetServerSideProps } from "next";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import type ReactPlayerType from "react-player";
import { parse } from "cookie";

import {
  LEAVE_ROOM,
  USER_MESSAGE,
  SERVER_MESSAGE,
  PLAY_VIDEO,
  PAUSE_VIDEO,
  GET_ROOM_INFO,
  BUFFERING_VIDEO,
  JOIN_ROOM,
  RECONNECT_USER,
  FASTFORWARD_VIDEO,
  REWIND_VIDEO,
  CHANGE_VIDEO,
  SYNC_TIME,
  SYNC_VIDEO_INFORMATION,
  GET_VIDEO_INFORMATION,
  GET_HOST_VIDEO_INFORMATION,
} from "../../../constants/socketActions";
import type { ChatMessage, Room, Messages, ServerMessage } from "@/types/interfaces";
import { useSocket } from "@/context/SocketContext";
import RoomToolbar, { ButtonActions, SidebarViews } from "@/components/RoomToolbar";
import Chat from "@/components/Chat";
import Sidebar from "@/components/Sidebar";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useUpdateEffect } from "@/hooks/useUpdateEffect";
import { OnProgressProps } from "react-player/base";

const ReactPlayer = dynamic(() => import("react-player/lazy"), {
  loading: () => {
    return <div className="w-full h-full bg-red-600">LOADING</div>;
  },
  ssr: false,
});

export interface RoomPageProps {
  sessionToken: string;
}

export const RoomPage: React.FC<RoomPageProps> = ({ sessionToken }) => {
  const [activeView, setActiveView] = useState<SidebarViews>("chat");
  const [isPlaying, setIsPlaying] = useState(false);
  const [messages, setMessages] = useState<Messages>([]);
  const [serverMessages, setServerMessages] = useState<ServerMessage[]>([]);
  // const [videoUrl, setVideoUrl] = useState<string[] | string>([
  //   "https://youtu.be/ECsqSli1DpY",
  //   "https://youtu.be/4yKsIdr_PNU",
  //   "https://youtu.be/jKcBZlPHC3o",
  //   "https://youtu.be/KTK5CTDy0Yk",
  // ]);
  const [currentVideoUrl, setCurrentVideoUrl] = useState<string>("https://youtu.be/ECsqSli1DpY");
  const [loading, setLoading] = useState(false);
  // const [isSeeking, setIsSeeking] = useState(false);
  // const [duration, setDuration] = useState(0);
  //const [played, setPlayed] = useState(0);
  const [player, setPlayer] = useState<ReactPlayerType | null>(null);
  const { socket, room } = useSocket();
  const isSocketAvailable = !!socket;

  const [storedRoom, setStoredRoom] = useLocalStorage("room", room);

  const router = useRouter();
  const searchParams = useSearchParams();
  const roomId = searchParams.get("id") as string;

  useEffect(() => {
    console.log("ROOM", room);
    room && setStoredRoom(room);
  }, [room]);

  useEffect(() => {
    if (!room && storedRoom && socket) {
      socket.emit(RECONNECT_USER, roomId, sessionToken, (canReconnect) => {
        if (!canReconnect) {
          setStoredRoom(null);
          router.push("/");
        }
      });
    }
  }, [isSocketAvailable]);

  const socketMethods = React.useCallback(() => {
    if (!socket) return;

    socket.on(SERVER_MESSAGE, (newMessage) => {
      setMessages((prevMessages) => [...prevMessages, newMessage]);
      setServerMessages((prevMessages) => [...prevMessages, newMessage]);
    });

    socket.on(USER_MESSAGE, (newMessage: ChatMessage) => {
      setMessages((prevMessages) => [...prevMessages, newMessage]);
    });

    socket.on(GET_HOST_VIDEO_INFORMATION, (callback: (playing: boolean, videoUrl: string, time: number) => void) => {
      const currentTime = player?.getCurrentTime();
      const currentVideoUrl = player?.props?.url as string;
      const isCurrentlyPlaying = player?.props?.playing as boolean;
      typeof callback === "function" && callback(isCurrentlyPlaying, currentVideoUrl, currentTime ?? 0);
    });

    socket.on(SYNC_VIDEO_INFORMATION, (playing, hostVideoUrl, time) => {
      console.log(SYNC_VIDEO_INFORMATION, playing, hostVideoUrl, time);
      setCurrentVideoUrl(hostVideoUrl);
      setIsPlaying(playing);
      player?.seekTo(time);
    });

    socket.on(PLAY_VIDEO, () => {
      setIsPlaying(true);
    });

    socket.on(PAUSE_VIDEO, () => {
      setIsPlaying(false);
    });

    socket.on(REWIND_VIDEO, (newTime: number) => {
      player?.seekTo(newTime);
    });

    socket.on(FASTFORWARD_VIDEO, (newTime: number) => {
      player?.seekTo(newTime);
    });

    socket.on(CHANGE_VIDEO, (newVideoUrl: string) => {
      setCurrentVideoUrl(newVideoUrl);
    });

    socket.on(SYNC_TIME, (currentTime: number) => {
      console.log(SYNC_TIME, currentTime);
      handleSyncTime(currentTime);
    });

    return () => {
      socket.offAnyOutgoing();
      socket.disconnect();
    };
  }, [socket, player]);

  const onReady = (player: ReactPlayerType) => {
    setPlayer(player);
    setLoading(false);
    socket?.emit(GET_VIDEO_INFORMATION);
  };

  useEffect(() => {
    if (!player) return;
    socketMethods();
    console.log("USEFFECTMETHODS", isPlaying, currentVideoUrl);
  }, [player]);

  const runIfAuthorized = (callback?: () => void) => {
    if (room?.host === socket?.userId) {
      typeof callback === "function" && callback();
    }
  };

  const handleLeaveRoom = () => {
    if (!socket) return;
    socket.emit(LEAVE_ROOM, roomId);
    void router.push("/");
  };

  const handleSyncTime = (time: number) => {
    console.log("handleSyncTime", player);
    if (!player) return;
    const currentTime = player?.getCurrentTime();
    if ((currentTime && currentTime < time - 0.5) || currentTime > time + 0.5) {
      player.seekTo(time);
      !isPlaying && setIsPlaying(true);
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

  const handleRewind = () => {
    if (!player) return null;
    const currentTime = player.getCurrentTime();
    const newTime = currentTime - 5 < 0 ? 0 : currentTime - 5;
    player.seekTo(newTime);

    runIfAuthorized(() => socket?.emit(REWIND_VIDEO, newTime));
  };

  const handleFastforward = () => {
    if (!player) return null;
    const currentTime = player.getCurrentTime();
    const endTime = player.getDuration();
    const newTime = currentTime + 5 > endTime ? endTime : currentTime + 5;
    player.seekTo(newTime);

    runIfAuthorized(() => socket?.emit(FASTFORWARD_VIDEO, newTime));
  };

  const handleBuffer = () => {
    console.log("HANDLEBUFFER");
    if (!player) return null;
    const currentTime = player.getCurrentTime();
    if (socket?.userId) {
      socket.emit(BUFFERING_VIDEO, socket.userId, currentTime);
    }
  };

  const handleEnded = () => {
    console.log("onEnded");
  };

  const handleClickPlayerButton = (buttonAction: ButtonActions, payload?: string | number) => {
    if (["chat", "queue", "settings"].includes(buttonAction)) {
      setActiveView(buttonAction as SidebarViews);
    }

    console.log("handleSendMessage", messages, player, loading, room);

    switch (buttonAction) {
      case "play":
        handlePlay();
        return;
      case "pause":
        handlePause();
        return;
      case "rewind":
        handleRewind();
        return;
      case "fast-forward":
        handleFastforward();
        return;
      case "leave-room":
        handleLeaveRoom();
        return;
      case "change-video":
        typeof payload === "string" && setCurrentVideoUrl(payload);
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
              url={currentVideoUrl}
              width="100%"
              height="100%"
              playing={isPlaying}
              onReady={onReady}
              onBuffer={handleBuffer}
              onPlay={handlePlay}
              onPause={handlePause}
              controls={true}
              onEnded={handleEnded}
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
