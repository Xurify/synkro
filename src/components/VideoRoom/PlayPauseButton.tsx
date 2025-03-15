import { PauseIcon, PlayIcon } from "lucide-react";
import { ButtonActions } from "./RoomToolbar";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";

interface PlayPauseButtonProps {
  onClick: (newActiveButton: ButtonActions) => void;
  isPlaying: boolean;
}

export const PlayPauseButton: React.FC<PlayPauseButtonProps> = ({
  onClick,
  isPlaying,
}) => {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          aria-label={isPlaying ? "Pause video" : "Play video"}
          className="w-9 h-9"
          onClick={() => onClick(isPlaying ? "pause" : "play")}
          variant="secondary"
        >
          <span>
            {isPlaying ? (
              <PauseIcon color="#FFFFFF" size="1.25rem" />
            ) : (
              <PlayIcon color="#FFFFFF" size="1.25rem" />
            )}
          </span>
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>{isPlaying ? "Pause" : "Play"}</p>
      </TooltipContent>
    </Tooltip>
  );
};
