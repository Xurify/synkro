import React, { startTransition, useEffect, useState } from "react";
import { GetServerSideProps } from "next";
import Head from "next/head";
import { useRouter } from "next/navigation";
import useSound from "use-sound";

import ReactPlayer from "react-player";
import type ReactPlayerType from "react-player";
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
  VIDEO_QUEUE_CLEARED,
  GET_ROOM_INFO,
  KICK_USER,
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
import { useUpdateEffect } from "@/hooks/useUpdateEffect";

import { convertURLToCorrectProviderVideoId } from "@/libs/utils/frontend-utils";
import { Spinner } from "@/components/Spinner";
import { AUDIO_FILE_URL_REGEX, VIDEO_FILE_URL_REGEX } from "@/constants/constants";

export interface RoomPageProps {
  sessionToken: string;
  roomId: string;
}

export const RoomPage: React.FC<RoomPageProps> = ({ sessionToken, roomId }) => {
  const [activeView, setActiveView] = useState<SidebarViews>("chat");
  const [isPlaying, setIsPlaying] = useState(false);
  const [messages, setMessages] = useState<Messages>([]);
  const { socket, room, isConnecting } = useSocket();
  const [storedRoom, setStoredRoom] = useLocalStorage("room", room);
  const [currentVideoUrl, setCurrentVideoUrl] = useState<string>(room?.videoInfo.currentVideoUrl || "https://youtu.be/QdKhuEnkwiY");
  const [isLoading, setIsLoading] = useState(false);
  const [_isSyncing, setIsSyncing] = useState(false);

  // Mixkit.co
  const [playUserJoinedSound] = useSound("/next-assets/audio/user_joined.wav", { volume: 0.1 });
  const [playUserDisconnectedSound] = useSound("/next-assets/audio/user_disconnected.mp3", { volume: 0.5 });

  // ElevenLabs
  const [playUserKickedSound] = useSound("/next-assets/audio/ElevenLabs_Mimi_Kicked.mp3", { volume: 0.5 });

  const [player, setPlayer] = useState<ReactPlayerType | null>(null);

  const isSocketAvailable = !!socket;

  const router = useRouter();
  const { toast } = useToast();

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
          console.error(result.error);
          handleGoBackToHome();
        }
      });
    } else if (!room && storedRoom && !!socket) {
      socket.emit(RECONNECT_USER, roomId, sessionToken, (result) => {
        if (!result.success) {
          console.error(result.error);
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

    socket.on(SERVER_MESSAGE, (newMessage) => {
      if ([ServerMessageType.USER_JOINED, ServerMessageType.USER_RECONNECTED].includes(newMessage.type)) {
        playUserJoinedSound();
      }
      if (newMessage.type === ServerMessageType.USER_DISCONNECTED) {
        playUserDisconnectedSound();
      }
      setMessages((prevMessages) => [...prevMessages, newMessage]);
    });

    socket.on(USER_MESSAGE, (newMessage: ChatMessage) => {
      setMessages((prevMessages) => [...prevMessages, newMessage]);
    });

    const currentVideoId = convertURLToCorrectProviderVideoId(currentVideoUrl) as string;

    socket.on(GET_HOST_VIDEO_INFORMATION, (callback: (playing: boolean, videoUrl: string, time: number) => void) => {
      if (sessionToken !== room?.host) return;
      const currentTime = player?.getCurrentTime() ?? 0;
      const currentVideoUrl = player?.props?.url as string;
      const isCurrentlyPlaying = player?.props?.playing as boolean;

      console.log(GET_HOST_VIDEO_INFORMATION, currentTime, currentVideoUrl, currentVideoId, isCurrentlyPlaying);
      typeof callback === "function" && callback(isCurrentlyPlaying, currentVideoUrl, currentTime);
    });

    socket.on(SYNC_VIDEO_INFORMATION, (playing, hostVideoUrl, time) => {
      console.log(SYNC_VIDEO_INFORMATION, playing, hostVideoUrl, time, currentVideoId);
      setCurrentVideoUrl(hostVideoUrl);
      handleSyncTime(time);
      setIsPlaying(playing);
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
      handleSyncTime(0);
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

    socket.on(VIDEO_QUEUE_CLEARED, () => {
      videoQueue.set([]);
    });

    socket.on(SYNC_TIME, (currentTime: number) => {
      handleSyncTime(currentTime);
    });

    socket.on(KICK_USER, () => {
      socket.disconnect();
      setStoredRoom(null);
      playUserKickedSound();
      toast({
        variant: "destructive",
        Icon: () => <span>😢</span>,
        description: "You have been kicked",
        duration: 10000,
      });
      router.push("/");
    });

    socket.on(LEAVE_ROOM, () => {
      playUserDisconnectedSound();
      socket.disconnect();
      setStoredRoom(null);
      router.push("/");
    });

    const handleSyncTime = (time: number) => {
      if (!player) {
        console.error("Failed to sync time");
        return;
      }
      const currentTime = player?.getCurrentTime() ?? 0;
      console.log("handleSyncTime", time, currentTime, currentTime < time - 0.6, currentTime > time + 0.6);
      if (currentTime < time - 0.6 || currentTime > time + 0.6) {
        console.log("PLAYERSEEKTO", time, player);
        player.seekTo(time, "seconds");
      }
    };

    return () => {
      playUserDisconnectedSound();
      socket.offAnyOutgoing();
      socket.disconnect();
    };
  }, [socket, player]);

  const onReady = React.useCallback(
    (player: ReactPlayerType) => {
      if (sessionToken === room?.host || sessionToken === process.env.NEXT_PUBLIC_ADMIN_TOKEN) {
        if (!currentVideoUrl.match(VIDEO_FILE_URL_REGEX) && !currentVideoUrl.match(AUDIO_FILE_URL_REGEX)) {
          player?.seekTo(0, "seconds");
        }
        setIsPlaying(true);
      }
      setIsLoading(false);
      if (sessionToken !== room?.host) {
        socket?.emit(GET_VIDEO_INFORMATION);
      }
    },
    [currentVideoUrl, player, sessionToken, room?.host, socket]
  );

  useUpdateEffect(() => {
    if (!player && !isLoading) return;
    socketMethods();
  }, [player]);

  // useEffect(() => {
  // }, [player]);

  const runIfAuthorized = (callback?: () => void, disableAdminCheck = false) => {
    if ((socket?.isAdmin && !disableAdminCheck) || room?.host === socket?.userId) {
      typeof callback === "function" && callback();
    }
  };

  const handleLeaveRoom = () => {
    if (!socket) return;
    socket.emit(LEAVE_ROOM, roomId);
    void router.push("/");
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
    }, false);
  };

  const handleClickPlayerButton = (buttonAction: ButtonActions, payload?: { videoUrl: string; videoIndex?: number }) => {
    if (["chat", "queue", "settings"].includes(buttonAction)) {
      startTransition(() => {
        setActiveView(buttonAction as SidebarViews);
      });
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
        if (typeof payload?.videoUrl === "string" && ReactPlayer.canPlay(payload.videoUrl)) {
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
      default:
        break;
    }
  };

  const currentVideoId = convertURLToCorrectProviderVideoId(currentVideoUrl) as string;

  const views: { [key in SidebarViews]: JSX.Element } = {
    chat: <Chat messages={messages} roomId={roomId} />,
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
    <>
      <Head>
        <title>Synkro - {room.name ?? "Unknown"}</title>
      </Head>

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
                  ref={setPlayer}
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
    </>
  );
};

export default RoomPage;

export const getServerSideProps: GetServerSideProps = async (context) => {
  const sessionToken = context.req.cookies["session_token"] || null;
  const adminToken = context.req.cookies["admin_token"] || null;
  const roomId = context.params?.["id"] || null;

  return {
    props: {
      sessionToken,
      adminToken,
      roomId,
      navigationHeaderProps: {
        page: "video_room",
      },
    },
  };
};
