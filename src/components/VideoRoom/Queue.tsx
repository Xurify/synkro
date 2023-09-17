import React, { useState } from "react";

import { PlayIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import UAParser from "ua-parser-js";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { VideoQueueItem } from "@/types/interfaces";
import { ADD_VIDEO_TO_QUEUE, REMOVE_VIDEO_FROM_QUEUE, VIDEO_QUEUE_REORDERED } from "@/constants/socketActions";

import { Queue } from "@/hooks/useQueue";
import { YOUTUBE_VIDEO_URL_REGEX } from "@/constants/constants";
import { useToast } from "@/components/ui/use-toast";
import { convertURLToYoutubeVideoId } from "@/libs/utils/frontend-utils";
import Image from "next/image";
import { useSocket } from "@/context/SocketContext";
import { runIfAuthorized } from "@/libs/utils/socket";
import { ButtonActions } from "./RoomToolbar";
import ReactPlayer from "react-player";

interface QueueProps {
  currentVideoId: string;
  videoQueue: Queue<VideoQueueItem>;
  onClickPlayerButton: (newActiveButton: ButtonActions, payload?: { videoUrl: string; videoIndex?: number }) => void;
}

const Queue: React.FC<QueueProps> = ({ currentVideoId, videoQueue, onClickPlayerButton }) => {
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

  const handleAddVideoToQueue = () => {
    if (!isAuthorized || !socket) return;
    if (!ReactPlayer.canPlay(newVideoInQueueUrl)) return;
    if (!YOUTUBE_VIDEO_URL_REGEX.test(newVideoInQueueUrl)) {
      toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong",
        description: "This URL seems to be invalid.",
      });
      return;
    }

    const videoId = convertURLToYoutubeVideoId(newVideoInQueueUrl);

    const videoExist = videoQueue.queue.find((video) => video.id === videoId);
    if (!!videoExist) {
      toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong",
        description: "This video is already in the current queue",
      });
      setNewVideoInQueueUrl("");
      return;
    }

    const YOUTUBE_API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;

    const url = `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&key=${YOUTUBE_API_KEY}&part=snippet,contentDetails,statistics`;

    fetch(url)
      .then((response) => response.json())
      .then((data) => {
        const videoInfo = data.items?.[0];

        if (!videoInfo) {
          console.error("No video info available", videoId);
        }

        const id = videoInfo.id;
        const title = videoInfo.snippet.title;
        const thumbnail = videoInfo.snippet.thumbnails.maxres.url;

        const newVideo = {
          url: newVideoInQueueUrl,
          name: title,
          thumbnail: thumbnail || "",
          id,
        };

        videoQueue.add(newVideo);
        socket.emit(ADD_VIDEO_TO_QUEUE, newVideo);
        setNewVideoInQueueUrl("");
      })
      .catch((error) => {
        console.error("Error fetching video details:", error);
      });
  };

  const handleChangeVideo = (newVideoUrl: string, newVideoId: string) => {
    if (socket?.userId && room) {
      runIfAuthorized(room.host, socket.userId, socket.isAdmin, () => {
        const newVideoIndex = getIndexOfVideoInQueue(newVideoId);
        onClickPlayerButton("change-video", { videoUrl: newVideoUrl, videoIndex: newVideoIndex });
      });
    }
  };

  const handleRemoveVideoFromQueue = (videoUrl: string) => {
    if (socket?.userId && room) {
      runIfAuthorized(room.host, socket.userId, socket.isAdmin, () => {
        socket.emit(REMOVE_VIDEO_FROM_QUEUE, videoUrl);
        videoQueue.removeItem("url", videoUrl);
      });
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
      runIfAuthorized(room.host, socket.userId, socket.isAdmin, () => {
        if (!result.destination) return;
        const items = handleReorder(videoQueue.queue, result.source.index, result.destination.index);
        videoQueue.set(items);
        socket.emit(VIDEO_QUEUE_REORDERED, items);
      });
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
    <div className="flex flex-col flex-grow w-full h-full relative hide-scrollbar md:max-h-[calc(100vh-158px)]">
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
                        currentVideoId === video.id
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
                            <Button className="p-2 w-8 h-8 bg-black" onClick={() => handleChangeVideo(video.url, video.id)}>
                              <span>
                                <PlayIcon fill="#FFFFFF" color="#FFFFFF" size="1.25rem" />
                              </span>
                            </Button>
                            <Button className="p-2 w-8 h-8 bg-black" onClick={() => handleRemoveVideoFromQueue(video.url)}>
                              <span>
                                <Trash2Icon color="#FFFFFF" size="1.25rem" />
                              </span>
                            </Button>
                          </div>
                        )}
                        <Image alt="" src={video.thumbnail} layout="fill" quality={25} />
                      </div>
                      <p className="text-primary-foreground mt-2 text-sm">{video.name}</p>
                    </div>
                  )}
                </Draggable>
              ))}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
};

export default Queue;
