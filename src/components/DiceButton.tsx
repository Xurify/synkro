import React from "react";
import { DicesIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/libs/utils/frontend-utils";
import useAudio from "@/hooks/useAudio";
import { BUTTON_PRESS_AUDIO } from "@/constants/constants";

export interface DiceButtonProps {
  className?: string;
  onClick: () => void;
}

export const DiceButton: React.FC<DiceButtonProps> = ({
  className,
  onClick,
}) => {
  const { play: playButtonClickSound } = useAudio({
    volume: 0.5,
    src: BUTTON_PRESS_AUDIO,
  });

  const handleClick = () => {
    playButtonClickSound();
    onClick?.();
  };

  return (
    <Button
      aria-label="Generate Random Name"
      className={cn(
        "w-9 h-9 min-w-[2.25rem] text-primary hover:bg-primary hover:text-white ml-2",
        className,
      )}
      onClick={handleClick}
      variant="secondary"
    >
      <span>
        <DicesIcon size="1.4rem" />
      </span>
    </Button>
  );
};

export default DiceButton;
