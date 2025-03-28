import { useState } from "react";
import {
  ArrowRightIcon,
  RefreshCwIcon,
  FastForwardIcon,
  ListOrderedIcon,
  MessageSquareIcon,
  RewindIcon,
  SettingsIcon,
  DoorOpenIcon,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import {
  TooltipProvider,
  TooltipTrigger,
  TooltipContent,
  Tooltip,
} from "@/components/ui/tooltip";

import { runIfAuthorized } from "@/libs/utils/socket";
import { useSocket } from "@/context/SocketContext";

import { Separator } from "../Separator";
import { PlayPauseButton } from "./PlayPauseButton";
import ReactPlayer from "react-player";

export const defaultButtonClassName = "w-9 h-9 min-w-[2.25rem]";

export type ButtonActions =
  | SidebarViews
  | "expand"
  | "play"
  | "pause"
  | "fast-forward"
  | "rewind"
  | "sync-video"
  | "change-video"
  | "leave-room";

export type SidebarViews = "chat" | "queue" | "settings";

interface ButtonWithTooltipProps {
  tooltipText: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link";
  "aria-label": string;
}

const ButtonWithTooltip: React.FC<ButtonWithTooltipProps> = ({
  tooltipText,
  children,
  className,
  onClick,
  variant,
  "aria-label": ariaLabel,
}) => {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          aria-label={ariaLabel}
          className={className}
          onClick={onClick}
          variant={variant}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>{tooltipText}</p>
      </TooltipContent>
    </Tooltip>
  );
};

interface RoomToolbarProps {
  activeView: ButtonActions;
  onClickPlayerButton: (
    newActiveButton: ButtonActions,
    payload?: { videoUrl: string; videoIndex?: number },
  ) => void;
  isPlaying: boolean;
  roomId: string;
}

export const RoomToolbar: React.FC<RoomToolbarProps> = ({
  activeView,
  onClickPlayerButton,
  isPlaying,
}) => {
  const [newVideoUrl, setNewVideoUrl] = useState<string>("");

  const { socket, room } = useSocket();
  const { toast } = useToast();

  const handleChangeNewVideoUrl = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewVideoUrl(value);
  };

  const handleChangeVideo = () => {
    if (newVideoUrl.trim() === "") return;
    if (!ReactPlayer.canPlay(newVideoUrl)) {
      toast({
        variant: "destructive",
        title: "Incorrect video URL",
        description: "Sorry, this video cannot be played",
      });
      console.error("Video URL cannot be played:", newVideoUrl);
      return;
    }
    if (socket?.data.isAdmin && room?.host) {
      runIfAuthorized(
        room.host,
        socket.data.userId,
        () => {
          onClickPlayerButton("change-video", { videoUrl: newVideoUrl });
          setNewVideoUrl("");
        },
        socket.data.isAdmin,
      );
    }
  };

  const handleChangeVideoOnKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Enter") handleChangeVideo();
  };

  const handleSyncVideo = () => {
    if (socket?.data.isAdmin && room?.host) {
      if (room.host !== socket.data.userId) {
        onClickPlayerButton("sync-video", { videoUrl: newVideoUrl });
      } else {
        runIfAuthorized(
          room.host,
          socket.data.userId,
          () => {},
          socket.data.isAdmin,
        );
      }
    }
  };

  const isAuthorized =
    socket?.data.isAdmin || room?.host === socket?.data?.userId;

  return (
    <TooltipProvider>
      <div className="max-w-[80rem] w-full bg-card shadow-md p-2.5 rounded flex">
        <div className="w-full">
          <div className="w-full flex gap-2 overflow-x-auto h-9">
            <SidebarViewButtons
              activeView={activeView}
              className={defaultButtonClassName}
              onClick={onClickPlayerButton}
            />
            <Separator />
            <PlayPauseButton
              onClick={onClickPlayerButton}
              isPlaying={isPlaying}
            />
            <ButtonWithTooltip
              tooltipText="Rewind 10 seconds"
              aria-label="Rewind video"
              className={defaultButtonClassName}
              onClick={() => onClickPlayerButton("rewind")}
              variant="secondary"
            >
              <span>
                <RewindIcon color="#FFFFFF" size="1.25rem" />
              </span>
            </ButtonWithTooltip>
            <ButtonWithTooltip
              tooltipText="Fast forward 10 seconds"
              aria-label="Fast forward video"
              className={defaultButtonClassName}
              onClick={() => onClickPlayerButton("fast-forward")}
              variant="secondary"
            >
              <span>
                <FastForwardIcon color="#FFFFFF" size="1.25rem" />
              </span>
            </ButtonWithTooltip>
            <Separator className="hidden min-[1020px]:flex" />
            <ButtonWithTooltip
              tooltipText="Sync video with host"
              aria-label="Sync video with host"
              className="rounded w-9 h-9"
              onClick={handleSyncVideo}
            >
              <span>
                <RefreshCwIcon color="#FFFFFF" size="1.25rem" />
              </span>
            </ButtonWithTooltip>
            <div className="w-full items-center hidden min-[1020px]:flex">
              <Input
                className="min-w-[140px]"
                disabled={!isAuthorized}
                type="text"
                placeholder={
                  !isAuthorized
                    ? "Only the host can change the video"
                    : "Change video"
                }
                onChange={handleChangeNewVideoUrl}
                onKeyDown={handleChangeVideoOnKeyDown}
                value={newVideoUrl}
              />
              <ButtonWithTooltip
                tooltipText="Change current video"
                aria-label="Change video"
                className="ml-2 rounded w-12"
                onClick={handleChangeVideo}
              >
                <span>
                  <ArrowRightIcon color="#FFFFFF" size="1.25rem" />
                </span>
              </ButtonWithTooltip>
            </div>
            <Separator />
            <ButtonWithTooltip
              tooltipText="Leave this room"
              aria-label="Leave room"
              className={`${defaultButtonClassName} ml-auto bg-red-600 hover:bg-red-500`}
              onClick={() => onClickPlayerButton("leave-room")}
              variant="secondary"
            >
              <span>
                <DoorOpenIcon color="#FFFFFF" size="1.25rem" />
              </span>
            </ButtonWithTooltip>
          </div>
          <div className="mt-3 w-full flex min-[1020px]:hidden">
            <div className="w-full flex items-center">
              <Input
                className="min-w-[140px]"
                disabled={!isAuthorized}
                type="text"
                placeholder={
                  !isAuthorized
                    ? "Only the host can change the video"
                    : "Change video"
                }
                onChange={handleChangeNewVideoUrl}
                onKeyDown={handleChangeVideoOnKeyDown}
                value={newVideoUrl}
              />
              <ButtonWithTooltip
                tooltipText="Change current video"
                aria-label="Change video"
                className="ml-2 rounded w-12"
                onClick={handleChangeVideo}
              >
                <span>
                  <ArrowRightIcon color="#FFFFFF" size="1.25rem" />
                </span>
              </ButtonWithTooltip>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
};

export const SidebarViewButtons = ({
  className,
  activeView,
  onClick,
}: {
  className: string;
  activeView: ButtonActions;
  onClick: (newActiveView: SidebarViews) => void;
}) => {
  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            aria-label="Go to chat view"
            className={className}
            data-active={activeView}
            onClick={() => onClick("chat")}
            variant={activeView === "chat" ? "default" : "secondary"}
          >
            <span>
              <MessageSquareIcon color="#FFFFFF" size="1.25rem" />
            </span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Chat</p>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            aria-label="Go to queue view"
            className={className}
            data-active={activeView}
            onClick={() => onClick("queue")}
            variant={activeView === "queue" ? "default" : "secondary"}
          >
            <span>
              <ListOrderedIcon color="#FFFFFF" size="1.25rem" />
            </span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Video Queue</p>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            aria-label="Go to settings view"
            className={className}
            data-active={activeView}
            onClick={() => onClick("settings")}
            variant={activeView === "settings" ? "default" : "secondary"}
          >
            <span>
              <SettingsIcon color="#FFFFFF" size="1.25rem" />
            </span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Settings</p>
        </TooltipContent>
      </Tooltip>
    </>
  );
};

export default RoomToolbar;
