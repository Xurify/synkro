import { PauseIcon, PlayIcon } from "lucide-react";
import { ButtonActions } from "./RoomToolbar";

interface PlayPauseButtonProps {
  onClick: (newActiveButton: ButtonActions) => void;
  isPlaying: boolean;
}

export const PlayPauseButton: React.FC<PlayPauseButtonProps> = ({ onClick, isPlaying }) => {
  const defaultButtonClassName = `w-9 h-9 min-w-[2.25rem] flex items-center justify-center bg-brand-indigo-200 hover:bg-brand-indigo-400 rounded`;
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
