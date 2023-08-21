import React, { useState } from "react";

import { PlayIcon, PlusIcon } from "lucide-react";
//import { PlusIcon } from "@radix-ui/react-icons";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { VideoQueueItem } from "@/types/interfaces";
import { ADD_VIDEO_TO_QUEUE, CHANGE_VIDEO } from "@/constants/socketActions";

import { Queue } from "@/hooks/useQueue";
import { YOUTUBE_VIDEO_URL_REGEX } from "@/constants/constants";
import { useToast } from "./ui/use-toast";
import { convertURLToYoutubeVideoId } from "@/libs/utils/frontend-utils";
import Image from "next/image";
import { useSocket } from "@/context/SocketContext";
import { runIfAuthorized } from "@/libs/utils/socket";
import { ButtonActions } from "./RoomToolbar";

interface QueueProps {
  currentVideoId: string;
  videoQueue: Queue<VideoQueueItem>;
  onClickPlayerButton: (newActiveButton: ButtonActions, payload?: string | number) => void;
}

const Queue: React.FC<QueueProps> = ({ currentVideoId, videoQueue, onClickPlayerButton }) => {
  const [newVideoInQueueUrl, setNewVideoInQueueUrl] = useState<string>("");

  const { toast } = useToast();
  const { socket, room } = useSocket();

  const isAuthorized = room?.host === socket?.userId;

  const handleOnChangeMessage = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewVideoInQueueUrl(e.target.value);
  };

  const handleOnKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleAddVideoToQueue();
  };

  const handleAddVideoToQueue = () => {
    if (!isAuthorized) return;
    if (!socket || newVideoInQueueUrl.trim() === "") return;
    if (!YOUTUBE_VIDEO_URL_REGEX.test(newVideoInQueueUrl)) {
      toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong.",
        description: "This URL seems to be invalid.",
      });
      return;
    }

    const videoId = convertURLToYoutubeVideoId(newVideoInQueueUrl);

    const videoExist = videoQueue.queue.find((video) => video.id === videoId);
    if (!!videoExist) {
      toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong.",
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
        const videoInfo = data.items[0];

        const id = videoInfo.id;
        const title = videoInfo.snippet.title;
        const thumbnail = videoInfo.snippet.thumbnails.medium.url;

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

  const handleChangeVideo = (newVideoUrl: string) => {
    if (socket?.userId && room) {
      runIfAuthorized(room.host, socket.userId, () => {
        onClickPlayerButton("change-video", newVideoUrl);
        socket?.emit(CHANGE_VIDEO, newVideoUrl);
      });
    }
  };

  return (
    <div className="flex flex-col flex-grow w-full h-full relative hide-scrollbar">
      {isAuthorized && (
        <div className="flex items-center p-2">
          <Input
            className="h-10 rounded-l rounded-r-none"
            type="text"
            value={newVideoInQueueUrl}
            onChange={handleOnChangeMessage}
            onKeyDown={handleOnKeyDown}
            placeholder="Add video"
          />
          <Button onClick={handleAddVideoToQueue} className="w-12 h-10 rounded-r rounded-l-none">
            <span>
              <PlusIcon color="#ffffff" size="1.25rem" />
            </span>
          </Button>
        </div>
      )}
      <div className="flex-grow overflow-y-auto p-4 h-full gap-y-4 flex flex-col">
        {videoQueue.queue.map((video, index) => (
          <div
            className={`bg-gray-800 rounded p-1 px-2 bg-${currentVideoId === video.id ? "primary" : "default"} cursor-pointer`}
            key={`${video.id}-${index}`}
          >
            <div className="w-full h-[130px] relative">
              <Button className="p-2 w-8 h-8 z-[2] absolute bottom-2 right-2 bg-black" onClick={() => handleChangeVideo(video.url)}>
                <span>
                  <PlayIcon fill="#FFFFFF" color="#FFFFFF" size="1.25rem" />
                </span>
              </Button>
              <Image alt="" src={video.thumbnail} layout="fill" />
            </div>
            <p className="text-text text-primary-foreground mt-2 text-sm">{video.name}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Queue;
