import React, { useState } from "react";

import { PlayIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import UAParser from "ua-parser-js";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { VideoQueueItem } from "@/types/interfaces";
import { ADD_VIDEO_TO_QUEUE, REMOVE_VIDEO_FROM_QUEUE, VIDEO_QUEUE_REORDERED, VIDEO_QUEUE_CLEARED } from "@/constants/socketActions";

import { Queue } from "@/hooks/useQueue";
import { useToast } from "@/components/ui/use-toast";
import Image from "next/image";
import { useSocket } from "@/context/SocketContext";
import { runIfAuthorized } from "@/libs/utils/socket";
import { ButtonActions } from "./RoomToolbar";
import ReactPlayer from "react-player";
import { fetchMediaData } from "@/libs/utils/video-fetch-lib";
import { convertURLToYoutubeVideoId } from "@/libs/utils/frontend-utils";

interface QueueProps {
  currentVideoId: string;
  videoQueue: Queue<VideoQueueItem>;
  onClickPlayerButton: (newActiveButton: ButtonActions, payload?: { videoUrl: string; videoIndex?: number }) => void;
}

const Queue: React.FC<QueueProps> = ({ videoQueue, onClickPlayerButton }) => {
  const [newVideoInQueueUrl, setNewVideoInQueueUrl] = useState<string>("");

  const { toast } = useToast();
  const { socket, room } = useSocket();

  const isAuthorized = socket?.isAdmin || room?.host === socket?.userId;
  const isMobile = new UAParser().getDevice().type === "mobile";

  const getIndexOfVideoInQueue = (videoId: string): number => {
    const index = videoQueue.queue.findIndex((video) => video.id === videoId);
    return index;
  };

  const handleOnChangeVideoUrl = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewVideoInQueueUrl(e.target.value);
  };

  const handleOnKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleAddVideoToQueue();
  };

  const handleAddVideoToQueue = async () => {
    if (!isAuthorized || !socket) return;
    if (!ReactPlayer.canPlay(newVideoInQueueUrl)) return;

    const removeQueryParams = (url: string, param: string): string => {
      if (!convertURLToYoutubeVideoId(url)) return url;
      const parsedUrl = new URL(url);
      const params = parsedUrl.searchParams;
      params.delete(param);
      return parsedUrl.toString();
    };

    const formattedVideoUrl = removeQueryParams(newVideoInQueueUrl, "t");
    const videoExist = videoQueue.queue.find((video) => video.url === formattedVideoUrl);

    if (!!videoExist) {
      toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong",
        description: "This video is already in the current queue",
      });
      return;
    }

    const newVideo = await fetchMediaData(formattedVideoUrl);

    if (newVideo?.url) {
      videoQueue.add(newVideo);
      socket.emit(ADD_VIDEO_TO_QUEUE, newVideo);
      setNewVideoInQueueUrl("");
    } else {
      toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong",
        description: "This URL seems to be invalid or is not from an accepted provider",
      });
    }
  };

  const handleChangeVideo = (newVideoUrl: string, newVideoId: string) => {
    if (socket?.userId && room) {
      runIfAuthorized(
        room.host,
        socket.userId,
        () => {
          const newVideoIndex = getIndexOfVideoInQueue(newVideoId);
          onClickPlayerButton("change-video", { videoUrl: newVideoUrl, videoIndex: newVideoIndex });
        },
        socket.isAdmin
      );
    }
  };

  const handleRemoveVideoFromQueue = (videoUrl: string) => {
    if (socket?.userId && room) {
      runIfAuthorized(
        room.host,
        socket.userId,
        () => {
          socket.emit(REMOVE_VIDEO_FROM_QUEUE, videoUrl);
          videoQueue.removeItem("url", videoUrl);
        },
        socket.isAdmin
      );
    }
  };

  const handleClearQueue = () => {
    if (socket?.userId && room) {
      runIfAuthorized(
        room.host,
        socket.userId,
        () => {
          if (videoQueue.queue.length > 0) {
            socket.emit(VIDEO_QUEUE_CLEARED);
            videoQueue.clear();
          }
        },
        socket.isAdmin
      );
    }
  };

  const handleReorder = (list: VideoQueueItem[], startIndex: number, endIndex: number): VideoQueueItem[] => {
    const result = Array.from(list);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);
    return result;
  };

  const onDragEnd = (result: DropResult) => {
    if (socket?.userId && room) {
      runIfAuthorized(
        room.host,
        socket.userId,
        () => {
          if (!result.destination) return;
          const items = handleReorder(videoQueue.queue, result.source.index, result.destination.index);
          videoQueue.set(items);
          socket.emit(VIDEO_QUEUE_REORDERED, items);
        },
        socket.isAdmin
      );
    }
  };

  const getItemStyle = (draggableStyle?: React.CSSProperties) => ({
    userSelect: "none" as React.CSSProperties["userSelect"],
    ...draggableStyle,
  });

  // inset 0 2px 3px rgba(255, 255, 255, 0.3), inset 0 -2px 3px #4d219b, 0 1px 1px #331567
  // shadow-[inset_0_2px_3px_rgba(255,_255,_255,_0.3),_inset_0_-2px_3px_#4d219b,_0_1px_1px_#331567]

  // background: linear-gradient(90deg, rgba(2,0,36,1) 0%, rgba(107,46,215,1) 35%, rgba(77,52,122,1) 100%);
  // bg-[linear-gradient(90deg,_rgba(2,0,36,1)_0%,_rgba(107,46,215,1)_35%,rgba(77,52,122,1)_100%)]

  //bg-[linear-gradient(120deg,_rgba(2,0,36,1)_0%,_rgba(107,46,215,1)_35%,rgba(77,52,122,1)_100%)]

  return (
    <div className="flex flex-col flex-grow w-full h-full relative hide-scrollbar">
      <div className="flex items-center p-2">
        <Input
          className="h-10 rounded-l rounded-r-none"
          type="text"
          value={newVideoInQueueUrl}
          onChange={handleOnChangeVideoUrl}
          onKeyDown={handleOnKeyDown}
          placeholder={!isAuthorized ? "Only the host can add videos" : "Add video"}
          disabled={!isAuthorized}
        />
        <Button onClick={handleAddVideoToQueue} className="w-12 h-10 rounded-r rounded-l-none" disabled={!isAuthorized}>
          <span>
            <PlusIcon color="#FFFFFF" size="1.25rem" />
          </span>
        </Button>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="droppable" isDropDisabled={!isAuthorized || isMobile}>
          {(provided) => (
            <div
              className="flex-grow overflow-y-auto p-4 h-full gap-y-4 flex flex-col"
              {...provided.droppableProps}
              ref={provided.innerRef}
            >
              {videoQueue.queue.map((video, index) => (
                <Draggable
                  key={`${video.id}-${index}`}
                  draggableId={`${video.id}-${index}`}
                  index={index}
                  isDragDisabled={!isAuthorized || isMobile}
                >
                  {(provided, snapshot) => (
                    <div
                      className={`${
                        room?.videoInfo.currentQueueIndex === index
                          ? "bg-gradient-to-br from-[#4d347a] from-10% via-[#6b2ed7] via-60% to-[#18118d] to-92%"
                          : snapshot.isDragging
                          ? "bg-[#6936ff75]"
                          : "bg-[#212123]"
                      } rounded w-[250px] md:w-auto p-2 cursor-pointer`}
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      style={getItemStyle(provided.draggableProps.style)}
                    >
                      <div className="w-full h-[130px] relative">
                        {isAuthorized && (
                          <div className="flex absolute bottom-2 right-2 z-[2] gap-2">
                            <Button
                              aria-label="Play video"
                              className="p-2 w-8 h-8 bg-black"
                              onClick={() => handleChangeVideo(video.url, video.id)}
                            >
                              <span>
                                <PlayIcon fill="#FFFFFF" color="#FFFFFF" size="1.25rem" />
                              </span>
                            </Button>
                            <Button
                              aria-label="Remove video"
                              className="p-2 w-8 h-8 bg-black"
                              onClick={() => handleRemoveVideoFromQueue(video.url)}
                            >
                              <span>
                                <Trash2Icon color="#FFFFFF" size="1.25rem" />
                              </span>
                            </Button>
                          </div>
                        )}
                        <Image alt="" src={video.thumbnail || "/next-assets/images/synkro_placeholder.svg"} fill={true} quality={25} />
                      </div>
                      <p className="text-primary-foreground mt-2 text-sm">{video.title}</p>
                    </div>
                  )}
                </Draggable>
              ))}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {isAuthorized && (
        <div className="w-full flex p-2">
          <Button onClick={handleClearQueue} className="w-full rounded" disabled={!isAuthorized} variant="destructive">
            <span className="uppercase">Clear queue</span>
          </Button>
        </div>
      )}
    </div>
  );
};

export default Queue;
