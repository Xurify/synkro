import React, { useState } from "react";

import { PlusIcon } from "lucide-react";
//import { PlusIcon } from "@radix-ui/react-icons";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { VideoQueueItem } from "@/types/interfaces";
import { CustomSocket } from "@/types/socketCustomTypes";
import { ADD_VIDEO_TO_QUEUE } from "@/constants/socketActions";

import { Queue } from "@/hooks/useQueue";

interface QueueProps {
  videoQueue: Queue<VideoQueueItem>;
  socket: CustomSocket | null;
}

const Queue: React.FC<QueueProps> = ({ videoQueue, socket }) => {
  const [newVideoUrl, setNewVideoUrl] = useState<string>("");

  const handleOnChangeMessage = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewVideoUrl(e.target.value);
  };

  const handleOnKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleAddVideoToQueue();
  };

  const handleAddVideoToQueue = () => {
    if (!socket || newVideoUrl.trim() === "") return;

    const newVideo = {
      url: "",
      name: "",
      thumbnail: "",
      id: "321312",
    };
    socket.emit(ADD_VIDEO_TO_QUEUE, newVideo);

    setNewVideoUrl("");
  };

  return (
    <div className="flex flex-col flex-grow w-full h-full relative hide-scrollbar">
      <div className="flex items-center p-2">
        <Input
          className="h-10 rounded-l rounded-r-none"
          type="text"
          value={newVideoUrl}
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
      <div className="flex-grow overflow-y-auto p-4 h-full gap-y-4 flex flex-col">
        {videoQueue.queue.map((video, index) => (
          <div className={`bg-gray-800 rounded p-1 px-2`} key={index}>
            <p className="text-text text-primary-foreground">{video.name}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Queue;
