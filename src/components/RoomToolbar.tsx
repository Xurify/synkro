import { useState } from "react";
import {
  ArrowRightIcon,
  ExpandIcon,
  FastForwardIcon,
  ListOrderedIcon,
  MessageSquareIcon,
  PauseIcon,
  PlayIcon,
  RewindIcon,
  SettingsIcon,
  DoorOpenIcon,
} from "lucide-react";
import { Separator } from "./Separator";

export type ButtonActions = SidebarViews | "expand" | "play" | "pause" | "fast-forward" | "rewind" | "leave_room";
export type SidebarViews = "chat" | "queue" | "settings";

interface RoomToolbarProps {
  activeView: ButtonActions;
  onClickPlayerButton: (newActiveButton: ButtonActions) => void;
  isPlaying: boolean;
  roomId: string;
}

interface PlayPauseButtonProps {
  onClick: (newActiveButton: ButtonActions) => void;
  isPlaying: boolean;
}

const PlayPauseButton: React.FC<PlayPauseButtonProps> = ({ onClick, isPlaying }) => {
  const defaultButtonClassName = `w-9 h-9 min-w-[2.25rem] flex items-center justify-center bg-brand-indigo-200 hover:bg-brand-purple-100 rounded`;
  if (isPlaying) {
    return (
      <button className={`${defaultButtonClassName}`} onClick={() => onClick("pause")}>
        <PauseIcon color="#FFFFFF" size="1.25rem" />
      </button>
    );
  }

  return (
    <button className={`${defaultButtonClassName}`} onClick={() => onClick("play")}>
      <PlayIcon color="#FFFFFF" size="1.25rem" />
    </button>
  );
};

export const RoomToolbar: React.FC<RoomToolbarProps> = ({ activeView, onClickPlayerButton, isPlaying }) => {
  const [newVideoUrl, setNewVideoUrl] = useState<string>("");

  const handleChangeNewVideoUrl = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewVideoUrl(value);
  };

  const defaultButtonClassName = `w-9 h-9 min-w-[2.25rem] flex items-center justify-center bg-brand-indigo-200 hover:bg-brand-purple-100 rounded`;

  return (
    <div className="max-w-[80rem] w-full bg-white shadow-md p-2.5 rounded flex">
      <div className="w-full flex gap-2">
        <button
          className={`${defaultButtonClassName} data-[active=chat]:bg-brand-indigo-400`}
          data-active={activeView}
          onClick={() => onClickPlayerButton("chat")}
        >
          <MessageSquareIcon color="#FFFFFF" size="1.25rem" />
        </button>
        <button
          className={`${defaultButtonClassName} data-[active=queue]:bg-brand-indigo-400`}
          data-active={activeView}
          onClick={() => onClickPlayerButton("queue")}
        >
          <ListOrderedIcon color="#FFFFFF" size="1.25rem" />
        </button>
        <button
          className={`${defaultButtonClassName} data-[active=expand]:bg-brand-indigo-400`}
          onClick={() => onClickPlayerButton("expand")}
        >
          <ExpandIcon color="#FFFFFF" size="1.25rem" />
        </button>
        <Separator />
        <PlayPauseButton onClick={onClickPlayerButton} isPlaying={isPlaying} />
        <button className={`${defaultButtonClassName}`} onClick={() => onClickPlayerButton("rewind")}>
          <RewindIcon color="#FFFFFF" size="1.25rem" />
        </button>
        <button className={`${defaultButtonClassName}`} onClick={() => onClickPlayerButton("fast-forward")}>
          <FastForwardIcon color="#FFFFFF" size="1.25rem" />
        </button>
        <Separator />
        <div className="w-full flex items-center">
          <input
            className="bg-gray-100 py-1.5 px-2 w-full rounded-sm outline-none"
            placeholder="New Video URL"
            onChange={handleChangeNewVideoUrl}
            value={newVideoUrl}
          />
          <button className={`${defaultButtonClassName} ml-2`}>
            <ArrowRightIcon color="#FFFFFF" size="1.25rem" />
          </button>
        </div>
        <Separator />
        <button className={`${defaultButtonClassName} bg-red-500 hover:bg-red-400`} onClick={() => onClickPlayerButton("leave_room")}>
          <DoorOpenIcon color="#FFFFFF" size="1.25rem" />
        </button>
        <button
          className={`${defaultButtonClassName} data-[active=settings]:bg-brand-indigo-400`}
          data-active={activeView}
          onClick={() => onClickPlayerButton("settings")}
        >
          <SettingsIcon color="#FFFFFF" size="1.25rem" />
        </button>
      </div>
    </div>
  );
};

export default RoomToolbar;
