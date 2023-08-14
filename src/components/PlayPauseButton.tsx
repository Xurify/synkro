import { PauseIcon, PlayIcon } from "lucide-react";
import { ButtonActions } from "./RoomToolbar";
import { Button } from "@/components/ui/button";

interface PlayPauseButtonProps {
  onClick: (newActiveButton: ButtonActions) => void;
  isPlaying: boolean;
}

export const PlayPauseButton: React.FC<PlayPauseButtonProps> = ({ onClick, isPlaying }) => {
  return (
    <Button className="w-9 h-9" onClick={() => onClick(isPlaying ? "pause" : "play")} variant="secondary">
      <span>{isPlaying ? <PauseIcon color="#FFFFFF" size="1.25rem" /> : <PlayIcon color="#FFFFFF" size="1.25rem" />}</span>
    </Button>
  );
};
