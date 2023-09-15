import React, { useEffect, useState } from "react";
import { findDOMNode } from "react-dom";
import { GetServerSideProps } from "next";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import useSound from "use-sound";

import type ReactPlayerType from "react-player";
//import { OnProgressProps } from "react-player/base";
import screenfull from "screenfull";
import { RefreshCcwIcon } from "lucide-react";

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
  SET_HOST,
} from "../../../constants/socketActions";
import { ServerMessageType, type ChatMessage, type Messages, type VideoQueueItem } from "@/types/interfaces";

import Chat from "@/components/VideoRoom/Chat";
import Sidebar from "@/components/Sidebar";
import Queue from "@/components/VideoRoom/Queue";
import Settings from "@/components/VideoRoom/Settings";
import RoomToolbar, { ButtonActions, SidebarViews } from "@/components/VideoRoom/RoomToolbar";

import { AspectRatio } from "@/components/ui/aspect-ratio";
import { useToast } from "@/components/ui/use-toast";

import { useSocket } from "@/context/SocketContext";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useQueue } from "@/hooks/useQueue";

import { convertURLToCorrectProviderVideoId, isValidUrl } from "@/libs/utils/frontend-utils";
import { Spinner } from "@/components/Spinner";

//import GlugSfx from '../../../assets/audio/mixkit-alert-quick-chime-766.mp3';

const ReactPlayer = dynamic(() => import("react-player/lazy"), {
  loading: () => {
    return <div className="w-full h-full flex text-white items-center justify-center">LOADING</div>;
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
  const [currentVideoUrl, setCurrentVideoUrl] = useState<string>(room?.videoInfo.currentVideoUrl || "https://youtu.be/QdKhuEnkwiY");
  const [isLoading, setIsLoading] = useState(false);
  const [_isSyncing, setIsSyncing] = useState(false);

  const [playUserJoinedSound] = useSound("/next-assets/audio/mixkit-alert-quick-chime-766.wav", { volume: 0.1 });

  const [player, setPlayer] = useState<ReactPlayerType | null>(null);
  const isSocketAvailable = !!socket;

  const router = useRouter();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const roomId = searchParams.get("id") as string;

  const videoQueue = useQueue<VideoQueueItem>();

  useEffect(() => {
    setStoredRoom(room);

    if (room && Array.isArray(room?.videoInfo?.queue) && room.videoInfo.queue.length > 0) {
      videoQueue.set(room.videoInfo.queue);
    }

    if (room?.videoInfo.currentVideoUrl) {
      setCurrentVideoUrl(room?.videoInfo.currentVideoUrl);
    }
  }, [room]);

  const handleGoBackToHome = React.useCallback(() => {
    setStoredRoom(null);
    router.push("/");
  }, [storedRoom]);

  useEffect(() => {
    if (!isConnecting && socket?.connected && !room) {
      socket.emit(RECONNECT_USER, roomId, sessionToken, (result) => {
        if (!result.success) {
          handleGoBackToHome();
        }
      });
    } else if (!room && storedRoom && !!socket) {
      socket.emit(RECONNECT_USER, roomId, sessionToken, (result) => {
        if (!result.success) {
          handleGoBackToHome();
        }
      });
    } else if (room === undefined && isConnecting === false) {
      handleGoBackToHome();
    }
  }, [isSocketAvailable, isConnecting, room]);

  useEffect(() => {
    if (room && room.members.length === 0) {
      handleGoBackToHome();
    }
  }, [room]);

  const socketMethods = React.useCallback(() => {
    if (!socket) return;

    socket.on(GET_ROOM_INFO, (newRoom) => {
      setStoredRoom(newRoom);
    });

    socket.on(SET_HOST, (newHost: string) => {
      console.log(SET_HOST, newHost, room);
      if (room) {
        const newRoom = { ...room, host: newHost };
        console.log(newRoom);
        setStoredRoom(newRoom);
      }
    });

    socket.on(SERVER_MESSAGE, (newMessage) => {
      if ([ServerMessageType.USER_JOINED, ServerMessageType.USER_RECONNECTED].includes(newMessage.type)) {
        playUserJoinedSound();
      }
      setMessages((prevMessages) => [...prevMessages, newMessage]);
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
      handleSyncTime(time);
      setIsSyncing(false);
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
      handlePlay();
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
    if (!player) {
      console.log("Failed to sync time");
      return;
    }
    const currentTime = player?.getCurrentTime();
    if (currentTime < time - 0.6 || currentTime > time + 0.6) {
      player.seekTo(time);
      setIsPlaying(true);
    }
  };

  const handlePlay = () => {
    setIsPlaying(true);
    runIfAuthorized(() => socket?.emit(PLAY_VIDEO));
  };

  const handlePause = () => {
    setIsPlaying(false);
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

  const handleClickPlayerButton = (buttonAction: ButtonActions, payload?: { videoUrl: string; videoIndex?: number }) => {
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
        if (typeof payload?.videoUrl === "string" && isValidUrl(payload.videoUrl)) {
          setCurrentVideoUrl(payload.videoUrl);
          socket?.emit(CHANGE_VIDEO, payload.videoUrl, payload.videoIndex);
          setIsPlaying(true);
        }
        return;
      case "sync-video":
        setIsSyncing(true);
        socket?.emit(GET_VIDEO_INFORMATION);
        toast({
          variant: "info",
          Icon: RefreshCcwIcon,
          iconClassname: "animate-spin",
          title: "Syncing with host",
          description: "This shouldn't take too long at all!",
          duration: 1000,
        });
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

  // const onProgress = (state: OnProgressProps) => {
  //   // Might fallback to this if the videos consistently go out of sync
  //   //console.log("onProgress", state);
  // };

  if (!room) {
    return (
      <div className="w-full h-[calc(100vh-106px)] flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <main className="mx-auto h-full flex flex-col md:flex-row justify-center mt-[-1rem] md:mt-0">
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
                //onProgress={onProgress}
                onEnded={handleEnded}
                fallback={<div>LOADING</div>}
              />
            </AspectRatio>
          </div>
        </div>
        <div className="w-full flex items-center justify-center p-2 md:p-0">
          <RoomToolbar activeView={activeView} onClickPlayerButton={handleClickPlayerButton} isPlaying={isPlaying} roomId={roomId} />
        </div>
      </div>
      <Sidebar activeView={activeView} views={views} />
    </main>
  );
};

export default RoomPage;

export const getServerSideProps: GetServerSideProps = async (context) => {
  const sessionToken = context.req.cookies["session_token"] || null;
  return {
    props: {
      sessionToken,
      navigationHeaderProps: {
        page: "video_room",
      },
    },
  };
};
