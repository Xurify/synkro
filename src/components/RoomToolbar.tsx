import { useState } from "react";
import {
  ArrowRightIcon,
  ExpandIcon,
  FastForwardIcon,
  ListOrderedIcon,
  MessageSquareIcon,
  RewindIcon,
  SettingsIcon,
  DoorOpenIcon,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import { runIfAuthorized } from "@/libs/utils/socket";
import { useSocket } from "@/context/SocketContext";
import { CHANGE_VIDEO } from "@/constants/socketActions";

import { Separator } from "./Separator";
import { PlayPauseButton } from "./PlayPauseButton";

export type ButtonActions = SidebarViews | "expand" | "play" | "pause" | "fast-forward" | "rewind" | "change-video" | "leave-room";
export type SidebarViews = "chat" | "queue" | "settings";

interface RoomToolbarProps {
  activeView: ButtonActions;
  onClickPlayerButton: (newActiveButton: ButtonActions, payload?: string | number) => void;
  isPlaying: boolean;
  roomId: string;
}

export const RoomToolbar: React.FC<RoomToolbarProps> = ({ activeView, onClickPlayerButton, isPlaying }) => {
  const [newVideoUrl, setNewVideoUrl] = useState<string>("");

  const { socket, room } = useSocket();

  const handleChangeNewVideoUrl = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewVideoUrl(value);
  };

  const handleChangeVideo = () => {
    if (socket?.userId && room) {
      runIfAuthorized(room.host, socket.userId, () => {
        onClickPlayerButton("change-video", newVideoUrl);
        setNewVideoUrl("");
        socket?.emit(CHANGE_VIDEO, newVideoUrl);
      });
    }
  };

  const handleChangeVideoOnKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleChangeVideo();
  };

  const defaultButtonClassName = `w-9 h-9 min-w-[2.25rem]`;

  return (
    <div className="max-w-[80rem] w-full bg-card shadow-md p-2.5 rounded flex">
      <div className="w-full">
        <div className="w-full flex gap-2 overflow-x-auto">
          <Button
            className={`${defaultButtonClassName}`}
            data-active={activeView}
            onClick={() => onClickPlayerButton("chat")}
            variant={activeView === "chat" ? "default" : "secondary"}
          >
            <span>
              <MessageSquareIcon color="#FFFFFF" size="1.25rem" />
            </span>
          </Button>
          <Button
            className={`${defaultButtonClassName}`}
            data-active={activeView}
            onClick={() => onClickPlayerButton("queue")}
            variant={activeView === "queue" ? "default" : "secondary"}
          >
            <span>
              <ListOrderedIcon color="#FFFFFF" size="1.25rem" />
            </span>
          </Button>
          <Button
            className={`${defaultButtonClassName}`}
            data-active={activeView}
            onClick={() => onClickPlayerButton("expand")}
            variant={activeView === "expand" ? "default" : "secondary"}
          >
            <span>
              <ExpandIcon color="#FFFFFF" size="1.25rem" />
            </span>
          </Button>
          <Separator />
          <PlayPauseButton onClick={onClickPlayerButton} isPlaying={isPlaying} />
          <Button className={`${defaultButtonClassName}`} onClick={() => onClickPlayerButton("rewind")} variant="secondary">
            <span>
              <RewindIcon color="#FFFFFF" size="1.25rem" />
            </span>
          </Button>
          <Button className={`${defaultButtonClassName}`} onClick={() => onClickPlayerButton("fast-forward")} variant="secondary">
            <span>
              <FastForwardIcon color="#FFFFFF" size="1.25rem" />
            </span>
          </Button>
          <Separator className="hidden md:flex" />
          <div className="w-full items-center hidden md:flex">
            <Input
              className="min-w-[140px]"
              placeholder="Change video"
              onChange={handleChangeNewVideoUrl}
              onKeyDown={handleChangeVideoOnKeyDown}
              value={newVideoUrl}
            />
            <Button className="ml-2 rounded w-12" onClick={handleChangeVideo}>
              <span>
                <ArrowRightIcon color="#FFFFFF" size="1.25rem" />
              </span>
            </Button>
          </div>
          <Separator className="ml-auto" />
          <Button
            className={`${defaultButtonClassName} bg-red-500 hover:bg-red-400`}
            onClick={() => onClickPlayerButton("leave-room")}
            variant="secondary"
          >
            <span>
              <DoorOpenIcon color="#FFFFFF" size="1.25rem" />
            </span>
          </Button>
          <Button
            className={`${defaultButtonClassName}`}
            data-active={activeView}
            onClick={() => onClickPlayerButton("settings")}
            variant={activeView === "settings" ? "default" : "secondary"}
          >
            <span>
              <SettingsIcon color="#FFFFFF" size="1.25rem" />
            </span>
          </Button>
        </div>
        <div className="mt-3 w-full flex md:hidden">
          <div className="w-full flex items-center">
            <Input
              className="min-w-[140px]"
              placeholder="Change video"
              onChange={handleChangeNewVideoUrl}
              onKeyDown={handleChangeVideoOnKeyDown}
              value={newVideoUrl}
            />
            <Button className="ml-2 rounded w-12" onClick={handleChangeVideo}>
              <span>
                <ArrowRightIcon color="#FFFFFF" size="1.25rem" />
              </span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomToolbar;
