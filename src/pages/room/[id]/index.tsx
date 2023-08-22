import React, { useEffect, useState } from "react";
import { findDOMNode } from "react-dom";
import { GetServerSideProps } from "next";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";

import type ReactPlayerType from "react-player";
import screenfull from "screenfull";
import { parse } from "cookie";

import {
  LEAVE_ROOM,
  USER_MESSAGE,
  SERVER_MESSAGE,
  PLAY_VIDEO,
  PAUSE_VIDEO,
  BUFFERING_VIDEO,
  RECONNECT_USER,
  FASTFORWARD_VIDEO,
  REWIND_VIDEO,
  CHANGE_VIDEO,
  SYNC_TIME,
  SYNC_VIDEO_INFORMATION,
  GET_VIDEO_INFORMATION,
  GET_HOST_VIDEO_INFORMATION,
  ADD_VIDEO_TO_QUEUE,
  END_OF_VIDEO,
  REMOVE_VIDEO_FROM_QUEUE,
  VIDEO_QUEUE_REORDERED,
  GET_ROOM_INFO,
} from "../../../constants/socketActions";
import type { ChatMessage, Messages, VideoQueueItem } from "@/types/interfaces";

import Chat from "@/components/Chat";
import Sidebar from "@/components/Sidebar";
import Queue from "@/components/Queue";
import Settings from "@/components/Settings";
import RoomToolbar, { ButtonActions, SidebarViews } from "@/components/RoomToolbar";

import { AspectRatio } from "@/components/ui/aspect-ratio";

import { useSocket } from "@/context/SocketContext";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useQueue } from "@/hooks/useQueue";

import { convertURLToCorrectProviderVideoId, isValidUrl } from "@/libs/utils/frontend-utils";

const ReactPlayer = dynamic(() => import("react-player/lazy"), {
  loading: () => {
    return <div className="w-full h-full flex">LOADING</div>;
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
  //const [serverMessages, setServerMessages] = useState<ServerMessage[]>([]);
  const { socket, room, isConnecting } = useSocket();
  const [storedRoom, setStoredRoom] = useLocalStorage("room", room);
  const [currentVideoUrl, setCurrentVideoUrl] = useState<string>(room?.videoInfo.currentVideoUrl || "https://youtu.be/ECsqSli1DpY");
  const [isLoading, setIsLoading] = useState(false);

  const [player, setPlayer] = useState<ReactPlayerType | null>(null);
  const isSocketAvailable = !!socket;

  const router = useRouter();
  const searchParams = useSearchParams();
  const roomId = searchParams.get("id") as string;

  const videoQueue = useQueue<VideoQueueItem>();

  useEffect(() => {
    room && setStoredRoom(room);

    if (room && Array.isArray(room?.videoInfo?.queue) && room.videoInfo.queue.length > 0) {
      videoQueue.set(room.videoInfo.queue);
    }

    if (room?.videoInfo.currentVideoUrl) {
      setCurrentVideoUrl(room?.videoInfo.currentVideoUrl);
    }
  }, [room]);

  useEffect(() => {
    console.log(room, storedRoom, socket, socket?.connected, isConnecting);

    console.log("FIRST", !isConnecting && socket?.connected && !room, !room && storedRoom && !!socket);
    if (!isConnecting && socket?.connected && !room) {
      console.log(RECONNECT_USER);
      socket.emit(RECONNECT_USER, roomId, sessionToken, (canReconnect) => {
        if (!canReconnect) {
          setStoredRoom(null);
          router.push("/");
        }
      });
    } else if (!room && storedRoom && !!socket) {
      socket.emit(RECONNECT_USER, roomId, sessionToken, (canReconnect) => {
        if (!canReconnect) {
          setStoredRoom(null);
          router.push("/");
        }
      });
    }
  }, [isSocketAvailable, isConnecting, room]);

  const socketMethods = React.useCallback(() => {
    if (!socket) return;

    socket.on(GET_ROOM_INFO, (newRoom) => {
      setStoredRoom(newRoom);
    });

    socket.on(SERVER_MESSAGE, (newMessage) => {
      setMessages((prevMessages) => [...prevMessages, newMessage]);
      //setServerMessages((prevMessages) => [...prevMessages, newMessage]);
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
      setCurrentVideoUrl(hostVideoUrl);
      setIsPlaying(playing);
      player?.seekTo(time);
    });

    socket.on(PLAY_VIDEO, () => {
      setIsPlaying(true);
      //handleSyncTime();
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
      setIsPlaying(true);
    });

    socket.on(ADD_VIDEO_TO_QUEUE, (newVideo: VideoQueueItem) => {
      videoQueue.add(newVideo);
    });

    socket.on(REMOVE_VIDEO_FROM_QUEUE, (url: string) => {
      videoQueue.removeItem("url", url);
    });

    socket.on(VIDEO_QUEUE_REORDERED, (newVideoQueue: VideoQueueItem[]) => {
      videoQueue.set(newVideoQueue);
    });

    socket.on(SYNC_TIME, (currentTime: number) => {
      handleSyncTime(currentTime);
    });

    return () => {
      socket.offAnyOutgoing();
      socket.disconnect();
    };
  }, [socket, player]);

  const onReady = (player: ReactPlayerType) => {
    setPlayer(player);
    setIsLoading(false);
    socket?.emit(GET_VIDEO_INFORMATION);
  };

  useEffect(() => {
    if (!player && !isLoading) return;
    socketMethods();
  }, [player]);

  const runIfAuthorized = (callback?: () => void) => {
    if (room?.host === socket?.userId) {
      typeof callback === "function" && callback();
    }
  };

  const runIfPlayerIsReady = (callback?: () => void) => {
    if (player) {
      typeof callback === "function" && callback();
    }
  };

  const handleLeaveRoom = () => {
    if (!socket) return;
    socket.emit(LEAVE_ROOM, roomId);
    void router.push("/");
  };

  const handleSyncTime = (time: number) => {
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
    if (!player) return null;
    const currentTime = player.getCurrentTime();
    if (socket?.userId) {
      socket.emit(BUFFERING_VIDEO, currentTime);
    }
  };

  const handleEnded = () => {
    runIfAuthorized(() => {
      socket?.emit(END_OF_VIDEO);
    });
  };

  const handleToggleFullscreen = () =>
    runIfPlayerIsReady(() => {
      screenfull.request(findDOMNode(player as unknown as Element) as Element);
    });

  const handleClickPlayerButton = (buttonAction: ButtonActions, payload?: string | number) => {
    if (["chat", "queue", "settings"].includes(buttonAction)) {
      setActiveView(buttonAction as SidebarViews);
    }

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
        if (typeof payload === "string" && isValidUrl(payload)) {
          setCurrentVideoUrl(payload);
          socket?.emit(CHANGE_VIDEO, payload);
          setIsPlaying(true);
        }
        return;
      case "expand":
        handleToggleFullscreen();
        return;
      default:
        break;
    }
  };

  const currentVideoId = convertURLToCorrectProviderVideoId(currentVideoUrl) as string;

  const views: { [key in SidebarViews]: JSX.Element } = {
    chat: <Chat messages={messages} socket={socket} roomId={roomId} />,
    queue: <Queue currentVideoId={currentVideoId} videoQueue={videoQueue} onClickPlayerButton={handleClickPlayerButton} />,
    settings: <Settings />,
  };

  return (
    <main className="mx-auto h-full flex flex-col md:flex-row justify-center">
      <div className="flex flex-col max-w-[80rem] w-full">
        <div className="w-full">
          <div className="bg-card mb-2">
            <AspectRatio ratio={16 / 9}>
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
            </AspectRatio>
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
